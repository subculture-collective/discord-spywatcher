import { getRedisClient } from '../utils/redis';

/**
 * Cache configuration options
 */
export interface CacheOptions {
    /**
     * Time-to-live in seconds
     */
    ttl?: number;
    /**
     * Tags for cache invalidation
     */
    tags?: string[];
}

/**
 * Cache statistics
 */
export interface CacheStats {
    hits: number;
    misses: number;
    hitRate: number;
    memoryUsed: string;
    evictedKeys: number;
    keyCount: number;
}

/**
 * CacheService - Provides caching functionality with tag-based invalidation
 * 
 * Features:
 * - Cache-aside pattern (lazy loading)
 * - Tag-based invalidation
 * - TTL-based expiration
 * - Remember pattern for convenient cache-or-fetch
 * - Cache statistics and monitoring
 */
export class CacheService {
    private readonly prefix: string = 'spywatcher:';
    private readonly tagPrefix: string = 'tag:';

    /**
     * Get a value from cache
     * @param key - Cache key
     * @returns Cached value or null if not found
     */
    async get<T>(key: string): Promise<T | null> {
        const redis = getRedisClient();
        if (!redis) {
            return null;
        }

        try {
            const data = await redis.get(this.prefix + key);
            return data ? (JSON.parse(data) as T) : null;
        } catch (error) {
            console.error(`Cache get error for key ${key}:`, error);
            return null;
        }
    }

    /**
     * Set a value in cache with optional TTL and tags
     * @param key - Cache key
     * @param value - Value to cache
     * @param options - Cache options (TTL, tags)
     */
    async set(key: string, value: unknown, options: CacheOptions = {}): Promise<void> {
        const redis = getRedisClient();
        if (!redis) {
            return;
        }

        const { ttl = 300, tags = [] } = options; // Default 5 minutes
        const fullKey = this.prefix + key;

        try {
            // Store the value with TTL
            await redis.setex(fullKey, ttl, JSON.stringify(value));

            // Store tags for invalidation
            if (tags.length > 0) {
                const pipeline = redis.pipeline();
                for (const tag of tags) {
                    const tagKey = `${this.prefix}${this.tagPrefix}${tag}`;
                    pipeline.sadd(tagKey, fullKey);
                    // Set expiry on tag slightly longer than cache entry
                    pipeline.expire(tagKey, ttl + 60);
                }
                await pipeline.exec();
            }
        } catch (error) {
            console.error(`Cache set error for key ${key}:`, error);
        }
    }

    /**
     * Delete a value from cache
     * @param key - Cache key
     */
    async delete(key: string): Promise<void> {
        const redis = getRedisClient();
        if (!redis) {
            return;
        }

        try {
            await redis.del(this.prefix + key);
        } catch (error) {
            console.error(`Cache delete error for key ${key}:`, error);
        }
    }

    /**
     * Delete multiple keys from cache
     * @param keys - Array of cache keys
     */
    async deleteMany(keys: string[]): Promise<void> {
        const redis = getRedisClient();
        if (!redis || keys.length === 0) {
            return;
        }

        try {
            const fullKeys = keys.map(key => this.prefix + key);
            await redis.del(...fullKeys);
        } catch (error) {
            console.error('Cache deleteMany error:', error);
        }
    }

    /**
     * Invalidate all cache entries associated with a tag
     * @param tag - Tag to invalidate
     */
    async invalidateByTag(tag: string): Promise<number> {
        const redis = getRedisClient();
        if (!redis) {
            return 0;
        }

        try {
            const tagKey = `${this.prefix}${this.tagPrefix}${tag}`;
            const keys = await redis.smembers(tagKey);
            
            if (keys.length > 0) {
                // Delete all keys associated with this tag
                await redis.del(...keys);
                // Delete the tag set itself
                await redis.del(tagKey);
                console.log(`Invalidated ${keys.length} cache entries for tag: ${tag}`);
                return keys.length;
            }
            return 0;
        } catch (error) {
            console.error(`Cache invalidateByTag error for tag ${tag}:`, error);
            return 0;
        }
    }

    /**
     * Invalidate cache entries for multiple tags
     * @param tags - Array of tags to invalidate
     */
    async invalidateByTags(tags: string[]): Promise<number> {
        let totalInvalidated = 0;
        for (const tag of tags) {
            totalInvalidated += await this.invalidateByTag(tag);
        }
        return totalInvalidated;
    }

    /**
     * Remember pattern - Try cache first, load from source on miss
     * @param key - Cache key
     * @param ttl - Time-to-live in seconds
     * @param callback - Function to load data on cache miss
     * @param options - Additional cache options (tags)
     * @returns Cached or freshly loaded value
     */
    async remember<T>(
        key: string,
        ttl: number,
        callback: () => Promise<T>,
        options: Omit<CacheOptions, 'ttl'> = {}
    ): Promise<T> {
        // Try cache first
        const cached = await this.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        // Load from source
        const value = await callback();

        // Store in cache
        await this.set(key, value, { ...options, ttl });

        return value;
    }

    /**
     * Clear all cache entries matching a pattern
     * @param pattern - Pattern to match (without prefix)
     */
    async clearPattern(pattern: string): Promise<number> {
        const redis = getRedisClient();
        if (!redis) {
            return 0;
        }

        try {
            let cursor = '0';
            let totalDeleted = 0;
            const fullPattern = `${this.prefix}${pattern}`;

            do {
                const [nextCursor, keys] = await redis.scan(
                    cursor,
                    'MATCH',
                    fullPattern,
                    'COUNT',
                    100
                );
                cursor = nextCursor;

                if (keys.length > 0) {
                    await redis.del(...keys);
                    totalDeleted += keys.length;
                }
            } while (cursor !== '0');

            console.log(`Cleared ${totalDeleted} cache entries matching pattern: ${pattern}`);
            return totalDeleted;
        } catch (error) {
            console.error(`Cache clearPattern error for pattern ${pattern}:`, error);
            return 0;
        }
    }

    /**
     * Flush all cache entries (use with caution!)
     */
    async flushAll(): Promise<void> {
        const redis = getRedisClient();
        if (!redis) {
            return;
        }

        try {
            // Only flush keys with our prefix to avoid affecting other data
            await this.clearPattern('*');
        } catch (error) {
            console.error('Cache flushAll error:', error);
        }
    }

    /**
     * Get cache statistics
     */
    async getStats(): Promise<CacheStats | null> {
        const redis = getRedisClient();
        if (!redis) {
            return null;
        }

        try {
            const [info, memory, keyCount] = await Promise.all([
                redis.info('stats'),
                redis.info('memory'),
                this.countKeys()
            ]);

            const hits = this.parseInfoValue(info, 'keyspace_hits') || 0;
            const misses = this.parseInfoValue(info, 'keyspace_misses') || 0;
            const total = hits + misses;
            const hitRate = total > 0 ? (hits / total) * 100 : 0;

            return {
                hits,
                misses,
                hitRate: Math.round(hitRate * 100) / 100,
                memoryUsed: this.parseInfoString(memory, 'used_memory_human') || 'N/A',
                evictedKeys: this.parseInfoValue(info, 'evicted_keys') || 0,
                keyCount
            };
        } catch (error) {
            console.error('Cache getStats error:', error);
            return null;
        }
    }

    /**
     * Count keys with our prefix
     */
    private async countKeys(): Promise<number> {
        const redis = getRedisClient();
        if (!redis) {
            return 0;
        }

        try {
            let cursor = '0';
            let count = 0;

            do {
                const [nextCursor, keys] = await redis.scan(
                    cursor,
                    'MATCH',
                    `${this.prefix}*`,
                    'COUNT',
                    100
                );
                cursor = nextCursor;
                count += keys.length;
            } while (cursor !== '0');

            return count;
        } catch (error) {
            console.error('Cache countKeys error:', error);
            return 0;
        }
    }

    /**
     * Parse numeric value from Redis INFO command output
     */
    private parseInfoValue(info: string, key: string): number | null {
        // Escape special regex characters in key
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const match = info.match(new RegExp(`${escapedKey}:(\\d+)`));
        return match ? parseInt(match[1], 10) : null;
    }

    /**
     * Parse string value from Redis INFO command output
     */
    private parseInfoString(info: string, key: string): string | null {
        // Escape special regex characters in key
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const match = info.match(new RegExp(`${escapedKey}:([^\\r\\n]+)`));
        return match ? match[1] : null;
    }

    /**
     * Warm cache with initial data
     * @param entries - Array of cache entries to warm
     */
    async warm(entries: Array<{ key: string; value: unknown; options?: CacheOptions }>): Promise<void> {
        const redis = getRedisClient();
        if (!redis) {
            return;
        }

        try {
            console.log(`Warming cache with ${entries.length} entries...`);
            for (const entry of entries) {
                await this.set(entry.key, entry.value, entry.options);
            }
            console.log('Cache warming completed');
        } catch (error) {
            console.error('Cache warm error:', error);
        }
    }
}

/**
 * Singleton instance of CacheService
 */
export const cache = new CacheService();
