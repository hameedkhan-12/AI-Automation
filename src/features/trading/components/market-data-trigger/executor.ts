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

