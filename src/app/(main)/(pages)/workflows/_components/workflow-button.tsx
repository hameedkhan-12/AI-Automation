"use client";
import Workflow from "@/components/form/workflow-form";
import CustomModal from "@/components/global/custom-modal";
import { Button } from "@/components/ui/button";
import { useBilling } from "@/providers/billing-providers";
import { useModal } from "@/providers/ModalProvider";
import { Plus } from "lucide-react";
import React from "react";

type Props = {};

const WorkflowButton = (props: Props) => {
  const { setOpen } = useModal();
  const { credits } = useBilling();

  const handleClick = () => {
    setOpen(
      <CustomModal
        title="Create a Workflow Automation"
        subheading="Workflows are a powerfull that help u automate tasks"
      >
        <Workflow />
      </CustomModal>
    );
  };
  return (
    <Button
      size={"icon"}
    //   {...(credits !== "0" ? { onClick: handleClick } : { disabled: true })}
      onClick={handleClick}
    >
      <Plus />
    </Button>
  );
};

export default WorkflowButton;
