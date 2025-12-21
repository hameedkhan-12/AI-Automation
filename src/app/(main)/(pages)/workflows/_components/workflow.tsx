import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { onFlowPublish } from "../_actions/workflow-connections";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type Props = {
  name: string;
  description: string;
  id: string;
  publish: boolean | null;
};

const Workflow = ({ name, description, id, publish }: Props) => {
  const onPublishFlow = async (event: any) => {
    const response = await onFlowPublish(
      id,
      event?.target.ariaChecked === "false"
    );
    if (response) toast.message(response.message);
  };
  return (
    <Card className="flex w-full items-center justify-between">
      <CardHeader className="flex flex-col gap-4">
        <Link href={`/workflows/editor/`}>
          <div className="flex flex-row gap-4">
            <Image
              src={"/googledrive.png"}
              alt="Google Drive"
              height={30}
              width={30}
              className="object-contain"
            />
            <Image
              src={"/notion.png"}
              alt="Notion"
              height={30}
              width={30}
              className="object-contain"
            />
            <Image
              src={"/slack.png"}
              alt="Slack"
              height={30}
              width={30}
              className="object-contain"
            />
            <Image
              src={"/discord.png"}
              alt="Discord"
              height={30}
              width={30}
              className="object-contain"
            />
          </div>
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </Link>
      </CardHeader>
      <div>
        <Label>
            {publish! ? "Published" : "Unpublished"}
        </Label>
        <Switch 
        id="airplane-mode"
        defaultChecked={publish!}
        />
      </div>
    </Card>
  );
};

export default Workflow;
