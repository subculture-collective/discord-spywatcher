-- CreateEnum
CREATE TYPE "BackupType" AS ENUM ('FULL', 'INCREMENTAL', 'WAL_ARCHIVE');

-- CreateEnum
CREATE TYPE "BackupStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FAILED', 'VERIFIED');

-- CreateTable
CREATE TABLE "BackupLog" (
    "id" TEXT NOT NULL,
    "backupType" "BackupType" NOT NULL,
    "status" "BackupStatus" NOT NULL,
    "filename" TEXT NOT NULL,
    "fileSizeMB" DOUBLE PRECISION,
    "duration" INTEGER,
    "s3Location" TEXT,
    "s3LocationSecondary" TEXT,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "startedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ,
    "verifiedAt" TIMESTAMPTZ,

    CONSTRAINT "BackupLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BackupLog_backupType_idx" ON "BackupLog"("backupType");

-- CreateIndex
CREATE INDEX "BackupLog_status_idx" ON "BackupLog"("status");

-- CreateIndex
CREATE INDEX "BackupLog_startedAt_idx" ON "BackupLog"("startedAt" DESC);

-- CreateIndex
CREATE INDEX "BackupLog_completedAt_idx" ON "BackupLog"("completedAt" DESC);
