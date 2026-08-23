-- AlterTable
ALTER TABLE "Execution" ADD COLUMN     "initialData" JSONB;

-- CreateTable
CREATE TABLE "NodeExecutionLog" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "nodeType" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB,
    "error" TEXT,
    "durationMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NodeExecutionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShadowRun" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "draftGraph" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ShadowRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReplayDiff" (
    "id" TEXT NOT NULL,
    "shadowRunId" TEXT NOT NULL,
    "originalExecutionId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "nodeType" TEXT NOT NULL,
    "diffType" TEXT NOT NULL,
    "oldOutput" JSONB,
    "newOutput" JSONB,
    "oldError" TEXT,
    "newError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReplayDiff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NodeExecutionLog_executionId_idx" ON "NodeExecutionLog"("executionId");

-- CreateIndex
CREATE UNIQUE INDEX "NodeExecutionLog_executionId_nodeId_key" ON "NodeExecutionLog"("executionId", "nodeId");

-- CreateIndex
CREATE INDEX "ReplayDiff_shadowRunId_idx" ON "ReplayDiff"("shadowRunId");

-- AddForeignKey
ALTER TABLE "NodeExecutionLog" ADD CONSTRAINT "NodeExecutionLog_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "Execution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShadowRun" ADD CONSTRAINT "ShadowRun_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplayDiff" ADD CONSTRAINT "ReplayDiff_shadowRunId_fkey" FOREIGN KEY ("shadowRunId") REFERENCES "ShadowRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
