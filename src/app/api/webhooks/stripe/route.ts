import { sendWorkflowExecution } from "@/inngest/utils";
import { type NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || "sk_placeholder_for_webhook_verification",
);

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { success: false, error: "Missing webhook signature or webhook secret configuration" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid webhook signature";
    return NextResponse.json(
      { success: false, error: `Webhook signature verification failed: ${message}` },
      { status: 400 },
    );
  }

  const url = new URL(request.url);
  const workflowId = url.searchParams.get("workflowId");

  if (!workflowId) {
    return NextResponse.json(
      { success: false, error: "Missing required query parameter: workflowId" },
      { status: 400 },
    );
  }

  const stripeData = {
    eventId: event.id,
    eventType: event.type,
    timestamp: event.created,
    livemode: event.livemode,
    raw: event.data?.object,
  };

  try {
    // Trigger an Inngest job
    await sendWorkflowExecution({
      workflowId,
      initialData: {
        stripe: stripeData,
      },
    });

    return NextResponse.json(
      { success: true },
      { status: 200 },
    );
  } catch (error) {
    console.error("Stripe webhook execution error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to dispatch workflow execution" },
      { status: 500 },
    );
  }
}
