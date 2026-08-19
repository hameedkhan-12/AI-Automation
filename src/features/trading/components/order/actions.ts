"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { orderChannel } from "@/inngest/channels/order";
import { inngest } from "@/inngest/client";

export type OrderToken = Realtime.Token<typeof orderChannel, ["status"]>;

export async function fetchOrderRealtimeToken(): Promise<OrderToken> {
  return getSubscriptionToken(inngest, {
    channel: orderChannel(),
    topics: ["status"],
  });
}
