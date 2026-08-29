import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { executeWorkflow, executeBacktest, executeShadowReplay } from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    executeWorkflow,
    executeBacktest,
    executeShadowReplay,
  ],
});

// Extend Vercel serverless function timeout so Inngest steps don't get
// cut off mid-execution. Hobby plan max is 60s, Pro plan allows up to 800s.
export const maxDuration = 60;