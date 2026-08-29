import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useExecutionsParams } from "./use-executions-params";

/**
 * Hook to fetch all executions with automatic polling while any are RUNNING
 */
export const useSuspenseExecutions = () => {
  const trpc = useTRPC();
  const [params] = useExecutionsParams();

  return useSuspenseQuery({
    ...trpc.executions.getMany.queryOptions(params),
    refetchInterval: (query) => {
      // If any execution in the list is still in RUNNING state, poll every 1.5s
      const hasRunning = query.state.data?.items?.some(
        (item) => item.status === "RUNNING",
      );
      return hasRunning ? 1500 : false;
    },
  });
};

/**
 * Hook to fetch a single execution with automatic polling while RUNNING
 */
export const useSuspenseExecution = (id: string) => {
  const trpc = useTRPC();

  return useSuspenseQuery({
    ...trpc.executions.getOne.queryOptions({ id }),
    refetchInterval: (query) => {
      // Auto-poll every 1.5s until execution status is finished (SUCCESS / FAILED / SKIPPED)
      return query.state.data?.status === "RUNNING" ? 1500 : false;
    },
  });
};
