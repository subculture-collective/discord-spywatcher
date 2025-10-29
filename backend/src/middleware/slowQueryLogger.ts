interface SlowQueryLog {
    model?: string;
    action?: string;
    duration: number;
    args?: unknown;
    timestamp: Date;
}

// Configurable thresholds
const SLOW_QUERY_THRESHOLD_MS = parseInt(
    process.env.SLOW_QUERY_THRESHOLD_MS || '100',
    10
);
const CRITICAL_QUERY_THRESHOLD_MS = parseInt(
    process.env.CRITICAL_QUERY_THRESHOLD_MS || '1000',
    10
);

// Store slow query logs in memory (last 100 queries)
const slowQueryLogs: SlowQueryLog[] = [];
const MAX_LOGS = 100;

/**
 * Logs slow queries to console and stores them for monitoring
 */
function logSlowQuery(log: SlowQueryLog): void {
    // Add to in-memory log
    slowQueryLogs.push(log);
    if (slowQueryLogs.length > MAX_LOGS) {
        slowQueryLogs.shift();
    }

    // Log to console with appropriate severity
    if (log.duration >= CRITICAL_QUERY_THRESHOLD_MS) {
        console.error(
            `🔴 CRITICAL: Slow query detected: ${log.model}.${log.action} took ${log.duration}ms`,
            {
                model: log.model,
                action: log.action,
                duration: log.duration,
                timestamp: log.timestamp,
                args: log.args,
            }
        );
    } else {
        console.warn(
            `🟡 WARNING: Slow query detected: ${log.model}.${log.action} took ${log.duration}ms`,
            {
                model: log.model,
                action: log.action,
                duration: log.duration,
                timestamp: log.timestamp,
            }
        );
    }
}

/**
 * Get recent slow query logs for monitoring dashboard
 */
export function getSlowQueryLogs(): SlowQueryLog[] {
    return [...slowQueryLogs];
}

/**
 * Get statistics about slow queries
 */
export function getSlowQueryStats() {
    if (slowQueryLogs.length === 0) {
        return {
            count: 0,
            avgDuration: 0,
            maxDuration: 0,
            criticalCount: 0,
        };
    }

    const durations = slowQueryLogs.map((log) => log.duration);
    const criticalCount = slowQueryLogs.filter(
        (log) => log.duration >= CRITICAL_QUERY_THRESHOLD_MS
    ).length;

    return {
        count: slowQueryLogs.length,
        avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        maxDuration: Math.max(...durations),
        criticalCount,
        threshold: SLOW_QUERY_THRESHOLD_MS,
        criticalThreshold: CRITICAL_QUERY_THRESHOLD_MS,
    };
}

/**
 * Clear slow query logs
 */
export function clearSlowQueryLogs(): void {
    slowQueryLogs.length = 0;
}

/**
 * Initialize slow query logging middleware for Prisma
 * This middleware intercepts all database queries and logs slow ones
 * 
 * Note: Prisma 6.x requires using extensions instead of $use middleware
 * This function provides a manual timing wrapper for critical queries
 */
export function initializeSlowQueryLogger(): void {
    console.log(
        `✅ Slow query logger initialized (threshold: ${SLOW_QUERY_THRESHOLD_MS}ms, critical: ${CRITICAL_QUERY_THRESHOLD_MS}ms)`
    );
    console.log(
        '⚠️  Note: Prisma 6.x does not support $use middleware. Use query timing wrapper or enable query logging.'
    );
}

/**
 * Wrapper for timing database operations
 * Use this to manually track query performance for critical operations
 * 
 * @example
 * const result = await trackQueryPerformance(
 *   'User',
 *   'findMany',
 *   async () => db.user.findMany({ where: { ... } })
 * );
 */
export async function trackQueryPerformance<T>(
    model: string,
    action: string,
    operation: () => Promise<T>
): Promise<T> {
    const before = Date.now();
    const result = await operation();
    const duration = Date.now() - before;

    // Log if query exceeds threshold
    if (duration > SLOW_QUERY_THRESHOLD_MS) {
        logSlowQuery({
            model,
            action,
            duration,
            timestamp: new Date(),
        });
    }

    return result;
}
