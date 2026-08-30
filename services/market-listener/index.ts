import WebSocket from "ws";
import http from "http";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const ALPACA_WS_URL = "wss://stream.data.alpaca.markets/v2/iex";
const CONTROL_PORT = Number(process.env.LISTENER_CONTROL_PORT ?? 3001);
const FORWARD_TIMEOUT_MS = 10_000; // 10 s — prevents a slow app from blocking tick processing

// symbol -> Set of workflowIds
const subscriptions = new Map<string, Set<string>>();

let ws: WebSocket | null = null;
let authenticated = false;

// ─── Forward tick to Next.js ──────────────────────────────────────────────────

async function forwardTick(symbol: string, candle: Record<string, unknown>): Promise<void> {
  const workflowIds = subscriptions.get(symbol);
  if (!workflowIds || workflowIds.size === 0) return;

  for (const workflowId of workflowIds) {
    // Bug fix: no timeout on the original fetch meant a slow or down Next.js app
    // would block the WebSocket message handler indefinitely, stalling all subsequent
    // tick processing. Added an AbortController timeout to bound each forward attempt.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FORWARD_TIMEOUT_MS);
    try {
      await fetch(`${APP_URL}/api/internal/market-tick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

function connectAlpaca(): void {
  ws = new WebSocket(ALPACA_WS_URL);

  ws.on("open", () => {
    console.log("[listener] WebSocket connected to Alpaca");
    ws!.send(JSON.stringify({
      action: "auth",
      key: process.env.ALPACA_API_KEY,
      secret: process.env.ALPACA_API_SECRET,
    }));
  });

  ws.on("message", async (raw: Buffer) => {
    const messages = JSON.parse(raw.toString()) as Array<Record<string, unknown>>;

    for (const msg of messages) {
      if (msg.T === "success" && msg.msg === "authenticated" && !authenticated) {
        authenticated = true;
        console.log("[listener] Authenticated with Alpaca");
        // Subscribe to all currently tracked symbols
        const symbols = [...subscriptions.keys()];
        if (symbols.length > 0) {
          ws!.send(JSON.stringify({ action: "subscribe", bars: symbols }));
        }
      }

      if (msg.T === "b") {
        // Bar message — forward to app
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

  ws.on("close", () => {
    authenticated = false;
    console.warn("[listener] WebSocket closed — reconnecting in 5s...");
    setTimeout(connectAlpaca, 5000);
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

  // Bug fix: some HTTP clients (e.g. curl) send `Expect: 100-continue` on POST.
  // A raw Node.js HTTP server does NOT automatically respond with `100 Continue`,
  // so the client would stall waiting for it, then close the connection after its
  // expect-timeout — appearing as a silent failure. Writing `100 Continue` explicitly
  // unblocks these clients so the body is actually sent.
  if (req.headers["expect"] === "100-continue") {
    res.writeContinue();
  }

  if (req.method === "GET" && req.url === "/status") {
    const status = Object.fromEntries(
      [...subscriptions.entries()].map(([sym, ids]) => [sym, [...ids]]),
    );
    res.end(JSON.stringify({ status: "running", subscriptions: status }));
    return;
  }

  let body = "";
  req.on("data", (chunk: Buffer) => { body += chunk.toString(); });
  req.on("end", () => {
    // Bug fix: JSON.parse throws on malformed input (e.g. empty body, curl quirks).
    // The original code had no try-catch, so a single bad request would crash the
    // entire control server process.
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

controlServer.listen(CONTROL_PORT, () => {
  console.log(`[listener] Control API listening on :${CONTROL_PORT}`);
});

connectAlpaca();
