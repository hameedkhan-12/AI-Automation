import { caller } from "@/trpc/server";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

export const metadata = {
  title: "Paper Positions | Flux",
  description: "View open paper trading positions and performance.",
};

export default async function PositionsPage() {
  const positions = await caller.trading.positions.list();

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/trading"
          className="size-8 rounded-lg border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <ArrowLeftIcon className="size-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Paper Positions</h1>
          <p className="text-muted-foreground text-sm">
            Current open positions held in paper trading.
          </p>
        </div>
      </div>

      {positions.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="text-muted-foreground text-sm">No open positions found.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Run a workflow containing an Order node to place paper trades.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3.5 font-medium">Symbol</th>
                <th className="text-right px-5 py-3.5 font-medium font-mono">Quantity</th>
                <th className="text-right px-5 py-3.5 font-medium font-mono">Avg Entry Price</th>
                <th className="text-right px-5 py-3.5 font-medium font-mono">Position Value (Est.)</th>
                <th className="text-right px-5 py-3.5 font-medium">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {positions.map((pos) => {
                const estValue = pos.quantity * pos.avgPrice;
                return (
                  <tr key={pos.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-4 font-semibold">
                      <Link
                        href={`/trading/${pos.symbol}`}
                        className="text-[#00E5A0] hover:underline"
                      >
                        {pos.symbol}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-medium">
                      {pos.quantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-[#00E5A0]">
                      ${pos.avgPrice.toFixed(2)}
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-medium">
                      ${estValue.toFixed(2)}
                    </td>
                    <td className="px-5 py-4 text-right text-xs text-muted-foreground">
                      {new Date(pos.updatedAt).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
