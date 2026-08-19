import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { marketDataTriggerChannel } from "@/inngest/channels/market-data-trigger";
import { redis } from "@/lib/redis";
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
 * In live mode:
 *   - The candle is already in context.candle (injected by /api/internal/market-tick
 *     when it sent the Inngest event).
 *   - We write it to Redis (tick:{symbol}) for the LiveMarketDataProvider,
 *     then publish a "ticking" status for the node UI pulse.
 *
 * In backtest mode:
 *   - executeBacktest drives the loop; this executor just passes through.
 */
export const marketDataTriggerExecutor: NodeExecutor<MarketDataTriggerData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  if (!data.symbol) {
    throw new NonRetriableError("MarketDataTrigger: symbol is required");
  }
  if (!data.exchange) {
    throw new NonRetriableError("MarketDataTrigger: exchange is required");
  }

  const mode = data.mode ?? "live";

  if (mode === "live") {
    await publish(marketDataTriggerChannel().status({ nodeId, status: "loading" }));

    const candle = context.candle as Candle | undefined;
    if (!candle) {
      await publish(marketDataTriggerChannel().status({ nodeId, status: "error" }));
      throw new NonRetriableError("MarketDataTrigger: no candle in context (live mode)");
    }

    // Write latest tick to Redis for LiveMarketDataProvider reads
    await step.run("write-tick-to-redis", async () => {
      await redis.set(`tick:${data.symbol}`, candle, { ex: 3600 }); // TTL 1h
    });

    await publish(marketDataTriggerChannel().status({ nodeId, status: "ticking" }));

    return { ...context, candle };
  }

  // Backtest mode: executeBacktest puts candle in context already
  return context;
};
