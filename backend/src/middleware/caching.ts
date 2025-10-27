import crypto from 'crypto';

import { Request, Response, NextFunction } from 'express';

import { getRedisClient } from '../utils/redis';

const redis = getRedisClient();

/**
 * Cache-Control headers middleware
 * Sets appropriate cache headers based on content type
 */
export const cacheControlHeaders = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Set cache headers based on route
    if (req.path.startsWith('/api/analytics')) {
        // Analytics can be cached for a short time
        res.setHeader('Cache-Control', 'private, max-age=60'); // 1 minute
    } else if (req.path === '/api/health') {
        // Health checks should not be cached
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else if (req.method === 'GET') {
        // General GET requests can be cached briefly
        res.setHeader('Cache-Control', 'private, max-age=30'); // 30 seconds
    } else {
        // POST/PUT/DELETE should not be cached
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    next();
};

/**
 * ETag generation middleware
 * Generates ETags for response content to enable conditional requests
 */
export const etagMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Only apply ETags to GET requests
    if (req.method !== 'GET') {
        next();
        return;
    }

    // Store the original send function
    const originalSend = res.send;

    // Override the send function to generate ETag
    res.send = function (data): Response {
        // Generate ETag from response data
        if (data && typeof data === 'string' || Buffer.isBuffer(data)) {
            const hash = crypto
                .createHash('md5')
                .update(data)
                .digest('hex');
            const etag = `"${hash}"`;

            // Set ETag header
            res.setHeader('ETag', etag);

            // Check if client has matching ETag
            const clientEtag = req.headers['if-none-match'];
            if (clientEtag === etag) {
                res.status(304);
                return originalSend.call(this, '');
            }
        }

        return originalSend.call(this, data);
    };

    next();
};

/**
 * Redis cache middleware for GET requests
 * Caches responses in Redis for specified duration
 */
export const redisCacheMiddleware = (ttl: number = 60) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        // Only cache GET requests
        if (req.method !== 'GET' || !redis) {
            next();
            return;
        }

        // Generate cache key from URL and query params
        const cacheKey = `cache:${req.originalUrl || req.url}`;

        try {
            // Try to get cached response
            const cachedResponse = await redis.get(cacheKey);
            
            if (cachedResponse) {
                // Return cached response
                res.setHeader('X-Cache', 'HIT');
                res.setHeader('Content-Type', 'application/json');
                res.send(cachedResponse);
                return;
            }

            // Store original send function
            const originalSend = res.send;

            // Override send to cache the response
            res.send = function (data): Response {
                // Cache the response
                if (res.statusCode === 200 && data) {
                    const cacheData = typeof data === 'string' ? data : JSON.stringify(data);
                    const dataSize = Buffer.byteLength(cacheData, 'utf8');
                    redis.setex(cacheKey, ttl, cacheData)
                        .catch(err => {
                            console.error(
                                `Failed to cache response in Redis.`,
                                {
                                    cacheKey,
                                    ttl,
                                    dataSize,
                                    error: err
                                }
                            );
                        });
                }

                res.setHeader('X-Cache', 'MISS');
                return originalSend.call(this, data);
            };

            next();
        } catch (err) {
            console.error('Redis cache error:', err);
            next();
        }
    };
};

/**
 * Stale-while-revalidate middleware
 * Serves stale content while fetching fresh data in background
 */
export const staleWhileRevalidate = (ttl: number = 60, staleTime: number = 300) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (req.method !== 'GET' || !redis) {
            next();
            return;
        }

        const cacheKey = `swr:${req.originalUrl || req.url}`;
        const timestampKey = `${cacheKey}:timestamp`;

        try {
            const [cachedData, timestamp] = await Promise.all([
                redis.get(cacheKey),
                redis.get(timestampKey),
            ]);

            if (cachedData && timestamp) {
                const age = Date.now() - parseInt(timestamp, 10);

                if (age < ttl * 1000) {
                    // Cache is fresh
                    res.setHeader('X-Cache', 'HIT');
                    res.setHeader('Age', Math.floor(age / 1000).toString());
                    res.send(cachedData);
                    return;
                } else if (age < staleTime * 1000) {
                    // Cache is stale but within stale-while-revalidate window
                    res.setHeader('X-Cache', 'STALE');
                    res.setHeader('Age', Math.floor(age / 1000).toString());
                    res.send(cachedData);
                    
                    // Continue to next() to trigger background revalidation
                    // Don't return, let the request continue
                }
            }

            // Store original send function
            const originalSend = res.send;

            // Override send to cache the response
            res.send = function (data): Response {
                if (res.statusCode === 200 && data) {
                    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
                    Promise.all([
                        redis.setex(cacheKey, staleTime, dataStr),
                        redis.setex(timestampKey, staleTime, Date.now().toString()),
                    ]).catch(err => console.error('Failed to cache response:', err));
                }

                if (!res.headersSent) {
                    res.setHeader('X-Cache', 'MISS');
                }
                
                return originalSend.call(this, data);
            };

            next();
        } catch (err) {
            console.error('Stale-while-revalidate error:', err);
            next();
        }
    };
};

/**
 * Clear cache for a specific pattern
 */
export async function clearCache(pattern: string): Promise<void> {
    if (!redis) {
        console.warn('Redis not available, cannot clear cache');
        return;
    }

    try {
        const keys = await redis.keys(`cache:${pattern}*`);
        if (keys.length > 0) {
            await redis.del(...keys);
            console.log(`Cleared ${keys.length} cache entries matching pattern: ${pattern}`);
        }
    } catch (err) {
        console.error('Failed to clear cache:', err);
        throw err;
    }
}
