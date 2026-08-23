// src/features/replay/server/routers.ts
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { prisma } from "@/lib/db";
import { inngest } from "@/inngest/client";
import z from "zod";

const draftNodeSchema = z.object({
  id: z.string(),
  type: z.string().nullish(),
  data: z.record(z.string(), z.any()).optional(),
});

const draftEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
});

export const replayRouter = createTRPCRouter({

  start: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        draftNodes: z.array(draftNodeSchema),
        draftEdges: z.array(draftEdgeSchema),
        limit: z.number().min(1).max(50).default(10),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: input.workflowId, userId: ctx.auth.user.id },
      });

      const recentExecutions = await prisma.execution.findMany({
        where: {
          workflowId: workflow.id,
          status: { in: ["SUCCESS", "SKIPPED", "FAILED"] }, // only finished runs have a full node log
          nodeLogs: { some: {} },
        },
        orderBy: { startedAt: "desc" },
        take: input.limit,
        select: { id: true },
      });

      if (recentExecutions.length === 0) {
        throw new Error(
          "No replayable executions yet — Test Changes needs at least one execution triggered " +
          "via \"Execute workflow\" (not \"Run Backtest\", which doesn't record per-node history yet).",
        );
      }

      const draftConnections = input.draftEdges.map((e) => ({
        fromNodeId: e.source,
        toNodeId: e.target,
      }));

      const event = await inngest.send({
        name: "workflows/shadow-replay.start",
        data: {
          workflowId: workflow.id,
          draftNodes: input.draftNodes,
          draftConnections,
          executionIds: recentExecutions.map((e) => e.id),
        },
      });

      return { eventId: event.ids[0] };
    }),

  /** Poll a shadow run's status by the id returned from start(). */
  status: protectedProcedure
    .input(z.object({ shadowRunId: z.string() }))
    .query(async ({ input, ctx }) => {
      return prisma.shadowRun.findUnique({
        where: {
          id: input.shadowRunId,
          workflow: { userId: ctx.auth.user.id },
        },
      });
    }),

  latestForWorkflow: protectedProcedure
    .input(z.object({ workflowId: z.string() }))
    .query(async ({ input, ctx }) => {
      return prisma.shadowRun.findFirst({
        where: {
          workflowId: input.workflowId,
          workflow: { userId: ctx.auth.user.id },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  /** Full diff results for a shadow run, grouped by node. */
  results: protectedProcedure
    .input(z.object({ shadowRunId: z.string() }))
    .query(async ({ input, ctx }) => {
      const shadowRun = await prisma.shadowRun.findUnique({
        where: {
          id: input.shadowRunId,
          workflow: { userId: ctx.auth.user.id },
        },
        include: { diffs: true },
      });
      if (!shadowRun) return null;

      const byNode = new Map<string, typeof shadowRun.diffs>();
      for (const diff of shadowRun.diffs) {
        byNode.set(diff.nodeId, [...(byNode.get(diff.nodeId) ?? []), diff]);
      }

      const summary = {
        totalNodes: byNode.size,
        newlyFailed: shadowRun.diffs.filter((d) => d.diffType === "NEWLY_FAILED").length,
        changed: shadowRun.diffs.filter((d) => d.diffType === "OUTPUT_CHANGED").length,
        reused: shadowRun.diffs.filter((d) => d.diffType === "REUSED").length,
      };

      return {
        status: shadowRun.status,
        summary,
        byNode: Object.fromEntries(byNode),
      };
    }),
});