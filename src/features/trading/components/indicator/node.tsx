"use client";

import { useReactFlow, type Node, type NodeProps } from "@xyflow/react";
import { ActivityIcon } from "lucide-react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "@/features/executions/components/base-execution-node";
import { type IndicatorFormValues, IndicatorDialog } from "./dialog";
import { useNodeStatus } from "@/features/executions/hooks/use-node-status";
import { INDICATOR_CHANNEL_NAME } from "@/inngest/channels/indicator";
import { fetchIndicatorRealtimeToken } from "./actions";

type IndicatorNodeData = Partial<IndicatorFormValues>;

type IndicatorNodeType = Node<IndicatorNodeData>;

export const IndicatorNode = memo((props: NodeProps<IndicatorNodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { setNodes } = useReactFlow();

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: INDICATOR_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchIndicatorRealtimeToken,
  });

  const handleSubmit = (values: IndicatorFormValues) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === props.id ? { ...node, data: { ...node.data, ...values } } : node,
      ),
    );
  };

  const { type, period } = props.data;
  const description = type ? `${type} ${period ?? 20}` : "Not configured";

  return (
    <>
      <IndicatorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defaultValues={props.data}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon={ActivityIcon}
        name="Indicator"
        status={nodeStatus}
        description={description}
        onSettings={() => setDialogOpen(true)}
        onDoubleClick={() => setDialogOpen(true)}
      />
    </>
  );
});

IndicatorNode.displayName = "IndicatorNode";
