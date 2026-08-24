"use client";

import { useState } from "react";
import { useAtomValue } from "jotai";
import { editorAtom } from "@/features/editor/store/atoms";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { HistoryIcon, Loader2Icon } from "lucide-react";
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
  const [polling, setPolling] = useState(false);

  const startBacktest = useMutation(
    trpc.trading.backtest.start.mutationOptions(),
  );

  const handleRunBacktest = async () => {
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
    if (!data.backtestFrom || !data.backtestTo) {
      toast.error(
        "Set a backtest date range on the Market Data node first (From / To fields, mode = backtest)",
      );
      return;
    }

    try {
      const { eventId } = await startBacktest.mutateAsync({
        workflowId,
        symbol: data.symbol,
        exchange: data.exchange,
        interval: data.interval ?? "1d",
        from: data.backtestFrom,
        to: data.backtestTo,
      });

      toast.success("Backtest started — replaying historical candles");
      setPolling(true);

      const deadline = Date.now() + 30_000;
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
    <Button
      size="sm"
      variant="outline"
      onClick={handleRunBacktest}
      disabled={startBacktest.isPending || polling}
    >
      {polling ? <Loader2Icon className="size-3.5 animate-spin" /> : <HistoryIcon className="size-3.5" />}
      Run Backtest
    </Button>
  );
};