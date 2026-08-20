import { caller } from "@/trpc/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, TrendingUpIcon, ActivityIcon, PercentIcon } from "lucide-react";
import dynamic from "next/dynamic";
import type { BacktestSummary } from "@/features/trading/providers/backtest";

// Dynamically import EquityChart to ensure no SSR window errors with lightweight-charts
const EquityChart = dynamic(
  () => import("@/features/trading/components/equity-chart").then((mod) => mod.EquityChart),
  { ssr: false, loading: () => <div className="h-[320px] flex items-center justify-center text-muted-foreground text-sm">Loading chart...</div> }
);

interface Props {
  params: Promise<{ backtestId: string }>;
}

export const metadata = {
  title: "Backtest Results | Flux",
  description: "Equity curve and simulated trade execution analysis.",
};

export default async function BacktestResultsPage({ params }: Props) {
  const { backtestId } = await params;

  let execution;
  try {
    execution = await caller.executions.getOne({ id: backtestId });
  } catch {
    notFound();
  }

  const output = execution.output as BacktestSummary | null;

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
              <h1 className="text-2xl font-bold tracking-tight">Backtest Report</h1>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  execution.status === "SUCCESS"
                    ? "bg-[#00E5A0]/10 text-[#00E5A0]"
                    : execution.status === "FAILED"
                    ? "bg-red-400/10 text-red-400"
                    : "bg-amber-400/10 text-amber-400"
                }`}
              >
                {execution.status}
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              Workflow: <span className="font-medium text-foreground">{execution.workflow?.name}</span> · Started {new Date(execution.startedAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {!output ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          {execution.status === "RUNNING"
            ? "Backtest is currently executing historical candles in-process..."
            : "No summary statistics generated for this backtest."}
        </div>
      ) : (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border bg-card p-5 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground text-xs uppercase tracking-wider font-medium">
                <span>Total Return</span>
                <PercentIcon className="size-4" />
              </div>
              <p
                className={`text-2xl font-bold font-mono ${
                  output.totalReturnPct >= 0 ? "text-[#00E5A0]" : "text-red-400"
                }`}
              >
                {output.totalReturnPct > 0 ? `+${output.totalReturnPct}%` : `${output.totalReturnPct}%`}
              </p>
            </div>

            <div className="rounded-xl border bg-card p-5 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground text-xs uppercase tracking-wider font-medium">
                <span>Max Drawdown</span>
                <TrendingUpIcon className="size-4" />
              </div>
              <p className="text-2xl font-bold font-mono text-amber-400">
                {output.maxDrawdownPct}%
              </p>
            </div>

            <div className="rounded-xl border bg-card p-5 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground text-xs uppercase tracking-wider font-medium">
                <span>Win Rate</span>
                <ActivityIcon className="size-4" />
              </div>
              <p className="text-2xl font-bold font-mono">
                {output.winRate}%
              </p>
            </div>

            <div className="rounded-xl border bg-card p-5 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground text-xs uppercase tracking-wider font-medium">
                <span>Total Trades</span>
                <ActivityIcon className="size-4" />
              </div>
              <p className="text-2xl font-bold font-mono">
                {output.totalTrades}
              </p>
            </div>
          </div>

          {/* Equity Curve Chart */}
          <section className="rounded-xl border bg-card p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight">Equity Curve ($10,000 Starting)</h2>
              <p className="text-xs text-muted-foreground">Portfolio marked-to-market across backtested timestamps</p>
            </div>
            <div className="pt-2">
              <EquityChart data={output.equityCurve || []} />
            </div>
          </section>

          {/* Trade Log */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Simulated Trades ({output.trades?.length || 0})
            </h2>

            {(!output.trades || output.trades.length === 0) ? (
              <p className="text-sm text-muted-foreground">No trades executed during this backtest run.</p>
            ) : (
              <div className="rounded-xl border overflow-hidden bg-card">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/40 text-muted-foreground">
                    <tr>
                      <th className="text-left px-5 py-3 font-medium">Timestamp</th>
                      <th className="text-left px-5 py-3 font-medium">Symbol</th>
                      <th className="text-left px-5 py-3 font-medium">Side</th>
                      <th className="text-right px-5 py-3 font-medium font-mono">Quantity</th>
                      <th className="text-right px-5 py-3 font-medium font-mono">Simulated Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {output.trades.map((trade, idx) => (
                      <tr key={idx} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3.5 text-xs text-muted-foreground">
                          {new Date(trade.timestamp).toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5 font-medium">{trade.symbol}</td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`font-semibold text-xs px-2 py-0.5 rounded-full ${
                              trade.side === "BUY"
                                ? "bg-[#00E5A0]/10 text-[#00E5A0]"
                                : "bg-red-400/10 text-red-400"
                            }`}
                          >
                            {trade.side}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-medium">
                          {trade.quantity}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-medium">
                          ${trade.price.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
