import path from 'path';

import { createLogger, format, transports } from 'winston';

import { db } from '../db';

export interface SecurityEvent {
    userId?: string;
    action: string;
    resource?: string;
    result: 'SUCCESS' | 'FAILURE';
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    metadata?: Record<string, unknown>;
}

// Winston logger for security events
export const securityLogger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
    ),
    defaultMeta: { service: 'spywatcher-security' },
    transports: [
        new transports.File({
            filename: path.join('logs', 'security.log'),
            level: 'info',
        }),
        new transports.File({
            filename: path.join('logs', 'security-error.log'),
            level: 'error',
        }),
        new transports.Console({
            format: format.simple(),
        }),
    ],
});

/**
 * Sanitize sensitive data from metadata before logging
 */
function sanitizeMetadata(
    metadata?: Record<string, unknown>
): Record<string, unknown> | undefined {
    if (!metadata) return undefined;

    const sanitized = { ...metadata };
    const sensitiveKeys = [
        'password',
        'token',
        'accessToken',
        'refreshToken',
        'secret',
        'apiKey',
        'scopes', // OAuth scopes can be sensitive
        'email',
    ];

    for (const key of sensitiveKeys) {
        if (key in sanitized) {
            sanitized[key] = '[REDACTED]';
        }
    }

    return sanitized;
}

/**
 * Log security event to both Winston and database
 */
export async function logSecurityEvent(
    event: SecurityEvent
): Promise<void> {
    try {
        // Sanitize event metadata before logging
        const sanitizedEvent = {
            ...event,
            metadata: sanitizeMetadata(event.metadata),
        };

        // Log to Winston for file-based logging
        securityLogger.info('Security event', sanitizedEvent);

        // Log to database for persistence and analysis (use sanitized metadata)
        await db.securityLog.create({
            data: {
                userId: event.userId,
                action: event.action,
                resource: event.resource,
                result: event.result,
                ipAddress: event.ipAddress,
                userAgent: event.userAgent,
                requestId: event.requestId,
                metadata: sanitizedEvent.metadata as never,
                timestamp: new Date(),
            },
        });

        // Check for alert conditions after logging (use sanitized event)
        await checkAlertConditions(sanitizedEvent);
    } catch (error) {
        // Log error but don't throw - security logging failures shouldn't break main flow
        console.error('Failed to log security event:', error);
        securityLogger.error('Failed to log security event', { error });
    }
}

/**
 * Security Actions Constants
 */
export const SecurityActions = {
    // Authentication Events
    LOGIN_ATTEMPT: 'LOGIN_ATTEMPT',
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILURE: 'LOGIN_FAILURE',
    LOGOUT: 'LOGOUT',
    TOKEN_REFRESH: 'TOKEN_REFRESH',
    TOKEN_REFRESH_FAILURE: 'TOKEN_REFRESH_FAILURE',
    PASSWORD_CHANGE: 'PASSWORD_CHANGE',
    SESSION_CREATED: 'SESSION_CREATED',
    SESSION_DESTROYED: 'SESSION_DESTROYED',
    OAUTH_GRANT: 'OAUTH_GRANT',

    // Authorization Events
    PERMISSION_CHECK: 'PERMISSION_CHECK',
    PERMISSION_GRANTED: 'PERMISSION_GRANTED',
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    ROLE_CHANGE: 'ROLE_CHANGE',
    PRIVILEGE_ESCALATION_ATTEMPT: 'PRIVILEGE_ESCALATION_ATTEMPT',
    UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
    FORBIDDEN_ACCESS: 'FORBIDDEN_ACCESS',
    ADMIN_ACTION: 'ADMIN_ACTION',

    // Data Access Events
    PII_ACCESS: 'PII_ACCESS',
    DATA_EXPORT: 'DATA_EXPORT',
    DATA_MODIFICATION: 'DATA_MODIFICATION',
    DATA_DELETION: 'DATA_DELETION',
    BULK_OPERATION: 'BULK_OPERATION',

    // Security Events
    RATE_LIMIT_VIOLATION: 'RATE_LIMIT_VIOLATION',
    IP_BLOCKED: 'IP_BLOCKED',
    SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
    CSRF_TOKEN_MISMATCH: 'CSRF_TOKEN_MISMATCH',
    INVALID_TOKEN: 'INVALID_TOKEN',
    SQL_INJECTION_ATTEMPT: 'SQL_INJECTION_ATTEMPT',
    XSS_ATTEMPT: 'XSS_ATTEMPT',
} as const;

/**
 * Get recent security logs for analysis
 */
export async function getSecurityLogs(options: {
    userId?: string;
    action?: string;
    result?: 'SUCCESS' | 'FAILURE';
    ipAddress?: string;
    limit?: number;
    offset?: number;
}) {
    const {
        userId,
        action,
        result,
        ipAddress,
        limit = 100,
        offset = 0,
    } = options;

    return db.securityLog.findMany({
        where: {
            userId,
            action,
            result,
            ipAddress,
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
    });
}

/**
 * Get security statistics for dashboard
 */
export async function getSecurityStats(timeWindow: number = 24 * 60 * 60 * 1000) {
    const since = new Date(Date.now() - timeWindow);

    const [
        totalEvents,
        failedLogins,
        permissionDenials,
        blockedIPs,
        suspiciousActivities,
    ] = await Promise.all([
        db.securityLog.count({
            where: { timestamp: { gte: since } },
        }),
        db.securityLog.count({
            where: {
                action: SecurityActions.LOGIN_ATTEMPT,
                result: 'FAILURE',
                timestamp: { gte: since },
            },
        }),
        db.securityLog.count({
            where: {
                action: SecurityActions.PERMISSION_DENIED,
                timestamp: { gte: since },
            },
        }),
        db.securityLog.count({
            where: {
                action: SecurityActions.IP_BLOCKED,
                timestamp: { gte: since },
            },
        }),
        db.securityLog.count({
            where: {
                action: SecurityActions.SUSPICIOUS_ACTIVITY,
                timestamp: { gte: since },
            },
        }),
    ]);

    return {
        totalEvents,
        failedLogins,
        permissionDenials,
        blockedIPs,
        suspiciousActivities,
        timeWindow: timeWindow / (60 * 60 * 1000) + ' hours',
    };
}

/**
 * Import alert system functions
 * These are imported dynamically to avoid circular dependencies
 */
async function checkAlertConditions(event: SecurityEvent): Promise<void> {
    try {
        const { checkAlertConditions: checkAlerts } = await import(
            './alertSystem'
        );
        await checkAlerts(event);
    } catch (error) {
        console.error('Failed to check alert conditions:', error);
    }
}
