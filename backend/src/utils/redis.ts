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

/**
 * Scan Redis keys matching a pattern using SCAN command (non-blocking)
 * This is a safer alternative to KEYS command for production use
 * 
 * @param pattern - Redis key pattern (e.g., 'violations:*', 'blocked:*')
 * @param count - Approximate number of keys to return per iteration (default: 100)
 * @returns Array of matching keys
 * 
 * @example
 * // Get all violation keys
 * const violationKeys = await scanKeys('violations:*');
 * 
 * // Get all blocked IP keys
 * const blockedKeys = await scanKeys('blocked:*');
 */
export async function scanKeys(pattern: string, count: number = 100): Promise<string[]> {
    const client = getRedisClient();
    if (!client) {
        return [];
    }

    const keys: string[] = [];
    let cursor = '0';

    try {
        do {
            // SCAN returns [nextCursor, keys]
            const [nextCursor, foundKeys] = await client.scan(
                cursor,
                'MATCH',
                pattern,
                'COUNT',
                count
            );
            cursor = nextCursor;
            keys.push(...foundKeys);
        } while (cursor !== '0');

        return keys;
    } catch (error) {
        console.error(`Error scanning keys with pattern ${pattern}:`, error);
        return [];
    }
}

/**
 * Delete all keys matching a pattern using SCAN (non-blocking)
 * Useful for cleanup operations
 * 
 * @param pattern - Redis key pattern to delete
 * @param batchSize - Number of keys to delete per batch (default: 100)
 * @returns Number of keys deleted
 * 
 * @example
 * // Clean up all expired violations
 * const deleted = await deleteKeysByPattern('violations:*');
 */
export async function deleteKeysByPattern(
    pattern: string,
    batchSize: number = 100
): Promise<number> {
    const client = getRedisClient();
    if (!client) {
        return 0;
    }

    let totalDeleted = 0;
    let cursor = '0';

    try {
        do {
            const [nextCursor, keys] = await client.scan(
                cursor,
                'MATCH',
                pattern,
                'COUNT',
                batchSize
            );
            cursor = nextCursor;

            if (keys.length > 0) {
                const deleted = await client.del(...keys);
                totalDeleted += deleted;
            }
        } while (cursor !== '0');

        return totalDeleted;
    } catch (error) {
        console.error(`Error deleting keys with pattern ${pattern}:`, error);
        return totalDeleted;
    }
}

/**
 * Get all keys and their values matching a pattern using SCAN (non-blocking)
 * 
 * @param pattern - Redis key pattern
 * @param count - Approximate number of keys to scan per iteration (default: 100)
 * @returns Map of keys to their values
 * 
 * @example
 * // Get all violations with their counts
 * const violations = await getKeyValuesByPattern('violations:*');
 */
export async function getKeyValuesByPattern(
    pattern: string,
    count: number = 100
): Promise<Map<string, string>> {
    const client = getRedisClient();
    if (!client) {
        return new Map();
    }

    const result = new Map<string, string>();
    let cursor = '0';

    try {
        do {
            const [nextCursor, keys] = await client.scan(
                cursor,
                'MATCH',
                pattern,
                'COUNT',
                count
            );
            cursor = nextCursor;

            // Get values for all found keys in a pipeline for efficiency
            if (keys.length > 0) {
                const pipeline = client.pipeline();
                keys.forEach((key) => pipeline.get(key));
                const values = await pipeline.exec();

                if (values) {
                    keys.forEach((key, index) => {
                        // Check bounds to satisfy security linter
                        if (index >= 0 && index < values.length) {
                            // eslint-disable-next-line security/detect-object-injection
                            const [err, value] = values[index];
                            if (!err && value !== null) {
                                result.set(key, value as string);
                            }
                        }
                    });
                }
            }
        } while (cursor !== '0');

        return result;
    } catch (error) {
        console.error(`Error getting key-values with pattern ${pattern}:`, error);
        return result;
    }
}

/**
 * Count keys matching a pattern using SCAN (non-blocking)
 * 
 * @param pattern - Redis key pattern
 * @param count - Approximate number of keys to scan per iteration (default: 100)
 * @returns Number of matching keys
 * 
 * @example
 * // Count active violations
 * const violationCount = await countKeysByPattern('violations:*');
 */
export async function countKeysByPattern(
    pattern: string,
    count: number = 100
): Promise<number> {
    const client = getRedisClient();
    if (!client) {
        return 0;
    }

    let totalCount = 0;
    let cursor = '0';

    try {
        do {
            const [nextCursor, keys] = await client.scan(
                cursor,
                'MATCH',
                pattern,
                'COUNT',
                count
            );
            cursor = nextCursor;
            totalCount += keys.length;
        } while (cursor !== '0');

        return totalCount;
    } catch (error) {
        console.error(`Error counting keys with pattern ${pattern}:`, error);
        return 0;
    }
}
