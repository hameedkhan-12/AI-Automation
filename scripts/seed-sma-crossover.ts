/**
 * Seed Script: Pre-built SMA-Crossover Strategy Workflow
 *
 * Creates a pre-configured SMA-crossover trading workflow for the first user in the DB.
 * Graph layout:
 *   [Market Data Trigger (AAPL)] -> [SMA Fast (Period 10)] -> [SMA Slow (Period 30)] -> [Order Node (Alpaca BUY)]
 *
 * Run with: npx tsx scripts/seed-sma-crossover.ts
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createId } from "@paralleldrive/cuid2";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set in environment or .env file");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log("🌱 Seeding SMA-Crossover Demo Workflow...");

  const user = await prisma.user.findFirst();
  if (!user) {
    console.error("❌ No users found in database. Please log in or create a user first.");
    process.exit(1);
  }

  // 1. Create or fetch an Alpaca Credential placeholder
  let credential = await prisma.credential.findFirst({
    where: { userId: user.id, type: "ALPACA" as any },
  });

  if (!credential) {
    console.log("Creating placeholder Alpaca credential...");
    credential = await prisma.credential.create({
      data: {
        name: "Alpaca Paper Trading",
        type: "ALPACA" as any,
        value: "encrypted_placeholder_value",
        userId: user.id,
      },
    });
  }

  // 2. Build the nodes
  const triggerNodeId = createId();
  const fastSmaNodeId = createId();
  const slowSmaNodeId = createId();
  const orderNodeId = createId();

  const workflow = await prisma.workflow.create({
    data: {
      name: "AAPL SMA 10/30 Crossover Strategy",
      userId: user.id,
      nodes: {
        create: [
          {
            id: triggerNodeId,
            name: "Market Data (AAPL)",
            type: "MARKET_DATA_TRIGGER" as any,
            position: { x: 50, y: 150 },
            data: {
              symbol: "AAPL",
              exchange: "alpaca",
              interval: "1d",
              mode: "backtest",
            },
          },
          {
            id: fastSmaNodeId,
            name: "Fast SMA (10)",
            type: "INDICATOR" as any,
            position: { x: 350, y: 100 },
            data: {
              variableName: "fastSma",
              type: "SMA",
              period: 10,
              source: "candle",
            },
          },
          {
            id: slowSmaNodeId,
            name: "Slow SMA (30)",
            type: "INDICATOR" as any,
            position: { x: 350, y: 250 },
            data: {
              variableName: "slowSma",
              type: "SMA",
              period: 30,
              source: "candle",
            },
          },
          {
            id: orderNodeId,
            name: "Paper Order (Alpaca)",
            type: "ORDER" as any,
            position: { x: 650, y: 180 },
            credentialId: credential.id,
            data: {
              exchange: "alpaca",
              credentialId: credential.id,
              symbol: "AAPL",
              side: "BUY",
              quantity: 10,
              orderType: "MARKET",
            },
          },
        ],
      },
      connections: {
        create: [
          {
            fromNodeId: triggerNodeId,
            toNodeId: fastSmaNodeId,
            fromOutput: "source-1",
            toInput: "target-1",
          },
          {
            fromNodeId: triggerNodeId,
            toNodeId: slowSmaNodeId,
            fromOutput: "source-1",
            toInput: "target-1",
          },
          {
            fromNodeId: fastSmaNodeId,
            toNodeId: orderNodeId,
            fromOutput: "source-1",
            toInput: "target-1",
          },
          {
            fromNodeId: slowSmaNodeId,
            toNodeId: orderNodeId,
            fromOutput: "source-1",
            toInput: "target-1",
          },
        ],
      },
    },
  });

  console.log(`✅ Successfully created Demo Workflow: "${workflow.name}" (ID: ${workflow.id})`);
}

seed()
  .catch((e) => {
    console.error("Failed to seed demo workflow:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
