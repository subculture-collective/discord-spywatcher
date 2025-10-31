/**
 * Integration tests for Metrics & Analytics API routes
 */

import request from 'supertest';
import express from 'express';

import metricsAnalyticsRoutes from '../../../src/routes/metricsAnalytics';
import * as analyticsService from '../../../src/services/analytics';

// Mock the analytics service
jest.mock('../../../src/services/analytics');

// Mock authentication middleware
jest.mock('../../../src/middleware/auth', () => ({
    requireAuth: (req: any, res: any, next: any) => {
        req.user = { id: 'test-user-id', role: 'ADMIN' };
        next();
    },
    requirePermission: () => (req: any, res: any, next: any) => {
        next();
    },
}));

describe('Metrics Analytics API Routes', () => {
    let app: express.Application;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/api/metrics', metricsAnalyticsRoutes);
        jest.clearAllMocks();
    });

    describe('GET /api/metrics/summary', () => {
        it('should return analytics summary', async () => {
            const mockSummary = [
                {
                    summaryDate: new Date('2024-01-01'),
                    summaryType: 'DAILY',
                    metric: 'active_users',
                    value: 100,
                },
            ];

            (analyticsService.getAnalyticsSummary as jest.Mock).mockResolvedValue(
                mockSummary
            );

            const response = await request(app).get('/api/metrics/summary');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(mockSummary);
            expect(response.body.dateRange).toBeDefined();
        });

        it('should accept custom date range', async () => {
            (analyticsService.getAnalyticsSummary as jest.Mock).mockResolvedValue([]);

            const startDate = '2024-01-01T00:00:00.000Z';
            const endDate = '2024-01-07T23:59:59.999Z';

            const response = await request(app)
                .get('/api/metrics/summary')
                .query({ startDate, endDate });

            expect(response.status).toBe(200);
            expect(analyticsService.getAnalyticsSummary).toHaveBeenCalledWith(
                new Date(startDate),
                new Date(endDate),
                undefined
            );
        });

        it('should handle errors', async () => {
            (analyticsService.getAnalyticsSummary as jest.Mock).mockRejectedValue(
                new Error('Database error')
            );

            const response = await request(app).get('/api/metrics/summary');

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Failed to fetch analytics summary');
        });
    });

    describe('GET /api/metrics/features', () => {
        it('should return feature usage statistics', async () => {
            const mockStats = [
                {
                    featureName: 'ghost_analysis',
                    totalUsage: 100,
                    uniqueUsers: 50,
                },
                {
                    featureName: 'lurker_detection',
                    totalUsage: 75,
                    uniqueUsers: 40,
                },
            ];

            (analyticsService.getFeatureUsageStats as jest.Mock).mockResolvedValue(
                mockStats
            );

            const response = await request(app).get('/api/metrics/features');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(mockStats);
        });

        it('should accept date range parameters', async () => {
            (analyticsService.getFeatureUsageStats as jest.Mock).mockResolvedValue([]);

            const startDate = '2024-01-01T00:00:00.000Z';
            const endDate = '2024-01-07T23:59:59.999Z';

            const response = await request(app)
                .get('/api/metrics/features')
                .query({ startDate, endDate });

            expect(response.status).toBe(200);
            expect(analyticsService.getFeatureUsageStats).toHaveBeenCalledWith(
                new Date(startDate),
                new Date(endDate)
            );
        });
    });

    describe('GET /api/metrics/activity', () => {
        it('should return user activity metrics', async () => {
            const mockMetrics = {
                totalEvents: 500,
                uniqueUsers: 50,
                consentedUsers: 45,
                topEvents: [
                    { eventName: 'page_view', count: 200 },
                    { eventName: 'button_click', count: 150 },
                ],
            };

            (analyticsService.getUserActivityMetrics as jest.Mock).mockResolvedValue(
                mockMetrics
            );

            const response = await request(app).get('/api/metrics/activity');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(mockMetrics);
        });
    });

    describe('GET /api/metrics/performance', () => {
        it('should return performance metrics', async () => {
            const mockMetrics = {
                average: 150,
                min: 50,
                max: 500,
                count: 100,
            };

            (analyticsService.getPerformanceMetricsSummary as jest.Mock).mockResolvedValue(
                mockMetrics
            );

            const response = await request(app).get('/api/metrics/performance');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(mockMetrics);
        });

        it('should accept metric type parameter', async () => {
            (analyticsService.getPerformanceMetricsSummary as jest.Mock).mockResolvedValue(
                {
                    average: 100,
                    min: 50,
                    max: 200,
                    count: 50,
                }
            );

            const response = await request(app)
                .get('/api/metrics/performance')
                .query({ type: 'DB_QUERY' });

            expect(response.status).toBe(200);
            expect(analyticsService.getPerformanceMetricsSummary).toHaveBeenCalledWith(
                'DB_QUERY',
                expect.any(Date),
                expect.any(Date)
            );
        });
    });

    describe('POST /api/metrics/event', () => {
        it('should track a custom event', async () => {
            (analyticsService.trackEvent as jest.Mock).mockResolvedValue(undefined);

            const eventData = {
                eventType: 'BUTTON_CLICK',
                eventName: 'export_button',
                properties: { format: 'csv' },
            };

            const response = await request(app)
                .post('/api/metrics/event')
                .send(eventData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Event tracked successfully');
            expect(analyticsService.trackEvent).toHaveBeenCalled();
        });

        it('should require eventType and eventName', async () => {
            const response = await request(app)
                .post('/api/metrics/event')
                .send({ properties: {} });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('eventType and eventName are required');
        });

        it('should handle tracking errors', async () => {
            (analyticsService.trackEvent as jest.Mock).mockRejectedValue(
                new Error('Tracking error')
            );

            const response = await request(app)
                .post('/api/metrics/event')
                .send({
                    eventType: 'PAGE_VIEW',
                    eventName: 'dashboard',
                });

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Failed to track event');
        });
    });

    describe('GET /api/metrics/dashboard', () => {
        it('should return comprehensive dashboard data', async () => {
            const mockActivityMetrics = {
                totalEvents: 500,
                uniqueUsers: 50,
                consentedUsers: 45,
                topEvents: [],
            };
            const mockFeatureStats = [
                { featureName: 'test', totalUsage: 10, uniqueUsers: 5 },
            ];
            const mockPerformanceMetrics = {
                average: 150,
                min: 50,
                max: 500,
                count: 100,
            };
            const mockSummary: any[] = [];

            (analyticsService.getUserActivityMetrics as jest.Mock).mockResolvedValue(
                mockActivityMetrics
            );
            (analyticsService.getFeatureUsageStats as jest.Mock).mockResolvedValue(
                mockFeatureStats
            );
            (analyticsService.getPerformanceMetricsSummary as jest.Mock).mockResolvedValue(
                mockPerformanceMetrics
            );
            (analyticsService.getAnalyticsSummary as jest.Mock).mockResolvedValue(
                mockSummary
            );

            const response = await request(app).get('/api/metrics/dashboard');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual({
                activity: mockActivityMetrics,
                features: mockFeatureStats,
                performance: mockPerformanceMetrics,
                summary: mockSummary,
            });
            expect(response.body.generatedAt).toBeDefined();
        });

        it('should handle errors gracefully', async () => {
            (analyticsService.getUserActivityMetrics as jest.Mock).mockRejectedValue(
                new Error('Database error')
            );

            const response = await request(app).get('/api/metrics/dashboard');

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Failed to fetch dashboard data');
        });
    });
});
