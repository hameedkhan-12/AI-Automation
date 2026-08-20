import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { indicatorChannel } from "@/inngest/channels/indicator";
import { redis } from "@/lib/redis";
import { prisma } from "@/lib/db";
import type { Candle } from "../../adapters/types";

// technicalindicators uses CommonJS default export
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ti = require("technicalindicators");

type IndicatorData = {
  variableName?: string;
  type?: "SMA" | "EMA" | "RSI" | "MACD";
  period?: number;
  source?: string; // context key holding the candle; defaults to "candle"
};

// Redis hot-path: rolling price buffer
// Accepted tradeoff: up to 100 ticks of indicator state can be lost on crash.
// Synced to IndicatorState (Postgres) every SYNC_EVERY ticks as an audit trail.
const SYNC_EVERY = 100;
const MAX_BUFFER = 500; // cap memory — keep last 500 prices

function getRedisKey(nodeId: string) {
  return `indicator:${nodeId}:prices`;
}

async function readPriceBuffer(nodeId: string): Promise<number[]> {
  try {
    const raw = await redis.get<number[]>(getRedisKey(nodeId));
    if (raw && Array.isArray(raw)) return raw;
  } catch {
    // fallback to Postgres indicator state if Redis is offline
  }

  const record = await prisma.indicatorState.findUnique({
    where: { nodeId_key: { nodeId, key: "prices" } },
  });
  if (record && Array.isArray(record.value)) {
    return record.value as number[];
  }
  return [];
}

async function writePriceBuffer(nodeId: string, prices: number[]): Promise<void> {
  const capped = prices.slice(-MAX_BUFFER);
  try {
    await redis.set(getRedisKey(nodeId), capped);
  } catch {
    // non-blocking
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
  step,
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

  const result = await step.run("compute-indicator", async () => {
    // 1. Read current price buffer from Redis
    const prices = await readPriceBuffer(nodeId);
    prices.push(candle.close);

    // 2. Compute indicator value
    const value = computeIndicator(data.type!, period, prices);

    // 3. Write updated buffer back to Redis
    await writePriceBuffer(nodeId, prices);

    // 4. Periodic sync to Postgres (every SYNC_EVERY ticks)
    if (prices.length % SYNC_EVERY === 0) {
      const workflowId = (context.__workflowId as string | undefined) ?? "unknown";
      await prisma.indicatorState.upsert({
        where: { nodeId_key: { nodeId, key: "prices" } },
        create: { nodeId, workflowId, key: "prices", value: prices },
        update: { value: prices },
      });
    }

    return { value, type: data.type, period, prices: prices.length };
  });

  await publish(indicatorChannel().status({ nodeId, status: "success" }));

  return {
    ...context,
    [data.variableName]: result,
  };
};
