import Link from "next/link";

export function TradingLoadError({ detail }: { detail?: string }) {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="rounded-xl border border-dashed p-10 space-y-3">
        <h1 className="text-lg font-semibold">Trading data could not be loaded</h1>
        <p className="text-sm text-muted-foreground">
          The overview query failed on the server. This is often a production database
          that is missing trading migrations (`PaperOrder.isSimulated`,{" "}
          <code className="font-mono text-xs">ActiveMarketSubscription</code>
          ). Apply pending Prisma migrations to the Vercel database, then reload.
        </p>
        {detail ? (
          <p className="text-xs font-mono text-muted-foreground break-all">{detail}</p>
        ) : null}
        <Link href="/workflows" className="text-sm text-[#00E5A0] hover:underline inline-block">
          Back to workflows
        </Link>
      </div>
    </div>
  );
}
