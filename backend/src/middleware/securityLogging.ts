import { NextFunction, Request, Response } from 'express';

import {
    logSecurityEvent,
    SecurityActions,
} from '../utils/securityLogger';

/**
 * Middleware to log security-relevant HTTP responses
 */
export function securityLoggingMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    // Use response finish event to capture all response methods
    res.on('finish', () => {
        // Log security-relevant responses
        if (res.statusCode === 401) {
            // Unauthorized - authentication failed
            logSecurityEvent({
                userId: req.user?.userId,
                action: SecurityActions.UNAUTHORIZED_ACCESS,
                resource: req.path,
                result: 'FAILURE',
                ipAddress: getClientIP(req),
                userAgent: req.get('user-agent'),
                requestId: req.id,
                metadata: {
                    method: req.method,
                    statusCode: res.statusCode,
                },
            }).catch((err) =>
                console.error('Failed to log unauthorized access:', err)
            );
        } else if (res.statusCode === 403) {
            // Forbidden - authorization failed
            logSecurityEvent({
                userId: req.user?.userId,
                action: SecurityActions.FORBIDDEN_ACCESS,
                resource: req.path,
                result: 'FAILURE',
                ipAddress: getClientIP(req),
                userAgent: req.get('user-agent'),
                requestId: req.id,
                metadata: {
                    method: req.method,
                    statusCode: res.statusCode,
                },
            }).catch((err) =>
                console.error('Failed to log forbidden access:', err)
            );
        }
    });

    next();
}

/**
 * Get client IP address from request
 */
function getClientIP(req: Request): string {
    const xForwardedFor = req.headers['x-forwarded-for'];
    return (
        req.ip ||
        (typeof xForwardedFor === 'string'
            ? xForwardedFor.split(',')[0].trim()
            : 'unknown')
    );
}

/**
 * Middleware to log admin actions
 */
export function logAdminAction(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    // Only log for admin routes
    if (req.user && req.user.role === 'ADMIN') {
        res.on('finish', () => {
            const result = res.statusCode < 400 ? 'SUCCESS' : 'FAILURE';
            logSecurityEvent({
                userId: req.user!.userId,
                action: SecurityActions.ADMIN_ACTION,
                resource: req.path,
                result,
                ipAddress: getClientIP(req),
                userAgent: req.get('user-agent'),
                requestId: req.id,
                metadata: {
                    method: req.method,
                    body: sanitizeBody(req.body),
                },
            }).catch((err) => console.error('Failed to log admin action:', err));
        });
    }

    next();
}

/**
 * Sanitize request body for logging (remove sensitive data)
 */
function sanitizeBody(body: unknown): unknown {
    if (!body || typeof body !== 'object') {
        return body;
    }

    const sanitized = { ...body } as Record<string, unknown>;
    const sensitiveFields = [
        'password',
        'token',
        'secret',
        'apiKey',
        'accessToken',
        'refreshToken',
    ];

    for (const field of sensitiveFields) {
        if (field in sanitized) {
            sanitized[field] = '[REDACTED]';
        }
    }

    return sanitized;
}
