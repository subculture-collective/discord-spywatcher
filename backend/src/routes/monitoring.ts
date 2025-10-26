import { Router, Request, Response } from 'express';

import { requireAuth, requireRole } from '../middleware/auth';
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
        // Get all violation keys
        const violationKeys = await redis.keys('violations:*');
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

        // Get all blocked keys
        const blockedKeys = await redis.keys('blocked:*');
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

        // Get rate limiter statistics
        const rateLimitKeys = await redis.keys('rl:*');
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
                totalViolations: violations.reduce((sum, v) => sum + v.count, 0),
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

        // Get rate limit keys for this IP
        const rateLimitKeys = await redis.keys(`rl:*:${ip}*`);
        const rateLimitInfo: Record<string, { value: string; ttl: number }> = {};

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

        // Clear all rate limit keys for this IP
        const rateLimitKeys = await redis.keys(`rl:*:${ip}*`);
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

export default router;
