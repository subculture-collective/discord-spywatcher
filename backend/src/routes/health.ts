import { Request, Response, Router } from 'express';

import { db } from '../db';
import { getRedisClient } from '../utils/redis';

const router = Router();

// Liveness probe - simple check that the service is running
router.get('/live', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});

// Readiness probe - check if service is ready to handle requests
router.get('/ready', async (req: Request, res: Response) => {
    const checks = {
        database: false,
        redis: false,
        discord: false,
    };

    try {
        // Check database
        await db.$queryRaw`SELECT 1`;
        checks.database = true;
    } catch (err) {
        console.error('Database health check failed', err);
    }

    try {
        // Check Redis
        const redis = getRedisClient();
        if (redis) {
            await redis.ping();
            checks.redis = true;
        } else {
            // Redis is optional, so we consider it healthy if not configured
            checks.redis = true;
        }
    } catch (err) {
        console.error('Redis health check failed', err);
    }

    try {
        // Check Discord API
        const response = await fetch('https://discord.com/api/v10/gateway');
        checks.discord = response.ok;
    } catch (err) {
        console.error('Discord health check failed', err);
    }

    const allHealthy = Object.values(checks).every(Boolean);

    res.status(allHealthy ? 200 : 503).json({
        status: allHealthy ? 'healthy' : 'unhealthy',
        checks,
        timestamp: new Date().toISOString(),
    });
});

export default router;
