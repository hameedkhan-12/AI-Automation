"use server";

import { db } from "@/lib/client";

export const onCreateNodesEdges = async (
  flowId: string,
  nodes: string,
  edges: string,
  flowPath: string
) => {
  const flow = await db.workflows.update({
    where: {
      id: flowId,
    },
    data: {
      nodes,
      edges,
      flowPath: flowPath,
    },
  });
  if (flow)
    return {
      message: "Workflow saved successfully",
    };
};

export const onGetNodesEdges = async (flowId: string) => {
  const nodesEdges = await db.workflows.findUnique({
    where: {
      id: flowId,
    },
    select: {
      nodes: true,
      edges: true,
    },
  });

  if (nodesEdges?.nodes && nodesEdges?.edges) {
    return {
      nodes: nodesEdges.nodes,
      edges: nodesEdges.edges,
    };
  }

  return null;
};
