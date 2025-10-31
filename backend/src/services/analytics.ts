/**
 * Analytics Service - User behavior tracking and metrics collection
 * GDPR-compliant analytics with consent management and data anonymization
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Event types for analytics tracking
 */
export enum AnalyticsEventType {
    PAGE_VIEW = 'PAGE_VIEW',
    BUTTON_CLICK = 'BUTTON_CLICK',
    FEATURE_USED = 'FEATURE_USED',
    API_CALL = 'API_CALL',
    FORM_SUBMIT = 'FORM_SUBMIT',
    ERROR = 'ERROR',
    SEARCH = 'SEARCH',
    EXPORT = 'EXPORT',
}

/**
 * Event categories for grouping
 */
export enum AnalyticsCategory {
    ANALYTICS = 'analytics',
    AUTH = 'auth',
    ADMIN = 'admin',
    PUBLIC_API = 'public_api',
    PRIVACY = 'privacy',
    SETTINGS = 'settings',
}

/**
 * Performance metric types
 */
export enum PerformanceMetricType {
    API_RESPONSE_TIME = 'API_RESPONSE_TIME',
    PAGE_LOAD = 'PAGE_LOAD',
    DB_QUERY = 'DB_QUERY',
    CACHE_HIT = 'CACHE_HIT',
    CACHE_MISS = 'CACHE_MISS',
}

interface TrackEventOptions {
    userId?: string;
    sessionId?: string;
    eventType: AnalyticsEventType;
    eventName: string;
    category?: AnalyticsCategory;
    properties?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
    pathname?: string;
    consentGiven?: boolean;
}

interface TrackFeatureOptions {
    featureName: string;
    userId?: string;
    metadata?: Record<string, unknown>;
    consentGiven?: boolean;
}

interface TrackPerformanceOptions {
    metricType: PerformanceMetricType;
    metricName: string;
    value: number;
    unit: string;
    endpoint?: string;
    userId?: string;
    sessionId?: string;
    metadata?: Record<string, unknown>;
}

/**
 * Anonymize sensitive data for privacy compliance
 */
function anonymizeData(data: string | undefined): string | undefined {
    if (!data) return undefined;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
}

/**
 * Track a user analytics event
 */
export async function trackEvent(options: TrackEventOptions): Promise<void> {
    const {
        userId,
        sessionId,
        eventType,
        eventName,
        category,
        properties,
        ipAddress,
        userAgent,
        referrer,
        pathname,
        consentGiven = false,
    } = options;

    // If consent not given, anonymize sensitive data
    const shouldAnonymize = !consentGiven;

    try {
        await prisma.userAnalyticsEvent.create({
            data: {
                userId: shouldAnonymize ? anonymizeData(userId) : userId,
                sessionId: shouldAnonymize ? anonymizeData(sessionId) : sessionId,
                eventType,
                eventName,
                category,
                properties: properties ? JSON.parse(JSON.stringify(properties)) : {},
                ipAddress: shouldAnonymize ? anonymizeData(ipAddress) : ipAddress,
                userAgent: shouldAnonymize ? anonymizeData(userAgent) : userAgent,
                referrer: shouldAnonymize ? anonymizeData(referrer) : referrer,
                pathname,
                consentGiven,
                anonymized: shouldAnonymize,
            },
        });
    } catch (error) {
        console.error('Error tracking analytics event:', error);
        // Don't throw - analytics should never break the main flow
    }
}

/**
 * Track feature usage
 */
export async function trackFeatureUsage(options: TrackFeatureOptions): Promise<void> {
    const { featureName, userId, metadata, consentGiven = false } = options;

    try {
        await prisma.featureUsageMetric.create({
            data: {
                featureName,
                userId: !consentGiven ? anonymizeData(userId) : userId,
                usageCount: 1,
                metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : {},
                consentGiven,
            },
        });
    } catch (error) {
        console.error('Error tracking feature usage:', error);
    }
}

/**
 * Track performance metric
 */
export async function trackPerformance(options: TrackPerformanceOptions): Promise<void> {
    const { metricType, metricName, value, unit, endpoint, userId, sessionId, metadata } =
        options;

    try {
        await prisma.performanceMetric.create({
            data: {
                metricType,
                metricName,
                value,
                unit,
                endpoint,
                userId,
                sessionId,
                metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : {},
            },
        });
    } catch (error) {
        console.error('Error tracking performance metric:', error);
    }
}

/**
 * Get analytics summary for a date range
 */
export async function getAnalyticsSummary(
    startDate: Date,
    endDate: Date,
    metric?: string
): Promise<
    Array<{
        summaryDate: Date;
        summaryType: string;
        metric: string;
        value: number;
        metadata?: Record<string, unknown>;
    }>
> {
    const where: {
        summaryDate: { gte: Date; lte: Date };
        metric?: string;
    } = {
        summaryDate: {
            gte: startDate,
            lte: endDate,
        },
    };

    if (metric) {
        where.metric = metric;
    }

    const results = await prisma.analyticsSummary.findMany({
        where,
        orderBy: { summaryDate: 'desc' },
    });
    
    return results.map(r => ({
        summaryDate: r.summaryDate,
        summaryType: r.summaryType,
        metric: r.metric,
        value: r.value,
        metadata: r.metadata as Record<string, unknown> | undefined,
    }));
}

/**
 * Get feature usage statistics
 */
export async function getFeatureUsageStats(
    startDate?: Date,
    endDate?: Date
): Promise<
    Array<{
        featureName: string;
        totalUsage: number;
        uniqueUsers: number;
    }>
> {
    const where: { createdAt?: { gte: Date; lte: Date } } = {};

    if (startDate && endDate) {
        where.createdAt = {
            gte: startDate,
            lte: endDate,
        };
    }

    const results = await prisma.featureUsageMetric.groupBy({
        by: ['featureName'],
        where,
        _count: {
            _all: true,
        },
        _sum: {
            usageCount: true,
        },
    });

    return results.map((result) => ({
        featureName: result.featureName,
        totalUsage: result._sum.usageCount || 0,
        uniqueUsers: result._count._all,
    }));
}

/**
 * Get user activity metrics
 */
export async function getUserActivityMetrics(
    startDate: Date,
    endDate: Date
): Promise<{
    totalEvents: number;
    uniqueUsers: number;
    consentedUsers: number;
    topEvents: Array<{ eventName: string; count: number }>;
}> {
    const events = await prisma.userAnalyticsEvent.findMany({
        where: {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        },
        select: {
            userId: true,
            eventName: true,
            consentGiven: true,
        },
    });

    const uniqueUserIds = new Set(events.filter((e) => e.userId).map((e) => e.userId));
    const consentedUserIds = new Set(
        events.filter((e) => e.userId && e.consentGiven).map((e) => e.userId)
    );

    // Count events by name
    const eventCounts = events.reduce(
        (acc, event) => {
            acc[event.eventName] = (acc[event.eventName] || 0) + 1;
            return acc;
        },
        {} as Record<string, number>
    );

    const topEvents = Object.entries(eventCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([eventName, count]) => ({ eventName, count }));

    return {
        totalEvents: events.length,
        uniqueUsers: uniqueUserIds.size,
        consentedUsers: consentedUserIds.size,
        topEvents,
    };
}

/**
 * Get performance metrics summary
 */
export async function getPerformanceMetricsSummary(
    metricType: PerformanceMetricType,
    startDate: Date,
    endDate: Date
): Promise<{
    average: number;
    min: number;
    max: number;
    count: number;
}> {
    const metrics = await prisma.performanceMetric.findMany({
        where: {
            metricType,
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        },
        select: {
            value: true,
        },
    });

    if (metrics.length === 0) {
        return { average: 0, min: 0, max: 0, count: 0 };
    }

    const values = metrics.map((m) => m.value);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
        average: sum / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length,
    };
}

/**
 * Aggregate daily analytics summary (for scheduled jobs)
 */
export async function aggregateDailySummary(date: Date): Promise<void> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Active users
    const activeUsers = await prisma.userAnalyticsEvent.groupBy({
        by: ['userId'],
        where: {
            createdAt: {
                gte: startOfDay,
                lte: endOfDay,
            },
            userId: {
                not: null,
            },
        },
    });

    await prisma.analyticsSummary.upsert({
        where: {
            summaryDate_summaryType_metric: {
                summaryDate: startOfDay,
                summaryType: 'DAILY',
                metric: 'active_users',
            },
        },
        create: {
            summaryDate: startOfDay,
            summaryType: 'DAILY',
            metric: 'active_users',
            value: activeUsers.length,
        },
        update: {
            value: activeUsers.length,
        },
    });

    // Total events
    const totalEvents = await prisma.userAnalyticsEvent.count({
        where: {
            createdAt: {
                gte: startOfDay,
                lte: endOfDay,
            },
        },
    });

    await prisma.analyticsSummary.upsert({
        where: {
            summaryDate_summaryType_metric: {
                summaryDate: startOfDay,
                summaryType: 'DAILY',
                metric: 'total_events',
            },
        },
        create: {
            summaryDate: startOfDay,
            summaryType: 'DAILY',
            metric: 'total_events',
            value: totalEvents,
        },
        update: {
            value: totalEvents,
        },
    });
}

/**
 * Clean old analytics data based on retention policy
 */
export async function cleanOldAnalyticsData(retentionDays: number): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    try {
        await prisma.userAnalyticsEvent.deleteMany({
            where: {
                createdAt: {
                    lt: cutoffDate,
                },
            },
        });

        await prisma.featureUsageMetric.deleteMany({
            where: {
                createdAt: {
                    lt: cutoffDate,
                },
            },
        });

        await prisma.performanceMetric.deleteMany({
            where: {
                createdAt: {
                    lt: cutoffDate,
                },
            },
        });

        console.log(`Cleaned analytics data older than ${retentionDays} days`);
    } catch (error) {
        console.error('Error cleaning old analytics data:', error);
    }
}
