import { Router, Request, Response } from 'express';

import { db } from '../db';
import {
    performHealthCheck,
    getUptimePercentage,
} from '../services/statusCheck';

const router = Router();

/**
 * @openapi
 * /status:
 *   get:
 *     tags:
 *       - Status
 *     summary: Get system status
 *     description: Returns current system status, uptime, and active incidents (public endpoint)
 *     responses:
 *       200:
 *         description: System status information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [operational, degraded, down]
 *                   description: Overall system status
 *                 health:
 *                   type: object
 *                   description: Health check results
 *                 uptime:
 *                   type: object
 *                   properties:
 *                     last24h:
 *                       type: number
 *                     last7d:
 *                       type: number
 *                     last30d:
 *                       type: number
 *                 incidents:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/', async (_req: Request, res: Response) => {
    try {
        const healthStatus = await performHealthCheck();

        // Get uptime for different periods
        const [uptime24h, uptime7d, uptime30d] = await Promise.all([
            getUptimePercentage(24),
            getUptimePercentage(24 * 7),
            getUptimePercentage(24 * 30),
        ]);

        // Get active incidents
        const activeIncidents = await db.incident.findMany({
            where: {
                status: {
                    not: 'RESOLVED',
                },
            },
            orderBy: {
                startedAt: 'desc',
            },
            select: {
                id: true,
                title: true,
                status: true,
                severity: true,
                startedAt: true,
                affectedServices: true,
            },
        });

        const overallStatus = activeIncidents.some(
            (i) => i.severity === 'CRITICAL'
        )
            ? 'down'
            : activeIncidents.some((i) => i.severity === 'MAJOR')
              ? 'degraded'
              : healthStatus.overall
                ? 'healthy'
                : 'degraded';

        res.json({
            status: overallStatus,
            timestamp: new Date().toISOString(),
            services: {
                database: {
                    status: healthStatus.database.healthy
                        ? 'operational'
                        : 'down',
                    latency: healthStatus.database.latency,
                },
                redis: {
                    status: healthStatus.redis.healthy
                        ? 'operational'
                        : 'down',
                    latency: healthStatus.redis.latency,
                },
                discord: {
                    status: healthStatus.discord.healthy
                        ? 'operational'
                        : 'down',
                    latency: healthStatus.discord.latency,
                },
            },
            uptime: {
                '24h': parseFloat(uptime24h.toFixed(2)),
                '7d': parseFloat(uptime7d.toFixed(2)),
                '30d': parseFloat(uptime30d.toFixed(2)),
            },
            incidents: {
                active: activeIncidents.length,
                critical: activeIncidents.filter((i) => i.severity === 'CRITICAL')
                    .length,
                major: activeIncidents.filter((i) => i.severity === 'MAJOR')
                    .length,
            },
        });
    } catch (error) {
        console.error('Failed to get status:', error);
        res.status(500).json({
            status: 'unknown',
            error: 'Failed to retrieve system status',
            timestamp: new Date().toISOString(),
        });
    }
});

/**
 * GET /api/status/history
 * Get historical status data for uptime charts
 */
router.get('/history', async (req: Request, res: Response) => {
    try {
        const limit = req.query.limit
            ? parseInt(req.query.limit as string, 10)
            : 100;
        const hours = req.query.hours
            ? parseInt(req.query.hours as string, 10)
            : 24;

        // Validate parameters
        if (limit < 1 || limit > 1000) {
            res.status(400).json({ error: 'Limit must be between 1 and 1000' });
            return;
        }

        if (hours < 1 || hours > 720) {
            // Max 30 days
            res.status(400).json({ error: 'Hours must be between 1 and 720' });
            return;
        }

        const since = new Date(Date.now() - hours * 60 * 60 * 1000);

        const history = await db.statusCheck.findMany({
            where: {
                timestamp: {
                    gte: since,
                },
            },
            take: limit,
            orderBy: {
                timestamp: 'desc',
            },
            select: {
                timestamp: true,
                status: true,
                overall: true,
                database: true,
                databaseLatency: true,
                redis: true,
                redisLatency: true,
                discord: true,
                discordLatency: true,
            },
        });

        // Calculate aggregate metrics
        const totalChecks = history.length;
        const healthyChecks = history.filter((h) => h.overall).length;
        const uptimePercentage =
            totalChecks > 0 ? (healthyChecks / totalChecks) * 100 : 100;

        const avgLatencies = {
            database:
                (history
                    .filter((h) => h.databaseLatency)
                    .reduce((sum, h) => sum + (h.databaseLatency || 0), 0) /
                    history.filter((h) => h.databaseLatency).length) || 0,
            redis:
                (history
                    .filter((h) => h.redisLatency)
                    .reduce((sum, h) => sum + (h.redisLatency || 0), 0) /
                    history.filter((h) => h.redisLatency).length) || 0,
            discord:
                (history
                    .filter((h) => h.discordLatency)
                    .reduce((sum, h) => sum + (h.discordLatency || 0), 0) /
                    history.filter((h) => h.discordLatency).length) || 0,
        };

        res.json({
            period: {
                hours,
                since: since.toISOString(),
            },
            uptime: parseFloat(uptimePercentage.toFixed(2)),
            checks: totalChecks,
            avgLatency: {
                database: parseFloat(avgLatencies.database.toFixed(2)),
                redis: parseFloat(avgLatencies.redis.toFixed(2)),
                discord: parseFloat(avgLatencies.discord.toFixed(2)),
            },
            history: history.reverse(), // Return in chronological order
        });
    } catch (error) {
        console.error('Failed to get status history:', error);
        res.status(500).json({
            error: 'Failed to retrieve status history',
        });
    }
});

/**
 * GET /api/status/incidents
 * Get public list of incidents
 */
router.get('/incidents', async (req: Request, res: Response) => {
    try {
        const limit = req.query.limit
            ? parseInt(req.query.limit as string, 10)
            : 10;
        const includeResolved = req.query.resolved === 'true';

        // Validate limit
        if (limit < 1 || limit > 100) {
            res.status(400).json({ error: 'Limit must be between 1 and 100' });
            return;
        }

        const where = includeResolved
            ? {}
            : {
                  status: {
                      not: 'RESOLVED' as const,
                  },
              };

        const incidents = await db.incident.findMany({
            where,
            take: limit,
            orderBy: {
                startedAt: 'desc',
            },
            include: {
                updates: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                    select: {
                        id: true,
                        message: true,
                        status: true,
                        createdAt: true,
                    },
                },
            },
        });

        res.json({
            incidents: incidents.map((incident) => ({
                id: incident.id,
                title: incident.title,
                description: incident.description,
                status: incident.status,
                severity: incident.severity,
                startedAt: incident.startedAt,
                resolvedAt: incident.resolvedAt,
                affectedServices: incident.affectedServices,
                updates: incident.updates,
            })),
            count: incidents.length,
        });
    } catch (error) {
        console.error('Failed to get incidents:', error);
        res.status(500).json({
            error: 'Failed to retrieve incidents',
        });
    }
});

/**
 * GET /api/status/incidents/:id
 * Get details of a specific incident
 */
router.get('/incidents/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const incident = await db.incident.findUnique({
            where: { id },
            include: {
                updates: {
                    orderBy: {
                        createdAt: 'asc',
                    },
                    select: {
                        id: true,
                        message: true,
                        status: true,
                        createdAt: true,
                    },
                },
            },
        });

        if (!incident) {
            res.status(404).json({ error: 'Incident not found' });
            return;
        }

        res.json({
            id: incident.id,
            title: incident.title,
            description: incident.description,
            status: incident.status,
            severity: incident.severity,
            startedAt: incident.startedAt,
            resolvedAt: incident.resolvedAt,
            affectedServices: incident.affectedServices,
            updates: incident.updates,
        });
    } catch (error) {
        console.error('Failed to get incident:', error);
        res.status(500).json({
            error: 'Failed to retrieve incident',
        });
    }
});

export default router;
