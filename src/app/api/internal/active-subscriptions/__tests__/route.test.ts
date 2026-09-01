import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  prisma: {
    activeMarketSubscription: {
      findMany: vi.fn().mockResolvedValue([
        { workflowId: "wf-1", symbol: "AAPL" },
        { workflowId: "wf-2", symbol: "TSLA" },
      ]),
    },
  },
}));

const { prisma } = await import("@/lib/db");
const { GET } = await import("../route");

const TEST_SECRET = "internal_secret_test_1234567890123456";

describe("GET /api/internal/active-subscriptions — Reconciliation Endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.INTERNAL_API_SECRET = TEST_SECRET;
  });

  it("rejects request with 401 when authorization header is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/internal/active-subscriptions");
    const res = await GET(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
    expect(prisma.activeMarketSubscription.findMany).not.toHaveBeenCalled();
  });

  it("rejects request with 401 when secret is invalid", async () => {
    const req = new NextRequest("http://localhost:3000/api/internal/active-subscriptions", {
      headers: { authorization: "Bearer wrong_secret" },
    });
    const res = await GET(req);

    expect(res.status).toBe(401);
    expect(prisma.activeMarketSubscription.findMany).not.toHaveBeenCalled();
  });

  it("returns active subscriptions when authorized with valid Bearer secret", async () => {
    const req = new NextRequest("http://localhost:3000/api/internal/active-subscriptions", {
      headers: { authorization: `Bearer ${TEST_SECRET}` },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.subscriptions).toEqual([
      { workflowId: "wf-1", symbol: "AAPL" },
      { workflowId: "wf-2", symbol: "TSLA" },
    ]);
    expect(prisma.activeMarketSubscription.findMany).toHaveBeenCalled();
  });
});
