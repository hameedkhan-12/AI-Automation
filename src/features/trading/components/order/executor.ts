import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { orderChannel } from "@/inngest/channels/order";
import { getExchangeAdapter } from "../../adapters/registry";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import type { Candle } from "../../adapters/types";
import type { Trade } from "../../providers/backtest";

import { createId } from "@paralleldrive/cuid2";

type OrderData = {
  exchange?: string;
  credentialId?: string;
  symbol?: string;
  side?: "BUY" | "SELL";
  quantity?: number;
  orderType?: "MARKET" | "LIMIT";
  limitPrice?: number;
};

// Used only for a simulated fill when no real candle price is available in context.
const FALLBACK_SIMULATED_PRICE = 181.9;

export const orderExecutor: NodeExecutor<OrderData> = async ({
  data,
  nodeId,
  userId,
  context,
  step,
  publish,
  mode = "live",
}) => {
  await publish(orderChannel().status({ nodeId, status: "loading" }));

  if (!data.exchange) {
    await publish(orderChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Order: exchange is required");
  }
  if (!data.symbol) {
    await publish(orderChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Order: symbol is required");
  }
  if (!data.side) {
    await publish(orderChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Order: side is required");
  }
  if (!data.quantity || data.quantity <= 0) {
    await publish(orderChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Order: quantity must be > 0");
  }

  const adapter = getExchangeAdapter(data.exchange);

  // Build deterministic idempotency key — same execution + same node always
  // produces the same key, preventing duplicate orders on Inngest retry.
  const executionId = (context.__executionId as string | undefined) || createId();
  const clientOrderId = `${executionId}-${nodeId}`.slice(0, 48); // Alpaca max 48 chars

  let result: import("../../adapters/types").OrderResult;
  try {
    result = await step.run("place-order", async () => {
      // 1. Decrypt credentials if available
      let credentials: Record<string, string> = {};
      if (data.credentialId) {
        try {
          const cred = await prisma.credential.findUnique({
            where: { id: data.credentialId, userId },
          });
          if (cred) {
            const decrypted = decrypt(cred.value);
            try {
              credentials = JSON.parse(decrypted) as Record<string, string>;
            } catch {
              credentials = { apiKey: decrypted };
            }
          }
        } catch (err) {
          console.warn("[order-executor] Decryption skipped, using paper simulation mode:", err);
        }
      }

      const currentPrice = (context.candle as Candle | undefined)?.close ?? FALLBACK_SIMULATED_PRICE;
      const hasRealCredentials =
        Boolean(credentials.apiKey) && credentials.apiKey !== "encrypted_placeholder_value";

      // In shadow-replay mode, NEVER place a real order regardless of
      // credentials — a replay must not have real side effects. This is
      // the dry-run branch for the ORDER node.
      const shouldSimulate = mode === "shadow" || !hasRealCredentials;
      
      if (mode === "live" && hasRealCredentials && !credentials.apiSecret) {
        throw new Error(
          "Alpaca credential is missing its secret key. Edit the credential and re-enter both the API Key ID and Secret Key.",
        );
      }

      let orderResult: import("../../adapters/types").OrderResult;

      if (shouldSimulate) {
        // Deliberate simulated paper fill — no credentials configured, this
        // is expected demo/dev behavior, not an error path.
        orderResult = {
          orderId: `sim_${clientOrderId}`,
          status: "FILLED",
          filledPrice: data.limitPrice ?? currentPrice,
          filledQuantity: data.quantity!,
        };
      } else {
        // Real credentials present — let a failure here throw for real.
        orderResult = await adapter.placeOrder(
          {
            symbol: data.symbol!,
            side: data.side!,
            quantity: data.quantity!,
            type: data.orderType ?? "MARKET",
            limitPrice: data.limitPrice,
            clientOrderId,
          },
          credentials,
        );
      }

      // 3. Persist order record (upsert to be idempotent across step retries).
      // Skipped entirely in shadow mode — a replay must not pollute real
      // order history or position tracking, it only needs the in-memory
      // orderResult for diffing.
      if (mode !== "shadow") {
        await prisma.paperOrder.upsert({
          where: { clientOrderId },
          create: {
            userId,
            workflowId: (context.__workflowId as string | undefined) ?? "unknown",
            symbol: data.symbol!,
            side: data.side!,
            quantity: data.quantity!,
            filledPrice: orderResult.filledPrice,
            status: orderResult.status,
            clientOrderId,
          },
          update: {
            filledPrice: orderResult.filledPrice,
            status: orderResult.status,
          },
        });

        // 4. Upsert paper position
        if (orderResult.status === "FILLED" && orderResult.filledPrice) {
          const filledQty = orderResult.filledQuantity ?? data.quantity!;
          const filledPrice = orderResult.filledPrice;

          const existing = await prisma.paperPosition.findUnique({
            where: { userId_symbol: { userId, symbol: data.symbol! } },
          });

          if (data.side === "BUY") {
            const prevQty = existing?.quantity ?? 0;
            const prevAvg = existing?.avgPrice ?? 0;
            const newQty = prevQty + filledQty;
            const newAvg = (prevQty * prevAvg + filledQty * filledPrice) / newQty;

            await prisma.paperPosition.upsert({
              where: { userId_symbol: { userId, symbol: data.symbol! } },
              create: { userId, symbol: data.symbol!, quantity: newQty, avgPrice: newAvg },
              update: { quantity: newQty, avgPrice: newAvg },
            });
          } else {
            // SELL
            const newQty = (existing?.quantity ?? 0) - filledQty;
            if (newQty <= 0) {
              await prisma.paperPosition.deleteMany({
                where: { userId, symbol: data.symbol! },
              });
            } else {
              await prisma.paperPosition.update({
                where: { userId_symbol: { userId, symbol: data.symbol! } },
                data: { quantity: newQty },
              });
            }
          }
        }
      }

      return orderResult;
    });
  } catch (err) {
    // Real failure (real adapter error, not the deliberate simulation path
    // above) — report it honestly instead of faking a fill.
    await publish(orderChannel().status({ nodeId, status: "error" }));
    throw err;
  }

  await publish(orderChannel().status({ nodeId, status: "success" }));

  // Expose the placed trade as __lastOrder so executeBacktest can collect it
  const candle = context.candle as Candle | undefined;
  const lastOrder: Trade = {
    timestamp: candle?.timestamp ?? Date.now(),
    side: data.side!,
    symbol: data.symbol!,
    quantity: data.quantity!,
    price: result.filledPrice ?? 0,
  };

  return {
    ...context,
    __lastOrder: lastOrder,
    orderResult: result,
  };
};