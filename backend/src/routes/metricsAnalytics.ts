/**
 * Metrics & Analytics API Routes
 * Provides endpoints for viewing analytics data and insights
 */

import { Router, Request, Response } from 'express';

import {
    getAnalyticsSummary,
    getFeatureUsageStats,
    getUserActivityMetrics,
    getPerformanceMetricsSummary,
    PerformanceMetricType,
    trackEvent,
    AnalyticsEventType,
} from '../services/analytics';
import { requireAuth, requirePermission } from '../middleware';

const router = Router();

// All analytics routes require authentication
router.use(requireAuth);

/**
 * @openapi
 * /metrics/summary:
 *   get:
 *     tags:
 *       - Monitoring
 *     summary: Get analytics summary
 *     description: Retrieve analytics summary for a specified date range
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for analytics (default 7 days ago)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for analytics (default now)
 *       - in: query
 *         name: metric
 *         schema:
 *           type: string
 *         description: Specific metric to filter by
 *     responses:
 *       200:
 *         description: Analytics summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 dateRange:
 *                   type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
    '/summary',
    requirePermission('analytics.view'),
    async (req: Request, res: Response) => {
        try {
            const startDate = req.query.startDate
                ? new Date(req.query.startDate as string)
                : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default: last 7 days

            const endDate = req.query.endDate
                ? new Date(req.query.endDate as string)
                : new Date();

            const metric = req.query.metric as string | undefined;

            const summary = await getAnalyticsSummary(
                startDate,
                endDate,
                metric
            );

            res.json({
                success: true,
                data: summary,
                dateRange: {
                    start: startDate,
                    end: endDate,
                },
            });
        } catch (error) {
            console.error('Error fetching analytics summary:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch analytics summary',
            });
        }
    }
);

/**
 * @openapi
 * /metrics/features:
 *   get:
 *     tags:
 *       - Monitoring
 *     summary: Get feature usage statistics
 *     description: Retrieve statistics about feature usage across the platform
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for statistics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for statistics
 *     responses:
 *       200:
 *         description: Feature usage statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
    '/features',
    requirePermission('analytics.view'),
    async (req: Request, res: Response) => {
        try {
            const startDate = req.query.startDate
                ? new Date(req.query.startDate as string)
                : undefined;

            const endDate = req.query.endDate
                ? new Date(req.query.endDate as string)
                : undefined;

            const stats = await getFeatureUsageStats(startDate, endDate);

            res.json({
                success: true,
                data: stats,
            });
        } catch (error) {
            console.error('Error fetching feature usage stats:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch feature usage statistics',
            });
        }
    }
);

/**
 * GET /api/metrics/activity
 * Get user activity metrics
 */
router.get(
    '/activity',
    requirePermission('analytics.view'),
    async (req: Request, res: Response) => {
        try {
            const startDate = req.query.startDate
                ? new Date(req.query.startDate as string)
                : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

            const endDate = req.query.endDate
                ? new Date(req.query.endDate as string)
                : new Date();

            const metrics = await getUserActivityMetrics(startDate, endDate);

            res.json({
                success: true,
                data: metrics,
                dateRange: {
                    start: startDate,
                    end: endDate,
                },
            });
        } catch (error) {
            console.error('Error fetching user activity metrics:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch user activity metrics',
            });
        }
    }
);

/**
 * GET /api/metrics/performance
 * Get performance metrics summary
 */
router.get(
    '/performance',
    requirePermission('analytics.view'),
    async (req: Request, res: Response) => {
        try {
            const metricType =
                (req.query.type as string) ||
                PerformanceMetricType.API_RESPONSE_TIME;

            const startDate = req.query.startDate
                ? new Date(req.query.startDate as string)
                : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default: last 24 hours

            const endDate = req.query.endDate
                ? new Date(req.query.endDate as string)
                : new Date();

            const summary = await getPerformanceMetricsSummary(
                metricType as PerformanceMetricType,
                startDate,
                endDate
            );

            res.json({
                success: true,
                data: summary,
                metricType,
                dateRange: {
                    start: startDate,
                    end: endDate,
                },
            });
        } catch (error) {
            console.error('Error fetching performance metrics:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch performance metrics',
            });
        }
    }
);

/**
 * POST /api/metrics/event
 * Track a custom analytics event (from frontend)
 */
router.post('/event', async (req: Request, res: Response) => {
    try {
        const { eventType, eventName, properties } = req.body;

        if (!eventType || !eventName) {
            return res.status(400).json({
                success: false,
                error: 'eventType and eventName are required',
            });
        }

        const consentGiven = req.cookies?.analyticsConsent === 'true';

        await trackEvent({
            userId: req.user?.id,
            sessionId:
                (req as any).sessionID ||
                (req.headers['x-session-id'] as string),
            eventType: eventType as AnalyticsEventType,
            eventName,
            properties,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            pathname: req.body.pathname,
            referrer: req.body.referrer,
            consentGiven,
        });

        res.json({
            success: true,
            message: 'Event tracked successfully',
        });
    } catch (error) {
        console.error('Error tracking event:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to track event',
        });
    }
});

/**
 * GET /api/metrics/dashboard
 * Get comprehensive dashboard data
 */
router.get(
    '/dashboard',
    requirePermission('analytics.view'),
    async (req: Request, res: Response) => {
        try {
            const now = new Date();
            const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            // Fetch all dashboard data in parallel
            const [
                activityMetrics,
                featureStats,
                performanceMetrics,
                weeklySummary,
            ] = await Promise.all([
                getUserActivityMetrics(last7Days, now),
                getFeatureUsageStats(last7Days, now),
                getPerformanceMetricsSummary(
                    PerformanceMetricType.API_RESPONSE_TIME,
                    last24Hours,
                    now
                ),
                getAnalyticsSummary(last7Days, now),
            ]);

            res.json({
                success: true,
                data: {
                    activity: activityMetrics,
                    features: featureStats,
                    performance: performanceMetrics,
                    summary: weeklySummary,
                },
                generatedAt: now,
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch dashboard data',
            });
        }
    }
);

export default router;
