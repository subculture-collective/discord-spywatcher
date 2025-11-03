import { Router, Request, Response } from 'express';

import { requireAuth, requireRole } from '../middleware/auth';
import {
    getSlowQueryLogs,
    getSlowQueryStats,
    clearSlowQueryLogs,
} from '../middleware/slowQueryLogger';
import { cache } from '../services/cache';
import {
    getSystemHealth,
    getConnectionPoolStats,
    getConnectionPoolAlerts,
} from '../utils/connectionPoolMonitor';
import {
    checkDatabaseHealth,
    getTableStats,
    getIndexUsageStats,
    getUnusedIndexes,
    getSlowQueries,
    generateMaintenanceReport,
    analyzeAllTables,
} from '../utils/databaseMaintenance';
import { getRedisClient } from '../utils/redis';

const router = Router();
const redis = getRedisClient();

// All routes require authentication and admin role
router.use(requireAuth);
router.use(requireRole(['ADMIN']));

/**
 * GET /api/admin/monitoring/rate-limits
 * Get rate limit statistics and violations
 */
router.get('/rate-limits', async (_req: Request, res: Response) => {
    if (!redis) {
        res.status(503).json({
            error: 'Redis not available',
            message: 'Rate limit monitoring requires Redis',
        });
        return;
    }

    try {
        // Get all violation keys using SCAN for better performance
        const violationKeys: string[] = [];
        let cursor = '0';
        do {
            const [nextCursor, keys] = await redis.scan(
                cursor,
                'MATCH',
                'violations:*',
                'COUNT',
                100
            );
            violationKeys.push(...keys);
            cursor = nextCursor;
        } while (cursor !== '0');

        const violations: Array<{
            ip: string;
            count: number;
            ttl: number;
        }> = [];

        for (const key of violationKeys) {
            const ip = key.replace('violations:', '');
            const count = await redis.get(key);
            const ttl = await redis.ttl(key);

            if (count) {
                violations.push({
                    ip,
                    count: parseInt(count, 10),
                    ttl,
                });
            }
        }

        // Get all blocked keys using SCAN for better performance
        const blockedKeys: string[] = [];
        let blockedCursor = '0';
        do {
            const [nextCursor, keys] = await redis.scan(
                blockedCursor,
                'MATCH',
                'blocked:*',
                'COUNT',
                100
            );
            blockedKeys.push(...keys);
            blockedCursor = nextCursor;
        } while (blockedCursor !== '0');

        const tempBlocked: Array<{
            ip: string;
            ttl: number;
        }> = [];

        for (const key of blockedKeys) {
            const ip = key.replace('blocked:', '');
            const ttl = await redis.ttl(key);

            tempBlocked.push({
                ip,
                ttl,
            });
        }

        // Get rate limiter statistics using SCAN for better performance
        const rateLimitKeys: string[] = [];
        let rateLimitCursor = '0';
        do {
            const [nextCursor, keys] = await redis.scan(
                rateLimitCursor,
                'MATCH',
                'rl:*',
                'COUNT',
                100
            );
            rateLimitKeys.push(...keys);
            rateLimitCursor = nextCursor;
        } while (rateLimitCursor !== '0');

        const rateLimitStats: Record<string, number> = {};

        for (const key of rateLimitKeys) {
            const prefix = key.split(':')[1]; // Extract prefix like "global", "auth", etc.
            if (!rateLimitStats[prefix]) {
                rateLimitStats[prefix] = 0;
            }
            rateLimitStats[prefix]++;
        }

        res.json({
            violations: violations.sort((a, b) => b.count - a.count),
            tempBlocked: tempBlocked.sort((a, b) => b.ttl - a.ttl),
            rateLimitStats,
            summary: {
                totalViolations: violations.reduce(
                    (sum, v) => sum + v.count,
                    0
                ),
                uniqueIPsWithViolations: violations.length,
                tempBlockedCount: tempBlocked.length,
                activeRateLimiters: Object.keys(rateLimitStats).length,
            },
        });
    } catch (error) {
        console.error('Failed to get rate limit statistics:', error);
        res.status(500).json({
            error: 'Failed to retrieve rate limit statistics',
        });
    }
});

/**
 * GET /api/admin/monitoring/rate-limits/:ip
 * Get detailed rate limit information for a specific IP
 */
router.get('/rate-limits/:ip', async (req: Request, res: Response) => {
    if (!redis) {
        res.status(503).json({
            error: 'Redis not available',
            message: 'Rate limit monitoring requires Redis',
        });
        return;
    }

    try {
        const { ip } = req.params;

        if (!ip || !/^[\d.:a-fA-F]+$/.test(ip)) {
            res.status(400).json({ error: 'Invalid IP address format' });
            return;
        }

        // Get violation count
        const violations = await redis.get(`violations:${ip}`);
        const violationTTL = await redis.ttl(`violations:${ip}`);

        // Check if temporarily blocked
        const isBlocked = await redis.get(`blocked:${ip}`);
        const blockTTL = isBlocked ? await redis.ttl(`blocked:${ip}`) : null;

        // Get rate limit keys for this IP using SCAN for better performance
        const rateLimitKeys: string[] = [];
        let cursor = '0';
        do {
            const [nextCursor, keys] = await redis.scan(
                cursor,
                'MATCH',
                `rl:*:${ip}*`,
                'COUNT',
                100
            );
            rateLimitKeys.push(...keys);
            cursor = nextCursor;
        } while (cursor !== '0');
        const rateLimitInfo: Record<string, { value: string; ttl: number }> =
            {};

        for (const key of rateLimitKeys) {
            const value = await redis.get(key);
            const ttl = await redis.ttl(key);
            if (value !== null) {
                rateLimitInfo[key] = { value, ttl };
            }
        }

        res.json({
            ip,
            violations: violations ? parseInt(violations, 10) : 0,
            violationTTL: violationTTL > 0 ? violationTTL : null,
            isTemporarilyBlocked: !!isBlocked,
            blockTTL: blockTTL && blockTTL > 0 ? blockTTL : null,
            rateLimitInfo,
        });
    } catch (error) {
        console.error('Failed to get IP rate limit information:', error);
        res.status(500).json({
            error: 'Failed to retrieve IP rate limit information',
        });
    }
});

/**
 * DELETE /api/admin/monitoring/rate-limits/:ip
 * Clear rate limit violations for a specific IP
 */
router.delete('/rate-limits/:ip', async (req: Request, res: Response) => {
    if (!redis) {
        res.status(503).json({
            error: 'Redis not available',
            message: 'Rate limit monitoring requires Redis',
        });
        return;
    }

    try {
        const { ip } = req.params;

        if (!ip || !/^[\d.:a-fA-F]+$/.test(ip)) {
            res.status(400).json({ error: 'Invalid IP address format' });
            return;
        }

        // Clear violations
        await redis.del(`violations:${ip}`);

        // Clear all rate limit keys for this IP using SCAN for better performance
        const rateLimitKeys: string[] = [];
        let cursor = '0';
        do {
            const [nextCursor, keys] = await redis.scan(
                cursor,
                'MATCH',
                `rl:*:${ip}*`,
                'COUNT',
                100
            );
            rateLimitKeys.push(...keys);
            cursor = nextCursor;
        } while (cursor !== '0');

        if (rateLimitKeys.length > 0) {
            await redis.del(...rateLimitKeys);
        }

        console.log(`Rate limit data cleared for IP: ${ip}`);

        res.json({
            message: 'Rate limit data cleared successfully',
            ip,
            clearedKeys: rateLimitKeys.length + 1,
        });
    } catch (error) {
        console.error('Failed to clear rate limit data:', error);
        res.status(500).json({
            error: 'Failed to clear rate limit data',
        });
    }
});

/**
 * GET /api/admin/monitoring/system
 * Get system health and performance metrics
 */
router.get('/system', async (_req: Request, res: Response) => {
    const os = await import('os');

    const cpuUsage = os.loadavg()[0] / os.cpus().length;
    const memUsage = 1 - os.freemem() / os.totalmem();
    const uptime = process.uptime();

    const status = cpuUsage > 0.8 || memUsage > 0.9 ? 'degraded' : 'healthy';

    res.json({
        status,
        timestamp: new Date().toISOString(),
        uptime: `${Math.floor(uptime)}s`,
        system: {
            cpu: {
                usage: `${(cpuUsage * 100).toFixed(1)}%`,
                cores: os.cpus().length,
                load: os.loadavg(),
            },
            memory: {
                usage: `${(memUsage * 100).toFixed(1)}%`,
                free: `${(os.freemem() / 1024 / 1024).toFixed(0)}MB`,
                total: `${(os.totalmem() / 1024 / 1024).toFixed(0)}MB`,
            },
            process: {
                memory: process.memoryUsage(),
                pid: process.pid,
            },
        },
        redis: {
            available: !!redis,
        },
    });
});

/**
 * GET /api/admin/monitoring/database/health
 * Get database health status
 */
router.get('/database/health', async (_req: Request, res: Response) => {
    try {
        const health = await checkDatabaseHealth();
        res.json(health);
    } catch (error) {
        console.error('Failed to check database health:', error);
        res.status(500).json({
            error: 'Failed to check database health',
            connected: false,
        });
    }
});

/**
 * GET /api/admin/monitoring/connections/health
 * Get comprehensive system health including connection pools
 */
router.get('/connections/health', async (_req: Request, res: Response) => {
    try {
        const health = await getSystemHealth();
        res.json(health);
    } catch (error) {
        console.error('Failed to get system health:', error);
        res.status(500).json({
            error: 'Failed to retrieve system health',
        });
    }
});

/**
 * GET /api/admin/monitoring/connections/pool
 * Get connection pool statistics
 */
router.get('/connections/pool', async (_req: Request, res: Response) => {
    try {
        const stats = await getConnectionPoolStats();
        res.json(stats);
    } catch (error) {
        console.error('Failed to get connection pool stats:', error);
        res.status(500).json({
            error: 'Failed to retrieve connection pool statistics',
        });
    }
});

/**
 * GET /api/admin/monitoring/connections/alerts
 * Get connection pool alerts and warnings
 */
router.get('/connections/alerts', async (_req: Request, res: Response) => {
    try {
        const alerts = await getConnectionPoolAlerts();
        res.json({
            alerts,
            count: alerts.length,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Failed to get connection pool alerts:', error);
        res.status(500).json({
            error: 'Failed to retrieve connection pool alerts',
        });
    }
});

/**
 * GET /api/admin/monitoring/database/tables
 * Get table statistics (sizes, row counts, etc.)
 */
router.get('/database/tables', async (_req: Request, res: Response) => {
    try {
        const stats = await getTableStats();
        res.json(stats);
    } catch (error) {
        console.error('Failed to get table statistics:', error);
        res.status(500).json({
            error: 'Failed to retrieve table statistics',
        });
    }
});

/**
 * GET /api/admin/monitoring/database/indexes
 * Get index usage statistics
 */
router.get('/database/indexes', async (_req: Request, res: Response) => {
    try {
        const [indexStats, unusedIndexes] = await Promise.all([
            getIndexUsageStats(),
            getUnusedIndexes(),
        ]);

        res.json({
            indexStats,
            unusedIndexes,
            summary: {
                totalIndexes: indexStats.length,
                unusedCount: unusedIndexes.length,
            },
        });
    } catch (error) {
        console.error('Failed to get index statistics:', error);
        res.status(500).json({
            error: 'Failed to retrieve index statistics',
        });
    }
});

/**
 * GET /api/admin/monitoring/database/slow-queries
 * Get slow query logs from application monitoring
 * Supports pagination via ?limit=20&offset=0
 */
router.get('/database/slow-queries', async (req: Request, res: Response) => {
    try {
        const limit = req.query.limit
            ? parseInt(req.query.limit as string, 10)
            : undefined;
        const offset = req.query.offset
            ? parseInt(req.query.offset as string, 10)
            : 0;

        const { logs, total } = getSlowQueryLogs(limit, offset);
        const stats = getSlowQueryStats();

        res.json({
            data: logs,
            pagination: {
                total,
                limit: limit || total,
                offset,
            },
            stats,
        });
    } catch (error) {
        console.error('Failed to get slow query logs:', error);
        res.status(500).json({
            error: 'Failed to retrieve slow query logs',
        });
    }
});

/**
 * DELETE /api/admin/monitoring/database/slow-queries
 * Clear slow query logs
 */
router.delete(
    '/database/slow-queries',
    async (_req: Request, res: Response) => {
        try {
            clearSlowQueryLogs();
            res.json({
                message: 'Slow query logs cleared successfully',
            });
        } catch (error) {
            console.error('Failed to clear slow query logs:', error);
            res.status(500).json({
                error: 'Failed to clear slow query logs',
            });
        }
    }
);

/**
 * GET /api/admin/monitoring/database/pg-slow-queries
 * Get slow queries from PostgreSQL statistics (requires pg_stat_statements)
 */
router.get('/database/pg-slow-queries', async (req: Request, res: Response) => {
    try {
        const minCalls = parseInt(req.query.minCalls as string) || 10;
        const queries = await getSlowQueries(minCalls);

        res.json({
            queries,
            note:
                queries.length === 0
                    ? 'pg_stat_statements extension may not be enabled'
                    : undefined,
        });
    } catch (error) {
        console.error('Failed to get PostgreSQL slow queries:', error);
        res.status(500).json({
            error: 'Failed to retrieve PostgreSQL slow queries',
        });
    }
});

/**
 * POST /api/admin/monitoring/database/analyze
 * Run ANALYZE on all tables to update statistics
 */
router.post('/database/analyze', async (_req: Request, res: Response) => {
    try {
        await analyzeAllTables();
        res.json({
            message: 'Database tables analyzed successfully',
        });
    } catch (error) {
        console.error('Failed to analyze tables:', error);
        res.status(500).json({
            error: 'Failed to analyze database tables',
        });
    }
});

/**
 * GET /api/admin/monitoring/database/report
 * Generate comprehensive database maintenance report
 */
router.get('/database/report', async (_req: Request, res: Response) => {
    try {
        const report = await generateMaintenanceReport();
        res.json(report);
    } catch (error) {
        console.error('Failed to generate maintenance report:', error);
        res.status(500).json({
            error: 'Failed to generate maintenance report',
        });
    }
});

/**
 * GET /api/admin/monitoring/cache/stats
 * Get cache statistics and performance metrics
 */
router.get('/cache/stats', async (_req: Request, res: Response) => {
    if (!redis) {
        res.status(503).json({
            error: 'Redis not available',
            message: 'Cache monitoring requires Redis',
        });
        return;
    }

    try {
        const stats = await cache.getStats();

        if (!stats) {
            res.status(500).json({
                error: 'Failed to retrieve cache statistics',
            });
            return;
        }

        res.json({
            stats,
            status: 'healthy',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Failed to get cache stats:', error);
        res.status(500).json({
            error: 'Failed to retrieve cache statistics',
        });
    }
});

/**
 * DELETE /api/admin/monitoring/cache/clear
 * Clear all cache entries (admin only)
 */
router.delete('/cache/clear', async (_req: Request, res: Response) => {
    if (!redis) {
        res.status(503).json({
            error: 'Redis not available',
            message: 'Cache clearing requires Redis',
        });
        return;
    }

    try {
        await cache.flushAll();
        console.log('Cache cleared by admin');

        res.json({
            message: 'Cache cleared successfully',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Failed to clear cache:', error);
        res.status(500).json({
            error: 'Failed to clear cache',
        });
    }
});

/**
 * DELETE /api/admin/monitoring/cache/invalidate/:tag
 * Invalidate cache entries by tag
 */
router.delete('/cache/invalidate/:tag', async (req: Request, res: Response) => {
    if (!redis) {
        res.status(503).json({
            error: 'Redis not available',
            message: 'Cache invalidation requires Redis',
        });
        return;
    }

    try {
        const { tag } = req.params;

        // Validate tag format - disallow Redis pattern special characters
        // to prevent unintended key matching
        if (
            !tag ||
            !/^[a-zA-Z0-9:_-]+$/.test(tag) ||
            /^[*?[\]{}()|\\]/.test(tag) ||
            /[*?[\]{}()|\\]/.test(tag)
        ) {
            res.status(400).json({
                error: 'Invalid tag format',
                message:
                    'Tag must contain only alphanumeric characters, colons, underscores, and hyphens, and must not contain Redis pattern special characters (*, ?, [, ], {, }, (, ), |, \\)',
            });
            return;
        }

        const invalidatedCount = await cache.invalidateByTag(tag);

        res.json({
            message: 'Cache invalidated successfully',
            tag,
            invalidatedCount,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Failed to invalidate cache:', error);
        res.status(500).json({
            error: 'Failed to invalidate cache',
        });
    }
});

export default router;
