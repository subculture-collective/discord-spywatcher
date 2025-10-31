import { SubscriptionTier } from '@prisma/client';

import { getRedisClient } from './redis';

/**
 * Quota limits by tier and endpoint category
 */
export const QUOTA_LIMITS = {
    FREE: {
        analytics: { requests: 100, window: 'daily' },
        api: { requests: 1000, window: 'daily' },
        admin: { requests: 0, window: 'daily' }, // No access
        public: { requests: 500, window: 'daily' },
        total: { requests: 1000, window: 'daily' },
    },
    PRO: {
        analytics: { requests: 1000, window: 'daily' },
        api: { requests: 10000, window: 'daily' },
        admin: { requests: 0, window: 'daily' }, // No access
        public: { requests: 5000, window: 'daily' },
        total: { requests: 10000, window: 'daily' },
    },
    ENTERPRISE: {
        analytics: { requests: 10000, window: 'daily' },
        api: { requests: 100000, window: 'daily' },
        admin: { requests: 50000, window: 'daily' },
        public: { requests: 50000, window: 'daily' },
        total: { requests: 100000, window: 'daily' },
    },
} as const;

/**
 * Rate limits by tier (per minute)
 */
export const RATE_LIMITS_BY_TIER = {
    FREE: {
        requestsPerMinute: 30,
        requestsPer15Minutes: 100,
    },
    PRO: {
        requestsPerMinute: 100,
        requestsPer15Minutes: 1000,
    },
    ENTERPRISE: {
        requestsPerMinute: 300,
        requestsPer15Minutes: 5000,
    },
} as const;

/**
 * Endpoint categories for quota tracking
 */
export type EndpointCategory = 'analytics' | 'api' | 'admin' | 'public' | 'total';

/**
 * Get the endpoint category from the request path
 */
export function getEndpointCategory(path: string): EndpointCategory {
    if (path.startsWith('/api/analytics')) return 'analytics';
    if (path.startsWith('/api/admin')) return 'admin';
    if (path.startsWith('/api/public')) return 'public';
    return 'api';
}

/**
 * Generate Redis key for quota tracking
 */
function getQuotaKey(
    userId: string,
    category: EndpointCategory,
    date: Date = new Date()
): string {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    return `quota:${userId}:${category}:${dateStr}`;
}

/**
 * Get TTL for quota keys (expires at end of day)
 */
function getQuotaKeyTTL(): number {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return Math.floor((tomorrow.getTime() - now.getTime()) / 1000);
}

/**
 * Check and atomically increment quota if allowed
 * This prevents race conditions by combining check and increment operations
 */
export async function checkAndIncrementQuota(
    userId: string,
    tier: SubscriptionTier,
    category: EndpointCategory
): Promise<{
    allowed: boolean;
    remaining: number;
    limit: number;
    reset: number;
}> {
    const redis = getRedisClient();

    // Get quota limits for the user's tier
    const quotaConfig = QUOTA_LIMITS[tier];
    const categoryLimit = quotaConfig[category];
    
    // If limit is 0, access is not allowed
    if (categoryLimit.requests === 0) {
        return {
            allowed: false,
            remaining: 0,
            limit: 0,
            reset: getQuotaKeyTTL(),
        };
    }

    // If Redis is not available, allow the request (fail open)
    if (!redis) {
        return {
            allowed: true,
            remaining: categoryLimit.requests,
            limit: categoryLimit.requests,
            reset: getQuotaKeyTTL(),
        };
    }

    const key = getQuotaKey(userId, category);
    const totalKey = getQuotaKey(userId, 'total');
    const ttl = getQuotaKeyTTL();

    try {
        // Use Redis transaction with WATCH to atomically check and increment
        // This prevents race conditions when multiple requests arrive simultaneously
        const multi = redis.multi();
        
        // Increment both counters atomically
        multi.incr(key);
        multi.expire(key, ttl);
        multi.incr(totalKey);
        multi.expire(totalKey, ttl);
        
        const results = await multi.exec();
        
        if (!results) {
            // Transaction failed, fail open
            return {
                allowed: true,
                remaining: categoryLimit.requests,
                limit: categoryLimit.requests,
                reset: ttl,
            };
        }

        // Get the new counts after increment
        const categoryCount = results[0][1] as number;
        const totalCount = results[2][1] as number;
        const totalLimit = quotaConfig.total.requests;

        // Check if limits were exceeded (counts are now post-increment)
        const categoryAllowed = categoryCount <= categoryLimit.requests;
        const totalAllowed = totalCount <= totalLimit;
        const allowed = categoryAllowed && totalAllowed;

        return {
            allowed,
            remaining: Math.max(0, categoryLimit.requests - categoryCount),
            limit: categoryLimit.requests,
            reset: ttl,
        };
    } catch (error) {
        console.error('Error checking quota:', error);
        // Fail open on error
        return {
            allowed: true,
            remaining: categoryLimit.requests,
            limit: categoryLimit.requests,
            reset: getQuotaKeyTTL(),
        };
    }
}

/**
 * Check if user has quota remaining (read-only, no increment)
 * Use this for monitoring/display purposes only
 */
export async function checkQuota(
    userId: string,
    tier: SubscriptionTier,
    category: EndpointCategory
): Promise<{
    allowed: boolean;
    remaining: number;
    limit: number;
    reset: number;
}> {
    const redis = getRedisClient();

    // Get quota limits for the user's tier
    const quotaConfig = QUOTA_LIMITS[tier];
    const categoryLimit = quotaConfig[category];
    
    // If limit is 0, access is not allowed
    if (categoryLimit.requests === 0) {
        return {
            allowed: false,
            remaining: 0,
            limit: 0,
            reset: getQuotaKeyTTL(),
        };
    }

    // If Redis is not available, allow the request (fail open)
    if (!redis) {
        return {
            allowed: true,
            remaining: categoryLimit.requests,
            limit: categoryLimit.requests,
            reset: getQuotaKeyTTL(),
        };
    }

    const key = getQuotaKey(userId, category);
    const totalKey = getQuotaKey(userId, 'total');

    try {
        // Get current usage
        const [categoryUsage, totalUsage] = await Promise.all([
            redis.get(key),
            redis.get(totalKey),
        ]);

        const categoryCount = parseInt(categoryUsage || '0', 10);
        const totalCount = parseInt(totalUsage || '0', 10);
        const totalLimit = quotaConfig.total.requests;

        // Check both category and total limits
        const categoryAllowed = categoryCount < categoryLimit.requests;
        const totalAllowed = totalCount < totalLimit;
        const allowed = categoryAllowed && totalAllowed;

        return {
            allowed,
            remaining: Math.max(0, categoryLimit.requests - categoryCount),
            limit: categoryLimit.requests,
            reset: getQuotaKeyTTL(),
        };
    } catch (error) {
        console.error('Error checking quota:', error);
        // Fail open on error
        return {
            allowed: true,
            remaining: categoryLimit.requests,
            limit: categoryLimit.requests,
            reset: getQuotaKeyTTL(),
        };
    }
}

/**
 * Increment quota usage for a user
 */
export async function incrementQuota(
    userId: string,
    category: EndpointCategory
): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;

    const key = getQuotaKey(userId, category);
    const totalKey = getQuotaKey(userId, 'total');
    const ttl = getQuotaKeyTTL();

    try {
        // Increment both category and total counters
        const pipeline = redis.pipeline();
        pipeline.incr(key);
        pipeline.expire(key, ttl);
        pipeline.incr(totalKey);
        pipeline.expire(totalKey, ttl);
        await pipeline.exec();
    } catch (error) {
        console.error('Error incrementing quota:', error);
    }
}

/**
 * Get current quota usage for a user
 */
export async function getQuotaUsage(
    userId: string,
    tier: SubscriptionTier
): Promise<{
    [key in EndpointCategory]?: {
        used: number;
        limit: number;
        remaining: number;
    };
}> {
    const redis = getRedisClient();
    if (!redis) {
        return {};
    }

    const quotaConfig = QUOTA_LIMITS[tier];
    const categories: EndpointCategory[] = ['analytics', 'api', 'admin', 'public', 'total'];

    try {
        const keys = categories.map((cat) => getQuotaKey(userId, cat));
        const values = await redis.mget(...keys);

        const usage: Record<string, { used: number; limit: number; remaining: number }> = {};

        categories.forEach((category, index) => {
            const used = parseInt(values[index] || '0', 10);
            const limit = quotaConfig[category].requests;
            // eslint-disable-next-line security/detect-object-injection
            usage[category] = {
                used,
                limit,
                remaining: Math.max(0, limit - used),
            };
        });

        return usage;
    } catch (error) {
        console.error('Error getting quota usage:', error);
        return {};
    }
}

/**
 * Reset quota for a user (admin function)
 */
export async function resetQuota(
    userId: string,
    category?: EndpointCategory
): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;

    try {
        if (category) {
            // Reset specific category
            const key = getQuotaKey(userId, category);
            await redis.del(key);
        } else {
            // Reset all categories
            const categories: EndpointCategory[] = ['analytics', 'api', 'admin', 'public', 'total'];
            const keys = categories.map((cat) => getQuotaKey(userId, cat));
            await redis.del(...keys);
        }
    } catch (error) {
        console.error('Error resetting quota:', error);
    }
}

/**
 * Get quota limits for a tier
 */
export function getQuotaLimitsForTier(tier: SubscriptionTier) {
    return QUOTA_LIMITS[tier];
}

/**
 * Get rate limits for a tier
 */
export function getRateLimitsForTier(tier: SubscriptionTier) {
    return RATE_LIMITS_BY_TIER[tier];
}
