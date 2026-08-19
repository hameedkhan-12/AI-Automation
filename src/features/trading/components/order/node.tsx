"use client";

import { useReactFlow, type Node, type NodeProps } from "@xyflow/react";
import { ArrowUpDownIcon } from "lucide-react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "@/features/executions/components/base-execution-node";
import { type OrderFormValues, OrderDialog } from "./dialog";
import { useNodeStatus } from "@/features/executions/hooks/use-node-status";
import { ORDER_CHANNEL_NAME } from "@/inngest/channels/order";
import { fetchOrderRealtimeToken } from "./actions";

type OrderNodeData = Partial<OrderFormValues>;

type OrderNodeType = Node<OrderNodeData>;

export const OrderNode = memo((props: NodeProps<OrderNodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { setNodes } = useReactFlow();

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: ORDER_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchOrderRealtimeToken,
  });

  const handleSubmit = (values: OrderFormValues) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === props.id ? { ...node, data: { ...node.data, ...values } } : node,
      ),
    );
  };

  const { side, symbol, quantity, orderType } = props.data;
  const description = symbol
    ? `${side ?? "BUY"} ${quantity ?? 1} ${symbol} · ${orderType ?? "MARKET"}`
    : "Not configured";

  return (
    <>
      <OrderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defaultValues={props.data}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon={ArrowUpDownIcon}
        name="Order"
        status={nodeStatus}
        description={description}
        onSettings={() => setDialogOpen(true)}
        onDoubleClick={() => setDialogOpen(true)}
      />
    </>
  );
});

OrderNode.displayName = "OrderNode";
