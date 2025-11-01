import { db } from '../db';
import { getRedisClient } from '../utils/redis';

interface HealthCheckResult {
    healthy: boolean;
    latency?: number;
    error?: string;
}

interface ServiceHealthStatus {
    database: HealthCheckResult;
    redis: HealthCheckResult;
    discord: HealthCheckResult;
    overall: boolean;
}

/**
 * Check database health and measure latency
 */
async function checkDatabaseHealth(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
        await db.$queryRaw`SELECT 1`;
        const latency = Date.now() - start;
        return { healthy: true, latency };
    } catch (error) {
        const latency = Date.now() - start;
        return {
            healthy: false,
            latency,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Check Redis health and measure latency
 */
async function checkRedisHealth(): Promise<HealthCheckResult> {
    const redis = getRedisClient();
    if (!redis) {
        // Redis is optional, so we consider it healthy if not configured
        return { healthy: true, latency: 0 };
    }

    const start = Date.now();
    try {
        await redis.ping();
        const latency = Date.now() - start;
        return { healthy: true, latency };
    } catch (error) {
        const latency = Date.now() - start;
        return {
            healthy: false,
            latency,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Check Discord API health and measure latency
 */
async function checkDiscordHealth(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
        const response = await fetch('https://discord.com/api/v10/gateway', {
            signal: AbortSignal.timeout(5000), // 5 second timeout
        });
        const latency = Date.now() - start;

        if (response.ok) {
            return { healthy: true, latency };
        } else {
            return {
                healthy: false,
                latency,
                error: `Discord API returned status ${response.status}`,
            };
        }
    } catch (error) {
        const latency = Date.now() - start;
        return {
            healthy: false,
            latency,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Perform comprehensive health check of all services
 */
export async function performHealthCheck(): Promise<ServiceHealthStatus> {
    const [database, redis, discord] = await Promise.all([
        checkDatabaseHealth(),
        checkRedisHealth(),
        checkDiscordHealth(),
    ]);

    const overall = database.healthy && redis.healthy && discord.healthy;

    return {
        database,
        redis,
        discord,
        overall,
    };
}

/**
 * Record a status check in the database
 */
export async function recordStatusCheck(
    healthStatus: ServiceHealthStatus
): Promise<void> {
    try {
        const status = healthStatus.overall
            ? 'healthy'
            : healthStatus.database.healthy
              ? 'degraded'
              : 'down';

        await db.statusCheck.create({
            data: {
                status,
                database: healthStatus.database.healthy,
                databaseLatency: healthStatus.database.latency || null,
                redis: healthStatus.redis.healthy,
                redisLatency: healthStatus.redis.latency || null,
                discord: healthStatus.discord.healthy,
                discordLatency: healthStatus.discord.latency || null,
                overall: healthStatus.overall,
                metadata: {
                    errors: {
                        database: healthStatus.database.error,
                        redis: healthStatus.redis.error,
                        discord: healthStatus.discord.error,
                    },
                },
            },
        });
    } catch (error) {
        console.error('Failed to record status check:', error);
        // Don't throw - we don't want health check recording to fail the actual check
    }
}

/**
 * Get uptime percentage for a time period
 * @param hours - Number of hours to look back (default: 24)
 */
export async function getUptimePercentage(hours = 24): Promise<number> {
    try {
        const since = new Date(Date.now() - hours * 60 * 60 * 1000);

        const [totalChecks, healthyChecks] = await Promise.all([
            db.statusCheck.count({
                where: {
                    timestamp: {
                        gte: since,
                    },
                },
            }),
            db.statusCheck.count({
                where: {
                    timestamp: {
                        gte: since,
                    },
                    overall: true,
                },
            }),
        ]);

        if (totalChecks === 0) {
            return 100; // No data = assume healthy
        }

        return (healthyChecks / totalChecks) * 100;
    } catch (error) {
        console.error('Failed to calculate uptime:', error);
        return 100; // Return 100 on error to avoid alarming users
    }
}

/**
 * Get historical status checks
 * @param limit - Number of checks to return (default: 100)
 */
export async function getHistoricalStatus(limit = 100) {
    try {
        return await db.statusCheck.findMany({
            take: limit,
            orderBy: {
                timestamp: 'desc',
            },
            select: {
                id: true,
                timestamp: true,
                status: true,
                database: true,
                databaseLatency: true,
                redis: true,
                redisLatency: true,
                discord: true,
                discordLatency: true,
                overall: true,
            },
        });
    } catch (error) {
        console.error('Failed to get historical status:', error);
        return [];
    }
}

/**
 * Clean up old status checks (keep last 90 days)
 */
export async function cleanupOldStatusChecks(): Promise<number> {
    try {
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

        const result = await db.statusCheck.deleteMany({
            where: {
                timestamp: {
                    lt: ninetyDaysAgo,
                },
            },
        });

        console.log(`Cleaned up ${result.count} old status checks`);
        return result.count;
    } catch (error) {
        console.error('Failed to cleanup old status checks:', error);
        return 0;
    }
}

/**
 * Start periodic status check job
 */
export function startStatusCheckJob(intervalMinutes = 5): NodeJS.Timeout {
    console.log(
        `Starting status check job (every ${intervalMinutes} minutes)`
    );

    const interval = setInterval(() => {
        void (async () => {
            try {
                const healthStatus = await performHealthCheck();
                await recordStatusCheck(healthStatus);
            } catch (error) {
                console.error('Status check job failed:', error);
            }
        })();
    }, intervalMinutes * 60 * 1000);

    // Run immediately on start
    void (async () => {
        try {
            const healthStatus = await performHealthCheck();
            await recordStatusCheck(healthStatus);
        } catch (error) {
            console.error('Initial status check failed:', error);
        }
    })();

    return interval;
}
