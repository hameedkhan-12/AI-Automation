import WebSocket from "ws";
import http from "http";
import crypto from "crypto";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const ALPACA_WS_URL =
  process.env.ALPACA_DATA_WS_URL ?? "wss://stream.data.alpaca.markets/v2/iex";
const ALPACA_API_KEY = process.env.ALPACA_API_KEY?.trim();
const ALPACA_API_SECRET = process.env.ALPACA_API_SECRET?.trim();
const CONTROL_PORT = Number(process.env.LISTENER_CONTROL_PORT ?? 3001);
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;
const FORWARD_TIMEOUT_MS = 10_000; // 10 s — prevents a slow app from blocking tick processing
const AUTH_FAIL_CODES = new Set([402, 404, 409]); // do not retry: bad creds / timeout / feed not allowed

// symbol -> Set of workflowIds
const subscriptions = new Map<string, Set<string>>();

let ws: WebSocket | null = null;
let authenticated = false;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let shouldReconnect = true;

// ─── Timing-safe Auth Validation ──────────────────────────────────────────────

function timingSafeCompare(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function extractSecret(req: http.IncomingMessage): string | null {
  const authHeader = req.headers["authorization"];
  if (typeof authHeader === "string") {
    const trimmed = authHeader.trim();
    if (trimmed.toLowerCase().startsWith("bearer ")) {
      return trimmed.slice(7).trim();
    }
    return trimmed;
  }
  const customSecret = req.headers["x-internal-secret"];
  if (typeof customSecret === "string") {
    return customSecret.trim();
  }
  return null;
}

// ─── Startup Reconciliation ──────────────────────────────────────────────────

async function reconcileSubscriptions(): Promise<void> {
  try {
    const headers: Record<string, string> = {};
    if (INTERNAL_API_SECRET) {
      headers["Authorization"] = `Bearer ${INTERNAL_API_SECRET}`;
    }

    const res = await fetch(`${APP_URL}/api/internal/active-subscriptions`, { headers });
    if (!res.ok) {
      console.warn(`[listener] Failed to fetch active subscriptions (${res.status}): ${await res.text()}`);
      return;
    }

    const data = (await res.json()) as {
      subscriptions?: Array<{ symbol: string; workflowId: string }>;
    };

    if (data.subscriptions && Array.isArray(data.subscriptions)) {
      for (const sub of data.subscriptions) {
        if (sub.symbol && sub.workflowId) {
          addSubscription(sub.symbol, sub.workflowId);
        }
      }
      console.log(
        `[listener] Reconciled ${data.subscriptions.length} subscription(s) across ${subscriptions.size} symbol(s) on startup`,
      );
    }
  } catch (err) {
    console.error("[listener] Error reconciling active subscriptions on startup:", err);
  }
}

// ─── Forward tick to Next.js ──────────────────────────────────────────────────

async function forwardTick(symbol: string, candle: Record<string, unknown>): Promise<void> {
  const workflowIds = subscriptions.get(symbol);
  if (!workflowIds || workflowIds.size === 0) return;

  for (const workflowId of workflowIds) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FORWARD_TIMEOUT_MS);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (INTERNAL_API_SECRET) {
        headers["Authorization"] = `Bearer ${INTERNAL_API_SECRET}`;
      }

      await fetch(`${APP_URL}/api/internal/market-tick`, {
        method: "POST",
        headers,
        body: JSON.stringify({ symbol, candle, workflowId }),
        signal: controller.signal,
      });
    } catch (err) {
      console.error(`[listener] Failed to forward tick for ${workflowId}:`, err);
    } finally {
      clearTimeout(timer);
    }
  }
}

// ─── Alpaca WebSocket connection ──────────────────────────────────────────────

function scheduleReconnect(): void {
  if (!shouldReconnect) return;
  if (reconnectTimer) return;
  console.warn("[listener] WebSocket closed — reconnecting in 5s...");
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectAlpaca();
  }, 5000);
}

function connectAlpaca(): void {
  if (!ALPACA_API_KEY || !ALPACA_API_SECRET) {
    console.error(
      "[listener] ALPACA_API_KEY / ALPACA_API_SECRET are missing after loading env. Refusing to connect.",
    );
    shouldReconnect = false;
    return;
  }

  ws = new WebSocket(ALPACA_WS_URL);

  ws.on("open", () => {
    console.log(`[listener] WebSocket connected to ${ALPACA_WS_URL}`);
    ws!.send(
      JSON.stringify({
        action: "auth",
        key: ALPACA_API_KEY,
        secret: ALPACA_API_SECRET,
      }),
    );
  });

  ws.on("message", async (raw: Buffer) => {
    let messages: Array<Record<string, unknown>>;
    try {
      messages = JSON.parse(raw.toString()) as Array<Record<string, unknown>>;
    } catch {
      console.error("[listener] Non-JSON Alpaca payload:", raw.toString());
      return;
    }

    for (const msg of messages) {
      if (msg.T === "error") {
        const code = Number(msg.code);
        console.error(`[listener] Alpaca error ${code}: ${msg.msg}`);
        if (code === 406) {
          console.error(
            "[listener] Connection limit exceeded — only one market-data WebSocket per Alpaca account. Stop other listeners (npm run dev:all, Docker, another terminal) and retry.",
          );
        }
        if (AUTH_FAIL_CODES.has(code)) {
          shouldReconnect = false;
        }
        continue;
      }

      if (msg.T === "success") {
        console.log(`[listener] Alpaca: ${msg.msg}`);
      }

      if (msg.T === "success" && msg.msg === "authenticated" && !authenticated) {
        authenticated = true;
        const symbols = [...subscriptions.keys()];
        if (symbols.length > 0) {
          ws!.send(JSON.stringify({ action: "subscribe", bars: symbols }));
        }
      }

      if (msg.T === "b") {
        const symbol = msg.S as string;
        const candle = {
          timestamp: new Date(msg.t as string).getTime(),
          open: msg.o,
          high: msg.h,
          low: msg.l,
          close: msg.c,
          volume: msg.v,
        };
        await forwardTick(symbol, candle);
        console.log(`[listener] Tick forwarded: ${symbol} @ ${candle.close}`);
      }
    }
  });

  ws.on("error", (err) => {
    console.error("[listener] WebSocket error:", err.message);
  });

  ws.on("close", (code, reason) => {
    authenticated = false;
    const reasonText = reason?.toString() || "no reason";
    console.warn(`[listener] WebSocket closed (${code}: ${reasonText})`);
    scheduleReconnect();
  });
}

// ─── Subscribe/unsubscribe helpers ────────────────────────────────────────────

function addSubscription(symbol: string, workflowId: string): void {
  if (!subscriptions.has(symbol)) {
    subscriptions.set(symbol, new Set());
    // Subscribe to new symbol on Alpaca
    if (authenticated && ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: "subscribe", bars: [symbol] }));
    }
  }
  subscriptions.get(symbol)!.add(workflowId);
  console.log(`[listener] Subscribed ${workflowId} to ${symbol}`);
}

function removeSubscription(symbol: string, workflowId: string): void {
  subscriptions.get(symbol)?.delete(workflowId);
  if (subscriptions.get(symbol)?.size === 0) {
    subscriptions.delete(symbol);
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: "unsubscribe", bars: [symbol] }));
    }
  }
  console.log(`[listener] Unsubscribed ${workflowId} from ${symbol}`);
}

// ─── Control API (HTTP) ───────────────────────────────────────────────────────

const controlServer = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");

  if (req.headers["expect"] === "100-continue") {
    res.writeContinue();
  }

  // GET /status remains open for health monitoring
  if (req.method === "GET" && req.url === "/status") {
    const status = Object.fromEntries(
      [...subscriptions.entries()].map(([sym, ids]) => [sym, [...ids]]),
    );
    res.end(JSON.stringify({ status: "running", subscriptions: status }));
    return;
  }

  // All mutating control routes require internal auth verification
  if (req.method === "POST") {
    const providedSecret = extractSecret(req);
    if (!timingSafeCompare(providedSecret, INTERNAL_API_SECRET)) {
      res.statusCode = 401;
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }
  }

  let body = "";
  req.on("data", (chunk: Buffer) => { body += chunk.toString(); });
  req.on("end", () => {
    let data: { symbol?: string; workflowId?: string } = {};
    try {
      data = JSON.parse(body || "{}") as { symbol?: string; workflowId?: string };
    } catch {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "Invalid JSON body" }));
      return;
    }

    if (!data.symbol || !data.workflowId) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "symbol and workflowId are required" }));
      return;
    }

    if (req.url === "/subscribe") {
      addSubscription(data.symbol, data.workflowId);
      res.end(JSON.stringify({ ok: true }));
    } else if (req.url === "/unsubscribe") {
      removeSubscription(data.symbol, data.workflowId);
      res.end(JSON.stringify({ ok: true }));
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: "Not found" }));
    }
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────

async function start(): Promise<void> {
  controlServer.listen(CONTROL_PORT, () => {
    console.log(`[listener] Control API listening on :${CONTROL_PORT}`);
  });

  await reconcileSubscriptions();
  connectAlpaca();
}

start().catch((err) => {
  console.error("[listener] Fatal initialization error:", err);
});
