"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { indicatorChannel } from "@/inngest/channels/indicator";
import { inngest } from "@/inngest/client";

export type IndicatorToken = Realtime.Token<typeof indicatorChannel, ["status"]>;

export async function fetchIndicatorRealtimeToken(): Promise<IndicatorToken> {
  return getSubscriptionToken(inngest, {
    channel: indicatorChannel(),
    topics: ["status"],
  });
}
