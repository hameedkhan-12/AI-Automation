import { NonRetriableError } from "inngest";
import { inngest } from "./client";
import { prisma } from "@/lib/db";
import { topologicalSort } from "./utils";
import { ExecutionStatus, NodeType } from "@/generated/prisma/enums";
import { getExecutor } from "@/features/executions/lib/executor-registry";
import { httpRequestChannel } from "./channels/http-request";
import { manualTriggerChannel } from "./channels/manual-trigger";
import { googleFormTriggerChannel } from "./channels/google-form-trigger";
import { stripeTriggerChannel } from "./channels/stripe-trigger";
import { geminiChannel } from "./channels/gemini";
import { openAiChannel } from "./channels/openai";
import { anthropicChannel } from "./channels/anthropic";
import { discordChannel } from "./channels/discord";
import { slackChannel } from "./channels/slack";
import { marketDataTriggerChannel } from "./channels/market-data-trigger";
import { indicatorChannel } from "./channels/indicator";
import { orderChannel } from "./channels/order";
import { BacktestMarketDataProvider, buildBacktestSummary } from "@/features/trading/providers/backtest";
import { getExchangeAdapter } from "@/features/trading/adapters/registry";
import type { Trade } from "@/features/trading/providers/backtest";
import { conditionChannel } from "./channels/condition";
import { diffGraphs } from "@/features/replay/lib/graph-diff";
import toposort from "toposort";
import { ConditionNotMetError } from "@/lib/condition-not-met-error";

function topologicalSortDraft<T extends { id: string }>(
  nodes: T[],
  connections: { fromNodeId: string; toNodeId: string }[],
): T[] {
  if (connections.length === 0) return nodes;

  const edges: [string, string][] = connections.map((c) => [c.fromNodeId, c.toNodeId]);
  const connectedIds = new Set<string>();
  for (const c of connections) {
    connectedIds.add(c.fromNodeId);
    connectedIds.add(c.toNodeId);
  }
  for (const n of nodes) {
    if (!connectedIds.has(n.id)) edges.push([n.id, n.id]);
  }

  let sortedIds: string[];
  try {
    sortedIds = [...new Set(toposort(edges))];
  } catch (error) {
    if (error instanceof Error && error.message.includes("Cyclic")) {
      throw new Error("Draft workflow contains a cycle");
    }
    throw error;
  }

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  return sortedIds.map((id) => nodeMap.get(id)!).filter(Boolean);
}

export const executeWorkflow = inngest.createFunction(
  {
    id: "execute-workflow",
    retries: process.env.NODE_ENV === "production" ? 3 : 0,
    onFailure: async ({ event, step }) => {
      return prisma.execution.update({
        where: { inngestEventId: event.data.event.id },
        data: {
          status: ExecutionStatus.FAILED,
          error: event.data.error.message,
          errorStack: event.data.error.stack,
        },
      });
    },
  },
  {
    event: "workflows/execute.workflow",
    channels: [
      httpRequestChannel(),
      manualTriggerChannel(),
      googleFormTriggerChannel(),
      stripeTriggerChannel(),
      geminiChannel(),
      openAiChannel(),
      anthropicChannel(),
      discordChannel(),
      slackChannel(),
      marketDataTriggerChannel(),
      indicatorChannel(),
      orderChannel(),
      conditionChannel(),
    ],
  },
  async ({ event, step, publish }) => {
    const inngestEventId = event.id;
    const workflowId = event.data.workflowId;

    if (!inngestEventId || !workflowId) {
      throw new NonRetriableError("Event ID or workflow ID is missing");
    }

    const execution = await step.run("create-execution", async () => {
      return prisma.execution.create({
        data: {
          workflowId,
          inngestEventId,
          // Captured so this execution can later be replayed through an
          // edited graph by shadow-replay — without this there's nothing
          // to feed back in as the "trigger input" on replay.
          initialData: event.data.initialData ?? {},
        },
      });
    });

    const sortedNodes = await step.run("prepare-workflow", async () => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: workflowId },
        include: {
          nodes: true,
          connections: true,
        },
      });

      return topologicalSort(workflow.nodes, workflow.connections);
    });

    const userId = await step.run("find-user-id", async () => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: workflowId },
        select: {
          userId: true,
        },
      });

      return workflow.userId;
    });

    // Initialize context with any initial data from the trigger
    let context: Record<string, unknown> = {
      ...event.data.initialData,
      __workflowId: workflowId,
      __executionId: inngestEventId,
    };

    let skippedReason: string | null = null;
    for (const node of sortedNodes) {
      const executor = getExecutor(node.type as NodeType);
      const startedAt = Date.now();
      try {
        const nextContext = await executor({
          data: node.data as Record<string, unknown>,
          nodeId: node.id,
          userId,
          context,
          step,
          publish,
          mode: "live",
        });

        await step.run(`log-node-${node.id}`, () =>
          prisma.nodeExecutionLog.create({
            data: {
              executionId: execution.id,
              nodeId: node.id,
              nodeType: node.type,
              input: { data: node.data, contextSnapshot: context } as object,
              output: nextContext as object,
              durationMs: Date.now() - startedAt,
            },
          }),
        );

        context = nextContext;
      } catch (err) {
        if (err instanceof ConditionNotMetError) {
          await step.run(`log-node-${node.id}`, () =>
            prisma.nodeExecutionLog.create({
              data: {
                executionId: execution.id,
                nodeId: node.id,
                nodeType: node.type,
                input: { data: node.data, contextSnapshot: context } as object,
                error: err.message,
                durationMs: Date.now() - startedAt,
              },
            }),
          );
          skippedReason = err.message;
          break;
        }

        await step.run(`log-node-error-${node.id}`, () =>
          prisma.nodeExecutionLog.create({
            data: {
              executionId: execution.id,
              nodeId: node.id,
              nodeType: node.type,
              input: { data: node.data, contextSnapshot: context } as object,
              // omitted `output` — see comment above
              error: err instanceof Error ? err.message : String(err),
              durationMs: Date.now() - startedAt,
            },
          }),
        );
        throw err;
      }
    }

    await step.run("update-execution", async () => {
      if (skippedReason) {
        return prisma.execution.update({
          where: { inngestEventId },
          data: {
            status: ExecutionStatus.SKIPPED,
            completedAt: new Date(),
            output: context as object,
            error: skippedReason,
          },
        });
      }
      return prisma.execution.update({
        where: { inngestEventId },
        data: {
          status: ExecutionStatus.SUCCESS,
          completedAt: new Date(),
          output: context as object,
        },
      });
    });

    return {
      workflowId,
      result: context,
    };
  },
);

export const executeBacktest = inngest.createFunction(
  {
    id: "execute-backtest",
    retries: 0, // backtest is idempotent by design — safe to re-run
  },
  { event: "trading/backtest.start" },
  async ({ event, step }) => {
    const { workflowId, userId, symbol, exchange, interval, from, to } =
      event.data as {
        workflowId: string;
        userId: string;
        symbol: string;
        exchange: string;
        interval: string;
        from: string;
        to: string;
      };

    // 1. Fetch historical candles (via adapter — caches in Postgres)
    const adapter = getExchangeAdapter(exchange);
    await step.run("fetch-historical-candles", async () => {
      await adapter.fetchHistoricalCandles(
        symbol,
        new Date(from),
        new Date(to),
        interval,
      );
    });

    // 2. Load workflow nodes
    const sortedNodes = await step.run("prepare-workflow", async () => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: workflowId },
        include: { nodes: true, connections: true },
      });
      return topologicalSort(workflow.nodes, workflow.connections);
    });

    // 3. Create an Execution record
    const execution = await step.run("create-execution", async () => {
      return prisma.execution.create({
        data: { workflowId, inngestEventId: event.id! },
      });
    });

    // 4. Run backtest loop in-process (no step.run per candle)
    const result = await step.run("backtest-loop", async () => {
      const provider = new BacktestMarketDataProvider(
        exchange, symbol, interval,
        new Date(from), new Date(to),
      );

      const trades: Trade[] = [];
      const allCandles: import("@/features/trading/adapters/types").Candle[] = [];
      let context: Record<string, unknown> = {};

      // Stub publish for backtest (no realtime during replay)
      const noopPublish = async () => { };
      // Stub step for backtest executors (no Inngest checkpoints in inner loop)
      const backtestStep = {
        run: async (_id: string, fn: () => Promise<unknown>) => fn(),
        sleep: async () => { },
        waitForEvent: async () => null,
        sendEvent: async () => { },
        invoke: async () => null,
      } as unknown as import("inngest").GetStepTools<import("inngest").Inngest.Any>;

      let candle = await provider.getNextCandle();
      while (candle !== null) {
        allCandles.push(candle);
        context = { ...context, candle };

        try {
          for (const node of sortedNodes) {
            const executor = getExecutor(node.type as NodeType);
            context = await executor({
              data: node.data as Record<string, unknown>,
              nodeId: node.id,
              userId,
              context,
              step: backtestStep,
              publish: noopPublish,
              mode: "live",
            });

            // Collect trades placed by ORDER nodes
            if (node.type === NodeType.ORDER && context.__lastOrder) {
              const order = context.__lastOrder as Trade;
              trades.push(order);
            }
          }
        } catch (err) {
          if (!(err instanceof ConditionNotMetError)) {
            throw err; // a real error (bad config, adapter failure) should still abort the backtest
          }
          // Condition not met on this candle — expected on most candles in
          // a crossover strategy. Skip remaining nodes for this candle only
          // and continue replaying forward.
        }

        candle = await provider.getNextCandle();
      }

      return buildBacktestSummary(10_000, allCandles, trades);
    });

    // 5. Write summary to Execution record
    await step.run("complete-execution", async () => {
      return prisma.execution.update({
        where: { id: execution.id },
        data: {
          status: ExecutionStatus.SUCCESS,
          completedAt: new Date(),
          output: result,
        },
      });
    });

    return { workflowId, executionId: execution.id, summary: result };
  },
);

export const executeShadowReplay = inngest.createFunction(
  {
    id: "execute-shadow-replay",
    retries: 0,
    timeouts: { finish: "3m" },
  },
  { event: "workflows/shadow-replay.start" },
  async ({ event, step }) => {
    const { workflowId, draftNodes, draftConnections, executionIds } =
      event.data as {
        workflowId: string;
        draftNodes: { id: string; type?: string | null; data?: Record<string, unknown> }[];
        draftConnections: { fromNodeId: string; toNodeId: string }[];
        executionIds: string[];
      };

    const shadowRun = await step.run("create-shadow-run", () =>
      prisma.shadowRun.create({
        data: {
          workflowId,
          // JSON round-trip strips undefined/optional-property quirks so
          // this is unambiguously plain JSON, regardless of exactly how
          // Prisma's generated Json input type is named/shaped.
          draftGraph: JSON.parse(JSON.stringify({ nodes: draftNodes, connections: draftConnections })),
          status: "RUNNING",
        },
      }),
    );

    const savedWorkflow = await step.run("load-saved-graph", () =>
      prisma.workflow.findUniqueOrThrow({
        where: { id: workflowId },
        include: { nodes: true, connections: true },
      }),
    );

    const { reExecuteNodeIds } = await step.run("diff-graphs", async () => {
      const diff = diffGraphs(savedWorkflow.nodes, savedWorkflow.connections, draftNodes, draftConnections);
      return { reExecuteNodeIds: [...diff.reExecuteNodeIds] };
    });
    const reExecuteSet = new Set(reExecuteNodeIds);

    const sortedDraftNodes = topologicalSortDraft(draftNodes, draftConnections);

    for (const executionId of executionIds) {
      await step.run(`replay-${executionId}`, async () => {
        const original = await prisma.execution.findUnique({
          where: { id: executionId },
          include: { nodeLogs: true },
        });
        if (!original) return; // execution was deleted since the person picked it — skip, don't fail the whole run

        const originalLogs = new Map(original.nodeLogs.map((l) => [l.nodeId, l]));
        const userId = savedWorkflow.userId;

        let context: Record<string, unknown> = {
          ...(original.initialData as object ?? {}),
          __workflowId: workflowId,
          __executionId: `shadow-${shadowRun.id}-${executionId}`,
        };

        for (const node of sortedDraftNodes) {
          const originalLog = originalLogs.get(node.id);
          const canReuseOutput = !reExecuteSet.has(node.id) && originalLog?.output;
          const canReuseSkip = !reExecuteSet.has(node.id) && !originalLog?.output && originalLog?.error;

          if (canReuseOutput) {
            // Unchanged, and not downstream of anything that changed —
            // reuse the recorded output instead of re-executing.
            context = originalLog!.output as Record<string, unknown>;
            await prisma.replayDiff.create({
              data: {
                shadowRunId: shadowRun.id,
                originalExecutionId: executionId,
                nodeId: node.id,
                nodeType: node.type ?? "UNKNOWN",
                diffType: "REUSED",
              },
            });
            continue;
          }

          if (canReuseSkip) {
            await prisma.replayDiff.create({
              data: {
                shadowRunId: shadowRun.id,
                originalExecutionId: executionId,
                nodeId: node.id,
                nodeType: node.type ?? "UNKNOWN",
                diffType: "REUSED",
                oldError: originalLog!.error,
              },
            });
            break;
          }

          const executor = getExecutor(node.type as NodeType);
          try {
            const NODE_TIMEOUT_MS = 20_000;
            let timeoutHandle: ReturnType<typeof setTimeout>;
            const nextContext = await Promise.race([
              executor({
                data: (node.data ?? {}) as Record<string, unknown>,
                nodeId: node.id,
                userId,
                context,
                step: {
                  run: async (_id: string, fn: () => Promise<unknown>) => fn(),
                  sleep: async () => {},
                  waitForEvent: async () => null,
                  sendEvent: async () => {},
                  invoke: async () => null,
                } as unknown as typeof step,
                publish: async () => {},
                mode: "shadow",
              }).finally(() => clearTimeout(timeoutHandle)),
              new Promise<never>((_, reject) => {
                timeoutHandle = setTimeout(
                  () => reject(new Error(
                    `Node "${node.id}" (${node.type}) timed out after ${NODE_TIMEOUT_MS / 1000}s during shadow replay`,
                  )),
                  NODE_TIMEOUT_MS,
                );
              }),
            ]);

            const diffType = !originalLog
              ? "NEWLY_SUCCEEDED"
              : originalLog.error
                ? "NEWLY_SUCCEEDED"
                : JSON.stringify(originalLog.output) === JSON.stringify(nextContext)
                  ? "UNCHANGED"
                  : "OUTPUT_CHANGED";

            await prisma.replayDiff.create({
              data: {
                shadowRunId: shadowRun.id,
                originalExecutionId: executionId,
                nodeId: node.id,
                nodeType: node.type ?? "UNKNOWN",
                diffType,
                oldOutput: originalLog?.output ?? undefined,
                newOutput: nextContext as object,
              },
            });
            context = nextContext;
          } catch (err) {
            if (err instanceof ConditionNotMetError) {
              const isSameOutcome = originalLog?.error === err.message;
              await prisma.replayDiff.create({
                data: {
                  shadowRunId: shadowRun.id,
                  originalExecutionId: executionId,
                  nodeId: node.id,
                  nodeType: node.type ?? "UNKNOWN",
                  diffType: isSameOutcome ? "UNCHANGED" : "OUTPUT_CHANGED",
                  oldError: originalLog?.error ?? undefined,
                  newError: err.message,
                },
              });
              break;
            }

            const genuinelyNewError = err instanceof Error ? err.message : String(err);
            const isSameFailure = originalLog?.error === genuinelyNewError;
            await prisma.replayDiff.create({
              data: {
                shadowRunId: shadowRun.id,
                originalExecutionId: executionId,
                nodeId: node.id,
                nodeType: node.type ?? "UNKNOWN",
                diffType: isSameFailure ? "UNCHANGED" : "NEWLY_FAILED",
                oldError: originalLog?.error ?? undefined,
                newError: genuinelyNewError,
              },
            });
            break; // stop replaying THIS execution, move to the next one
          }
        }
      });
    }

    await step.run("complete-shadow-run", () =>
      prisma.shadowRun.update({
        where: { id: shadowRun.id },
        data: { status: "COMPLETE", completedAt: new Date() },
      }),
    );

    return { shadowRunId: shadowRun.id };
  },
);