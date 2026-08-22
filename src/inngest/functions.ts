import { NonRetriableError } from "inngest";
import { inngest } from "./client";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
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
import {
  BacktestMarketDataProvider,
  buildBacktestSummary,
} from "@/features/trading/providers/backtest";
import { getExchangeAdapter } from "@/features/trading/adapters/registry";
import type { Trade } from "@/features/trading/providers/backtest";
import { conditionChannel } from "./channels/condition";
import { ConditionNotMetError } from "@/lib/condition-not-met-error";

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

    await step.run("create-execution", async () => {
      return prisma.execution.create({
        data: {
          workflowId,
          inngestEventId,
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

    // Execute each node
    let skippedReason: string | null = null;
    for (const node of sortedNodes) {
      const executor = getExecutor(node.type as NodeType);
      try {
        context = await executor({
          data: node.data as Record<string, unknown>,
          nodeId: node.id,
          userId,
          context,
          step,
          publish,
        });
      } catch (err) {
        if (err instanceof ConditionNotMetError) {
          // Not a failure — a Condition node deliberately halted execution.
          // Stop running remaining downstream nodes, but the execution as a
          // whole is a graceful SKIPPED outcome, not FAILED.
          skippedReason = err.message;
          break;
        }
        throw err;
      }
    }

    await step.run("update-execution", async () => {
      return prisma.execution.update({
        where: { inngestEventId, workflowId },
        data: skippedReason
          ? {
              status: ExecutionStatus.SKIPPED,
              completedAt: new Date(),
              output: context as Prisma.InputJsonValue,
              error: skippedReason,
            }
          : {
              status: ExecutionStatus.SUCCESS,
              completedAt: new Date(),
              output: context as Prisma.InputJsonValue,
            },
      });
    });

    return {
      workflowId,
      result: context,
    };
  },
);

/**
 * executeBacktest — fast in-process backtest loop.
 *
 * Deliberately does NOT use step.run() per candle (no Inngest checkpoint per
 * tick). Running thousands of candles through the step system would be
 * prohibitively slow. Instead:
 *   - Loops all candles in-process, calling executors directly.
 *   - Collects trades emitted by ORDER nodes.
 *   - Writes ONE summary Execution record at the end.
 *
 * Tradeoff: if the function crashes mid-loop, no partial results are saved.
 * Acceptable for a portfolio demo; note in README.
 */
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
        exchange,
        symbol,
        interval,
        new Date(from),
        new Date(to),
      );

      const trades: Trade[] = [];
      const allCandles: import("@/features/trading/adapters/types").Candle[] =
        [];
      let context: Record<string, unknown> = {};

      // Stub publish for backtest (no realtime during replay)
      const noopPublish = async () => {};
      // Stub step for backtest executors (no Inngest checkpoints in inner loop)
      const backtestStep = {
        run: async (_id: string, fn: () => Promise<unknown>) => fn(),
        sleep: async () => {},
        waitForEvent: async () => null,
        sendEvent: async () => {},
        invoke: async () => null,
      } as unknown as import("inngest").GetStepTools<
        import("inngest").Inngest.Any
      >;

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
