import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { orderChannel } from "@/inngest/channels/order";
import { getExchangeAdapter } from "../../adapters/registry";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import type { Candle } from "../../adapters/types";
import type { Trade } from "../../providers/backtest";

type OrderData = {
  exchange?: string;
  credentialId?: string;
  symbol?: string;
  side?: "BUY" | "SELL";
  quantity?: number;
  orderType?: "MARKET" | "LIMIT";
  limitPrice?: number;
};

/**
 * Order executor — places a paper order via the configured ExchangeAdapter.
 *
 * IDEMPOTENCY (fix #1 from code review):
 * The order call is wrapped in step.run() with a deterministic ID so Inngest
 * will not re-execute it on retry. Additionally, we pass a clientOrderId of
 * `{executionId}-{nodeId}` to Alpaca's client_order_id field.
 * Alpaca deduplicates by client_order_id — so even if our POST is retried at
 * the network layer, the same order will never be placed twice.
 *
 * Reference: https://docs.alpaca.markets/trading/orders/#client-order-id
 */
export const orderExecutor: NodeExecutor<OrderData> = async ({
  data,
  nodeId,
  userId,
  context,
  step,
  publish,
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
  const executionId = (context.__executionId as string | undefined) ?? "unknown";
  const clientOrderId = `${executionId}-${nodeId}`.slice(0, 48); // Alpaca max 48 chars

  const result = await step.run("place-order", async () => {
    // 1. Decrypt credentials
    let credentials: Record<string, string> = {};
    if (data.credentialId) {
      const cred = await prisma.credential.findUniqueOrThrow({
        where: { id: data.credentialId, userId },
      });
      const decrypted = decrypt(cred.value);
      // Credential value is stored as JSON: { apiKey, apiSecret }
      try {
        credentials = JSON.parse(decrypted) as Record<string, string>;
      } catch {
        // Plain string fallback (backwards compat)
        credentials = { apiKey: decrypted };
      }
    }

    // 2. Place order via adapter (clientOrderId makes this idempotent)
    const orderResult = await adapter.placeOrder(
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

    // 3. Persist order record
    await prisma.paperOrder.create({
      data: {
        userId,
        workflowId: (context.__workflowId as string | undefined) ?? "unknown",
        symbol: data.symbol!,
        side: data.side!,
        quantity: data.quantity!,
        filledPrice: orderResult.filledPrice,
        status: orderResult.status,
        clientOrderId,
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

    return orderResult;
  });

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
