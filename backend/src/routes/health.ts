import { Request, Response, Router } from 'express';

import { db } from '../db';
import { getRedisClient } from '../utils/redis';

const router = Router();

// Cache Discord API health check result to avoid rate limiting
let discordApiCache: { healthy: boolean; timestamp: number } = {
    healthy: true,
    timestamp: 0,
};
const DISCORD_CACHE_TTL = 30000; // 30 seconds

// Liveness probe - simple check that the service is running
router.get('/live', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});

// Readiness probe - check if service is ready to handle requests
// Note: Health checks are intentionally not rate-limited as they need to be
// accessible by orchestrators (Kubernetes, Docker, etc.) and monitoring systems
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
        // Check Discord API with caching to avoid rate limits
        const now = Date.now();
        if (now - discordApiCache.timestamp > DISCORD_CACHE_TTL) {
            const response = await fetch('https://discord.com/api/v10/gateway');
            discordApiCache = {
                healthy: response.ok,
                timestamp: now,
            };
        }
        checks.discord = discordApiCache.healthy;
    } catch (err) {
        console.error('Discord health check failed', err);
        discordApiCache = {
            healthy: false,
            timestamp: Date.now(),
        };
    }

    const allHealthy = Object.values(checks).every(Boolean);

    res.status(allHealthy ? 200 : 503).json({
        status: allHealthy ? 'healthy' : 'unhealthy',
        checks,
        timestamp: new Date().toISOString(),
    });
});

// Export function to reset cache for testing
export function resetDiscordApiCache(): void {
    discordApiCache = {
        healthy: true,
        timestamp: 0,
    };
}

export default router;
