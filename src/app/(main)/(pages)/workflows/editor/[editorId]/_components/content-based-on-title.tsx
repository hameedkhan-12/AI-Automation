import { AccordionContent } from "@/components/ui/accordion";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectionProviderProps } from "@/lib/types";
import { EditorState } from "@/providers/editor-provider";
import React from "react";

export interface Option {
  value: string;
  label: string;
  disable?: boolean;
  fixed?: boolean;
  [key: string]: string | boolean | undefined;
}

type Props = {
  nodeConnection: ConnectionProviderProps;
  newState: EditorState;
  file: any;
  setFile: (file: any) => void;
  selectedSlackChannels: Option[];
  setSelectedSlackChannels: (channels: Option[]) => void;
};
const ContentBasedOnTitle = ({
  file,
  setFile,
  selectedSlackChannels,
  setSelectedSlackChannels,
  nodeConnection,
  newState,
}: Props) => {

  const { selectedNode } = newState.editor;
  const title = selectedNode.data.title;
  return (
    <AccordionContent>
      <Card>
        <CardHeader>
          <CardTitle>Discord</CardTitle>
          <CardDescription>Welcome to the discord</CardDescription>
        </CardHeader>
      </Card>
    </AccordionContent>
  );
};

export default ContentBasedOnTitle;
