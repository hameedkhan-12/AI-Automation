import { channel, topic } from "@inngest/realtime";

export const ORDER_CHANNEL_NAME = "order-execution";

export const orderChannel = channel(ORDER_CHANNEL_NAME).addTopic(
  topic("status").type<{
    nodeId: string;
    status: "loading" | "success" | "error";
  }>(),
);
