import type { ExchangeAdapter } from "./types";
import { alpacaAdapter } from "./alpaca";
// import { binanceAdapter } from "./binance"; // Uncomment + add line below to activate Binance

/**
 * Exchange adapter registry.
 *
 * Adding exchange #2:
 *   1. Implement ExchangeAdapter in adapters/{exchange}.ts
 *   2. Import and add one line here.
 *   3. Done — nodes, engine, and UI need zero changes.
 */
export const exchangeAdapterRegistry: Record<string, ExchangeAdapter> = {
  alpaca: alpacaAdapter,
  // binance: binanceAdapter,  // Stub exists in binance.ts; activate when ready
};

export const getExchangeAdapter = (id: string): ExchangeAdapter => {
  const adapter = exchangeAdapterRegistry[id];
  if (!adapter) {
    throw new Error(
      `No adapter registered for exchange: "${id}". Available: ${Object.keys(exchangeAdapterRegistry).join(", ")}`,
    );
  }
  return adapter;
};

/** Returns all registered adapter IDs — used by the tRPC exchanges.list query. */
export const listExchanges = (): string[] => Object.keys(exchangeAdapterRegistry);
