/**
 * Unit tests for BacktestMarketDataProvider cursor behavior.
 *
 * These tests mock prisma so they don't need a real database.
 * Run with: npx vitest (or jest, depending on your setup)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { BacktestMarketDataProvider } from "../backtest";
import type { Candle } from "../../adapters/types";

// Mock prisma
vi.mock("@/lib/db", () => ({
  prisma: {
    historicalCandle: {
      findMany: vi.fn(),
    },
  },
}));

const { prisma } = await import("@/lib/db");

const makeCandle = (ts: number, close: number): Candle => ({
  timestamp: ts,
  open: close,
  high: close,
  low: close,
  close,
  volume: 1000,
});

describe("BacktestMarketDataProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns candles in order then null", async () => {
    const candles = [makeCandle(1000, 100), makeCandle(2000, 105), makeCandle(3000, 110)];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.historicalCandle.findMany as any).mockResolvedValueOnce(
      candles.map((c) => ({
        exchange: "alpaca",
        symbol: "AAPL",
        interval: "1d",
        timestamp: new Date(c.timestamp),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
      })),
    );

    const provider = new BacktestMarketDataProvider(
      "alpaca", "AAPL", "1d",
      new Date(1000), new Date(3000),
    );

    expect(await provider.getNextCandle()).toEqual(candles[0]);
    expect(await provider.getNextCandle()).toEqual(candles[1]);
    expect(await provider.getNextCandle()).toEqual(candles[2]);
    expect(await provider.getNextCandle()).toBeNull(); // exhausted
  });

  it("returns null immediately when no candles in range", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.historicalCandle.findMany as any).mockResolvedValueOnce([]);

    const provider = new BacktestMarketDataProvider(
      "alpaca", "AAPL", "1d",
      new Date(1000), new Date(2000),
    );

    expect(await provider.getNextCandle()).toBeNull();
  });

  it("loads DB only once across multiple getNextCandle calls", async () => {
    const candles = [makeCandle(1000, 100)];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.historicalCandle.findMany as any).mockResolvedValueOnce(
      candles.map((c) => ({
        exchange: "alpaca",
        symbol: "AAPL",
        interval: "1d",
        timestamp: new Date(c.timestamp),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
      })),
    );

    const provider = new BacktestMarketDataProvider(
      "alpaca", "AAPL", "1d",
      new Date(1000), new Date(1000),
    );

    await provider.getNextCandle();
    await provider.getNextCandle(); // cursor past end

    // findMany called exactly once — cursor advances in-memory after load
    expect(prisma.historicalCandle.findMany).toHaveBeenCalledTimes(1);
  });

  it("exposes totalCandles and currentIndex", async () => {
    const candles = [makeCandle(1000, 100), makeCandle(2000, 105)];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.historicalCandle.findMany as any).mockResolvedValueOnce(
      candles.map((c) => ({
        exchange: "alpaca",
        symbol: "AAPL",
        interval: "1d",
        timestamp: new Date(c.timestamp),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
      })),
    );

    const provider = new BacktestMarketDataProvider(
      "alpaca", "AAPL", "1d",
      new Date(1000), new Date(2000),
    );

    await provider.getNextCandle();
    expect(provider.totalCandles).toBe(2);
    expect(provider.currentIndex).toBe(1);
  });
});
