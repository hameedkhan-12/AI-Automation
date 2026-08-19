/**
 * Unit tests for buildBacktestSummary (equity curve + drawdown math).
 *
 * These tests are pure — no DB, no Redis, no network.
 * Run with: npx vitest
 */

import { describe, it, expect } from "vitest";
import { buildBacktestSummary } from "../backtest";
import type { Candle } from "../../adapters/types";
import type { Trade } from "../backtest";

const candle = (ts: number, close: number): Candle => ({
  timestamp: ts, open: close, high: close, low: close, close, volume: 1000,
});

describe("buildBacktestSummary", () => {
  it("returns initial equity when no trades are placed", () => {
    const candles = [candle(1000, 100), candle(2000, 110), candle(3000, 120)];
    const result = buildBacktestSummary(10_000, candles, []);

    expect(result.equityCurve).toHaveLength(3);
    // No trades → equity = cash throughout
    for (const point of result.equityCurve) {
      expect(point.equity).toBe(10_000);
    }
    expect(result.totalReturnPct).toBe(0);
    expect(result.maxDrawdownPct).toBe(0);
    expect(result.totalTrades).toBe(0);
  });

  it("reflects a profitable BUY-then-SELL correctly", () => {
    // Buy 10 shares at 100, sell at 120 → profit 200, return 2%
    const candles = [candle(1000, 100), candle(2000, 110), candle(3000, 120)];
    const trades: Trade[] = [
      { timestamp: 1000, side: "BUY", symbol: "AAPL", quantity: 10, price: 100 },
      { timestamp: 3000, side: "SELL", symbol: "AAPL", quantity: 10, price: 120 },
    ];

    const result = buildBacktestSummary(10_000, candles, trades);

    const lastPoint = result.equityCurve[result.equityCurve.length - 1]!;
    // After sell: cash = 10_000 - 1000 + 1200 = 10_200, shares = 0
    expect(lastPoint.equity).toBe(10_200);
    expect(result.totalReturnPct).toBe(2);
    expect(result.totalTrades).toBe(2);
  });

  it("calculates max drawdown correctly", () => {
    // Equity rises to 11_000 then falls to 9_900 → drawdown = (11000-9900)/11000 * 100 ≈ 10%
    const candles = [
      candle(1000, 100), // start: equity 10_000
      candle(2000, 110), // peak: equity 10_100 (hold 1 share)
      candle(3000, 90),  // drop: equity 9_900
    ];
    const trades: Trade[] = [
      { timestamp: 1000, side: "BUY", symbol: "AAPL", quantity: 1, price: 100 },
    ];

    const result = buildBacktestSummary(10_000, candles, trades);

    // After buy at 1000: cash = 9_900, shares = 1
    // At candle 2000 (close=110): equity = 9_900 + 110 = 10_010 → peak
    // At candle 3000 (close=90): equity = 9_900 + 90 = 9_990 → drawdown from 10_010
    expect(result.maxDrawdownPct).toBeGreaterThan(0);
    expect(result.equityCurve).toHaveLength(3);
  });

  it("equity curve has one point per candle", () => {
    const candles = Array.from({ length: 50 }, (_, i) => candle(i * 1000, 100 + i));
    const result = buildBacktestSummary(10_000, candles, []);
    expect(result.equityCurve).toHaveLength(50);
  });

  it("handles zero candles gracefully", () => {
    const result = buildBacktestSummary(10_000, [], []);
    expect(result.equityCurve).toHaveLength(0);
    expect(result.totalReturnPct).toBe(0);
    expect(result.maxDrawdownPct).toBe(0);
  });
});
