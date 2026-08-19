"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { marketDataTriggerChannel } from "@/inngest/channels/market-data-trigger";
import { inngest } from "@/inngest/client";

export type MarketDataTriggerToken = Realtime.Token<
  typeof marketDataTriggerChannel,
  ["status"]
>;

export async function fetchMarketDataTriggerRealtimeToken(): Promise<MarketDataTriggerToken> {
  return getSubscriptionToken(inngest, {
    channel: marketDataTriggerChannel(),
    topics: ["status"],
  });
}
