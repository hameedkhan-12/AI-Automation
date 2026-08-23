// src/features/editor/components/test-changes-button.tsx
"use client";

import { useState } from "react";
import { useAtomValue } from "jotai";
import { editorAtom } from "@/features/editor/store/atoms";
import { Button } from "@/components/ui/button";
import { FlaskConicalIcon, Loader2Icon } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ReplayDiffSheet } from "./replay-diff-sheet";

export const TestChangesButton = ({ workflowId }: { workflowId: string }) => {
  const editor = useAtomValue(editorAtom);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [shadowRunId, setShadowRunId] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  const startReplay = useMutation(trpc.replay.start.mutationOptions());

  const handleTestChanges = async () => {
    if (!editor) {
      toast.error("Editor is still loading — try again in a moment");
      return;
    }

    const nodes = editor.getNodes();
    const edges = editor.getEdges();

    if (nodes.length === 0) {
      toast.error("Nothing to test — this workflow is empty");
      return;
    }

    try {
      await startReplay.mutateAsync({
        workflowId,
        draftNodes: nodes.map((n) => ({ id: n.id, type: n.type, data: n.data })),
        draftEdges: edges.map((e) => ({ source: e.source, target: e.target })),
      });

      toast.success("Testing your changes against recent executions…");
      setResolving(true);

      // start() only returns an Inngest eventId — the ShadowRun row itself
      // is created inside the function, asynchronously. Poll briefly for it
      // by workflowId so we have a real shadowRunId to hand the sheet.
      const deadline = Date.now() + 15_000;
      const resolve = async (): Promise<void> => {
        const latest = await queryClient.fetchQuery(
          trpc.replay.latestForWorkflow.queryOptions({ workflowId }),
        );
        if (latest) {
          setResolving(false);
          setShadowRunId(latest.id);
          setSheetOpen(true);
          return;
        }
        if (Date.now() > deadline) {
          setResolving(false);
          toast.error("Timed out starting the test replay — try again");
          return;
        }
        setTimeout(resolve, 800);
      };
      resolve();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start test replay");
    }
  };

  const isDraftDirty = () => {
    // Kept intentionally simple: always enabled. A precise "does the draft
    // actually differ from the saved graph" check would duplicate diffGraphs
    // client-side just to gate a button — not worth the complexity for a
    // low-cost action the person can just click.
    return true;
  };

  return (
    <>
      <ReplayDiffSheet open={sheetOpen} onOpenChange={setSheetOpen} shadowRunId={shadowRunId} />
      <Button
        size="sm"
        variant="outline"
        onClick={handleTestChanges}
        disabled={startReplay.isPending || resolving || !isDraftDirty()}
      >
        {resolving ? (
          <Loader2Icon className="size-3.5 animate-spin" />
        ) : (
          <FlaskConicalIcon className="size-3.5" />
        )}
        Test Changes
      </Button>
    </>
  );
};