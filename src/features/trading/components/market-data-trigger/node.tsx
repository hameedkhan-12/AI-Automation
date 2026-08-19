"use client";

import { useReactFlow, type Node, type NodeProps } from "@xyflow/react";
import { TrendingUpIcon } from "lucide-react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "@/features/executions/components/base-execution-node";
import { type MarketDataTriggerFormValues, MarketDataTriggerDialog } from "./dialog";
import { useNodeStatus } from "@/features/executions/hooks/use-node-status";
import { MARKET_DATA_TRIGGER_CHANNEL_NAME } from "@/inngest/channels/market-data-trigger";
import { fetchMarketDataTriggerRealtimeToken } from "./actions";

type MarketDataTriggerNodeData = Partial<MarketDataTriggerFormValues>;

type MarketDataTriggerNodeType = Node<MarketDataTriggerNodeData>;

export const MarketDataTriggerNode = memo((props: NodeProps<MarketDataTriggerNodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { setNodes } = useReactFlow();

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: MARKET_DATA_TRIGGER_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchMarketDataTriggerRealtimeToken,
  });

  const handleSubmit = (values: MarketDataTriggerFormValues) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === props.id ? { ...node, data: { ...node.data, ...values } } : node,
      ),
    );
  };

  const { symbol, exchange, interval, mode } = props.data;
  const description = symbol
    ? `${exchange?.toUpperCase()} · ${symbol} · ${interval} · ${mode ?? "live"}`
    : "Not configured";

  return (
    <>
      <MarketDataTriggerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defaultValues={props.data}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon={TrendingUpIcon}
        name="Market Data"
        status={nodeStatus}
        description={description}
        onSettings={() => setDialogOpen(true)}
        onDoubleClick={() => setDialogOpen(true)}
      />
    </>
  );
});

MarketDataTriggerNode.displayName = "MarketDataTriggerNode";
