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
  let historicalCandles = context.historicalCandles as Candle[] | undefined;

  if (!candle && mode === "shadow") {
    throw new NonRetriableError(
      "Shadow replay: no recorded candle available for this execution to replay — " +
      "this usually means the execution being replayed came from a backtest run, which " +
      "doesn't yet record per-node history. Test against a live-triggered execution instead.",
    );
  }

  // If no candle provided (e.g. manual click or scheduled run), fetch latest candle & historical lookback window in one go
  if (!candle) {
    const marketData = await step.run("fetch-market-data", async () => {
      try {
        const adapter = getExchangeAdapter(data.exchange!);
        const now = new Date();
        // Fetch up to 120 days of historical bars so downstream indicators (SMA 10, 30, 50, etc.) are pre-warmed immediately
        const past = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 120);
        const bars = await adapter.fetchHistoricalCandles(
          data.symbol!,
          past,
          now,
          data.interval ?? "1d",
        );
        if (bars && bars.length > 0) {
          const latest = bars[bars.length - 1];
          return { latest, bars };
        }
      } catch (err) {
        console.warn("[market-data-trigger] Could not fetch remote candle, using simulated candle:", err);
      }

      // Fallback simulated candle + bars if API is unreachable / market closed
      const simulatedLatest = {
        timestamp: Date.now(),
        open: 180.25,
        high: 182.50,
        low: 179.80,
        close: 181.90,
        volume: 1500000,
      };
      return { latest: simulatedLatest, bars: [simulatedLatest] };
    });

    candle = marketData.latest;
    historicalCandles = marketData.bars;

    // Cache latest tick in Redis (non-blocking)
    redis.set(`tick:${data.symbol}`, candle, { ex: 3600 }).catch(() => {});
  }

  await publish(marketDataTriggerChannel().status({ nodeId, status: "ticking" }));

  return {
    ...context,
    candle,
    historicalCandles,
    symbol: data.symbol,
    exchange: data.exchange,
  };
};