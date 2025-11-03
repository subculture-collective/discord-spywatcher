import { metrics } from './metrics';
import { Sentry } from './sentry';

export function setupDatabaseMonitoring(): void {
    // Note: Prisma v6+ removed $use middleware in favor of Prisma extensions
    // Database query monitoring is now handled by Sentry's Prisma integration
    // and we rely on Prisma's built-in logging capabilities

    // Log slow query detection can be configured in Prisma schema with log levels
    console.log(
        '✅ Database monitoring configured (using Sentry Prisma integration)'
    );
}

// Helper function to manually record database metrics if needed
export function recordDatabaseMetric(
    model: string,
    operation: string,
    duration: number
): void {
    metrics.dbQueryDuration.observe(
        {
            model: model || 'unknown',
            operation,
        },
        duration
    );

    // Log slow queries
    if (duration > 1) {
        console.warn('Slow query detected', {
            model,
            operation,
            duration,
        });
    }
}

// Helper function to capture database errors
export function captureDatabaseError(
    error: Error,
    model?: string,
    operation?: string
): void {
    // Sentry.captureException is safe to call even if Sentry isn't initialized
    Sentry.captureException(error, {
        contexts: {
            prisma: {
                model,
                operation,
            },
        },
    });
}
