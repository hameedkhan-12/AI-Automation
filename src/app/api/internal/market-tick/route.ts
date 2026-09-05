import { type NextRequest, NextResponse } from "next/server";
import { inngest } from "@/inngest/client";
import { redis } from "@/lib/redis";
import { validateInternalAuth } from "@/lib/internal-auth";
import type { Candle } from "@/features/trading/adapters/types";


export async function POST(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization");
  const customSecretHeader = req.headers.get("x-internal-secret");

  if (!validateInternalAuth(authHeader, customSecretHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    symbol?: string;
    candle?: Candle;
    workflowId?: string;
  };

  try {
    body = (await req.json()) as {
      symbol?: string;
      candle?: Candle;
      workflowId?: string;
    };
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

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
      eventCreatedAt: Date.now(),
      initialData: { candle, symbol },
    },
  });

  return NextResponse.json({ ok: true });
}
