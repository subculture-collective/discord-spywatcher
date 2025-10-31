-- CreateTable
CREATE TABLE "UserAnalyticsEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "eventType" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "category" TEXT,
    "properties" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "pathname" TEXT,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "anonymized" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureUsageMetric" (
    "id" TEXT NOT NULL,
    "featureName" TEXT NOT NULL,
    "userId" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 1,
    "lastUsedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeatureUsageMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceMetric" (
    "id" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "endpoint" TEXT,
    "userId" TEXT,
    "sessionId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsSummary" (
    "id" TEXT NOT NULL,
    "summaryDate" DATE NOT NULL,
    "summaryType" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsSummary_pkey" PRIMARY KEY ("id")
);

-- AlterTable User: Add analyticsConsent column
ALTER TABLE "User" ADD COLUMN "analyticsConsent" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "UserAnalyticsEvent_userId_idx" ON "UserAnalyticsEvent"("userId");

-- CreateIndex
CREATE INDEX "UserAnalyticsEvent_sessionId_idx" ON "UserAnalyticsEvent"("sessionId");

-- CreateIndex
CREATE INDEX "UserAnalyticsEvent_eventType_idx" ON "UserAnalyticsEvent"("eventType");

-- CreateIndex
CREATE INDEX "UserAnalyticsEvent_eventName_idx" ON "UserAnalyticsEvent"("eventName");

-- CreateIndex
CREATE INDEX "UserAnalyticsEvent_category_idx" ON "UserAnalyticsEvent"("category");

-- CreateIndex
CREATE INDEX "UserAnalyticsEvent_createdAt_idx" ON "UserAnalyticsEvent"("createdAt");

-- CreateIndex
CREATE INDEX "UserAnalyticsEvent_userId_createdAt_idx" ON "UserAnalyticsEvent"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "UserAnalyticsEvent_eventType_createdAt_idx" ON "UserAnalyticsEvent"("eventType", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "UserAnalyticsEvent_consentGiven_idx" ON "UserAnalyticsEvent"("consentGiven");

-- CreateIndex
CREATE INDEX "FeatureUsageMetric_featureName_idx" ON "FeatureUsageMetric"("featureName");

-- CreateIndex
CREATE INDEX "FeatureUsageMetric_userId_idx" ON "FeatureUsageMetric"("userId");

-- CreateIndex
CREATE INDEX "FeatureUsageMetric_lastUsedAt_idx" ON "FeatureUsageMetric"("lastUsedAt");

-- CreateIndex
CREATE INDEX "FeatureUsageMetric_featureName_createdAt_idx" ON "FeatureUsageMetric"("featureName", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "PerformanceMetric_metricType_idx" ON "PerformanceMetric"("metricType");

-- CreateIndex
CREATE INDEX "PerformanceMetric_metricName_idx" ON "PerformanceMetric"("metricName");

-- CreateIndex
CREATE INDEX "PerformanceMetric_endpoint_idx" ON "PerformanceMetric"("endpoint");

-- CreateIndex
CREATE INDEX "PerformanceMetric_createdAt_idx" ON "PerformanceMetric"("createdAt");

-- CreateIndex
CREATE INDEX "PerformanceMetric_metricType_createdAt_idx" ON "PerformanceMetric"("metricType", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AnalyticsSummary_summaryDate_idx" ON "AnalyticsSummary"("summaryDate");

-- CreateIndex
CREATE INDEX "AnalyticsSummary_summaryType_idx" ON "AnalyticsSummary"("summaryType");

-- CreateIndex
CREATE INDEX "AnalyticsSummary_metric_idx" ON "AnalyticsSummary"("metric");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsSummary_summaryDate_summaryType_metric_key" ON "AnalyticsSummary"("summaryDate", "summaryType", "metric");
