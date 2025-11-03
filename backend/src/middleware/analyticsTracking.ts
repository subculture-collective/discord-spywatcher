/**
 * Analytics Tracking Middleware
 * Automatically tracks API requests and user actions with GDPR compliance
 */

import { Request, Response, NextFunction } from 'express';

import {
    trackEvent,
    trackPerformance,
    AnalyticsEventType,
    AnalyticsCategory,
    PerformanceMetricType,
} from '../services/analytics';

/**
 * Get analytics category from request path
 */
function getCategoryFromPath(path: string): AnalyticsCategory {
    if (path.startsWith('/api/analytics')) return AnalyticsCategory.ANALYTICS;
    if (path.startsWith('/api/auth')) return AnalyticsCategory.AUTH;
    if (path.startsWith('/api/admin')) return AnalyticsCategory.ADMIN;
    if (path.startsWith('/api/public')) return AnalyticsCategory.PUBLIC_API;
    if (path.startsWith('/api/privacy')) return AnalyticsCategory.PRIVACY;
    if (path.startsWith('/api/settings')) return AnalyticsCategory.SETTINGS;
    return AnalyticsCategory.ANALYTICS;
}

/**
 * Check if user has given analytics consent
 */
function hasAnalyticsConsent(req: Request): boolean {
    // Check consent from user record or cookie
    return (
        req.cookies?.analyticsConsent === 'true' ||
        req.user?.analyticsConsent === true
    );
}

/**
 * Middleware to track API requests
 */
export function trackApiRequest(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const startTime = Date.now();

    // Skip tracking for certain endpoints to avoid noise
    const skipPaths = ['/health', '/metrics', '/api/health', '/api/metrics'];
    if (skipPaths.some((path) => req.path.startsWith(path))) {
        next();
        return;
    }

    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const consentGiven = hasAnalyticsConsent(req);

        // Track the API call event
        trackEvent({
            userId: req.user?.id,
            sessionId:
                (req as any).sessionID ||
                (req.headers['x-session-id'] as string),
            eventType: AnalyticsEventType.API_CALL,
            eventName: `${req.method} ${req.path}`,
            category: getCategoryFromPath(req.path),
            properties: {
                method: req.method,
                statusCode: res.statusCode,
                duration,
                query:
                    Object.keys(req.query).length > 0
                        ? Object.keys(req.query)
                        : undefined,
            },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            pathname: req.path,
            consentGiven,
        }).catch((error) => {
            console.error('Error tracking API request:', error);
        });

        // Track performance metric
        trackPerformance({
            metricType: PerformanceMetricType.API_RESPONSE_TIME,
            metricName: req.path,
            value: duration,
            unit: 'ms',
            endpoint: req.path,
            userId: req.user?.id,
            sessionId:
                (req as any).sessionID ||
                (req.headers['x-session-id'] as string),
            metadata: {
                method: req.method,
                statusCode: res.statusCode,
            },
        }).catch((error) => {
            console.error('Error tracking performance metric:', error);
        });
    });

    next();
}

/**
 * Middleware to track errors
 */
export function trackErrorEvent(
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const consentGiven = hasAnalyticsConsent(req);

    trackEvent({
        userId: req.user?.id,
        sessionId:
            (req as any).sessionID || (req.headers['x-session-id'] as string),
        eventType: AnalyticsEventType.ERROR,
        eventName: error.name || 'UnknownError',
        category: getCategoryFromPath(req.path),
        properties: {
            message: error.message,
            path: req.path,
            method: req.method,
            statusCode: res.statusCode,
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        pathname: req.path,
        consentGiven,
    }).catch((err) => {
        console.error('Error tracking error event:', err);
    });

    next(error);
}

/**
 * Helper function to manually track custom events
 * Use this in route handlers for specific user actions
 */
export function trackCustomEvent(
    req: Request,
    eventName: string,
    properties?: Record<string, unknown>
): void {
    const consentGiven = hasAnalyticsConsent(req);

    trackEvent({
        userId: req.user?.id,
        sessionId:
            (req as any).sessionID || (req.headers['x-session-id'] as string),
        eventType: AnalyticsEventType.FEATURE_USED,
        eventName,
        category: getCategoryFromPath(req.path),
        properties,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        pathname: req.path,
        consentGiven,
    }).catch((error) => {
        console.error('Error tracking custom event:', error);
    });
}
