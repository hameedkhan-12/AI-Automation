/**
 * Seeds a ready-to-run "AAPL SMA 10/30 Crossover" workflow, fully wired
 * with the Condition node (the piece that was missing before) so it
 * actually behaves like a real strategy instead of buying unconditionally.
 *
 * Usage:
 *   npx tsx scripts/seed-trading-workflow.ts you@example.com
 *
 * If you omit the email, it uses the first user found in the database.
 *
 * What this creates, in plain terms:
 *
 *   Market Data (AAPL)
 *        │
 *        ├──> Fast SMA (10-day average)  ──┐
 *        │                                  ├──> Condition ──> Order (BUY 10 AAPL)
 *        └──> Slow SMA (30-day average)  ──┘
 *
 *   The idea: a 10-day average reacts faster to price than a 30-day
 *   average. When the fast one crosses ABOVE the slow one, it's read as
 *   "the stock's short-term trend just turned upward" — a classic,
 *   simple momentum signal. The Condition node only lets the Order node
 *   run on the exact tick that crossover happens — not on every tick.
 *
 * No Alpaca credential is attached to the Order node on purpose: with no
 * credential, it uses a simulated paper fill automatically (see the
 * order executor's hasRealCredentials check) — so this runs out of the
 * box with zero API keys required. Attach a real Alpaca credential to
 * the Order node later once you're ready to test against the real API.
 */

import { prisma } from "../src/lib/db";
import { NodeType } from "../src/generated/prisma/enums";

async function main() {
  const emailArg = process.argv[2];

  const user = emailArg
    ? await prisma.user.findUniqueOrThrow({ where: { email: emailArg } })
    : await prisma.user.findFirstOrThrow();

  console.log(`Seeding workflow for user: ${user.email} (${user.id})`);

  // Backtest range: 6 months back from today. Long enough to give the
  // 30-day SMA real history to work with — a short range (like a few
  // weeks) will never produce enough candles for SMA30 to stop being null.
  const today = new Date();
  const sixMonthsAgo = new Date(today);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const backtestFrom = sixMonthsAgo.toISOString().slice(0, 10);
  const backtestTo = today.toISOString().slice(0, 10);

  const workflow = await prisma.workflow.create({
    data: {
      name: "AAPL SMA 10/30 Crossover (Demo)",
      userId: user.id,
    },
  });

  // ---- Nodes ------------------------------------------------------------
  // Positions are laid out left-to-right, indicators fanning out above and
  // below the middle line, mirroring the diagram shape from the original
  // architecture doc.

  const marketData = await prisma.node.create({
    data: {
      workflowId: workflow.id,
      type: NodeType.MARKET_DATA_TRIGGER,
      name: "Market Data",
      position: { x: 0, y: 260 },
      data: {
        symbol: "AAPL",
        exchange: "alpaca",
        interval: "1d",
        mode: "backtest",
        backtestFrom,
        backtestTo,
      },
    },
  });

  const fastSma = await prisma.node.create({
    data: {
      workflowId: workflow.id,
      type: NodeType.INDICATOR,
      name: "Fast SMA (10)",
      position: { x: 340, y: 100 },
      data: {
        variableName: "fastSma",
        type: "SMA",
        period: 10,
        source: "candle",
      },
    },
  });

  const slowSma = await prisma.node.create({
    data: {
      workflowId: workflow.id,
      type: NodeType.INDICATOR,
      name: "Slow SMA (30)",
      position: { x: 340, y: 420 },
      data: {
        variableName: "slowSma",
        type: "SMA",
        period: 30,
        source: "candle",
      },
    },
  });

  const condition = await prisma.node.create({
    data: {
      workflowId: workflow.id,
      type: NodeType.CONDITION,
      name: "Crossover?",
      position: { x: 680, y: 260 },
      data: {
        leftPath: "fastSma.value",
        operator: "crosses_above",
        rightPath: "slowSma.value",
      },
    },
  });

  const order = await prisma.node.create({
    data: {
      workflowId: workflow.id,
      type: NodeType.ORDER,
      name: "Buy AAPL",
      position: { x: 1000, y: 260 },
      data: {
        exchange: "alpaca",
        symbol: "AAPL",
        side: "BUY",
        quantity: 10,
        orderType: "MARKET",
        // No credentialId set — runs as a simulated paper fill by default.
      },
    },
  });

  // ---- Connections --------------------------------------------------------

  await prisma.connection.createMany({
    data: [
      { workflowId: workflow.id, fromNodeId: marketData.id, toNodeId: fastSma.id },
      { workflowId: workflow.id, fromNodeId: marketData.id, toNodeId: slowSma.id },
      { workflowId: workflow.id, fromNodeId: fastSma.id, toNodeId: condition.id },
      { workflowId: workflow.id, fromNodeId: slowSma.id, toNodeId: condition.id },
      { workflowId: workflow.id, fromNodeId: condition.id, toNodeId: order.id },
    ],
  });

  console.log(`\nDone. Open the workflow at:\n  /workflows/${workflow.id}\n`);
  console.log(`Backtest range defaulted to ${backtestFrom} → ${backtestTo}.`);
  console.log(`Click "Run Backtest" in the editor header to test it.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });