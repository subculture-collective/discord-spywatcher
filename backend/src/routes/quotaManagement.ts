import { SubscriptionTier } from '@prisma/client';
import express, { Request, Response } from 'express';

import { db } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';
import {
    EndpointCategory,
    getQuotaLimitsForTier,
    getQuotaUsage,
    getRateLimitsForTier,
    resetQuota,
} from '../utils/quotaManager';

const router = express.Router();

/**
 * Get quota usage for the authenticated user
 * GET /api/quota/usage
 */
router.get('/usage', requireAuth, async (req: Request, res: Response) => {
    try {
        const user = await db.user.findUnique({
            where: { id: req.user!.userId },
            select: { subscriptionTier: true },
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const usage = await getQuotaUsage(
            req.user!.userId,
            user.subscriptionTier
        );
        const limits = getQuotaLimitsForTier(user.subscriptionTier);
        const rateLimits = getRateLimitsForTier(user.subscriptionTier);

        res.json({
            tier: user.subscriptionTier,
            usage,
            limits,
            rateLimits,
        });
    } catch (error) {
        console.error('Error fetching quota usage:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get quota limits for all tiers
 * GET /api/quota/limits
 */
router.get('/limits', async (_req: Request, res: Response) => {
    try {
        const tiers: SubscriptionTier[] = ['FREE', 'PRO', 'ENTERPRISE'];
        const limits: Record<string, { quotas: unknown; rateLimits: unknown }> =
            {};

        tiers.forEach((tier) => {
            // eslint-disable-next-line security/detect-object-injection
            limits[tier] = {
                quotas: getQuotaLimitsForTier(tier),
                rateLimits: getRateLimitsForTier(tier),
            };
        });

        res.json(limits);
    } catch (error) {
        console.error('Error fetching quota limits:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get quota usage for a specific user (admin only)
 * GET /api/quota/users/:userId
 */
router.get(
    '/users/:userId',
    requireAuth,
    requireRole(['ADMIN']),
    async (req: Request, res: Response) => {
        try {
            const { userId } = req.params;

            const user = await db.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    username: true,
                    subscriptionTier: true,
                    role: true,
                },
            });

            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            const usage = await getQuotaUsage(userId, user.subscriptionTier);
            const limits = getQuotaLimitsForTier(user.subscriptionTier);

            res.json({
                user: {
                    id: user.id,
                    username: user.username,
                    tier: user.subscriptionTier,
                    role: user.role,
                },
                usage,
                limits,
            });
        } catch (error) {
            console.error('Error fetching user quota:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

/**
 * Update user subscription tier (admin only)
 * PUT /api/quota/users/:userId/tier
 */
router.put(
    '/users/:userId/tier',
    requireAuth,
    requireRole(['ADMIN']),
    async (req: Request, res: Response) => {
        try {
            const { userId } = req.params;
            const { tier } = req.body as { tier: SubscriptionTier };

            if (!tier || !['FREE', 'PRO', 'ENTERPRISE'].includes(tier)) {
                res.status(400).json({
                    error: 'Invalid tier. Must be FREE, PRO, or ENTERPRISE',
                });
                return;
            }

            const user = await db.user.update({
                where: { id: userId },
                data: { subscriptionTier: tier },
                select: {
                    id: true,
                    username: true,
                    subscriptionTier: true,
                },
            });

            res.json({
                message: 'User tier updated successfully',
                user,
            });
        } catch (error) {
            console.error('Error updating user tier:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

/**
 * Reset quota for a user (admin only)
 * DELETE /api/quota/users/:userId/reset
 */
router.delete(
    '/users/:userId/reset',
    requireAuth,
    requireRole(['ADMIN']),
    async (req: Request, res: Response) => {
        try {
            const { userId } = req.params;
            const { category } = req.query as { category?: string };

            // Validate category parameter if provided
            const allowedCategories: EndpointCategory[] = [
                'analytics',
                'api',
                'admin',
                'public',
                'total',
            ];
            if (
                category !== undefined &&
                !allowedCategories.includes(category as EndpointCategory)
            ) {
                res.status(400).json({
                    error: `Invalid category. Must be one of: ${allowedCategories.join(', ')}`,
                });
                return;
            }

            const user = await db.user.findUnique({
                where: { id: userId },
                select: { username: true },
            });

            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            await resetQuota(userId, category as EndpointCategory | undefined);

            res.json({
                message: category
                    ? `Quota reset for category: ${category}`
                    : 'All quotas reset successfully',
                userId,
                username: user.username,
                category: category || 'all',
            });
        } catch (error) {
            console.error('Error resetting quota:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

export default router;
