/**
 * Unit tests for Analytics Service
 */

import { PrismaClient } from '@prisma/client';

import {
    trackEvent,
    trackFeatureUsage,
    trackPerformance,
    getFeatureUsageStats,
    getUserActivityMetrics,
    AnalyticsEventType,
    AnalyticsCategory,
    PerformanceMetricType,
} from '../../../src/services/analytics';

// Mock Prisma client
jest.mock('@prisma/client', () => {
    const mockPrismaClient = {
        userAnalyticsEvent: {
            create: jest.fn(),
            findMany: jest.fn(),
            deleteMany: jest.fn(),
        },
        featureUsageMetric: {
            create: jest.fn(),
            groupBy: jest.fn(),
            deleteMany: jest.fn(),
        },
        performanceMetric: {
            create: jest.fn(),
            findMany: jest.fn(),
            deleteMany: jest.fn(),
        },
        analyticsSummary: {
            findMany: jest.fn(),
            upsert: jest.fn(),
        },
    };

    return {
        PrismaClient: jest.fn(() => mockPrismaClient),
    };
});

describe('Analytics Service', () => {
    let prisma: any;

    beforeEach(() => {
        // Get the mocked Prisma instance
        prisma = new PrismaClient();
        jest.clearAllMocks();
    });

    describe('trackEvent', () => {
        it('should track an analytics event with consent', async () => {
            prisma.userAnalyticsEvent.create.mockResolvedValue({
                id: 'test-id',
                eventType: AnalyticsEventType.API_CALL,
                eventName: 'test-event',
            });

            await trackEvent({
                userId: 'user-123',
                eventType: AnalyticsEventType.API_CALL,
                eventName: 'test-event',
                category: AnalyticsCategory.ANALYTICS,
                consentGiven: true,
            });

            expect(prisma.userAnalyticsEvent.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId: 'user-123',
                    eventType: AnalyticsEventType.API_CALL,
                    eventName: 'test-event',
                    category: AnalyticsCategory.ANALYTICS,
                    consentGiven: true,
                    anonymized: false,
                }),
            });
        });

        it('should anonymize data when consent not given', async () => {
            prisma.userAnalyticsEvent.create.mockResolvedValue({
                id: 'test-id',
            });

            await trackEvent({
                userId: 'user-123',
                eventType: AnalyticsEventType.PAGE_VIEW,
                eventName: 'dashboard-view',
                ipAddress: '192.168.1.1',
                consentGiven: false,
            });

            expect(prisma.userAnalyticsEvent.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    anonymized: true,
                    consentGiven: false,
                }),
            });

            const call = prisma.userAnalyticsEvent.create.mock.calls[0][0];
            // userId and ipAddress should be hashed (16 char hex string)
            expect(call.data.userId).toMatch(/^[a-f0-9]{16}$/);
            expect(call.data.ipAddress).toMatch(/^[a-f0-9]{16}$/);
        });

        it('should handle errors gracefully', async () => {
            prisma.userAnalyticsEvent.create.mockRejectedValue(
                new Error('Database error')
            );

            // Should not throw
            await expect(
                trackEvent({
                    userId: 'user-123',
                    eventType: AnalyticsEventType.ERROR,
                    eventName: 'test-error',
                })
            ).resolves.not.toThrow();
        });
    });

    describe('trackFeatureUsage', () => {
        it('should track feature usage with consent', async () => {
            prisma.featureUsageMetric.create.mockResolvedValue({
                id: 'test-id',
                featureName: 'ghost_analysis',
            });

            await trackFeatureUsage({
                featureName: 'ghost_analysis',
                userId: 'user-123',
                consentGiven: true,
            });

            expect(prisma.featureUsageMetric.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    featureName: 'ghost_analysis',
                    userId: 'user-123',
                    usageCount: 1,
                    consentGiven: true,
                }),
            });
        });

        it('should anonymize user ID without consent', async () => {
            prisma.featureUsageMetric.create.mockResolvedValue({
                id: 'test-id',
            });

            await trackFeatureUsage({
                featureName: 'lurker_detection',
                userId: 'user-456',
                consentGiven: false,
            });

            const call = prisma.featureUsageMetric.create.mock.calls[0][0];
            expect(call.data.userId).toMatch(/^[a-f0-9]{16}$/);
            expect(call.data.consentGiven).toBe(false);
        });
    });

    describe('trackPerformance', () => {
        it('should track performance metrics', async () => {
            prisma.performanceMetric.create.mockResolvedValue({
                id: 'test-id',
            });

            await trackPerformance({
                metricType: PerformanceMetricType.API_RESPONSE_TIME,
                metricName: '/api/analytics',
                value: 150,
                unit: 'ms',
                endpoint: '/api/analytics',
            });

            expect(prisma.performanceMetric.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    metricType: PerformanceMetricType.API_RESPONSE_TIME,
                    metricName: '/api/analytics',
                    value: 150,
                    unit: 'ms',
                    endpoint: '/api/analytics',
                }),
            });
        });
    });

    describe('getFeatureUsageStats', () => {
        it('should return feature usage statistics', async () => {
            prisma.featureUsageMetric.groupBy.mockResolvedValue([
                {
                    featureName: 'ghost_analysis',
                    _count: { _all: 5 },
                    _sum: { usageCount: 10 },
                },
                {
                    featureName: 'lurker_detection',
                    _count: { _all: 3 },
                    _sum: { usageCount: 8 },
                },
            ]);

            const stats = await getFeatureUsageStats();

            expect(stats).toEqual([
                {
                    featureName: 'ghost_analysis',
                    totalUsage: 10,
                    uniqueUsers: 5,
                },
                {
                    featureName: 'lurker_detection',
                    totalUsage: 8,
                    uniqueUsers: 3,
                },
            ]);
        });
    });

    describe('getUserActivityMetrics', () => {
        it('should return user activity metrics', async () => {
            const mockEvents = [
                {
                    userId: 'user-1',
                    eventName: 'page_view',
                    consentGiven: true,
                },
                {
                    userId: 'user-2',
                    eventName: 'button_click',
                    consentGiven: true,
                },
                {
                    userId: 'user-1',
                    eventName: 'page_view',
                    consentGiven: true,
                },
                {
                    userId: null,
                    eventName: 'anonymous_event',
                    consentGiven: false,
                },
            ];

            prisma.userAnalyticsEvent.findMany.mockResolvedValue(mockEvents);

            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-07');
            const metrics = await getUserActivityMetrics(startDate, endDate);

            expect(metrics.totalEvents).toBe(4);
            expect(metrics.uniqueUsers).toBe(2);
            expect(metrics.consentedUsers).toBe(2);
            expect(metrics.topEvents).toEqual([
                { eventName: 'page_view', count: 2 },
                { eventName: 'button_click', count: 1 },
                { eventName: 'anonymous_event', count: 1 },
            ]);
        });
    });
});
