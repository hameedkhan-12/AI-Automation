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
  clientOrderId?: string;
}

export interface OrderResult {
  orderId: string;
  status: "FILLED" | "PENDING" | "REJECTED";
  filledPrice?: number;
  filledQuantity?: number;
}

export interface ExchangeAdapter {
  id: string;
  subscribeToTicks(symbol: string, onTick: (candle: Candle) => void): () => void;
  fetchHistoricalCandles(
    symbol: string,
    from: Date,
    to: Date,
    interval: string,
  ): Promise<Candle[]>;
  placeOrder(
    order: OrderRequest,
    credentials: Record<string, string>,
  ): Promise<OrderResult>;
}
