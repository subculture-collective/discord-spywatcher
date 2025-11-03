/**
 * Connection Pool Monitoring Utility
 *
 * Provides monitoring and health check capabilities for database
 * and Redis connection pools.
 */

import { checkDatabaseHealth, getConnectionPoolMetrics } from '../db';

import { getRedisMetrics, isRedisAvailable } from './redis';

/**
 * Overall system health status
 */
export interface SystemHealth {
    healthy: boolean;
    timestamp: string;
    database: DatabaseHealth;
    redis: RedisHealth;
}

/**
 * Database connection health
 */
export interface DatabaseHealth {
    healthy: boolean;
    responseTime?: number;
    connectionPool?: {
        active: number;
        idle: number;
        total: number;
        max: number;
        utilizationPercent: string;
        isPgBouncer: boolean;
        isShuttingDown: boolean;
    };
    error?: string;
}

/**
 * Redis connection health
 */
export interface RedisHealth {
    available: boolean;
    connected: boolean;
    status?: string;
    metrics?: {
        totalConnectionsReceived: string;
        totalCommandsProcessed: string;
        instantaneousOpsPerSec: string;
        usedMemory: string;
    };
    error?: string;
}

/**
 * Connection pool statistics for alerting
 */
export interface ConnectionPoolStats {
    database: {
        utilizationPercent: number;
        activeConnections: number;
        maxConnections: number;
        isHealthy: boolean;
    };
    redis: {
        available: boolean;
        connected: boolean;
    };
}

/**
 * Get comprehensive system health including connection pools
 */
export async function getSystemHealth(): Promise<SystemHealth> {
    const [dbHealth, dbMetrics, redisMetrics] = await Promise.all([
        checkDatabaseHealth(),
        getConnectionPoolMetrics(),
        getRedisMetrics(),
    ]);

    const redisAvailable = await isRedisAvailable();

    return {
        healthy: dbHealth.healthy && (!process.env.REDIS_URL || redisAvailable),
        timestamp: new Date().toISOString(),
        database: {
            healthy: dbHealth.healthy,
            responseTime: dbHealth.responseTime,
            connectionPool: dbMetrics.error
                ? undefined
                : {
                      active: dbMetrics.active,
                      idle: dbMetrics.idle,
                      total: dbMetrics.total,
                      max: dbMetrics.max,
                      utilizationPercent: dbMetrics.utilizationPercent,
                      isPgBouncer: dbMetrics.isPgBouncer,
                      isShuttingDown: dbMetrics.isShuttingDown,
                  },
            error: dbHealth.error || dbMetrics.error,
        },
        redis: {
            available: redisMetrics.available,
            connected: redisMetrics.connected,
            status: redisMetrics.status,
            metrics:
                redisMetrics.available && redisMetrics.connected
                    ? {
                          totalConnectionsReceived:
                              redisMetrics.totalConnectionsReceived ?? 'N/A',
                          totalCommandsProcessed:
                              redisMetrics.totalCommandsProcessed ?? 'N/A',
                          instantaneousOpsPerSec:
                              redisMetrics.instantaneousOpsPerSec ?? 'N/A',
                          usedMemory: redisMetrics.usedMemory ?? 'N/A',
                      }
                    : undefined,
            error: redisMetrics.error,
        },
    };
}

/**
 * Get connection pool statistics for alerting purposes
 */
export async function getConnectionPoolStats(): Promise<ConnectionPoolStats> {
    const [dbMetrics, redisMetrics] = await Promise.all([
        getConnectionPoolMetrics(),
        getRedisMetrics(),
    ]);

    return {
        database: {
            utilizationPercent: parseFloat(dbMetrics.utilizationPercent),
            activeConnections: dbMetrics.active,
            maxConnections: dbMetrics.max,
            isHealthy: !dbMetrics.error,
        },
        redis: {
            available: redisMetrics.available,
            connected: redisMetrics.connected,
        },
    };
}

/**
 * Check if connection pool utilization is above threshold
 * @param threshold - Percentage threshold (default 80%)
 */
export async function isConnectionPoolOverloaded(
    threshold: number = 80
): Promise<boolean> {
    const stats = await getConnectionPoolStats();
    return stats.database.utilizationPercent >= threshold;
}

/**
 * Get connection pool alerts
 */
export async function getConnectionPoolAlerts(): Promise<string[]> {
    const alerts: string[] = [];
    const stats = await getConnectionPoolStats();

    // Database connection pool alerts
    if (stats.database.utilizationPercent >= 90) {
        alerts.push(
            `CRITICAL: Database connection pool at ${stats.database.utilizationPercent}% utilization`
        );
    } else if (stats.database.utilizationPercent >= 80) {
        alerts.push(
            `WARNING: Database connection pool at ${stats.database.utilizationPercent}% utilization`
        );
    }

    if (!stats.database.isHealthy) {
        alerts.push('CRITICAL: Database connection pool is not healthy');
    }

    // Redis connection alerts
    if (process.env.REDIS_URL && !stats.redis.available) {
        alerts.push('WARNING: Redis is configured but not available');
    }

    if (process.env.REDIS_URL && !stats.redis.connected) {
        alerts.push('WARNING: Redis is not connected');
    }

    return alerts;
}

/**
 * Log connection pool metrics to console (for monitoring/debugging)
 */
export async function logConnectionPoolMetrics(): Promise<void> {
    const health = await getSystemHealth();

    console.log('=== Connection Pool Metrics ===');
    console.log(`Timestamp: ${health.timestamp}`);
    console.log(
        `Overall Health: ${health.healthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}`
    );

    console.log('\n--- Database ---');
    console.log(`Health: ${health.database.healthy ? '✅' : '❌'}`);
    if (health.database.responseTime) {
        console.log(`Response Time: ${health.database.responseTime}ms`);
    }
    if (health.database.connectionPool) {
        console.log(`Connection Pool:`);
        console.log(`  Active: ${health.database.connectionPool.active}`);
        console.log(`  Idle: ${health.database.connectionPool.idle}`);
        console.log(`  Total: ${health.database.connectionPool.total}`);
        console.log(`  Max: ${health.database.connectionPool.max}`);
        console.log(
            `  Utilization: ${health.database.connectionPool.utilizationPercent}%`
        );
        console.log(
            `  PgBouncer: ${health.database.connectionPool.isPgBouncer ? 'Yes' : 'No'}`
        );
    }
    if (health.database.error) {
        console.log(`Error: ${health.database.error}`);
    }

    console.log('\n--- Redis ---');
    console.log(`Available: ${health.redis.available ? '✅' : '❌'}`);
    console.log(`Connected: ${health.redis.connected ? '✅' : '❌'}`);
    if (health.redis.status) {
        console.log(`Status: ${health.redis.status}`);
    }
    if (health.redis.metrics) {
        console.log(`Metrics:`);
        console.log(
            `  Total Connections: ${health.redis.metrics.totalConnectionsReceived}`
        );
        console.log(
            `  Total Commands: ${health.redis.metrics.totalCommandsProcessed}`
        );
        console.log(
            `  Ops/sec: ${health.redis.metrics.instantaneousOpsPerSec}`
        );
        console.log(`  Memory Used: ${health.redis.metrics.usedMemory}`);
    }
    if (health.redis.error) {
        console.log(`Error: ${health.redis.error}`);
    }

    console.log('==============================\n');

    // Log any alerts
    const alerts = await getConnectionPoolAlerts();
    if (alerts.length > 0) {
        console.log('🚨 ALERTS:');
        alerts.forEach((alert) => console.log(`  - ${alert}`));
        console.log('');
    }
}

/**
 * Start periodic connection pool monitoring
 * @param intervalMs - Monitoring interval in milliseconds (default: 60000 = 1 minute)
 */
export function startConnectionPoolMonitoring(
    intervalMs: number = 60000
): NodeJS.Timeout {
    console.log(
        `Starting connection pool monitoring (interval: ${intervalMs}ms)`
    );

    // Log initial metrics
    logConnectionPoolMetrics().catch((err) => {
        console.error('Error logging initial connection pool metrics:', err);
    });

    // Start periodic monitoring
    return setInterval(() => {
        logConnectionPoolMetrics().catch((err) => {
            console.error('Error logging connection pool metrics:', err);
        });
    }, intervalMs);
}

/**
 * Stop periodic connection pool monitoring
 */
export function stopConnectionPoolMonitoring(timer: NodeJS.Timeout): void {
    clearInterval(timer);
    console.log('Connection pool monitoring stopped');
}
