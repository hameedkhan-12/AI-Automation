import { channel, topic } from "@inngest/realtime";

export const MARKET_DATA_TRIGGER_CHANNEL_NAME = "market-data-trigger-execution";

// Adds "ticking" status for the live price pulse animation on the node UI.
export const marketDataTriggerChannel = channel(MARKET_DATA_TRIGGER_CHANNEL_NAME).addTopic(
  topic("status").type<{
    nodeId: string;
    status: "loading" | "success" | "error" | "ticking";
  }>(),
);
