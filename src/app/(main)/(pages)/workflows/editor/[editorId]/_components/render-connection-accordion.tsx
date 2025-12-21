import ConnectionCard from "@/app/(main)/(pages)/connections/_components/connection-card";
import { AccordionContent } from "@/components/ui/accordion";
import MultipleSelector from "@/components/ui/multiple-selector";
import { Connection } from "@/lib/types";
import { useNodeConnections } from "@/providers/connections-provider";
import { EditorState } from "@/providers/editor-provider";
import { useFuzzieStore } from "@/store";
import React from "react";

const RenderConnectionAccordion = ({
  connection,
  state,
}: {
  connection: Connection;
  state: EditorState;
}) => {
  const {
    title,
    image,
    description,
    connectionKey,
    accessTokenKey,
    alwaysTrue,
    slackSpecial,
  } = connection;

  const { nodeConnection } = useNodeConnections();
  const connectionData = (nodeConnection as any)[connectionKey];

  const isConnected =
    alwaysTrue ||
    (nodeConnection[connectionKey] &&
      accessTokenKey &&
      connectionData[accessTokenKey!]);

  const { slackChannels, selectedSlackChannels, setSelectedSlackChannels } =
    useFuzzieStore();
  return (
    <AccordionContent key={title}>
      {state.editor.selectedNode.data.title === title && (
        <>
          <ConnectionCard
            title={title}
            icon={image}
            description={description}
            type={title}
            connected={{ [title]: isConnected }}
          />
          {slackSpecial && isConnected && (
            <div>
              {slackChannels?.length ? (
                <>
                  <div className="mb-4 ml-1">
                    Select the slack channels to send notifications and messages
                  </div>
                  <MultipleSelector
                    emptyIndicator={
                      <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                        No channels found
                      </p>
                    }
                    value={selectedSlackChannels}
                    onChange={setSelectedSlackChannels}
                    defaultOptions={slackChannels}
                    placeholder="Select Slack Channels"
                  />
                </>
              ) : (
                "No Slack Channels found. Please add your slack bot to your slack channels"
              )}
            </div>
          )}
        </>
      )}
    </AccordionContent>
  );
};

export default RenderConnectionAccordion;
