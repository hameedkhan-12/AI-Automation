import WebSocket from "ws";
import { prisma } from "@/lib/db";
import type { Candle, ExchangeAdapter, OrderRequest, OrderResult } from "./types";

// ─── Alpaca REST helpers ───────────────────────────────────────────────────

const BASE_URL = process.env.ALPACA_BASE_URL ?? "https://paper-api.alpaca.markets";
const DATA_URL = "https://data.alpaca.markets";
const WS_URL = "wss://stream.data.alpaca.markets/v2/iex";

function alpacaHeaders(credentials: Record<string, string>) {
  return {
    "APCA-API-KEY-ID": credentials.apiKey ?? process.env.ALPACA_API_KEY ?? "",
    "APCA-API-SECRET-KEY": credentials.apiSecret ?? process.env.ALPACA_API_SECRET ?? "",
    "Content-Type": "application/json",
  };
}

// Map Alpaca timeframe strings to our interval format
function toAlpacaTimeframe(interval: string): string {
  const map: Record<string, string> = {
    "1m": "1Min",
    "5m": "5Min",
    "15m": "15Min",
    "1h": "1Hour",
    "1d": "1Day",
  };
  return map[interval] ?? "1Min";
}

// ─── Adapter implementation ────────────────────────────────────────────────

export const alpacaAdapter: ExchangeAdapter = {
  id: "alpaca",

  subscribeToTicks(symbol: string, onTick: (candle: Candle) => void): () => void {
    const ws = new WebSocket(WS_URL);
    let authenticated = false;
    let closed = false;

    ws.on("open", () => {
      // Authenticate
      ws.send(
        JSON.stringify({
          action: "auth",
          key: process.env.ALPACA_API_KEY,
          secret: process.env.ALPACA_API_SECRET,
        }),
      );
    });

    ws.on("message", (raw: Buffer) => {
      if (closed) return;
      const messages: unknown[] = JSON.parse(raw.toString());

      for (const msg of messages) {
        const m = msg as Record<string, unknown>;

        if (m.T === "success" && m.msg === "authenticated" && !authenticated) {
          authenticated = true;
          // Subscribe to 1-minute bars
          ws.send(JSON.stringify({ action: "subscribe", bars: [symbol] }));
        }

        if (m.T === "b") {
          // Bar (OHLCV) message
          const candle: Candle = {
            timestamp: new Date(m.t as string).getTime(),
            open: m.o as number,
            high: m.h as number,
            low: m.l as number,
            close: m.c as number,
            volume: m.v as number,
          };
          onTick(candle);
        }
      }
    });

    ws.on("error", (err) => {
      console.error("[alpaca-adapter] WebSocket error:", err.message);
    });

    return () => {
      closed = true;
      ws.close();
    };
  },

  async fetchHistoricalCandles(
    symbol: string,
    from: Date,
    to: Date,
    interval: string,
  ): Promise<Candle[]> {
    // Check Postgres cache first
    const cached = await prisma.historicalCandle.findMany({
      where: {
        exchange: "alpaca",
        symbol,
        interval,
        timestamp: { gte: from, lte: to },
      },
      orderBy: { timestamp: "asc" },
    });

    if (cached.length > 0) {
      return cached.map((c) => ({
        timestamp: c.timestamp.getTime(),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
      }));
    }

    // Fetch from Alpaca REST API
    const timeframe = toAlpacaTimeframe(interval);
    const url = new URL(`${DATA_URL}/v2/stocks/${symbol}/bars`);
    url.searchParams.set("timeframe", timeframe);
    url.searchParams.set("start", from.toISOString());
    url.searchParams.set("end", to.toISOString());
    url.searchParams.set("limit", "10000");
    url.searchParams.set("adjustment", "raw");
    url.searchParams.set("feed", "iex");

    const res = await fetch(url.toString(), {
      headers: {
        "APCA-API-KEY-ID": process.env.ALPACA_API_KEY ?? "",
        "APCA-API-SECRET-KEY": process.env.ALPACA_API_SECRET ?? "",
      },
    });

    if (!res.ok) {
      throw new Error(`Alpaca historical candles failed: ${res.status} ${await res.text()}`);
    }

    const data = (await res.json()) as { bars: Array<Record<string, unknown>> };
    const bars = data.bars ?? [];

    const candles: Candle[] = bars.map((b) => ({
      timestamp: new Date(b.t as string).getTime(),
      open: b.o as number,
      high: b.h as number,
      low: b.l as number,
      close: b.c as number,
      volume: b.v as number,
    }));

    // Cache in Postgres (upsert to avoid duplicates)
    if (candles.length > 0) {
      await prisma.historicalCandle.createMany({
        data: candles.map((c) => ({
          exchange: "alpaca",
          symbol,
          interval,
          timestamp: new Date(c.timestamp),
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume,
        })),
        skipDuplicates: true,
      });
    }

    return candles;
  },

  async placeOrder(
    order: OrderRequest,
    credentials: Record<string, string>,
  ): Promise<OrderResult> {
    const body: Record<string, unknown> = {
      symbol: order.symbol,
      qty: order.quantity,
      side: order.side.toLowerCase(),
      type: order.type.toLowerCase(),
      time_in_force: "gtc",
    };

    if (order.limitPrice && order.type === "LIMIT") {
      body.limit_price = order.limitPrice;
    }

    // Idempotency: pass the deterministic clientOrderId to Alpaca.
    // If this request is retried, Alpaca deduplicates by client_order_id.
    if (order.clientOrderId) {
      body.client_order_id = order.clientOrderId;
    }

    const res = await fetch(`${BASE_URL}/v2/orders`, {
      method: "POST",
      headers: alpacaHeaders(credentials),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(3500),
    });

    if (!res.ok) {
      const text = await res.text();
      // 422 = duplicate client_order_id → already placed, treat as success
      if (res.status === 422 && text.includes("client_order_id")) {
        return { orderId: order.clientOrderId ?? "dedup", status: "FILLED" };
      }
      throw new Error(`Alpaca placeOrder failed: ${res.status} ${text}`);
    }

    const data = (await res.json()) as Record<string, unknown>;

    return {
      orderId: data.id as string,
      status:
        data.status === "filled"
          ? "FILLED"
          : data.status === "rejected"
            ? "REJECTED"
            : "PENDING",
      filledPrice: data.filled_avg_price
        ? Number(data.filled_avg_price)
        : undefined,
      filledQuantity: data.filled_qty ? Number(data.filled_qty) : undefined,
    };
  },
};
