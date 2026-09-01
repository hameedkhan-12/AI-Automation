"use client";

import { useState } from "react";
import { useAtomValue } from "jotai";
import { editorAtom } from "@/features/editor/store/atoms";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HistoryIcon, Loader2Icon, PlayIcon, CalendarIcon } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NodeType } from "@/generated/prisma/enums";

type MarketDataNodeData = {
  symbol?: string;
  exchange?: string;
  interval?: string;
  backtestFrom?: string;
  backtestTo?: string;
};

export const RunBacktestButton = ({ workflowId }: { workflowId: string }) => {
  const editor = useAtomValue(editorAtom);
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [polling, setPolling] = useState(false);

  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [targetNodeData, setTargetNodeData] = useState<MarketDataNodeData | null>(null);

  const startBacktest = useMutation(
    trpc.trading.backtest.start.mutationOptions(),
  );

  const getPresetDates = (days: number) => {
    const today = new Date();
    const past = new Date(today);
    past.setDate(past.getDate() - days);
    return {
      from: past.toISOString().slice(0, 10),
      to: today.toISOString().slice(0, 10),
    };
  };

  const handleOpenDialog = () => {
    if (!editor) {
      toast.error("Editor is still loading — try again in a moment");
      return;
    }

    const marketDataNode = editor.getNodes().find((n) => n.type === NodeType.MARKET_DATA_TRIGGER);

    if (!marketDataNode) {
      toast.error("Add a Market Data node to this workflow before running a backtest");
      return;
    }

    const data = marketDataNode.data as MarketDataNodeData;

    if (!data.symbol || !data.exchange) {
      toast.error("Configure the Market Data node's symbol and exchange first");
      return;
    }

    setTargetNodeData(data);

    // Set intelligent preset based on interval
    const interval = data.interval ?? "1d";
    if (interval === "1m" || interval === "5m") {
      const dates = getPresetDates(7);
      setFrom(dates.from);
      setTo(dates.to);
      setSelectedPreset("7d");
    } else if (interval === "15m" || interval === "1h") {
      const dates = getPresetDates(30);
      setFrom(dates.from);
      setTo(dates.to);
      setSelectedPreset("30d");
    } else {
      // 1d default: 6 months
      const dates = getPresetDates(180);
      setFrom(dates.from);
      setTo(dates.to);
      setSelectedPreset("180d");
    }

    setDialogOpen(true);
  };

  const handleApplyPreset = (days: number, key: string) => {
    const dates = getPresetDates(days);
    setFrom(dates.from);
    setTo(dates.to);
    setSelectedPreset(key);
  };

  const handleExecuteBacktest = async () => {
    if (!targetNodeData || !from || !to) {
      toast.error("Please specify a valid date range");
      return;
    }

    if (new Date(from) >= new Date(to)) {
      toast.error("Start date must be before end date");
      return;
    }

    setDialogOpen(false);

    try {
      const { eventId } = await startBacktest.mutateAsync({
        workflowId,
        symbol: targetNodeData.symbol!,
        exchange: targetNodeData.exchange!,
        interval: targetNodeData.interval ?? "1d",
        from,
        to,
      });

      toast.success(`Backtest started for ${targetNodeData.symbol} (${from} → ${to})`);
      setPolling(true);

      const deadline = Date.now() + 35_000;
      const poll = async (): Promise<void> => {
        const execution = await queryClient.fetchQuery({
          ...trpc.trading.backtest.status.queryOptions({ eventId }),
          staleTime: 0,
        });

        if (execution?.status === "SUCCESS" || execution?.status === "FAILED") {
          setPolling(false);
          router.push(`/executions/${execution.id}`);
          return;
        }
        if (Date.now() > deadline) {
          setPolling(false);
          toast.info("Backtest is still running — check the Executions tab shortly");
          return;
        }
        setTimeout(poll, 1500);
      };
      poll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start backtest");
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={handleOpenDialog}
        disabled={startBacktest.isPending || polling}
      >
        {polling ? (
          <Loader2Icon className="size-3.5 animate-spin" />
        ) : (
          <HistoryIcon className="size-3.5" />
        )}
        Run Backtest
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HistoryIcon className="size-5 text-[#00E5A0]" />
              Run Strategy Backtest
            </DialogTitle>
            <DialogDescription>
              Replay historical market data through this workflow to evaluate performance metrics and simulated orders.
            </DialogDescription>
          </DialogHeader>

          {targetNodeData && (
            <div className="space-y-4 py-2">
              {/* Asset Badge */}
              <div className="flex items-center gap-2 text-xs font-mono bg-muted/50 p-2.5 rounded-lg border">
                <span className="font-semibold text-foreground">{targetNodeData.symbol}</span>
                <span className="text-muted-foreground">·</span>
                <span className="uppercase text-muted-foreground">{targetNodeData.exchange}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-[#00E5A0] bg-[#00E5A0]/10 px-1.5 py-0.5 rounded font-bold">
                  {targetNodeData.interval ?? "1d"}
                </span>
              </div>

              {/* Timeframe Presets */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Quick Presets</Label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { label: "1W", days: 7, key: "7d" },
                    { label: "1M", days: 30, key: "30d" },
                    { label: "3M", days: 90, key: "90d" },
                    { label: "6M", days: 180, key: "180d" },
                    { label: "1Y", days: 365, key: "365d" },
                  ].map((preset) => (
                    <Button
                      key={preset.key}
                      type="button"
                      size="sm"
                      variant={selectedPreset === preset.key ? "default" : "outline"}
                      className={`h-8 text-xs font-mono ${
                        selectedPreset === preset.key
                          ? "bg-[#00E5A0] text-black hover:bg-[#00E5A0]/90 font-bold"
                          : ""
                      }`}
                      onClick={() => handleApplyPreset(preset.days, preset.key)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Date Inputs */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="backtest-from" className="text-xs flex items-center gap-1">
                    <CalendarIcon className="size-3 text-muted-foreground" />
                    Start Date
                  </Label>
                  <Input
                    id="backtest-from"
                    type="date"
                    value={from}
                    onChange={(e) => {
                      setFrom(e.target.value);
                      setSelectedPreset("");
                    }}
                    className="text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="backtest-to" className="text-xs flex items-center gap-1">
                    <CalendarIcon className="size-3 text-muted-foreground" />
                    End Date
                  </Label>
                  <Input
                    id="backtest-to"
                    type="date"
                    value={to}
                    onChange={(e) => {
                      setTo(e.target.value);
                      setSelectedPreset("");
                    }}
                    className="text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-[#00E5A0] text-black hover:bg-[#00E5A0]/90 font-semibold gap-1.5"
              onClick={handleExecuteBacktest}
              disabled={startBacktest.isPending}
            >
              {startBacktest.isPending ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <PlayIcon className="size-3.5 fill-current" />
              )}
              Start Backtest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};