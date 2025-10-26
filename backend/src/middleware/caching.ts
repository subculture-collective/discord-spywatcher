import crypto from 'crypto';

import { Request, Response, NextFunction } from 'express';

import { getRedisClient } from '../utils/redis';

const redis = getRedisClient();

/**
 * Generate ETag from response data
 */
function generateETag(data: string): string {
    return `"${crypto.createHash('md5').update(data).digest('hex')}"`;
}

/**
 * Cache control middleware for analytics endpoints
 * Sets appropriate Cache-Control headers for client-side caching
 */
export const analyticsCache = (maxAge: number = 60) => {
    return (_req: Request, res: Response, next: NextFunction): void => {
        // Set cache control headers
        res.setHeader('Cache-Control', `private, max-age=${maxAge}, stale-while-revalidate=${maxAge * 2}`);
        next();
    };
};

/**
 * ETag middleware for conditional requests
 * Implements ETag generation and validation for 304 Not Modified responses
 */
export const etagMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const originalJson = res.json.bind(res);

    // Override res.json to add ETag support
    res.json = function (data: unknown): Response {
        const body = JSON.stringify(data);
        const etag = generateETag(body);

        // Set ETag header
        res.setHeader('ETag', etag);

        // Check if client sent If-None-Match header
        const clientETag = req.headers['if-none-match'];
        if (clientETag === etag) {
            // Content hasn't changed, return 304
            res.status(304).end();
            return res;
        }

        // Content has changed or no etag from client, send full response
        return originalJson(data);
    };

    next();
};

/**
 * Redis-backed caching middleware for analytics data
 * Caches responses in Redis for fast retrieval
 */
export const redisCacheMiddleware = (ttl: number = 60) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        // Skip if Redis is not available
        if (!redis) {
            next();
            return;
        }

        // Generate cache key from request path and query parameters
        const cacheKey = `cache:${req.path}:${JSON.stringify(req.query)}:${req.guildId || ''}`;

        try {
            // Try to get cached response
            const cachedData = await redis.get(cacheKey);
            
            if (cachedData) {
                // Parse and return cached data
                const parsed = JSON.parse(cachedData) as unknown;
                res.setHeader('X-Cache', 'HIT');
                res.setHeader('Cache-Control', `private, max-age=${ttl}`);
                res.json(parsed);
                return;
            }

            // Cache miss - store original json method
            const originalJson = res.json.bind(res);

            // Override res.json to cache the response
            res.json = function (data: unknown): Response {
                // Cache the response data
                redis
                    .set(cacheKey, JSON.stringify(data), 'EX', ttl)
                    .catch((err) => {
                        console.error('Failed to cache response:', err);
                    });

                // Set cache headers
                res.setHeader('X-Cache', 'MISS');
                res.setHeader('Cache-Control', `private, max-age=${ttl}`);

                // Call original json method
                return originalJson(data);
            };

            next();
        } catch (err) {
            console.error('Redis cache error:', err);
            // Continue without caching on error
            next();
        }
    };
};

/**
 * Invalidate cache for a specific path pattern
 */
export async function invalidateCache(pattern: string): Promise<void> {
    if (!redis) {
        return;
    }

    try {
        const keys = await redis.keys(`cache:${pattern}*`);
        if (keys.length > 0) {
            await redis.del(...keys);
            console.log(`Invalidated ${keys.length} cache entries matching pattern: ${pattern}`);
        }
    } catch (err) {
        console.error('Failed to invalidate cache:', err);
    }
}

/**
 * Clear all cache entries
 */
export async function clearAllCache(): Promise<void> {
    if (!redis) {
        return;
    }

    try {
        const keys = await redis.keys('cache:*');
        if (keys.length > 0) {
            await redis.del(...keys);
            console.log(`Cleared ${keys.length} cache entries`);
        }
    } catch (err) {
        console.error('Failed to clear cache:', err);
    }
}
