import { createTRPCRouter } from '../init';
import { workflowsRouter } from '@/features/workflows/server/routers';
import { credentialsRouter } from '@/features/credentials/server/routers';
import { executionsRouter } from '@/features/executions/server/routers';
import { tradingRouter } from '@/features/trading/server/routers';

export const appRouter = createTRPCRouter({
  workflows: workflowsRouter,
  credentials: credentialsRouter,
  executions: executionsRouter,
  trading: tradingRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
