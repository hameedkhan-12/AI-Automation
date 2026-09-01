import { sendWorkflowExecution } from "@/inngest/utils";
import { type NextRequest, NextResponse } from "next/server";
import { timingSafeCompare } from "@/lib/internal-auth";

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  const expectedSecret =
    process.env.GOOGLE_FORM_WEBHOOK_SECRET || process.env.INTERNAL_API_SECRET;

  if (!expectedSecret || !timingSafeCompare(secret, expectedSecret)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Invalid or missing webhook secret" },
      { status: 401 },
    );
  }

  const workflowId = url.searchParams.get("workflowId");

  if (!workflowId) {
    return NextResponse.json(
      { success: false, error: "Missing required query parameter: workflowId" },
      { status: 400 },
    );
  }

  try {
    const body = await request.json();

    const formData = {
      formId: body.formId,
      formTitle: body.formTitle,
      responseId: body.responseId,
      timestamp: body.timestamp,
      respondentEmail: body.respondentEmail,
      responses: body.responses,
      raw: body,
    };

    // Trigger an Inngest job
    await sendWorkflowExecution({
      workflowId,
      initialData: {
        googleForm: formData,
      },
    });

    return NextResponse.json(
      { success: true },
      { status: 200 },
    );
  } catch (error) {
    console.error("Google form webhook error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process Google Form submission" },
      { status: 500 },
    );
  }
}
