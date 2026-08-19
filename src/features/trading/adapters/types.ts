// Core trading data types shared across adapters, providers, and node executors.
// All exchange-specific concerns are hidden behind ExchangeAdapter — nodes
// only ever see these shapes.

export interface Candle {
  timestamp: number; // Unix ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderRequest {
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  type: "MARKET" | "LIMIT";
  limitPrice?: number;
  /** Passed through to the exchange as an idempotency key (e.g. Alpaca's client_order_id). */
  clientOrderId?: string;
}

export interface OrderResult {
  orderId: string;
  status: "FILLED" | "PENDING" | "REJECTED";
  filledPrice?: number;
  filledQuantity?: number;
}

/**
 * The adapter interface every exchange must implement.
 *
 * Adding exchange #2:
 *   1. Create `adapters/{exchange}.ts` implementing this interface.
 *   2. Register it in `adapters/registry.ts`.
 *   3. Nothing else changes — nodes, engine, and UI are exchange-agnostic.
 */
export interface ExchangeAdapter {
  /** Registry key: "alpaca", "binance", etc. */
  id: string;
  /** Subscribe to real-time ticks for a symbol. Returns an unsubscribe function. */
  subscribeToTicks(symbol: string, onTick: (candle: Candle) => void): () => void;
  /** Fetch OHLCV bars from the exchange REST API. */
  fetchHistoricalCandles(
    symbol: string,
    from: Date,
    to: Date,
    interval: string,
  ): Promise<Candle[]>;
  /** Place a paper order. Credentials are passed in — never stored on the adapter. */
  placeOrder(
    order: OrderRequest,
    credentials: Record<string, string>,
  ): Promise<OrderResult>;
}
