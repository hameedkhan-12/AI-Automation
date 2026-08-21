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
  source?: string; 
};

const SYNC_EVERY = 100;
const MAX_BUFFER = 500;

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

async function writePriceBuffer(nodeId: string, prices: number[], workflowId: string): Promise<void> {
  const capped = prices.slice(-MAX_BUFFER);
  try {
    await redis.set(getRedisKey(nodeId), capped);
    return;
  } catch {
    // Redis unreachable — fall through to a Postgres write-through below.
    // Without this, the buffer would silently never persist between ticks
    // at all (each candle would start from empty), and a strategy would
    // quietly never accumulate enough history to compute anything —
    // exactly what happened before Upstash was configured.
  }

  try {
    await prisma.indicatorState.upsert({
      where: { nodeId_key: { nodeId, key: "prices" } },
      create: { nodeId, workflowId, key: "prices", value: capped },
      update: { value: capped },
    });
  } catch {
    // Both Redis and Postgres write failed — genuinely nothing we can do
    // to persist state this tick. Non-blocking on purpose (a live run
    // shouldn't crash over this), but this is now a real data gap, not a
    // cosmetic one.
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
    const workflowId = (context.__workflowId as string | undefined) ?? "unknown";

    const prices = await readPriceBuffer(nodeId);
    prices.push(candle.close);

    const value = computeIndicator(data.type!, period, prices);

    await writePriceBuffer(nodeId, prices, workflowId);

    if (prices.length % SYNC_EVERY === 0) {
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