import { SubscriptionTier } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';

import { db } from '../db';
import { getRedisClient } from '../utils/redis';
import {
    checkAndIncrementQuota,
    checkQuota,
    EndpointCategory,
    getEndpointCategory,
} from '../utils/quotaManager';

/**
 * Middleware to enforce quota limits based on user's subscription tier
 * Should be applied after authentication middleware
 */
export function quotaEnforcement() {
    return async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        // Skip quota enforcement for unauthenticated requests
        // (they are handled by IP-based rate limiting)
        if (!req.user) {
            next();
            return;
        }

        try {
            // Get user's subscription tier (with Redis caching)
            const tier = await getUserTier(req.user.userId);

            if (!tier) {
                res.status(403).json({ error: 'User not found' });
                return;
            }

            const category = getEndpointCategory(req.path);

            // Atomically check and increment quota to prevent race conditions
            const quotaCheck = await checkAndIncrementQuota(req.user.userId, tier, category);

            // Set quota headers
            res.setHeader('X-Quota-Limit', quotaCheck.limit);
            res.setHeader('X-Quota-Remaining', quotaCheck.remaining);
            res.setHeader('X-Quota-Reset', quotaCheck.reset);
            res.setHeader('X-Quota-Category', category);

            if (!quotaCheck.allowed) {
                res.status(429).json({
                    error: 'Quota exceeded',
                    message: `You have exceeded your ${category} quota for the day. Please upgrade your subscription or try again tomorrow.`,
                    quota: {
                        limit: quotaCheck.limit,
                        remaining: quotaCheck.remaining,
                        reset: quotaCheck.reset,
                        category,
                    },
                });
                return;
            }

            next();
        } catch (error) {
            console.error('Quota enforcement error:', error);
            // Fail open - allow request if quota check fails
            next();
        }
    };
}

/**
 * Middleware to add quota headers to response without enforcing limits
 * Useful for monitoring quota usage without blocking requests
 */
export function quotaHeaders() {
    return async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        if (!req.user) {
            next();
            return;
        }

        try {
            const tier = await getUserTier(req.user.userId);

            if (tier) {
                const category = getEndpointCategory(req.path);
                const quotaCheck = await checkQuota(req.user.userId, tier, category);

                res.setHeader('X-Quota-Limit', quotaCheck.limit);
                res.setHeader('X-Quota-Remaining', quotaCheck.remaining);
                res.setHeader('X-Quota-Reset', quotaCheck.reset);
                res.setHeader('X-Quota-Category', category);
            }
        } catch (error) {
            console.error('Error adding quota headers:', error);
        }

        next();
    };
}

/**
 * Get user's subscription tier with Redis caching
 * Caches tier for 5 minutes to reduce database load
 */
async function getUserTier(userId: string): Promise<SubscriptionTier | null> {
    const redis = getRedisClient();
    const cacheKey = `user:tier:${userId}`;

    // Try to get from Redis cache first
    if (redis) {
        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                return cached as SubscriptionTier;
            }
        } catch (error) {
            console.error('Error reading user tier from cache:', error);
        }
    }

    // Fetch from database
    try {
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { subscriptionTier: true },
        });

        if (!user) {
            return null;
        }

        const tier = user.subscriptionTier || SubscriptionTier.FREE;

        // Cache in Redis for 5 minutes
        if (redis) {
            try {
                await redis.set(cacheKey, tier, 'EX', 300);
            } catch (error) {
                console.error('Error caching user tier:', error);
            }
        }

        return tier;
    } catch (error) {
        console.error('Error fetching user tier:', error);
        return null;
    }
}

/**
 * Get quota category for request path
 * Exported for testing purposes
 */
export { getEndpointCategory, EndpointCategory };
