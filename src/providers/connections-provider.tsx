"use client";
import React, { createContext, useContext, useState } from "react";

export type ConnectionsProviderProps = {
  discordNode: {
    webhookURL: string;
    content: string;
    webhookName: string;
    guildName: string;
  };
  setDiscordNode: React.Dispatch<React.SetStateAction<any>>;
  googleNode: {}[];
  setGoogleNode: React.Dispatch<React.SetStateAction<any>>;
  notionNode: {
    accessToken: string;
    databaseId: string;
    workspaceName: string;
    content: "";
  };
  workflowTemplate: {
    discord?: string;
    notion?: string;
    slack?: string;
  };
  setNotionNode: React.Dispatch<React.SetStateAction<any>>;
  slackNode: {
    appId: string;
    authedUserId: string;
    authedUserToken: string;
    slackAccessToken: string;
    botUserId: string;
    teamId: string;
    teamName: string;
    content: string;
  };
  setSlackNode: React.Dispatch<React.SetStateAction<any>>;
  setWorkflowTemplate: React.Dispatch<
    React.SetStateAction<{ discord?: string; notion?: string; slack?: string }>
  >;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

type ConnectionWithChildProps = {
  children: React.ReactNode;
};

const initialValues: ConnectionsProviderProps = {
  discordNode: {
    webhookURL: "",
    content: "",
    webhookName: "",
    guildName: "",
  },
  googleNode: [],
  notionNode: {
    accessToken: "",
    databaseId: "",
    workspaceName: "",
    content: "",
  },
  workflowTemplate: {
    discord: "",
    notion: "",
    slack: "",
  },
  slackNode: {
    appId: "",
    authedUserId: "",
    authedUserToken: "",
    slackAccessToken: "",
    botUserId: "",
    teamId: "",
    teamName: "",
    content: "",
  },
  isLoading: false,
  setGoogleNode: () => {},
  setDiscordNode: () => {},
  setNotionNode: () => {},
  setWorkflowTemplate: () => {},
  setSlackNode: () => {},
  setIsLoading: () => {},
};

const ConnectionsContext =
  createContext<ConnectionsProviderProps>(initialValues);

  const { Provider } = ConnectionsContext;
const ConnectionsProvider = ({children} : ConnectionWithChildProps) => {
    const [discordNode, setDiscordNode] = useState(initialValues.discordNode);
    const [googleNode, setGoogleNode] = useState(initialValues.googleNode);
    const [notionNode, setNotionNode] = useState(initialValues.notionNode);
    const [workflowTemplate, setWorkflowTemplate] = useState(initialValues.workflowTemplate);
    const [slackNode, setSlackNode] = useState(initialValues.slackNode);
    const [isLoading, setIsLoading] = useState(initialValues.isLoading);

    const values = {
        discordNode,
        setDiscordNode,
        googleNode,
        setGoogleNode,
        notionNode,
        setNotionNode,
        workflowTemplate,
        setWorkflowTemplate,
        slackNode,
        setSlackNode,
        isLoading,
        setIsLoading,
    }
  return <Provider value={values}>
    {children}
  </Provider>;
};

export const useNodeConnections = () => {
    const nodeConnection = useContext(ConnectionsContext);
    if(!nodeConnection) throw new Error('useNodeConnections must be used within a ConnectionsProvider');
    return { nodeConnection };
}

export default ConnectionsProvider;
