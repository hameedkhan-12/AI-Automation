/**
 * Batch-triggers real workflow executions via the same Inngest event
 * ("workflows/execute.workflow") that live market ticks use, so the
 * resulting NodeExecutionLog data is representative of production latency —
 * not a synthetic shortcut.
 *
 * Use this to build enough sample size for scripts/analyze-performance.ts
 * to produce a trustworthy p95/p99, without waiting on real market hours.
 *
 * Run with: npx tsx scripts/batch-trigger-executions.ts <workflowId> <count> [batchSize]
 * Example (paced, default):  npx tsx scripts/batch-trigger-executions.ts clx1a2b3c4 200
 * Example (all at once):     npx tsx scripts/batch-trigger-executions.ts clx1a2b3c4 200 200
 * Example (custom pacing):   npx tsx scripts/batch-trigger-executions.ts clx1a2b3c4 200 25
 *
 * batchSize defaults to 10 if omitted. Setting it equal to (or greater than)
 * count sends everything in a single burst with no pacing delay — useful for
 * testing the true concurrency ceiling rather than steady-state throughput.
 */

import "dotenv/config";
import { Inngest } from "inngest";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set in environment or .env file");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const inngest = new Inngest({
  id: "flux-batch-trigger-script",
  eventKey: process.env.INNGEST_EVENT_KEY,
});

const DELAY_BETWEEN_BATCHES_MS = 500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const workflowId = process.argv[2];
  const count = Number(process.argv[3] ?? 100);
  const batchSize = Number(process.argv[4] ?? 10);

  if (!workflowId) {
    console.error(
      "Usage: npx tsx scripts/batch-trigger-executions.ts <workflowId> <count> [batchSize]",
    );
    console.error(
      "\nNo workflowId provided — here are the workflows in your DB:\n",
    );
    const workflows = await prisma.workflow.findMany({
      select: { id: true, name: true },
    });
    for (const w of workflows) {
      console.error(`  ${w.id}  —  ${w.name}`);
    }
    process.exit(1);
  }

  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    include: { nodes: true },
  });

  if (!workflow) {
    console.error(`No workflow found with id ${workflowId}`);
    process.exit(1);
  }

  // Find the market-data-trigger / manual-trigger node to know what symbol
  // this workflow expects, so the synthetic candle looks realistic.
  const triggerNode = workflow.nodes.find(
    (n) => n.type === "MARKET_DATA_TRIGGER" || n.type === "MANUAL_TRIGGER",
  );
  const symbol =
    (triggerNode?.data as { symbol?: string } | null)?.symbol ?? "AAPL";

  const isSingleBurst = batchSize >= count;
  console.log(
    isSingleBurst
      ? `\n🚀 Triggering ${count} executions of "${workflow.name}" (${symbol}) in a single burst (no pacing)...\n`
      : `\n🚀 Triggering ${count} executions of "${workflow.name}" (${symbol}) in batches of ${batchSize}...\n`,
  );

  let sent = 0;
  let basePrice = 150 + Math.random() * 50;

  while (sent < count) {
    const batch = Math.min(batchSize, count - sent);
    const sends = Array.from({ length: batch }, () => {
      // Small random walk so successive candles aren't identical — closer
      // to what a real price feed looks like, and avoids every SMA
      // computation being over an artificially flat series.
      basePrice += (Math.random() - 0.5) * 2;
      const candle = {
        timestamp: Date.now(),
        open: basePrice,
        high: basePrice + Math.random(),
        low: basePrice - Math.random(),
        close: basePrice,
        volume: Math.floor(1000 + Math.random() * 5000),
      };

      return inngest.send({
        name: "workflows/execute.workflow",
        data: {
          workflowId,
          initialData: { candle, symbol },
        },
      });
    });

    await Promise.all(sends);
    sent += batch;
    process.stdout.write(`  sent ${sent}/${count}\r`);
    if (sent < count) await sleep(DELAY_BETWEEN_BATCHES_MS);
  }

  console.log(`\n\n✅ Sent ${count} execution events.`);
  console.log(
    "Give Inngest a minute or two to process the queue, then run:\n",
  );
  console.log("  npx tsx scripts/analyze-performance.ts 1\n");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
