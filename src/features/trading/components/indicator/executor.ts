import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { indicatorChannel } from "@/inngest/channels/indicator";
import { redis } from "@/lib/redis";
import { prisma } from "@/lib/db";
import { getExchangeAdapter } from "../../adapters/registry";
import type { Candle } from "../../adapters/types";

// technicalindicators uses CommonJS default export
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ti = require("technicalindicators");

type IndicatorData = {
  variableName?: string;
  type?: "SMA" | "EMA" | "RSI" | "MACD";
  period?: number;
  source?: string;
};

const SYNC_EVERY = 50;
const MAX_BUFFER = 500;

function getRedisKey(nodeId: string) {
  return `indicator:${nodeId}:prices`;
}

async function readPriceBuffer(nodeId: string): Promise<number[]> {
  try {
    const raw = await redis.get<number[]>(getRedisKey(nodeId));
    if (raw && Array.isArray(raw) && raw.length > 0) return raw;
  } catch {
    // fallback to Postgres indicator state if Redis is offline
  }

  try {
    const record = await prisma.indicatorState.findUnique({
      where: { nodeId_key: { nodeId, key: "prices" } },
    });
    if (record && Array.isArray(record.value) && (record.value as number[]).length > 0) {
      return record.value as number[];
    }
  } catch {
    // Database read fallback
  }

  return [];
}

async function writePriceBuffer(nodeId: string, prices: number[], workflowId: string): Promise<void> {
  const capped = prices.slice(-MAX_BUFFER);
  try {
    await redis.set(getRedisKey(nodeId), capped);
    return;
  } catch {
    // Fallback to Postgres write-through
  }

  try {
    await prisma.indicatorState.upsert({
      where: { nodeId_key: { nodeId, key: "prices" } },
      create: { nodeId, workflowId, key: "prices", value: capped },
      update: { value: capped },
    });
  } catch {
    // Non-blocking fail-safe
  }
}

function computeIndicator(type: string, period: number, prices: number[]): number | null {
  if (prices.length < period) return null;

  switch (type) {
    case "SMA": {
      const result = ti.SMA.calculate({ period, values: prices });
      return result[result.length - 1] ?? null;
    }
    case "EMA": {
      const result = ti.EMA.calculate({ period, values: prices });
      return result[result.length - 1] ?? null;
    }
    case "RSI": {
      const result = ti.RSI.calculate({ period, values: prices });
      return result[result.length - 1] ?? null;
    }
    case "MACD": {
      const result = ti.MACD.calculate({
        values: prices,
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        SimpleMAOscillator: false,
        SimpleMASignal: false,
      });
      const last = result[result.length - 1];
      return last ? last.MACD : null;
    }
    default:
      return null;
  }
}

export const indicatorExecutor: NodeExecutor<IndicatorData> = async ({
  data,
  nodeId,
  context,
  publish,
}) => {
  await publish(indicatorChannel().status({ nodeId, status: "loading" }));

  if (!data.variableName) {
    await publish(indicatorChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Indicator: variableName is required");
  }
  if (!data.type) {
    await publish(indicatorChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Indicator: type is required");
  }

  const period = data.period ?? 20;
  const sourceKey = data.source ?? "candle";
  const candle = context[sourceKey] as Candle | undefined;

  if (!candle?.close) {
    await publish(indicatorChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError(`Indicator: no candle found at context.${sourceKey}`);
  }

  const workflowId = (context.__workflowId as string | undefined) ?? "unknown";

  // 1. Read existing price buffer
  let prices = await readPriceBuffer(nodeId);

  // 2. Automated Buffer Warm-Up:
  // If the buffer has fewer prices than required by the period, pre-warm from historical candles
  if (prices.length < period) {
    if (context.historicalCandles && Array.isArray(context.historicalCandles) && context.historicalCandles.length > 0) {
      const histCloses = (context.historicalCandles as Candle[])
        .map((c) => c.close)
        .filter((c): c is number => typeof c === "number");
      if (histCloses.length > 0) {
        prices = histCloses;
      }
    } else if (context.symbol && context.exchange) {
      try {
        const adapter = getExchangeAdapter(context.exchange as string);
        const now = new Date();
        const past = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 90);
        const bars = await adapter.fetchHistoricalCandles(
          context.symbol as string,
          past,
          now,
          (context.interval as string) ?? "1d",
        );
        if (bars && bars.length > 0) {
          prices = bars.map((b) => b.close).filter((c): c is number => typeof c === "number");
        }
      } catch (err) {
        console.warn("[indicator] Could not backfill historical candles:", err);
      }
    }
  }

  // Ensure current tick's close price is included
  if (prices.length === 0 || prices[prices.length - 1] !== candle.close) {
    prices.push(candle.close);
  }

  // 3. Compute indicator
  const value = computeIndicator(data.type!, period, prices);

  // 4. Persist updated buffer (in background)
  writePriceBuffer(nodeId, prices, workflowId).catch(() => {});

  if (prices.length % SYNC_EVERY === 0) {
    prisma.indicatorState.upsert({
      where: { nodeId_key: { nodeId, key: "prices" } },
      create: { nodeId, workflowId, key: "prices", value: prices },
      update: { value: prices },
    }).catch(() => {});
  }

  const result = { value, type: data.type, period, prices: prices.length };

  await publish(indicatorChannel().status({ nodeId, status: "success" }));

  return {
    ...context,
    [data.variableName]: result,
  };
};