import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/trading/candles/[symbol]
 *
 * Serves cached OHLCV data from the HistoricalCandle Postgres table.
 * Used by the backtest results page's lightweight-charts component.
 *
 * Query params:
 *   exchange  (default: alpaca)
 *   interval  (default: 1d)
 *   from      ISO date string
 *   to        ISO date string
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
): Promise<NextResponse> {
  const { symbol } = await params;
  const { searchParams } = req.nextUrl;

  const exchange = searchParams.get("exchange") ?? "alpaca";
  const interval = searchParams.get("interval") ?? "1d";
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const candles = await prisma.historicalCandle.findMany({
    where: {
      exchange,
      symbol: symbol.toUpperCase(),
      interval,
      ...(from || to
        ? {
            timestamp: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    orderBy: { timestamp: "asc" },
    take: 10000,
  });

  return NextResponse.json(
    candles.map((c) => ({
      time: Math.floor(c.timestamp.getTime() / 1000), // lightweight-charts uses Unix seconds
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
    })),
  );
}
