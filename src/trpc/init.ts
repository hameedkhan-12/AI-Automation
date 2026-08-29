import { auth } from '@/lib/auth';
import { polarClient } from '@/lib/polar';
import { initTRPC, TRPCError } from '@trpc/server';
import { headers } from 'next/headers';
import { cache } from 'react';
import superjson from "superjson"

export const createTRPCContext = cache(async () => {
  return { userId: 'user_123' };
});

const t = initTRPC.create({
  transformer: superjson,
});
// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
export const protectedProcedure = baseProcedure.use(async ({ ctx, next }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Unathorized",
    });
  }

  return next({ ctx: { ...ctx, auth: session } });
});
import { env } from '@/lib/env';

export const premiumProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    // If Polar is not configured in environment, allow creation in local dev
    if (!env.POLAR_ACCESS_TOKEN) {
      return next({ ctx: { ...ctx, customer: null } });
    }

    try {
      const customer = await polarClient.customers.getStateExternal({
        externalId: ctx.auth.user.id,
      });

      if (
        !customer.activeSubscriptions ||
        customer.activeSubscriptions.length === 0
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Active subscription required",
        });
      }

      return next({ ctx: { ...ctx, customer } });
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      // If Polar token is invalid (e.g. 401 Unauthorized in dev), warn and permit dev access
      console.warn("[Polar] Subscription check failed:", error);
      if (process.env.NODE_ENV !== "production") {
        return next({ ctx: { ...ctx, customer: null } });
      }

      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Active subscription required",
      });
    }
  },
);

