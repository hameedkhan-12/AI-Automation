"use client";

import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";

type DiffType = "REUSED" | "UNCHANGED" | "OUTPUT_CHANGED" | "NEWLY_FAILED" | "NEWLY_SUCCEEDED";

const DIFF_BADGE: Record<DiffType, { label: string; className: string }> = {
  REUSED: { label: "Reused", className: "bg-muted text-muted-foreground" },
  UNCHANGED: { label: "Unchanged", className: "bg-muted text-muted-foreground" },
  OUTPUT_CHANGED: { label: "Changed", className: "bg-blue-500/15 text-blue-700 dark:text-blue-400" },
  NEWLY_FAILED: { label: "Newly fails", className: "bg-red-500/15 text-red-700 dark:text-red-400" },
  NEWLY_SUCCEEDED: { label: "Newly succeeds", className: "bg-green-500/15 text-green-700 dark:text-green-400" },
};

function diffKeys(
  oldObj: Record<string, unknown> | null | undefined,
  newObj: Record<string, unknown> | null | undefined,
): string[] {
  const old = oldObj ?? {};
  const next = newObj ?? {};
  const allKeys = new Set([...Object.keys(old), ...Object.keys(next)]);
  const changed: string[] = [];
  for (const key of allKeys) {
    if (key.startsWith("__")) continue; // internal bookkeeping fields, not meaningful to a person reading this
    if (JSON.stringify(old[key]) !== JSON.stringify(next[key])) {
      changed.push(key);
    }
  }
  return changed;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shadowRunId: string | null;
}

export const ReplayDiffSheet = ({ open, onOpenChange, shadowRunId }: Props) => {
  const trpc = useTRPC();
  const [expandedNode, setExpandedNode] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    ...trpc.replay.results.queryOptions({ shadowRunId: shadowRunId ?? "" }),
    enabled: open && !!shadowRunId,
    refetchInterval: (query) => (query.state.data?.status === "RUNNING" ? 1500 : false),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Test Changes</SheetTitle>
          <SheetDescription>
            Your draft graph replayed against recent real executions — side-effecting nodes
            (orders, HTTP calls, Slack/Discord messages) never actually ran.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-4">
          {isLoading || !data ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4">
              <Loader2Icon className="size-4 animate-spin" />
              Replaying against recent executions…
            </div>
          ) : data.status === "RUNNING" ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4">
              <Loader2Icon className="size-4 animate-spin" />
              Still replaying…
            </div>
          ) : (
            <>
              <div className="rounded-md border p-3 text-sm">
                Tested against recent executions —{" "}
                <span className="font-medium text-red-600 dark:text-red-400">
                  {data.summary.newlyFailed} node{data.summary.newlyFailed === 1 ? "" : "s"} newly fail
                </span>
                {", "}
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {data.summary.changed} changed
                </span>
                {", "}
                <span className="text-muted-foreground">{data.summary.reused} unaffected</span>.
              </div>

              <div className="space-y-2">
                {Object.entries(data.byNode).map(([nodeId, diffs]) => {
                  // Worst diffType across replayed executions wins the summary badge
                  const priority: DiffType[] = ["NEWLY_FAILED", "OUTPUT_CHANGED", "NEWLY_SUCCEEDED", "UNCHANGED", "REUSED"];
                  const worst = diffs
                    .map((d) => d.diffType as DiffType)
                    .sort((a, b) => priority.indexOf(a) - priority.indexOf(b))[0];
                  const badge = DIFF_BADGE[worst] ?? DIFF_BADGE.UNCHANGED;
                  const isExpanded = expandedNode === nodeId;

                  return (
                    <div key={nodeId} className="rounded-md border">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm"
                        onClick={() => setExpandedNode(isExpanded ? null : nodeId)}
                      >
                        <span className="font-mono text-xs text-muted-foreground">{nodeId}</span>
                        <Badge className={badge.className}>{badge.label}</Badge>
                      </button>

                      {isExpanded && (
                        <div className="border-t px-3 py-2 space-y-3">
                          {diffs.map((d) => (
                            <div key={d.id} className="text-xs space-y-1">
                              <div className="text-muted-foreground">
                                execution {d.originalExecutionId.slice(0, 10)}… — {DIFF_BADGE[d.diffType as DiffType]?.label ?? d.diffType}
                              </div>
                              {(d.oldOutput != null || d.newOutput != null) && (() => {
                                const changedFieldNames = diffKeys(
                                  d.oldOutput as Record<string, unknown> | null,
                                  d.newOutput as Record<string, unknown> | null,
                                );
                                const old = (d.oldOutput ?? {}) as Record<string, unknown>;
                                const next = (d.newOutput ?? {}) as Record<string, unknown>;

                                if (changedFieldNames.length === 0) {
                                  // Diffed as OUTPUT_CHANGED at the whole-object level (e.g. key
                                  // order or an internal-only field differed) but nothing a person
                                  // would recognize as meaningful actually changed.
                                  return (
                                    <div className="text-muted-foreground italic">
                                      No meaningful field-level difference detected.
                                    </div>
                                  );
                                }

                                return (
                                  <div className="space-y-2">
                                    <div className="text-muted-foreground">
                                      Changed: <span className="font-mono">{changedFieldNames.join(", ")}</span>
                                    </div>
                                    {changedFieldNames.map((key) => (
                                      <div key={key} className="grid grid-cols-2 gap-2">
                                        <pre className="rounded bg-muted p-2 overflow-x-auto max-h-32">
                                          {key}: {JSON.stringify(old[key] ?? null, null, 2)}
                                        </pre>
                                        <pre className="rounded bg-muted p-2 overflow-x-auto max-h-32">
                                          {key}: {JSON.stringify(next[key] ?? null, null, 2)}
                                        </pre>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()}
                              {(d.oldError || d.newError) && (
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="rounded bg-red-500/10 p-2 text-red-700 dark:text-red-400">
                                    {d.oldError ?? "(no error)"}
                                  </div>
                                  <div className="rounded bg-red-500/10 p-2 text-red-700 dark:text-red-400">
                                    {d.newError ?? "(no error)"}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};