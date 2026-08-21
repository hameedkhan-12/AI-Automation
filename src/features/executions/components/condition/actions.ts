"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { conditionChannel } from "@/inngest/channels/condition";
import { inngest } from "@/inngest/client";

export type ConditionToken = Realtime.Token<typeof conditionChannel, ["status"]>;

export async function fetchConditionRealtimeToken(): Promise<ConditionToken> {
  return getSubscriptionToken(inngest, {
    channel: conditionChannel(),
    topics: ["status"],
  });
}