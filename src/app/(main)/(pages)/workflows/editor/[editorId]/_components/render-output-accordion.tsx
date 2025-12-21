import { ConnectionsProviderProps } from "@/providers/connections-provider";
import { EditorState } from "@/providers/editor-provider";
import React from "react";
import ContentBasedOnTitle from "./content-based-on-title";
import { useFuzzieStore } from "@/store";

type Props = {
  state: EditorState;
  nodeConnection: ConnectionsProviderProps;
};
const RenderOutPutAccordion = ({ state, nodeConnection }: Props) => {
  const {
    googleFile,
    setGoogleFile,
    selectedSlackChannels,
    setSelectedSlackChannels,
  } = useFuzzieStore();
  return <ContentBasedOnTitle
    file={googleFile}
    setFile={setGoogleFile}
    selectedSlackChannels={selectedSlackChannels}
    setSelectedSlackChannels={setSelectedSlackChannels}
    nodeConnection={nodeConnection}
    newState={state}
  ></ContentBasedOnTitle>;
};

export default RenderOutPutAccordion;
