// src/features/trading/components/market-data-trigger/executor.ts
import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { marketDataTriggerChannel } from "@/inngest/channels/market-data-trigger";
import { redis } from "@/lib/redis";
import { getExchangeAdapter } from "../../adapters/registry";
import type { Candle } from "../../adapters/types";

type MarketDataTriggerData = {
  symbol?: string;
  exchange?: string;
  interval?: string;
  mode?: "live" | "backtest";
};

/**
 * MarketDataTrigger executor.
 *
 * In live / tick mode:
 *   - The candle is in context.candle (injected by /api/internal/market-tick).
 *
 * In manual canvas execution mode:
 *   - If context.candle is missing, fetches the latest market candle using the adapter.
 *
 * In backtest mode:
 *   - executeBacktest drives the loop; this executor passes through.
 */
export const marketDataTriggerExecutor: NodeExecutor<MarketDataTriggerData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
  mode = "live",
}) => {
  if (!data.symbol) {
    await publish(marketDataTriggerChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("MarketDataTrigger: symbol is required");
  }
  if (!data.exchange) {
    await publish(marketDataTriggerChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("MarketDataTrigger: exchange is required");
  }

  await publish(marketDataTriggerChannel().status({ nodeId, status: "loading" }));

  let candle = context.candle as Candle | undefined;

  // Shadow replay must NEVER fetch live market data — a replay is testing
  // what would happen to a PAST execution's data through the new graph, not
  // "what's the price right now." Fetching live data here would be both
  // semantically wrong (comparing against a moving target, not the
  // original input) and a real-network dependency inside what's supposed
  // to be a fast, isolated test. If no candle survived in the replayed
  // context (e.g. this execution predates per-node logging, or came from
  // a backtest run, which doesn't yet record per-node history), fail
  // clearly instead of silently substituting today's price.
  if (!candle && mode === "shadow") {
    throw new NonRetriableError(
      "Shadow replay: no recorded candle available for this execution to replay — " +
      "this usually means the execution being replayed came from a backtest run, which " +
      "doesn't yet record per-node history. Test against a live-triggered execution instead.",
    );
  }

  // If no candle provided (e.g. manual click on canvas), fetch the latest candle via adapter
  if (!candle) {
    candle = await step.run("fetch-latest-candle", async () => {
      try {
        const adapter = getExchangeAdapter(data.exchange!);
        const now = new Date();
        const past = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30); // 30 days
        const bars = await adapter.fetchHistoricalCandles(
          data.symbol!,
          past,
          now,
          data.interval ?? "1d",
        );
        if (bars && bars.length > 0) {
          return bars[bars.length - 1];
        }
      } catch (err) {
        console.warn("[market-data-trigger] Could not fetch remote candle, using simulated candle:", err);
      }

      // Fallback candle if API is unreachable or market is closed
      return {
        timestamp: Date.now(),
        open: 180.25,
        high: 182.50,
        low: 179.80,
        close: 181.90,
        volume: 1500000,
      };
    });
  }

  // Cache latest tick in Redis (non-blocking if Redis is unreachable)
  await step.run("write-tick-to-redis", async () => {
    try {
      await redis.set(`tick:${data.symbol}`, candle, { ex: 3600 });
    } catch {
      // Ignored for local fallback
    }
  });

  await publish(marketDataTriggerChannel().status({ nodeId, status: "ticking" }));

  return {
    ...context,
    candle,
    symbol: data.symbol,
  };
};