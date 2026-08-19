import type { Candle } from "../adapters/types";

/**
 * The unified interface for candle delivery — both live and backtest modes.
 *
 * Node executors (indicator, order) receive a Candle from context.candle
 * regardless of mode — they are completely agnostic to live vs. backtest.
 * This is the parity guarantee.
 */
export interface MarketDataProvider {
  mode: "live" | "backtest";
  /** Returns the next candle, or null when the stream is exhausted (backtest finished). */
  getNextCandle(): Promise<Candle | null>;
}
