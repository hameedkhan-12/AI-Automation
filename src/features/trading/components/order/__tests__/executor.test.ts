import { describe, it, expect, vi, beforeEach } from "vitest";
import { NonRetriableError } from "inngest";

vi.mock("@/lib/db", () => ({
  prisma: {
    credential: { findUnique: vi.fn() },
    paperOrder: { upsert: vi.fn() },
    paperPosition: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));
vi.mock("@/lib/encryption", () => ({
  decrypt: vi.fn((v: string) => v),
}));
vi.mock("@/inngest/channels/order", () => ({
  orderChannel: () => ({ status: (args: unknown) => args }),
}));
vi.mock("../../../adapters/registry", () => ({
  getExchangeAdapter: vi.fn(),
}));

const { prisma } = await import("@/lib/db");
const { getExchangeAdapter } = await import("../../../adapters/registry");
const { orderExecutor } = await import("../executor");

const stubStep = { run: async (_id: string, fn: () => Promise<unknown>) => fn() } as never;

const validData = {
  exchange: "alpaca",
  symbol: "AAPL",
  side: "BUY" as const,
  quantity: 10,
  orderType: "MARKET" as const,
};

const baseParams = {
  nodeId: "order-1",
  userId: "user-1",
  step: stubStep,
  publish: vi.fn(async () => {}),
};

describe("orderExecutor — validation", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    [{ ...validData, exchange: undefined }, "exchange"],
    [{ ...validData, symbol: undefined }, "symbol"],
    [{ ...validData, side: undefined }, "side"],
    [{ ...validData, quantity: 0 }, "quantity"],
  ])("throws NonRetriableError when %s is invalid", async (data, _label) => {
    await expect(
      orderExecutor({ ...baseParams, data, context: {}, mode: "live" }),
    ).rejects.toThrow(NonRetriableError);
  });
});

describe("orderExecutor — no credentials attached (deliberate simulated fill)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a simulated FILLED result, using the candle's close price", async () => {
    const context = { candle: { close: 123.45 }, __executionId: "exec-1" };
    const result = await orderExecutor({ ...baseParams, data: validData, context, mode: "live" });

    expect(result.orderResult.status).toBe("FILLED");
    expect(result.orderResult.filledPrice).toBe(123.45);
    expect(result.orderResult.orderId).toMatch(/^sim_/);
  });

  it("falls back to the fixed simulated price when no candle is present", async () => {
    const result = await orderExecutor({
      ...baseParams,
      data: validData,
      context: { __executionId: "exec-1" },
      mode: "live",
    });
    expect(result.orderResult.filledPrice).toBe(181.9);
  });

  it("still persists a PaperOrder and PaperPosition in live mode", async () => {
    await orderExecutor({
      ...baseParams,
      data: validData,
      context: { candle: { close: 100 }, __executionId: "exec-1" },
      mode: "live",
    });

    expect(prisma.paperOrder.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.paperPosition.upsert).toHaveBeenCalledTimes(1);
  });
});

describe("orderExecutor — real credentials, real adapter errors must propagate (regression test)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does NOT silently return FILLED when the adapter throws — it fails loudly instead", async () => {
    (prisma.credential.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      value: JSON.stringify({ apiKey: "real-key", apiSecret: "real-secret" }),
    });
    const placeOrder = vi.fn().mockRejectedValue(new Error("Alpaca placeOrder failed: 401 unauthorized"));
    (getExchangeAdapter as ReturnType<typeof vi.fn>).mockReturnValue({ placeOrder });

    const publish = vi.fn(async () => {});
    await expect(
      orderExecutor({
        ...baseParams,
        publish,
        data: { ...validData, credentialId: "cred-1" },
        context: { candle: { close: 100 }, __executionId: "exec-1" },
        mode: "live",
      }),
    ).rejects.toThrow("401 unauthorized");

    // Must have published an "error" status, not "success"
    expect(publish).toHaveBeenCalledWith(expect.objectContaining({ status: "error" }));
    // Must NOT have written a PaperOrder for a failed order
    expect(prisma.paperOrder.upsert).not.toHaveBeenCalled();
  });

  it("fails with a clear message (not a raw 401) when the secret key is missing", async () => {
    (prisma.credential.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      value: JSON.stringify({ apiKey: "real-key" }), // no apiSecret
    });
    const placeOrder = vi.fn();
    (getExchangeAdapter as ReturnType<typeof vi.fn>).mockReturnValue({ placeOrder });

    await expect(
      orderExecutor({
        ...baseParams,
        data: { ...validData, credentialId: "cred-1" },
        context: { candle: { close: 100 }, __executionId: "exec-1" },
        mode: "live",
      }),
    ).rejects.toThrow(/missing its secret key/);

    // Should fail BEFORE ever calling the real adapter
    expect(placeOrder).not.toHaveBeenCalled();
  });

  it("succeeds and persists correctly when the adapter succeeds", async () => {
    (prisma.credential.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      value: JSON.stringify({ apiKey: "real-key", apiSecret: "real-secret" }),
    });
    const placeOrder = vi.fn().mockResolvedValue({
      orderId: "alpaca-order-1", status: "FILLED", filledPrice: 100, filledQuantity: 10,
    });
    (getExchangeAdapter as ReturnType<typeof vi.fn>).mockReturnValue({ placeOrder });

    const result = await orderExecutor({
      ...baseParams,
      data: { ...validData, credentialId: "cred-1" },
      context: { candle: { close: 100 }, __executionId: "exec-1" },
      mode: "live",
    });

    expect(result.orderResult.orderId).toBe("alpaca-order-1");
    expect(prisma.paperOrder.upsert).toHaveBeenCalledTimes(1);
  });
});

describe("orderExecutor — idempotency", () => {
  beforeEach(() => vi.clearAllMocks());

  it("derives a deterministic clientOrderId from executionId + nodeId (same inputs -> same id)", async () => {
    const context = { candle: { close: 100 }, __executionId: "exec-42" };
    const first = await orderExecutor({ ...baseParams, data: validData, context, mode: "live" });
    const second = await orderExecutor({ ...baseParams, data: validData, context, mode: "live" });

    expect(first.orderResult.orderId).toBe(second.orderResult.orderId);
  });

  it("upserts (not creates) the PaperOrder, keyed by clientOrderId — safe under Inngest step retry", async () => {
    await orderExecutor({
      ...baseParams,
      data: validData,
      context: { candle: { close: 100 }, __executionId: "exec-42" },
      mode: "live",
    });

    const call = (prisma.paperOrder.upsert as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.where.clientOrderId).toBeDefined();
    expect(call.create.clientOrderId).toBe(call.where.clientOrderId);
  });
});

describe("orderExecutor — shadow-replay mode must NEVER have real side effects (regression test)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not call the real adapter, even with valid credentials attached", async () => {
    (prisma.credential.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      value: JSON.stringify({ apiKey: "real-key", apiSecret: "real-secret" }),
    });
    const placeOrder = vi.fn().mockResolvedValue({ orderId: "should-never-happen", status: "FILLED" });
    (getExchangeAdapter as ReturnType<typeof vi.fn>).mockReturnValue({ placeOrder });

    await orderExecutor({
      ...baseParams,
      data: { ...validData, credentialId: "cred-1" },
      context: { candle: { close: 100 }, __executionId: "exec-1" },
      mode: "shadow",
    });

    expect(placeOrder).not.toHaveBeenCalled();
  });

  it("does not write PaperOrder or PaperPosition rows", async () => {
    await orderExecutor({
      ...baseParams,
      data: validData,
      context: { candle: { close: 100 }, __executionId: "exec-1" },
      mode: "shadow",
    });

    expect(prisma.paperOrder.upsert).not.toHaveBeenCalled();
    expect(prisma.paperPosition.upsert).not.toHaveBeenCalled();
    expect(prisma.paperPosition.update).not.toHaveBeenCalled();
    expect(prisma.paperPosition.deleteMany).not.toHaveBeenCalled();
  });

  it("still returns a usable simulated result for diffing purposes", async () => {
    const result = await orderExecutor({
      ...baseParams,
      data: validData,
      context: { candle: { close: 100 }, __executionId: "exec-1" },
      mode: "shadow",
    });

    expect(result.orderResult.status).toBe("FILLED");
  });
});