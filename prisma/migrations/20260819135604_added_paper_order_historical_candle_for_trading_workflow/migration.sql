-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CredentialType" ADD VALUE 'ALPACA';
ALTER TYPE "CredentialType" ADD VALUE 'BINANCE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NodeType" ADD VALUE 'MARKET_DATA_TRIGGER';
ALTER TYPE "NodeType" ADD VALUE 'INDICATOR';
ALTER TYPE "NodeType" ADD VALUE 'ORDER';

-- CreateTable
CREATE TABLE "IndicatorState" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndicatorState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperPosition" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "avgPrice" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaperPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "filledPrice" DOUBLE PRECISION,
    "status" TEXT NOT NULL,
    "clientOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaperOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricalCandle" (
    "id" TEXT NOT NULL,
    "exchange" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "interval" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "open" DOUBLE PRECISION NOT NULL,
    "high" DOUBLE PRECISION NOT NULL,
    "low" DOUBLE PRECISION NOT NULL,
    "close" DOUBLE PRECISION NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "HistoricalCandle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IndicatorState_nodeId_key_key" ON "IndicatorState"("nodeId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "PaperPosition_userId_symbol_key" ON "PaperPosition"("userId", "symbol");

-- CreateIndex
CREATE UNIQUE INDEX "PaperOrder_clientOrderId_key" ON "PaperOrder"("clientOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "HistoricalCandle_exchange_symbol_interval_timestamp_key" ON "HistoricalCandle"("exchange", "symbol", "interval", "timestamp");
