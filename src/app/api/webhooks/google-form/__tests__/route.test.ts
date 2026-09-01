import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/inngest/utils", () => ({
  sendWorkflowExecution: vi.fn().mockResolvedValue({ id: "job-456" }),
}));

const { sendWorkflowExecution } = await import("@/inngest/utils");
const { POST } = await import("../route");

const TEST_SECRET = "gf_secret_1234567890abcdef";

describe("POST /api/webhooks/google-form — Webhook Secret Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_FORM_WEBHOOK_SECRET = TEST_SECRET;
  });

  it("rejects request with 401 when secret query param is missing", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/webhooks/google-form?workflowId=wf-1",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ formTitle: "Feedback" }),
      },
    );

    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(sendWorkflowExecution).not.toHaveBeenCalled();
  });

  it("rejects request with 401 when secret is invalid", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/webhooks/google-form?workflowId=wf-1&secret=wrong_secret",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ formTitle: "Feedback" }),
      },
    );

    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(sendWorkflowExecution).not.toHaveBeenCalled();
  });

  it("accepts valid secret and dispatches Inngest workflow execution", async () => {
    const formData = {
      formId: "form_123",
      formTitle: "Customer Survey",
      responseId: "resp_456",
      timestamp: 1700000000,
      respondentEmail: "user@example.com",
      responses: { Rating: "5" },
    };

    const req = new NextRequest(
      `http://localhost:3000/api/webhooks/google-form?workflowId=wf-1&secret=${TEST_SECRET}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(formData),
      },
    );

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);

    expect(sendWorkflowExecution).toHaveBeenCalledWith({
      workflowId: "wf-1",
      initialData: {
        googleForm: {
          ...formData,
          raw: formData,
        },
      },
    });
  });

  it("rejects with 400 when workflowId is missing even with valid secret", async () => {
    const req = new NextRequest(
      `http://localhost:3000/api/webhooks/google-form?secret=${TEST_SECRET}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ formTitle: "Feedback" }),
      },
    );

    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(sendWorkflowExecution).not.toHaveBeenCalled();
  });
});
