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
    list: protectedProcedure
      .input(z.object({ symbol: z.string().optional() }).optional())
      .query(async ({ input, ctx }) => {
        const rows = await prisma.paperPosition.findMany({
          where: {
            userId: ctx.auth.user.id,
            ...(input?.symbol ? { symbol: input.symbol.toUpperCase() } : {}),
          },
          orderBy: { updatedAt: "desc" },
        });
        return rows.map((row) => ({
          ...row,
          quantity: Number(row.quantity),
          avgPrice: Number(row.avgPrice),
        }));
      }),
  }),

  orders: createTRPCRouter({
    list: protectedProcedure
      .input(
        z.object({
          symbol: z.string().optional(),
          page: z.number().default(PAGINATION.DEFAULT_PAGE),
          pageSize: z
            .number()
            .min(PAGINATION.MIN_PAGE_SIZE)
            .max(PAGINATION.MAX_PAGE_SIZE)
            .default(PAGINATION.DEFAULT_PAGE_SIZE),
        }),
      )
      .query(async ({ input, ctx }) => {
        const { page, pageSize, symbol } = input;
        const where = {
          userId: ctx.auth.user.id,
          ...(symbol ? { symbol: symbol.toUpperCase() } : {}),
        };

        const [items, totalCount] = await Promise.all([
          prisma.paperOrder.findMany({
            skip: (page - 1) * pageSize,
            take: pageSize,
            where,
            orderBy: { createdAt: "desc" },
          }),
          prisma.paperOrder.count({ where }),
        ]);

        return {
          items: items.map((row) => ({
            ...row,
            quantity: Number(row.quantity),
            filledPrice:
              row.filledPrice === null ? null : Number(row.filledPrice),
          })),
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
          hasNextPage: page < Math.ceil(totalCount / pageSize),
          hasPreviousPage: page > 1,
        };
      }),
  }),

  candles: createTRPCRouter({
    /** Get historical candles for a symbol */
    get: protectedProcedure
      .input(
        z.object({
          symbol: z.string(),
          exchange: z.string().default("alpaca"),
          interval: z.string().default("1d"),
          from: z.string().optional(),
          to: z.string().optional(),
        }),
      )
      .query(async ({ input }) => {
        const { symbol, exchange, interval, from, to } = input;
        const candles = await prisma.historicalCandle.findMany({
          where: {
            exchange,
            symbol: symbol.toUpperCase(),
            interval,
            ...(from || to
              ? {
                  timestamp: {
                    ...(from ? { gte: new Date(from) } : {}),
                    ...(to ? { lte: new Date(to) } : {}),
                  },
                }
              : {}),
          },
          orderBy: { timestamp: "asc" },
          take: 10000,
        });

        return candles.map((c) => ({
          time: Math.floor(c.timestamp.getTime() / 1000),
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume,
        }));
      }),

    /** Get computed indicators (like SMA) for a symbol */
    indicators: protectedProcedure
      .input(
        z.object({
          symbol: z.string(),
          exchange: z.string().default("alpaca"),
          interval: z.string().default("1d"),
          periods: z.array(z.number()).default([10, 30]),
        }),
      )
      .query(async ({ input }) => {
        const { symbol, exchange, interval, periods } = input;
        const candles = await prisma.historicalCandle.findMany({
          where: {
            exchange,
            symbol: symbol.toUpperCase(),
            interval,
          },
          orderBy: { timestamp: "asc" },
          take: 10000,
        });

        // technicalindicators uses CommonJS default export
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const ti = require("technicalindicators");
        const formattedCandles = candles.map((c) => ({
          time: Math.floor(c.timestamp.getTime() / 1000),
          close: c.close,
        }));

        const colors = ["#38BDF8", "#F59E0B", "#A855F7", "#EC4899"];

        return periods.map((period, i) => {
          if (formattedCandles.length < period) {
            return {
              name: `SMA (${period})`,
              color: colors[i % colors.length],
              data: [],
            };
          }

          const values: number[] = ti.SMA.calculate({
            period,
            values: formattedCandles.map((c) => c.close),
          });

          const data = values.map((value: number, idx: number) => ({
            time: formattedCandles[period - 1 + idx].time,
            value,
          }));

          return {
            name: `SMA (${period})`,
            color: colors[i % colors.length],
            data,
          };
        });
      }),

    /**
     * Resolve SMA indicator periods from the workflow that trades this symbol,
     * then compute and return overlay series data.
     *
     * Workflow resolution rule:
     *   1. Find all Node rows with type MARKET_DATA_TRIGGER whose data.symbol
     *      matches (case-insensitive).
     *   2. If multiple workflows match, pick the one whose most recent Execution
     *      has the latest startedAt.
     *   3. In that workflow, collect all Indicator nodes with type === "SMA"
     *      and read their period values.
     *   4. If 0 SMA nodes are found, return an empty array (no overlay).
     */
    symbolIndicators: protectedProcedure
      .input(
        z.object({
          symbol: z.string(),
          exchange: z.string().default("alpaca"),
          interval: z.string().default("1d"),
        }),
      )
      .query(async ({ input }) => {
        const { symbol, exchange, interval } = input;
        const upperSymbol = symbol.toUpperCase();

        // 1. Find all MARKET_DATA_TRIGGER nodes whose data.symbol matches
        const triggerNodes = await prisma.node.findMany({
          where: { type: "MARKET_DATA_TRIGGER" as any },
          select: { workflowId: true, data: true },
        });

        const matchingWorkflowIds = triggerNodes
          .filter((n) => {
            const data = n.data as Record<string, unknown>;
            return (
              typeof data.symbol === "string" &&
              data.symbol.toUpperCase() === upperSymbol
            );
          })
          .map((n) => n.workflowId);

        if (matchingWorkflowIds.length === 0) return [];

        // 2. Pick the workflow with the most recent execution
        let resolvedWorkflowId = matchingWorkflowIds[0];

        if (matchingWorkflowIds.length > 1) {
          const latestExecutions = await prisma.execution.findMany({
            where: { workflowId: { in: matchingWorkflowIds } },
            orderBy: { startedAt: "desc" },
            take: 1,
            select: { workflowId: true },
          });
          if (latestExecutions.length > 0) {
            resolvedWorkflowId = latestExecutions[0].workflowId;
          }
        }

        // 3. Find SMA indicator nodes in the resolved workflow
        const indicatorNodes = await prisma.node.findMany({
          where: {
            workflowId: resolvedWorkflowId,
            type: "INDICATOR" as any,
          },
          select: { data: true },
        });

        const smaPeriods: number[] = indicatorNodes
          .map((n) => n.data as Record<string, unknown>)
          .filter((d) => d.type === "SMA" && typeof d.period === "number")
          .map((d) => d.period as number)
          .sort((a, b) => a - b); // ascending: fast first, slow second

        // 4. No SMA nodes → return empty (caller renders no overlay)
        if (smaPeriods.length === 0) return [];

        // 5. Fetch candles and compute SMA series for the resolved periods
        const candles = await prisma.historicalCandle.findMany({
          where: { exchange, symbol: upperSymbol, interval },
          orderBy: { timestamp: "asc" },
          take: 10000,
        });

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const ti = require("technicalindicators");
        const formattedCandles = candles.map((c) => ({
          time: Math.floor(c.timestamp.getTime() / 1000),
          close: c.close,
        }));

        const colors = ["#38BDF8", "#F59E0B", "#A855F7", "#EC4899"];

        return smaPeriods.map((period, i) => {
          if (formattedCandles.length < period) {
            return {
              name: `SMA (${period})`,
              color: colors[i % colors.length],
              data: [] as { time: number; value: number }[],
            };
          }

          const values: number[] = ti.SMA.calculate({
            period,
            values: formattedCandles.map((c) => c.close),
          });

          return {
            name: `SMA (${period})`,
            color: colors[i % colors.length],
            data: values.map((value: number, idx: number) => ({
              time: formattedCandles[period - 1 + idx].time,
              value,
            })),
          };
        });
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
