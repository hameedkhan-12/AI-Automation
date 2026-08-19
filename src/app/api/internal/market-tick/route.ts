import { type NextRequest, NextResponse } from "next/server";
import { inngest } from "@/inngest/client";
import { redis } from "@/lib/redis";
import type { Candle } from "@/features/trading/adapters/types";

/**
 * POST /api/internal/market-tick
 *
 * Called by the standalone market-listener process to forward a tick into
 * Inngest. This route is the only point of contact between the listener and
 * the Next.js app — the listener holds zero business logic.
 *
 * Body: { symbol: string, candle: Candle, workflowId: string }
 *
 * The route:
 *  1. Writes the latest candle to Redis (tick:{symbol}) for LiveMarketDataProvider
 *  2. Sends an Inngest event to trigger the workflow for this tick
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as {
    symbol?: string;
    candle?: Candle;
    workflowId?: string;
  };

  if (!body.symbol || !body.candle || !body.workflowId) {
    return NextResponse.json(
      { error: "symbol, candle, and workflowId are required" },
      { status: 400 },
    );
  }

  const { symbol, candle, workflowId } = body;

  // 1. Cache latest tick in Redis (TTL 1h — live stale tick guard)
  await redis.set(`tick:${symbol}`, candle, { ex: 3600 });

  // 2. Trigger workflow execution for this tick
  await inngest.send({
    name: "workflows/execute.workflow",
    data: {
      workflowId,
      initialData: { candle, symbol },
    },
  });

  return NextResponse.json({ ok: true });
}
