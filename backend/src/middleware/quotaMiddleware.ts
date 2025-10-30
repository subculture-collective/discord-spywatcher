import { SubscriptionTier } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';

import { db } from '../db';
import {
    checkQuota,
    getEndpointCategory,
    incrementQuota,
    EndpointCategory,
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
            // Get user's subscription tier from database
            const user = await db.user.findUnique({
                where: { id: req.user.userId },
                select: { subscriptionTier: true },
            });

            if (!user) {
                res.status(403).json({ error: 'User not found' });
                return;
            }

            const tier = user.subscriptionTier || SubscriptionTier.FREE;
            const category = getEndpointCategory(req.path);

            // Check if user has quota remaining
            const quotaCheck = await checkQuota(req.user.userId, tier, category);

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

            // Increment quota usage after successful check
            // We do this in a non-blocking way after sending the response
            res.on('finish', () => {
                if (res.statusCode < 400) {
                    // Only count successful requests
                    incrementQuota(req.user!.userId, category).catch((err) => {
                        console.error('Error incrementing quota:', err);
                    });
                }
            });

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
            const user = await db.user.findUnique({
                where: { id: req.user.userId },
                select: { subscriptionTier: true },
            });

            if (user) {
                const tier = user.subscriptionTier || SubscriptionTier.FREE;
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
 * Get quota category for request path
 * Exported for testing purposes
 */
export { getEndpointCategory, EndpointCategory };
