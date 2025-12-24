import { Button } from "@/components/ui/button";
import { useNodeConnections } from "@/providers/connections-provider";
import { usePathname } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { onCreateNodesEdges } from "../_actions/workflow-connection";
import { onFlowPublish } from "../../../_actions/workflow-connections";

type Props = {
  children: React.ReactNode;
  edges: any[];
  nodes: any[];
};
const FlowInstance = ({ children, edges, nodes }: Props) => {
  const pathname = usePathname();
  const [isFlow, setIsFlow] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const { nodeConnection } = useNodeConnections();

  const onAutomateFlow = async() => {
    const flows: any[] = [];
    const connectedEdges = edges?.map((edge) => edge.target);

    connectedEdges?.map((target) => {
      nodes.map((node) => {
        if (node.id === target) flows.push(node.type);
      });
    });
    setIsFlow(flows);
  }
  useEffect(() => {
    onAutomateFlow();
  }, [edges]);

  const onFlowAutomation = useCallback(async () => {
    try {
      setIsSaving(true);

      const workflowId = pathname.split("/").pop();
      if (!workflowId) {
        toast.error("Workflow not found");
        return;
      }

      const flow = await onCreateNodesEdges(
        workflowId,
        JSON.stringify(nodes),
        JSON.stringify(edges),
        JSON.stringify(isFlow)
      );

      if (flow) toast.success(flow.message);
    } catch (error) {
      console.error("Error saving Workflow", error);
      toast.error("Error saving Workflow");
    } finally {
      setIsSaving(false);
    }
  }, [nodes, edges, isFlow, pathname, nodeConnection]);

  const onPublishWorkflow = useCallback(async () => {
    try {
      setIsPublishing(true);

      const workflowId = pathname.split("/").pop();
      if (!workflowId) {
        toast.error("Invalid Workflow ID");
        return;
      }
      const response = await onFlowPublish(workflowId, true);
      if (response) {
        toast.success(response.message);
      }
    } catch (error) {
      console.error("Error Publishing Workflow", error);
      toast.error("Error Publishing Workflow");
    } finally {
      setIsPublishing(false);
    }
  }, [pathname]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-3 p-4">
        <Button
          disabled={isFlow.length < 1 || isSaving}
          onClick={onFlowAutomation}
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
        <Button
          onClick={onPublishWorkflow}
          disabled={isFlow.length < 1 || isPublishing}
        >
          {isPublishing ? "Publishing..." : "Publish"}
        </Button>
      </div>
      {children}
    </div>
  );
};

export default FlowInstance;
