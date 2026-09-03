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
function getRedisKey(nodeId: string, interval: string) {
  return `indicator:${nodeId}:${interval}:prices`;
}

function getDbKey(interval: string) {
  return `prices:${interval}`;
}

async function readPriceBuffer(nodeId: string, interval: string): Promise<number[]> {
  try {
    const raw = await redis.get<number[]>(getRedisKey(nodeId, interval));
    if (raw && Array.isArray(raw) && raw.length > 0) return raw;
  } catch {
    // fallback to Postgres indicator state if Redis is offline
  }

  try {
    const record = await prisma.indicatorState.findUnique({
      where: { nodeId_key: { nodeId, key: getDbKey(interval) } },
    });
    if (record && Array.isArray(record.value) && (record.value as number[]).length > 0) {
      return record.value as number[];
    }
  } catch {
    // Database read fallback
  }

  return [];
}

async function writePriceBuffer(nodeId: string, interval: string, prices: number[], workflowId: string): Promise<void> {
  const capped = prices.slice(-MAX_BUFFER);
  try {
    await redis.set(getRedisKey(nodeId, interval), capped);
    return;
  } catch {
    // Fallback to Postgres write-through
  }

  try {
    const key = getDbKey(interval);
    await prisma.indicatorState.upsert({
      where: { nodeId_key: { nodeId, key } },
      create: { nodeId, workflowId, key, value: capped },
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
  mode = "live",
}) => {
  const stageStart = Date.now();
  const timings: Record<string, number> = {};
  const mark = (label: string, since: number) => {
    timings[label] = Date.now() - since;
  };

  let t = Date.now();
  await publish(indicatorChannel().status({ nodeId, status: "loading" }));
  mark("publishLoading", t);

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

  const interval = (context.interval as string | undefined) ?? "1d";

  // 1. Read existing price buffer — interval-scoped so that switching the
  //    node from 1d → 1m starts a fresh buffer instead of mixing timescales.
  t = Date.now();
  let prices = await readPriceBuffer(nodeId, interval);
  mark("readPriceBuffer", t);

  if (prices.length < period) {
    if (context.historicalCandles && Array.isArray(context.historicalCandles) && context.historicalCandles.length > 0) {
      const histCloses = (context.historicalCandles as Candle[])
        .map((c) => c.close)
        .filter((c): c is number => typeof c === "number");
      if (histCloses.length > 0) {
        prices = histCloses;
      }
    } else if (mode !== "shadow" && context.symbol && context.exchange) {
      try {
        const adapter = getExchangeAdapter(context.exchange as string);
        const now = new Date();
        const past = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 90);
        const bars = await adapter.fetchHistoricalCandles(
          context.symbol as string,
          past,
          now,
          interval,
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
  t = Date.now();
  const value = computeIndicator(data.type!, period, prices);
  mark("compute", t);

  // 4. Persist updated buffer (in background)
  writePriceBuffer(nodeId, interval, prices, workflowId).catch(() => {});

  if (prices.length % SYNC_EVERY === 0) {
    const key = getDbKey(interval);
    prisma.indicatorState.upsert({
      where: { nodeId_key: { nodeId, key } },
      create: { nodeId, workflowId, key, value: prices },
      update: { value: prices },
    }).catch(() => {});
  }

  const result = { value, type: data.type, period, prices: prices.length, interval };

  t = Date.now();
  await publish(indicatorChannel().status({ nodeId, status: "success" }));
  mark("publishSuccess", t);

  timings.total = Date.now() - stageStart;
  console.log(`[indicator] Stage timing (${nodeId}):`, timings);

  return {
    ...context,
    [data.variableName]: result,
  };
};