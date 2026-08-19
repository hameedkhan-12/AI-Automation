/**
 * Binance Adapter — STUB / EXPERIMENTAL
 *
 * This file exists to demonstrate the ExchangeAdapter extension pattern.
 * Adding Binance = implement this file + add one line to registry.ts.
 * The engine, nodes, and UI don't change at all.
 *
 * NOT registered in the active registry (see registry.ts).
 * NOT production-ready — placeholders marked with TODO.
 */
import type { Candle, ExchangeAdapter, OrderRequest, OrderResult } from "./types";

const BINANCE_TESTNET_REST = "https://testnet.binance.vision/api";
const BINANCE_TESTNET_WS = "wss://testnet.binance.vision/ws";

export const binanceAdapter: ExchangeAdapter = {
  id: "binance",

  subscribeToTicks(symbol: string, onTick: (candle: Candle) => void): () => void {
    // TODO: Connect to Binance WebSocket kline stream
    // Stream: `${BINANCE_TESTNET_WS}/${symbol.toLowerCase()}@kline_1m`
    // Parse message.k fields: t (open time), o, h, l, c, v
    console.warn("[binance-adapter] subscribeToTicks not implemented");
    void symbol;
    void onTick;
    void BINANCE_TESTNET_WS;
    return () => {};
  },

  async fetchHistoricalCandles(
    symbol: string,
    from: Date,
    to: Date,
    interval: string,
  ): Promise<Candle[]> {
    // TODO: GET ${BINANCE_TESTNET_REST}/v3/klines
    // Params: symbol, interval (e.g. "1m"), startTime (ms), endTime (ms), limit 1000
    // Response: array of [openTime, open, high, low, close, volume, ...]
    console.warn("[binance-adapter] fetchHistoricalCandles not implemented");
    void symbol; void from; void to; void interval;
    void BINANCE_TESTNET_REST;
    return [];
  },

  async placeOrder(
    order: OrderRequest,
    credentials: Record<string, string>,
  ): Promise<OrderResult> {
    // TODO: POST ${BINANCE_TESTNET_REST}/v3/order (signed HMAC-SHA256)
    // Use credentials.apiKey + credentials.apiSecret
    // Pass order.clientOrderId as `newClientOrderId` for idempotency
    console.warn("[binance-adapter] placeOrder not implemented");
    void order; void credentials;
    return { orderId: "stub", status: "REJECTED" };
  },
};
