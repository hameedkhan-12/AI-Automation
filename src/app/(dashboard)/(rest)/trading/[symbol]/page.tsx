import { caller } from "@/trpc/server";
import Link from "next/link";
import { ArrowLeftIcon, CandlestickChartIcon } from "lucide-react";
import { CandlestickChart } from "@/features/trading/components/candlestick-chart";

interface Props {
  params: Promise<{ symbol: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { symbol } = await params;
  const upper = symbol.toUpperCase();
  return {
    title: `${upper} Price Chart & Orders | Flux`,
    description: `Candlestick price chart, moving averages, and order history for ${upper}.`,
  };
}

export default async function SymbolDetailPage({ params }: Props) {
  const { symbol } = await params;
  const upper = symbol.toUpperCase();

  const [candles, indicators, positions, orders] = await Promise.all([
    caller.trading.candles.get({ symbol: upper, interval: "1d" }),
    caller.trading.candles.symbolIndicators({ symbol: upper, interval: "1d" }),
    caller.trading.positions.list({ symbol: upper }),
    caller.trading.orders.list({ symbol: upper, page: 1, pageSize: 10 }),
  ]);

  const activePosition = positions.find((p) => p.symbol === upper);

  // Build the subtitle from the real resolved indicator periods.
  // If no SMA nodes exist for this symbol, omit any SMA mention.
  const smaPeriodLabels = indicators.map((ind) => ind.name).join(" / ");
  const chartSubtitle =
    smaPeriodLabels.length > 0
      ? `Historical candle chart with ${smaPeriodLabels} overlays and order history.`
      : "Historical candle chart and order history.";

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/trading"
            className="size-8 rounded-lg border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <ArrowLeftIcon className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{upper}</h1>
              <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase font-mono">
                1D
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-[#00E5A0]/10 text-[#00E5A0] font-mono">
                Alpaca
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              {chartSubtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <section className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CandlestickChartIcon className="size-4 text-[#00E5A0]" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Price Chart
            </h2>
          </div>
          {candles.length > 0 && (
            <p className="text-xs text-muted-foreground font-mono">
              Latest: ${candles[candles.length - 1].close.toFixed(2)}
            </p>
          )}
        </div>
        <CandlestickChart
          symbol={upper}
          data={candles}
          indicators={indicators}
        />
      </section>

      {/* Symbol Position Status */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Position Status
        </h2>
        {!activePosition ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            No open position for {upper}.
          </div>
        ) : (
          <div className="rounded-xl border bg-card p-5 grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Quantity</p>
              <p className="text-lg font-mono font-semibold mt-0.5">
                {activePosition.quantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Entry Price</p>
              <p className="text-lg font-mono font-semibold text-[#00E5A0] mt-0.5">
                ${activePosition.avgPrice.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Est. Value</p>
              <p className="text-lg font-mono font-semibold mt-0.5">
                ${(activePosition.quantity * activePosition.avgPrice).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last Updated</p>
              <p className="text-xs font-mono text-muted-foreground mt-1.5">
                {new Date(activePosition.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Orders for Symbol */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Order History ({upper})
          </h2>
          {orders.items.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {orders.items.some((o) => o.isSimulated)
                ? "Simulated fills — no broker credentials connected"
                : "Paper trading via Alpaca"}
            </span>
          )}
        </div>
        {orders.items.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            No orders found for {upper}.
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden bg-card">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Side</th>
                  <th className="text-right px-4 py-3 font-medium font-mono">Qty</th>
                  <th className="text-right px-4 py-3 font-medium font-mono">Filled Price</th>
                  <th className="text-left px-4 py-3 font-medium">Fill Type</th>
                  <th className="text-right px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.items.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                          order.side === "BUY"
                            ? "bg-[#00E5A0]/10 text-[#00E5A0]"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {order.side}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{order.quantity}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {order.filledPrice ? `$${order.filledPrice.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-left">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-mono ${
                          order.isSimulated
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-[#00E5A0]/10 text-[#00E5A0] border border-[#00E5A0]/20"
                        }`}
                      >
                        {order.isSimulated ? "Simulated" : "Broker"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
