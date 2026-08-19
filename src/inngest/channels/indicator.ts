import { channel, topic } from "@inngest/realtime";

export const INDICATOR_CHANNEL_NAME = "indicator-execution";

export const indicatorChannel = channel(INDICATOR_CHANNEL_NAME).addTopic(
  topic("status").type<{
    nodeId: string;
    status: "loading" | "success" | "error";
  }>(),
);
