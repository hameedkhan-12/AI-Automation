import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/redis", () => ({
  redis: {
    set: vi.fn().mockResolvedValue("OK"),
  },
}));

vi.mock("@/inngest/client", () => ({
  inngest: {
    send: vi.fn().mockResolvedValue({ ids: ["event-1"] }),
  },
}));

const { redis } = await import("@/lib/redis");
const { inngest } = await import("@/inngest/client");
const { POST } = await import("../route");

const TEST_SECRET = "test-secret-123456789012345678901234567890";

describe("POST /api/internal/market-tick — Authentication & Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.INTERNAL_API_SECRET = TEST_SECRET;
  });

  function createRequest(
    body: Record<string, unknown>,
    headers: Record<string, string> = {},
  ): NextRequest {
    return new NextRequest("http://localhost:3000/api/internal/market-tick", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
    });
  }

  it("rejects request with 401 when authorization header is missing", async () => {
    const req = createRequest({
      symbol: "AAPL",
      candle: { close: 150, timestamp: 123456 },
      workflowId: "wf-1",
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toEqual({ error: "Unauthorized" });

    expect(redis.set).not.toHaveBeenCalled();
    expect(inngest.send).not.toHaveBeenCalled();
  });

  it("rejects request with 401 when authorization secret is wrong", async () => {
    const req = createRequest(
      {
        symbol: "AAPL",
        candle: { close: 150, timestamp: 123456 },
        workflowId: "wf-1",
      },
      { authorization: "Bearer invalid-secret" },
    );

    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toEqual({ error: "Unauthorized" });

    expect(redis.set).not.toHaveBeenCalled();
    expect(inngest.send).not.toHaveBeenCalled();
  });

  it("accepts valid Bearer token, caches tick in Redis, and dispatches Inngest event", async () => {
    const candle = { close: 150, open: 148, high: 151, low: 147, volume: 1000, timestamp: 123456 };
    const req = createRequest(
      {
        symbol: "AAPL",
        candle,
        workflowId: "wf-1",
      },
      { authorization: `Bearer ${TEST_SECRET}` },
    );

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true });

    expect(redis.set).toHaveBeenCalledWith("tick:AAPL", candle, { ex: 3600 });
    expect(inngest.send).toHaveBeenCalledWith({
      name: "workflows/execute.workflow",
      data: {
        workflowId: "wf-1",
        initialData: { candle, symbol: "AAPL" },
      },
    });
  });

  it("accepts valid X-Internal-Secret header", async () => {
    const candle = { close: 200, timestamp: 123456 };
    const req = createRequest(
      {
        symbol: "TSLA",
        candle,
        workflowId: "wf-2",
      },
      { "x-internal-secret": TEST_SECRET },
    );

    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(redis.set).toHaveBeenCalledWith("tick:TSLA", candle, { ex: 3600 });
    expect(inngest.send).toHaveBeenCalledWith({
      name: "workflows/execute.workflow",
      data: {
        workflowId: "wf-2",
        initialData: { candle, symbol: "TSLA" },
      },
    });
  });

  it("rejects with 400 if body is missing required fields when auth is valid", async () => {
    const req = createRequest(
      {
        symbol: "AAPL",
        // candle and workflowId missing
      },
      { authorization: `Bearer ${TEST_SECRET}` },
    );

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();

    expect(redis.set).not.toHaveBeenCalled();
    expect(inngest.send).not.toHaveBeenCalled();
  });
});
