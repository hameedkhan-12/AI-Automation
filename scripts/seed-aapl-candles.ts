import "dotenv/config";
import { prisma } from "../src/lib/db";

async function main() {
  console.log("🌱 Seeding extended historical candles for AAPL (1d)...");

  // Generate 90 trading days ending at 2026-08-21
  const endDate = new Date("2026-08-21T04:00:00.000Z");
  const candles = [];

  let current = new Date(endDate);
  let basePrice = 309.27;

  // Generate backwards for 120 calendar days to get ~85+ trading days
  const daysToGenerate = 130;
  const dates: Date[] = [];

  for (let i = 0; i < daysToGenerate; i++) {
    const d = new Date(current);
    d.setUTCDate(d.getUTCDate() - i);
    const dayOfWeek = d.getUTCDay();
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      dates.push(d);
    }
  }

  // Reverse so oldest is first
  dates.reverse();

  // Starting price 90 days ago ~ 260.00 climbing to 309.27
  let price = 265.0;
  const step = (basePrice - price) / dates.length;

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    // Add realistic variation
    const noise = (Math.sin(i / 5) * 4) + ((i % 3) - 1) * 1.5;
    price += step + (Math.sin(i / 2) * 0.8);
    const close = Math.round((price + noise) * 100) / 100;
    const open = Math.round((close - 0.75 + Math.random() * 1.5) * 100) / 100;
    const high = Math.round((Math.max(open, close) + 1.2 + Math.random() * 1.0) * 100) / 100;
    const low = Math.round((Math.min(open, close) - 1.2 - Math.random() * 1.0) * 100) / 100;
    const volume = Math.floor(45000000 + Math.random() * 20000000);

    candles.push({
      exchange: "alpaca",
      symbol: "AAPL",
      interval: "1d",
      timestamp: date,
      open,
      high,
      low,
      close,
      volume,
    });
  }

  console.log(`Inserting/upserting ${candles.length} candles for AAPL...`);

  for (const c of candles) {
    await prisma.historicalCandle.upsert({
      where: {
        exchange_symbol_interval_timestamp: {
          exchange: c.exchange,
          symbol: c.symbol,
          interval: c.interval,
          timestamp: c.timestamp,
        },
      },
      create: c,
      update: {
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
      },
    });
  }

  const finalCount = await prisma.historicalCandle.count({
    where: { symbol: "AAPL", exchange: "alpaca", interval: "1d" },
  });

  const first = await prisma.historicalCandle.findFirst({
    where: { symbol: "AAPL", exchange: "alpaca", interval: "1d" },
    orderBy: { timestamp: "asc" },
  });

  const last = await prisma.historicalCandle.findFirst({
    where: { symbol: "AAPL", exchange: "alpaca", interval: "1d" },
    orderBy: { timestamp: "desc" },
  });

  console.log(`✅ Done. AAPL candles in DB: ${finalCount} rows (from ${first?.timestamp.toISOString().slice(0, 10)} to ${last?.timestamp.toISOString().slice(0, 10)})`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
