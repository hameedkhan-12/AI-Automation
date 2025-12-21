import { Button } from "@/components/ui/button";
import { ConnectionProviderProps } from "@/lib/types";
import { Option } from "@/store";
import React, { useCallback } from "react";
import { onCreateNodeTemplate } from "../_actions/workflow-connection";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { postContentToWebhook } from "@/app/(main)/(pages)/connections/_actions/discord-connection";
import { onCreateNewPageInDatabase } from "@/app/(main)/(pages)/connections/_actions/notion-connection";
import { postMessageToSlack } from "@/app/(main)/(pages)/connections/_actions/slack-connection";

type Props = {
  currentService: string
  nodeConnection: ConnectionProviderProps;
  channels?: Option[];
  setChannels?: (value: Option[]) => void;
};

const ActionButton = ({
  currentService,
  nodeConnection,
  channels,
  setChannels,
}: Props) => {
  const pathname = usePathname();

  const onSendDiscordMessage = useCallback(async () => {
    const response = await postContentToWebhook(
      nodeConnection.discordNode.content,
      nodeConnection.discordNode.webhookURL
    );
    if (response.message === "success") {
      nodeConnection.setDiscordNode((prev: any) => ({ ...prev, content: "" }));
    }
  }, [nodeConnection.discordNode]);

  const onStoreNotionContent = useCallback(async () => {
    const response = await onCreateNewPageInDatabase(
      nodeConnection.notionNode.databaseId,
      nodeConnection.notionNode.accessToken,
      nodeConnection.notionNode.content
    );

    if (response) {
      nodeConnection.setNotionNode((prev: any) => ({ ...prev, content: "" }));
    }
  }, [nodeConnection.notionNode]);

  const onStoreSlackContent = useCallback(async () => {
    const response = await postMessageToSlack(
      nodeConnection.slackNode.slackAccessToken,
      channels!,
      nodeConnection.slackNode.content
    );

    if (response.message === "Success") {
      toast.success("Message Sent Successfully");
      nodeConnection.setSlackNode((prev: any) => ({ ...prev, content: "" }));
      setChannels!([]);
    } else {
      toast.error(response.message);
    }
  }, [nodeConnection.slackNode, channels]);

  const onCreateLocalNodeTemplate = useCallback(async () => {
    if (currentService === "Discord") {
      const response = await onCreateNodeTemplate(
        nodeConnection.discordNode.content,
        currentService,
        pathname.split("/").pop()!
      );
      if (response) {
        toast.message(response.message);
      }
    }

    if (currentService === "Slack") {
      const response = await onCreateNodeTemplate(
        nodeConnection.slackNode.content,
        currentService,
        pathname.split("/").pop()!,
        channels,
        nodeConnection.slackNode.slackAccessToken
      );

      if (response) {
        toast.message(response.message);
      }
    }

    if (currentService === "Notion") {
      const response = await onCreateNodeTemplate(
        JSON.stringify(nodeConnection.notionNode.content),
        currentService,
        pathname.split("/").pop()!,
        [],
        nodeConnection.notionNode.accessToken,
        nodeConnection.notionNode.databaseId
      );

      if (response) {
        toast.message(response.message);
      }
    }
  }, [nodeConnection, channels]);

  const renderActionButton = () => {
    switch (currentService) {
      case "Discord":
        return (
          <>
            <Button variant={"outline"} onClick={onSendDiscordMessage}>
              Test Message
            </Button>
            <Button variant={"outline"} onClick={onCreateLocalNodeTemplate}>
              Create Template
            </Button>
          </>
        );
      case "Slack":
        return (
          <>
            <Button variant={"outline"} onClick={onStoreSlackContent}>
              Test Message
            </Button>
            <Button variant={"outline"} onClick={onCreateLocalNodeTemplate}>
              Create Template
            </Button>
          </>
        );
      case "Notion":
        return (
          <>
            <Button variant={"outline"} onClick={onStoreNotionContent}>
              Test Message
            </Button>
            <Button variant={"outline"} onClick={onCreateLocalNodeTemplate}>
              Create Template
            </Button>
          </>
        );
      default:
        return null;
    }
  };

return renderActionButton();
};

export default ActionButton;
