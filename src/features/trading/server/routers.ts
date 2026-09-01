import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { prisma } from "@/lib/db";
import { inngest } from "@/inngest/client";
import { listExchanges } from "@/features/trading/adapters/registry";
import { PAGINATION } from "@/config/constants";
import z from "zod";

const LISTENER_URL = process.env.LISTENER_CONTROL_URL ?? "http://localhost:3001";

export const tradingRouter = createTRPCRouter({
  exchanges: createTRPCRouter({
    /** Returns registered exchange adapter IDs: ["alpaca"] */
    list: protectedProcedure.query(() => {
      return listExchanges();
    }),
  }),

  instruments: createTRPCRouter({
    /** Search Alpaca assets by symbol prefix */
    search: protectedProcedure
      .input(z.object({ query: z.string().min(1), exchange: z.string().default("alpaca") }))
      .query(async ({ input }) => {
        if (input.exchange !== "alpaca") return [];

        const res = await fetch(
          `https://paper-api.alpaca.markets/v2/assets?status=active&asset_class=us_equity`,
          {
            headers: {
              "APCA-API-KEY-ID": process.env.ALPACA_API_KEY ?? "",
              "APCA-API-SECRET-KEY": process.env.ALPACA_API_SECRET ?? "",
            },
          },
        );
        if (!res.ok) return [];

        const assets = (await res.json()) as Array<{ symbol: string; name: string }>;
        const q = input.query.toUpperCase();
        return assets
          .filter((a) => a.symbol.startsWith(q))
          .slice(0, 20)
          .map((a) => ({ symbol: a.symbol, name: a.name }));
      }),
  }),

  backtest: createTRPCRouter({
    /** Kick off an executeBacktest Inngest event */
    start: protectedProcedure
      .input(
        z.object({
          workflowId: z.string(),
          symbol: z.string(),
          exchange: z.string().default("alpaca"),
          interval: z.string().default("1d"),
          from: z.string(), // ISO date
          to: z.string(),   // ISO date
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const event = await inngest.send({
          name: "trading/backtest.start",
          data: {
            ...input,
            userId: ctx.auth.user.id,
          },
        });

        return { eventId: event.ids[0] };
      }),

    /** Poll execution status by inngestEventId */
    status: protectedProcedure
      .input(z.object({ eventId: z.string() }))
      .query(async ({ input, ctx }) => {
        const execution = await prisma.execution.findUnique({
          where: {
            inngestEventId: input.eventId,
            workflow: { userId: ctx.auth.user.id },
          },
        });
        return execution;
      }),
  }),

  positions: createTRPCRouter({
    list: protectedProcedure.query(({ ctx }) => {
      return prisma.paperPosition.findMany({
        where: { userId: ctx.auth.user.id },
        orderBy: { updatedAt: "desc" },
      });
    }),
  }),

  orders: createTRPCRouter({
    list: protectedProcedure
      .input(
        z.object({
          page: z.number().default(PAGINATION.DEFAULT_PAGE),
          pageSize: z
            .number()
            .min(PAGINATION.MIN_PAGE_SIZE)
            .max(PAGINATION.MAX_PAGE_SIZE)
            .default(PAGINATION.DEFAULT_PAGE_SIZE),
        }),
      )
      .query(async ({ input, ctx }) => {
        const { page, pageSize } = input;

        const [items, totalCount] = await Promise.all([
          prisma.paperOrder.findMany({
            skip: (page - 1) * pageSize,
            take: pageSize,
            where: { userId: ctx.auth.user.id },
            orderBy: { createdAt: "desc" },
          }),
          prisma.paperOrder.count({ where: { userId: ctx.auth.user.id } }),
        ]);

        return {
          items,
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
          hasNextPage: page < Math.ceil(totalCount / pageSize),
          hasPreviousPage: page > 1,
        };
      }),
  }),

  listener: createTRPCRouter({
    /** Tell the market-listener process to subscribe a symbol for a workflow */
    start: protectedProcedure
      .input(z.object({ symbol: z.string(), workflowId: z.string() }))
      .mutation(async ({ input }) => {
        // 1. Persist subscription in DB before calling listener (durable source of truth)
        await prisma.activeMarketSubscription.upsert({
          where: {
            workflowId_symbol: {
              workflowId: input.workflowId,
              symbol: input.symbol,
            },
          },
          create: {
            workflowId: input.workflowId,
            symbol: input.symbol,
          },
          update: {},
        });

        // 2. Notify running market listener process with auth header
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (process.env.INTERNAL_API_SECRET) {
          headers["Authorization"] = `Bearer ${process.env.INTERNAL_API_SECRET}`;
        }

        try {
          await fetch(`${LISTENER_URL}/subscribe`, {
            method: "POST",
            headers,
            body: JSON.stringify(input),
          });
        } catch (err) {
          console.warn("[listener.start] Failed to notify live listener (persisted in DB for next reconciliation):", err);
        }

        return { ok: true };
      }),

    /** Tell the market-listener process to unsubscribe */
    stop: protectedProcedure
      .input(z.object({ symbol: z.string(), workflowId: z.string() }))
      .mutation(async ({ input }) => {
        // 1. Remove subscription from DB
        await prisma.activeMarketSubscription.deleteMany({
          where: {
            workflowId: input.workflowId,
            symbol: input.symbol,
          },
        });

        // 2. Notify running market listener process with auth header
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (process.env.INTERNAL_API_SECRET) {
          headers["Authorization"] = `Bearer ${process.env.INTERNAL_API_SECRET}`;
        }

        try {
          await fetch(`${LISTENER_URL}/unsubscribe`, {
            method: "POST",
            headers,
            body: JSON.stringify(input),
          });
        } catch (err) {
          console.warn("[listener.stop] Failed to notify live listener:", err);
        }

        return { ok: true };
      }),
  }),
});
