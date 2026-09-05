import "dotenv/config";
import { prisma } from "../src/lib/db";
import { Redis } from "@upstash/redis";

// Standalone Redis client (mirrors src/lib/redis.ts) — avoids importing the
// "server-only"-guarded module from a plain Node script.
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// ─── Percentile helper ──────────────────────────────────────────────────────
function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sortedValues.length) - 1;
  return sortedValues[Math.min(Math.max(idx, 0), sortedValues.length - 1)];
}

function stats(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    count: sorted.length,
    avgMs: sorted.length ? Math.round(sum / sorted.length) : 0,
    p50Ms: Math.round(percentile(sorted, 50)),
    p95Ms: Math.round(percentile(sorted, 95)),
    p99Ms: Math.round(percentile(sorted, 99)),
    maxMs: sorted.length ? sorted[sorted.length - 1] : 0,
  };
}

// ─── 1. Per-node-type latency ───────────────────────────────────────────────
// Every node execution already writes durationMs to NodeExecutionLog — this
// has been true since the engine was built, it's just never been aggregated
// until now.
async function nodeTypeLatency(sinceDays: number) {
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);

  const logs = await prisma.nodeExecutionLog.findMany({
    where: { createdAt: { gte: since }, error: null },
    select: { nodeType: true, durationMs: true },
  });

  const byType = new Map<string, number[]>();
  for (const log of logs) {
    const arr = byType.get(log.nodeType) ?? [];
    arr.push(log.durationMs);
    byType.set(log.nodeType, arr);
  }

  const rows = [...byType.entries()]
    .map(([nodeType, durations]) => ({ nodeType, ...stats(durations) }))
    .sort((a, b) => b.p95Ms - a.p95Ms);

  return rows;
}

// ─── 2. End-to-end workflow latency ─────────────────────────────────────────
async function workflowLatency(sinceDays: number) {
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);

  const executions = await prisma.execution.findMany({
    where: {
      startedAt: { gte: since },
      completedAt: { not: null },
    },
    select: { startedAt: true, completedAt: true },
  });

  const durations = executions.map(
    (e) => e.completedAt!.getTime() - e.startedAt.getTime(),
  );

  return stats(durations);
}

// ─── 3. External-API time vs internal-logic time ────────────────────────────
// Classifies node types as "external" (network round-trip to a third-party
// API) vs "internal" (pure engine/DB logic) and reports the split of total
// execution time between the two. Extend EXTERNAL_NODE_TYPES if new
// integrations are added.
const EXTERNAL_NODE_TYPES = new Set([
  "OPENAI",
  "ANTHROPIC",
  "GEMINI",
  "DISCORD",
  "SLACK",
  "HTTP_REQUEST",
  "STRIPE_TRIGGER",
  "GOOGLE_FORM_TRIGGER",
]);

async function externalVsInternalSplit(sinceDays: number) {
  const rows = await nodeTypeLatency(sinceDays);
  let externalMs = 0;
  let internalMs = 0;

  for (const row of rows) {
    const totalForType = row.avgMs * row.count;
    if (EXTERNAL_NODE_TYPES.has(row.nodeType)) {
      externalMs += totalForType;
    } else {
      internalMs += totalForType;
    }
  }

  const totalMs = externalMs + internalMs || 1;
  return {
    externalMs: Math.round(externalMs),
    internalMs: Math.round(internalMs),
    externalPct: Math.round((externalMs / totalMs) * 100),
    internalPct: Math.round((internalMs / totalMs) * 100),
  };
}

// ─── 4. Redis workflow-cache hit rate ───────────────────────────────────────
// Reads the daily hit/miss counters written in src/inngest/functions.ts.
async function cacheHitRate(sinceDays: number) {
  let hits = 0;
  let misses = 0;

  for (let i = 0; i < sinceDays; i++) {
    const day = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const [h, m] = await Promise.all([
      redis.get<number>(`metrics:workflow-cache:${day}:hit`),
      redis.get<number>(`metrics:workflow-cache:${day}:miss`),
    ]);
    hits += h ?? 0;
    misses += m ?? 0;
  }

  const total = hits + misses || 1;
  return {
    hits,
    misses,
    hitRatePct: Math.round((hits / total) * 100),
  };
}

// ─── 5. Queue-wait time (producer send → function start) ──────────────────
// Requires eventCreatedAt to be populated (route.ts / utils.ts set this when
// sending the event). Executions without it (older data, manual triggers
// that predate this instrumentation) are excluded, not treated as zero.
async function queueWaitTime(sinceDays: number) {
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);

  const executions = await prisma.execution.findMany({
    where: { startedAt: { gte: since }, eventCreatedAt: { not: null } },
    select: { startedAt: true, eventCreatedAt: true },
  });

  const waits = executions.map(
    (e) => e.startedAt.getTime() - e.eventCreatedAt!.getTime(),
  );

  return { ...stats(waits), missingTimestamp: waits.length === 0 };
}

// ─── Report ──────────────────────────────────────────────────────────────
async function main() {
  const SINCE_DAYS = Number(process.argv[2] ?? 7);

  console.log(`\n📊 Flux performance report — last ${SINCE_DAYS} day(s)\n`);

  console.log("── Per-node-type latency (ms) ──────────────────────────────");
  const nodeRows = await nodeTypeLatency(SINCE_DAYS);
  if (nodeRows.length === 0) {
    console.log("  No node executions in this window.");
  } else {
    console.table(nodeRows);
  }

  console.log("\n── End-to-end workflow latency (ms) ────────────────────────");
  const wfStats = await workflowLatency(SINCE_DAYS);
  console.table([wfStats]);

  console.log("\n── External API time vs internal engine time ──────────────");
  const split = await externalVsInternalSplit(SINCE_DAYS);
  console.log(
    `  External (AI/API calls): ${split.externalPct}%  (${split.externalMs}ms total)`,
  );
  console.log(
    `  Internal (engine/DB):    ${split.internalPct}%  (${split.internalMs}ms total)`,
  );

  console.log("\n── Redis workflow-cache hit rate ───────────────────────────");
  const cache = await cacheHitRate(SINCE_DAYS);
  console.log(
    `  ${cache.hitRatePct}% hit rate  (${cache.hits} hits / ${cache.misses} misses)`,
  );

  console.log("\n── Queue-wait time (event sent → function started) ────────");
  const queueWait = await queueWaitTime(SINCE_DAYS);
  if (queueWait.missingTimestamp) {
    console.log(
      "  No executions with eventCreatedAt in this window yet — deploy the",
    );
    console.log(
      "  producer-timestamp change and run a fresh batch to populate this.",
    );
  } else {
    console.table([queueWait]);
  }

  console.log("\nDone.\n");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());