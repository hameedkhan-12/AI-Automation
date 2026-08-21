"use client";

import { useReactFlow, type Node, type NodeProps } from "@xyflow/react";
import { GitBranchIcon } from "lucide-react";
import { memo, useState } from "react";
import { type ConditionFormValues, ConditionDialog } from "./dialog";
import { useNodeStatus } from "@/features/executions/hooks/use-node-status";
import { CONDITION_CHANNEL_NAME } from "@/inngest/channels/condition";
import { fetchConditionRealtimeToken } from "./actions";
import { BaseExecutionNode } from "../base-execution-node";

type ConditionNodeData = Partial<ConditionFormValues>;
type ConditionNodeType = Node<ConditionNodeData>;

export const ConditionNode = memo((props: NodeProps<ConditionNodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { setNodes } = useReactFlow();

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: CONDITION_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchConditionRealtimeToken,
  });

  const handleSubmit = (values: ConditionFormValues) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === props.id ? { ...node, data: { ...node.data, ...values } } : node,
      ),
    );
  };

  const { leftPath, operator, rightPath, rightValue } = props.data;
  const right = rightPath ?? rightValue ?? "?";
  const opLabel = operator === "crosses_above" ? "crosses above" : operator === "crosses_below" ? "crosses below" : operator;
  const description = leftPath && operator ? `${leftPath} ${opLabel ?? ""} ${right}` : "Not configured";

  return (
    <>
      <ConditionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defaultValues={props.data}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon={GitBranchIcon}
        name="Condition"
        status={nodeStatus}
        description={description}
        onSettings={() => setDialogOpen(true)}
        onDoubleClick={() => setDialogOpen(true)}
      />
    </>
  );
});

ConditionNode.displayName = "ConditionNode";