-- CreateEnum
CREATE TYPE "RuleStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DRAFT');

-- CreateEnum
CREATE TYPE "RuleTriggerType" AS ENUM ('SCHEDULED', 'REALTIME', 'MANUAL');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('WEBHOOK', 'NOTIFICATION', 'EMAIL', 'DISCORD_MESSAGE');

-- CreateEnum
CREATE TYPE "ConditionOperator" AS ENUM ('EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN', 'GREATER_THAN_OR_EQUAL', 'LESS_THAN_OR_EQUAL', 'CONTAINS', 'NOT_CONTAINS', 'IN', 'NOT_IN');

-- CreateTable
CREATE TABLE "AnalyticsRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "status" "RuleStatus" NOT NULL DEFAULT 'DRAFT',
    "triggerType" "RuleTriggerType" NOT NULL DEFAULT 'SCHEDULED',
    "schedule" TEXT,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "metadata" JSONB,
    "lastExecutedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "AnalyticsRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleExecution" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "matchedCount" INTEGER NOT NULL DEFAULT 0,
    "actionsExecuted" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "results" JSONB,
    "executionTimeMs" INTEGER,
    "startedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ,

    CONSTRAINT "RuleExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "metadata" JSONB,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "RuleTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalyticsRule_userId_idx" ON "AnalyticsRule"("userId");

-- CreateIndex
CREATE INDEX "AnalyticsRule_status_idx" ON "AnalyticsRule"("status");

-- CreateIndex
CREATE INDEX "AnalyticsRule_triggerType_idx" ON "AnalyticsRule"("triggerType");

-- CreateIndex
CREATE INDEX "AnalyticsRule_lastExecutedAt_idx" ON "AnalyticsRule"("lastExecutedAt");

-- CreateIndex
CREATE INDEX "AnalyticsRule_userId_status_idx" ON "AnalyticsRule"("userId", "status");

-- CreateIndex
CREATE INDEX "RuleExecution_ruleId_idx" ON "RuleExecution"("ruleId");

-- CreateIndex
CREATE INDEX "RuleExecution_status_idx" ON "RuleExecution"("status");

-- CreateIndex
CREATE INDEX "RuleExecution_startedAt_idx" ON "RuleExecution"("startedAt" DESC);

-- CreateIndex
CREATE INDEX "RuleExecution_ruleId_startedAt_idx" ON "RuleExecution"("ruleId", "startedAt" DESC);

-- CreateIndex
CREATE INDEX "RuleTemplate_category_idx" ON "RuleTemplate"("category");

-- CreateIndex
CREATE INDEX "RuleTemplate_usageCount_idx" ON "RuleTemplate"("usageCount" DESC);

-- AddForeignKey
ALTER TABLE "RuleExecution" ADD CONSTRAINT "RuleExecution_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AnalyticsRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
