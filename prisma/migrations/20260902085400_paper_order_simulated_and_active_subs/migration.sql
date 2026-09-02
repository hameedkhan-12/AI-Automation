-- Schema had drifted from migrations: PaperOrder.isSimulated and
-- ActiveMarketSubscription exist in prisma/schema.prisma but were never
-- recorded. Production `migrate deploy` then crashed /trading (orders.list).

ALTER TABLE "PaperOrder" ADD COLUMN IF NOT EXISTS "isSimulated" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS "ActiveMarketSubscription" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActiveMarketSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ActiveMarketSubscription_workflowId_symbol_key"
    ON "ActiveMarketSubscription"("workflowId", "symbol");
