import Redis from 'ioredis';

import { env } from './env';

/**
 * Redis client instance for rate limiting and caching
 */
let redisClient: Redis | null = null;

/**
 * Initialize and return Redis client
 * Returns null if Redis is not configured or connection fails
 */
export function getRedisClient(): Redis | null {
    // If Redis URL is not configured, return null (will use in-memory rate limiting)
    if (!env.REDIS_URL || !env.ENABLE_REDIS_RATE_LIMITING) {
        return null;
    }

    // Return existing client if already initialized
    if (redisClient) {
        return redisClient;
    }

    try {
        redisClient = new Redis(env.REDIS_URL, {
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            retryStrategy(times: number) {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            lazyConnect: false,
        });

        redisClient.on('error', (err: Error) => {
            console.error('Redis connection error:', err);
        });

        redisClient.on('connect', () => {
            console.log('✅ Redis connected successfully');
        });

        redisClient.on('ready', () => {
            console.log('✅ Redis ready for operations');
        });

        return redisClient;
    } catch (error) {
        console.error('Failed to initialize Redis client:', error);
        return null;
    }
}

/**
 * Check if Redis is available and connected
 */
export async function isRedisAvailable(): Promise<boolean> {
    const client = getRedisClient();
    if (!client) {
        return false;
    }

    try {
        await client.ping();
        return true;
    } catch {
        return false;
    }
}

/**
 * Gracefully close Redis connection
 */
export async function closeRedisConnection(): Promise<void> {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
        console.log('✅ Redis connection closed');
    }
}
