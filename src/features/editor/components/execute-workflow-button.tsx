import { Button } from "@/components/ui/button";
import { useExecuteWorkflow } from "@/features/workflows/hooks/use-workflows";
import { PlayIcon } from "lucide-react";

export const ExecuteWorkflowButton = ({
  workflowId,
  size = "lg",
  variant = "default",
}: {
  workflowId: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "secondary" | "ghost";
}) => {
  const executeWorkflow = useExecuteWorkflow();

  const handleExecute = () => {
    executeWorkflow.mutate({ id: workflowId });
  };

  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleExecute}
      disabled={executeWorkflow.isPending}
      className={variant === "default" ? "bg-[#00E5A0] hover:bg-[#00E5A0]/90 text-black font-medium" : ""}
    >
      <PlayIcon className="size-3.5 fill-current" />
      {size === "sm" ? "Execute" : "Execute workflow"}
    </Button>
  );
};
