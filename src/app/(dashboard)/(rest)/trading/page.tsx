import { trpc } from "@/trpc/server";
import Link from "next/link";
import { TrendingUpIcon, BarChart3Icon, ArrowUpDownIcon } from "lucide-react";

export const metadata = {
  title: "Trading | Flux",
  description: "Paper trading overview — positions, strategies, and exchange connections.",
};

export default async function TradingPage() {
  const [exchanges, positions, orders] = await Promise.all([
    trpc.trading.exchanges.list(),
    trpc.trading.positions.list(),
    trpc.trading.orders.list({ page: 1, pageSize: 5 }),
  ]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trading</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Paper trading via Alpaca — no real money.
        </p>
      </div>

      {/* Connected Exchanges */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Connected Exchanges
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {exchanges.map((ex) => (
            <div
              key={ex}
              className="rounded-xl border bg-card p-4 flex items-center gap-3"
            >
              <div className="size-8 rounded-full bg-[#00E5A0]/10 flex items-center justify-center">
                <TrendingUpIcon className="size-4 text-[#00E5A0]" />
              </div>
              <div>
                <p className="font-medium capitalize">{ex}</p>
                <p className="text-xs text-muted-foreground">Paper trading</p>
              </div>
            </div>
          ))}
          {exchanges.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-3">
              No exchanges configured. Add Alpaca credentials in{" "}
              <Link href="/credentials" className="underline">Credentials</Link>.
            </p>
          )}
        </div>
      </section>

      {/* Open Positions */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Open Positions
          </h2>
          <Link href="/trading/positions" className="text-xs text-[#00E5A0] hover:underline">
            View all →
          </Link>
        </div>
        {positions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open positions.</p>
        ) : (
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Symbol</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground font-mono">Qty</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground font-mono">Avg Price</th>
                </tr>
              </thead>
              <tbody>
                {positions.slice(0, 5).map((pos) => (
                  <tr key={pos.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{pos.symbol}</td>
                    <td className="px-4 py-3 text-right font-mono">{pos.quantity}</td>
                    <td className="px-4 py-3 text-right font-mono text-[#00E5A0]">
                      ${pos.avgPrice.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Recent Orders */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Recent Orders
          </h2>
        </div>
        {orders.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet. Build a workflow with an Order node to get started.</p>
        ) : (
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Symbol</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Side</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground font-mono">Qty</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground font-mono">Fill Price</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.items.map((order) => (
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{order.symbol}</td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${order.side === "BUY" ? "text-[#00E5A0]" : "text-red-400"}`}>
                        {order.side}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{order.quantity}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {order.filledPrice ? `$${order.filledPrice.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        order.status === "FILLED"
                          ? "bg-[#00E5A0]/10 text-[#00E5A0]"
                          : order.status === "REJECTED"
                          ? "bg-red-400/10 text-red-400"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Quick links */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/trading/positions"
          className="rounded-xl border p-5 flex items-center gap-4 hover:border-[#00E5A0]/40 transition-colors group"
        >
          <BarChart3Icon className="size-5 text-muted-foreground group-hover:text-[#00E5A0] transition-colors" />
          <div>
            <p className="font-medium">Positions</p>
            <p className="text-xs text-muted-foreground">View all open paper positions</p>
          </div>
        </Link>
        <Link
          href="/workflows"
          className="rounded-xl border p-5 flex items-center gap-4 hover:border-[#00E5A0]/40 transition-colors group"
        >
          <ArrowUpDownIcon className="size-5 text-muted-foreground group-hover:text-[#00E5A0] transition-colors" />
          <div>
            <p className="font-medium">Strategies</p>
            <p className="text-xs text-muted-foreground">Build & run trading workflows</p>
          </div>
        </Link>
      </section>
    </div>
  );
}
