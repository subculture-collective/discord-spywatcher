import { db } from '../db';

import { sendAlert } from './alertSystem';

export interface BackupHealthCheckResult {
    healthy: boolean;
    lastBackup?: Date;
    issues: string[];
}

/**
 * Check backup health and alert if issues are found
 */
export async function checkBackupHealth(): Promise<BackupHealthCheckResult> {
    const issues: string[] = [];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    try {
        // Check for recent successful backups
        const recentBackup = await db.backupLog.findFirst({
            where: {
                status: 'COMPLETED',
                startedAt: { gte: yesterday },
            },
            orderBy: { startedAt: 'desc' },
        });

        if (!recentBackup) {
            const lastBackup = await db.backupLog.findFirst({
                where: { status: 'COMPLETED' },
                orderBy: { startedAt: 'desc' },
            });

            const message = lastBackup
                ? `No successful backup in the last 24 hours. Last backup: ${lastBackup.startedAt.toISOString()}`
                : 'No successful backup found';

            issues.push(message);

            await sendAlert({
                severity: 'CRITICAL',
                title: 'No Recent Backup Found',
                message,
                details: {
                    lastBackup: lastBackup?.startedAt.toISOString() || 'never',
                    thresholdHours: 24,
                },
            });
        }

        // Check for recent failed backups
        const recentFailures = await db.backupLog.count({
            where: {
                status: 'FAILED',
                startedAt: { gte: yesterday },
            },
        });

        if (recentFailures > 0) {
            const failedBackups = await db.backupLog.findMany({
                where: {
                    status: 'FAILED',
                    startedAt: { gte: yesterday },
                },
                orderBy: { startedAt: 'desc' },
                take: 5,
            });

            issues.push(
                `${recentFailures} backup failure(s) in the last 24 hours`
            );

            await sendAlert({
                severity: 'HIGH',
                title: 'Recent Backup Failures',
                message: `${recentFailures} backup(s) failed in the last 24 hours`,
                details: {
                    failures: recentFailures,
                    recentErrors: failedBackups.map((b) => ({
                        time: b.startedAt.toISOString(),
                        error: b.errorMessage || 'Unknown error',
                    })),
                },
            });
        }

        // Check backup size consistency
        if (recentBackup) {
            const avgSize = await getAverageBackupSize();
            const currentSize = recentBackup.fileSizeMB || 0;

            if (
                avgSize > 0 &&
                Math.abs(currentSize - avgSize) > avgSize * 0.5
            ) {
                issues.push(
                    `Backup size ${currentSize}MB differs significantly from average ${avgSize.toFixed(2)}MB`
                );

                await sendAlert({
                    severity: 'MEDIUM',
                    title: 'Abnormal Backup Size',
                    message: `Recent backup size (${currentSize}MB) differs significantly from average (${avgSize.toFixed(2)}MB)`,
                    details: {
                        currentSize: `${currentSize}MB`,
                        averageSize: `${avgSize.toFixed(2)}MB`,
                        deviation: `${((Math.abs(currentSize - avgSize) / avgSize) * 100).toFixed(1)}%`,
                    },
                });
            }
        }

        // Check for unverified backups
        const unverifiedCount = await db.backupLog.count({
            where: {
                status: 'COMPLETED',
                verifiedAt: null,
                startedAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                },
            },
        });

        if (unverifiedCount > 3) {
            issues.push(`${unverifiedCount} unverified backup(s) in the last 7 days`);

            await sendAlert({
                severity: 'MEDIUM',
                title: 'Unverified Backups',
                message: `${unverifiedCount} backup(s) have not been verified in the last 7 days`,
                details: {
                    unverifiedCount,
                    recommendation: 'Run backup verification tests',
                },
            });
        }

        return {
            healthy: issues.length === 0,
            lastBackup: recentBackup?.startedAt,
            issues,
        };
    } catch (error) {
        console.error('Error checking backup health:', error);
        await sendAlert({
            severity: 'HIGH',
            title: 'Backup Health Check Failed',
            message: 'Failed to perform backup health check',
            details: {
                error: error instanceof Error ? error.message : 'Unknown error',
            },
        });
        return {
            healthy: false,
            issues: ['Failed to check backup health'],
        };
    }
}

/**
 * Get average backup size from recent backups
 */
async function getAverageBackupSize(): Promise<number> {
    const recentBackups = await db.backupLog.findMany({
        where: {
            status: 'COMPLETED',
            backupType: 'FULL',
            fileSizeMB: { not: null },
            startedAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
        },
        select: { fileSizeMB: true },
        take: 10,
    });

    if (recentBackups.length === 0) return 0;

    const total = recentBackups.reduce(
        (sum, backup) => sum + (backup.fileSizeMB || 0),
        0
    );
    return total / recentBackups.length;
}

/**
 * Log a backup operation
 */
export async function logBackupStart(
    backupType: 'FULL' | 'INCREMENTAL' | 'WAL_ARCHIVE',
    filename: string
): Promise<string> {
    const log = await db.backupLog.create({
        data: {
            backupType,
            status: 'IN_PROGRESS',
            filename,
            startedAt: new Date(),
        },
    });
    return log.id;
}

/**
 * Update backup log with completion details
 */
export async function logBackupComplete(
    logId: string,
    details: {
        success: boolean;
        fileSizeMB?: number;
        s3Location?: string;
        s3LocationSecondary?: string;
        errorMessage?: string;
        metadata?: Record<string, unknown>;
    }
): Promise<void> {
    const startLog = await db.backupLog.findUnique({ where: { id: logId } });
    if (!startLog) {
        console.error(`Backup log ${logId} not found`);
        return;
    }

    const duration = Math.floor(
        (Date.now() - startLog.startedAt.getTime()) / 1000
    );

    await db.backupLog.update({
        where: { id: logId },
        data: {
            status: details.success ? 'COMPLETED' : 'FAILED',
            fileSizeMB: details.fileSizeMB,
            s3Location: details.s3Location,
            s3LocationSecondary: details.s3LocationSecondary,
            errorMessage: details.errorMessage,
            metadata: details.metadata ? (details.metadata as any) : null,
            duration,
            completedAt: new Date(),
        },
    });

    // Send alert on failure
    if (!details.success) {
        await sendAlert({
            severity: 'HIGH',
            title: 'Backup Failed',
            message: `Backup operation failed: ${details.errorMessage || 'Unknown error'}`,
            details: {
                filename: startLog.filename,
                backupType: startLog.backupType,
                duration: `${duration}s`,
                error: details.errorMessage || 'Unknown error',
            },
        });
    }
}

/**
 * Mark a backup as verified
 */
export async function markBackupVerified(
    logId: string,
    metadata?: Record<string, unknown>
): Promise<void> {
    await db.backupLog.update({
        where: { id: logId },
        data: {
            status: 'VERIFIED',
            verifiedAt: new Date(),
            metadata: metadata ? (metadata as any) : null,
        },
    });
}

/**
 * Get backup statistics
 */
export async function getBackupStats(days: number = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
        totalBackups,
        successfulBackups,
        failedBackups,
        verifiedBackups,
        avgSize,
        avgDuration,
    ] = await Promise.all([
        db.backupLog.count({
            where: { startedAt: { gte: since } },
        }),
        db.backupLog.count({
            where: {
                status: { in: ['COMPLETED', 'VERIFIED'] },
                startedAt: { gte: since },
            },
        }),
        db.backupLog.count({
            where: { status: 'FAILED', startedAt: { gte: since } },
        }),
        db.backupLog.count({
            where: { status: 'VERIFIED', startedAt: { gte: since } },
        }),
        db.backupLog.aggregate({
            where: {
                status: { in: ['COMPLETED', 'VERIFIED'] },
                startedAt: { gte: since },
                fileSizeMB: { not: null },
            },
            _avg: { fileSizeMB: true },
        }),
        db.backupLog.aggregate({
            where: {
                status: { in: ['COMPLETED', 'VERIFIED'] },
                startedAt: { gte: since },
                duration: { not: null },
            },
            _avg: { duration: true },
        }),
    ]);

    return {
        totalBackups,
        successfulBackups,
        failedBackups,
        verifiedBackups,
        successRate:
            totalBackups > 0
                ? ((successfulBackups / totalBackups) * 100).toFixed(2) + '%'
                : 'N/A',
        avgSizeMB: avgSize._avg.fileSizeMB?.toFixed(2) || 'N/A',
        avgDurationSeconds: avgDuration._avg.duration?.toFixed(0) || 'N/A',
        period: `${days} days`,
    };
}

/**
 * Get recent backups
 */
export async function getRecentBackups(limit: number = 10) {
    return db.backupLog.findMany({
        orderBy: { startedAt: 'desc' },
        take: limit,
    });
}
