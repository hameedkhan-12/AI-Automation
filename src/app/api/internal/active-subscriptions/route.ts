import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateInternalAuth } from "@/lib/internal-auth";

/**
 * GET /api/internal/active-subscriptions
 *
 * Internal endpoint called by the market-listener process on startup
 * to reconcile and restore active market subscriptions from database persistence.
 *
 * Auth: Requires valid shared secret via `Authorization: Bearer <INTERNAL_API_SECRET>`
 *       or `X-Internal-Secret: <INTERNAL_API_SECRET>`.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization");
  const customSecretHeader = req.headers.get("x-internal-secret");

  if (!validateInternalAuth(authHeader, customSecretHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const subscriptions = await prisma.activeMarketSubscription.findMany({
      select: {
        workflowId: true,
        symbol: true,
      },
    });

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error("[active-subscriptions] Failed to fetch active subscriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch active subscriptions" },
      { status: 500 },
    );
  }
}
