import { redis } from "@/lib/redis";
import type { Candle } from "../adapters/types";
import type { MarketDataProvider } from "./types";

/**
 * Live market data provider.
 *
 * Reads the latest tick from Redis key `tick:{symbol}`.
 * The market-listener process writes to this key on every bar.
 * Returns null only if no tick has ever been written (Redis miss).
 */
export class LiveMarketDataProvider implements MarketDataProvider {
  readonly mode = "live" as const;
  private symbol: string;

  constructor(symbol: string) {
    this.symbol = symbol;
  }

  async getNextCandle(): Promise<Candle | null> {
    const raw = await redis.get<Candle>(`tick:${this.symbol}`);
    return raw ?? null;
  }
}
