import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import Stripe from "stripe";

vi.mock("@/inngest/utils", () => ({
  sendWorkflowExecution: vi.fn().mockResolvedValue({ id: "job-123" }),
}));

const { sendWorkflowExecution } = await import("@/inngest/utils");
const { POST } = await import("../route");

const TEST_SECRET = "whsec_test_secret_1234567890abcdef";

describe("POST /api/webhooks/stripe — Webhook Signature Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = TEST_SECRET;
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
  });

  function createSignedRequest(
    payload: string,
    secret: string = TEST_SECRET,
    workflowId: string = "wf-test-1",
  ): NextRequest {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = Stripe.webhooks.generateTestHeaderString({
      payload,
      secret,
      timestamp,
    });

    return new NextRequest(
      `http://localhost:3000/api/webhooks/stripe?workflowId=${workflowId}`,
      {
        method: "POST",
        headers: {
          "stripe-signature": signature,
          "content-type": "application/json",
        },
        body: payload,
      },
    );
  }

  it("rejects request with 400 when stripe-signature header is missing", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/webhooks/stripe?workflowId=wf-test-1",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: "evt_123" }),
      },
    );

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(sendWorkflowExecution).not.toHaveBeenCalled();
  });

  it("rejects request with 400 when signature verification fails", async () => {
    const payload = JSON.stringify({ id: "evt_123", type: "payment_intent.succeeded" });
    const req = createSignedRequest(payload, "whsec_wrong_secret");

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(sendWorkflowExecution).not.toHaveBeenCalled();
  });

  it("accepts validly signed Stripe event and triggers Inngest workflow", async () => {
    const eventObject = {
      id: "evt_test_123",
      type: "payment_intent.succeeded",
      created: 1234567890,
      livemode: false,
      data: {
        object: {
          id: "pi_123",
          amount: 2000,
          currency: "usd",
        },
      },
    };
    const payload = JSON.stringify(eventObject);
    const req = createSignedRequest(payload, TEST_SECRET, "wf-real-1");

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);

    expect(sendWorkflowExecution).toHaveBeenCalledWith({
      workflowId: "wf-real-1",
      initialData: {
        stripe: {
          eventId: "evt_test_123",
          eventType: "payment_intent.succeeded",
          timestamp: 1234567890,
          livemode: false,
          raw: {
            id: "pi_123",
            amount: 2000,
            currency: "usd",
          },
        },
      },
    });
  });

  it("rejects with 400 if workflowId is missing even with valid signature", async () => {
    const payload = JSON.stringify({ id: "evt_123", type: "checkout.session.completed" });
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = Stripe.webhooks.generateTestHeaderString({
      payload,
      secret: TEST_SECRET,
      timestamp,
    });

    const req = new NextRequest("http://localhost:3000/api/webhooks/stripe", {
      method: "POST",
      headers: {
        "stripe-signature": signature,
        "content-type": "application/json",
      },
      body: payload,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(sendWorkflowExecution).not.toHaveBeenCalled();
  });
});
