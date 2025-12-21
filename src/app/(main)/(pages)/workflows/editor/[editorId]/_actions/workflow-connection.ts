"use server";
import { db } from "@/lib/client";
import { Option } from "@/store";
import { auth, currentUser } from "@clerk/nextjs";

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

export const getGoogleListener = async () => {
  const { userId } = auth();

  if (userId) {
    const listener = await db.user.findUnique({
      where: {
        clerkId: userId,
      },
      select: {
        googleResourceId: true,
      },
    });

    if (listener) return listener;
  }
};

export const onCreateNodeTemplate = async (
  content: string,
  type: string,
  workflowId: string,
  channels?: Option[],
  accessToken?: string,
  notionDbId?: string
) => {
  if (type === "Discord") {
    const response = await db.workflows.update({
      where: {
        id: workflowId,
      },
      data: {
        discordTemplate: content,
      },
    });

    if (response) return { message: "Template saved successfully" };
  }

  if (type === "Slack") {
    const response = await db.workflows.update({
      where: {
        id: workflowId,
      },
      data: {
        slackTemplate: content,
        slackAccessToken: accessToken,
      },
    });
    if (response) {
      const channelList = await db.workflows.findUnique({
        where: {
          id: workflowId,
        },
        select: {
          slackChannels: true,
        },
      });
      if (channelList) {
        const nonDuplicated = channelList.slackChannels.filter(
          (channel) => channel !== channels![0].value
        );

        nonDuplicated
          .map((channel) => channel)
          .forEach(async (channel) => {
            await db.workflows.update({
              where: {
                id: workflowId,
              },
              data: {
                slackChannels: {
                  push: channel,
                },
              },
            });
          });

        return { message: "Template saved successfully" };
      }
    }
  }

  if (type === "Notion") {
    const response = await db.workflows.update({
      where: {
        id: workflowId,
      },
      data: {
        notionTemplate: content,
        notionAccessToken: accessToken,
        notionDbId: notionDbId,
      },
    });

    if (response) return { message: "Template saved successfully" };
  }
};

export const onGetWorkflows = async () => {
  const user = await currentUser();
  if (user) {
    const workflow = await db.workflows.findMany({
      where: {
        userId: user.id,
      },
    });
    if (workflow) return workflow;
  }
};

export const onCreateWorkflow = async (name: string, description: string) => {
  const user = await currentUser();

  if (user) {
    const workflow = await db.workflows.create({
      data: {
        userId: user.id,
        name,
        description,
      },
    });

    if (workflow) return { message: "Workflow created successfully" };
    return { message: "Failed to create workflow" };
  }
};

export const onFlowPublish = async(workflowId: string, state: boolean) => {
  try {
    const published = await db.workflows.update({
      where: {
        id: workflowId
      },
      data: {
        publish: state
      }
    })
    if(published.publish) return {
      message: "Workflow published successfully"
    }
    return {
      message: "Failed to publish workflow"
    }
  } catch (error) {
    console.log(error);
  }
}