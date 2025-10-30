import { SubscriptionTier } from '@prisma/client';
import express from 'express';
import request from 'supertest';

import { db } from '../../../src/db';
import quotaManagementRoutes from '../../../src/routes/quotaManagement';

// Mock database
jest.mock('../../../src/db', () => ({
    db: {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    },
}));

// Mock quota manager
jest.mock('../../../src/utils/quotaManager', () => ({
    getQuotaUsage: jest.fn(),
    resetQuota: jest.fn(),
    getQuotaLimitsForTier: jest.fn((tier: SubscriptionTier) => ({
        analytics: { requests: tier === 'FREE' ? 100 : 1000, window: 'daily' },
        api: { requests: tier === 'FREE' ? 1000 : 10000, window: 'daily' },
        total: { requests: tier === 'FREE' ? 1000 : 10000, window: 'daily' },
    })),
    getRateLimitsForTier: jest.fn((tier: SubscriptionTier) => ({
        requestsPerMinute: tier === 'FREE' ? 30 : 100,
        requestsPer15Minutes: tier === 'FREE' ? 100 : 1000,
    })),
}));

// Mock authentication middleware
jest.mock('../../../src/middleware/auth', () => ({
    requireAuth: (req: any, _res: any, next: any) => {
        req.user = { userId: 'test-user', username: 'testuser', role: 'USER' };
        next();
    },
    requireRole: () => (_req: any, _res: any, next: any) => next(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const quotaManager = require('../../../src/utils/quotaManager');

describe('Quota Management Routes', () => {
    let app: express.Application;
    const { getQuotaUsage, resetQuota } = quotaManager;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/api/quota', quotaManagementRoutes);
        jest.clearAllMocks();
    });

    describe('GET /api/quota/usage', () => {
        it('should return quota usage for authenticated user', async () => {
            const mockUser = {
                subscriptionTier: SubscriptionTier.FREE,
            };

            const mockUsage = {
                analytics: { used: 50, limit: 100, remaining: 50 },
                api: { used: 200, limit: 1000, remaining: 800 },
                total: { used: 250, limit: 1000, remaining: 750 },
            };

            (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            getQuotaUsage.mockResolvedValue(mockUsage);

            const response = await request(app).get('/api/quota/usage');

            expect(response.status).toBe(200);
            expect(response.body.tier).toBe(SubscriptionTier.FREE);
            expect(response.body.usage).toEqual(mockUsage);
        });

        it('should return 404 if user not found', async () => {
            (db.user.findUnique as jest.Mock).mockResolvedValue(null);

            const response = await request(app).get('/api/quota/usage');

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('User not found');
        });
    });

    describe('GET /api/quota/limits', () => {
        it('should return quota limits for all tiers', async () => {
            const response = await request(app).get('/api/quota/limits');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('FREE');
            expect(response.body).toHaveProperty('PRO');
            expect(response.body).toHaveProperty('ENTERPRISE');
            expect(response.body.FREE.quotas).toBeDefined();
            expect(response.body.FREE.rateLimits).toBeDefined();
        });
    });

    describe('GET /api/quota/users/:userId', () => {
        it('should return quota usage for specified user', async () => {
            const mockUser = {
                id: 'user123',
                username: 'testuser',
                subscriptionTier: SubscriptionTier.PRO,
                role: 'USER',
            };

            const mockUsage = {
                analytics: { used: 500, limit: 1000, remaining: 500 },
                total: { used: 5000, limit: 10000, remaining: 5000 },
            };

            (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            getQuotaUsage.mockResolvedValue(mockUsage);

            const response = await request(app).get('/api/quota/users/user123');

            expect(response.status).toBe(200);
            expect(response.body.user.id).toBe('user123');
            expect(response.body.user.tier).toBe(SubscriptionTier.PRO);
            expect(response.body.usage).toEqual(mockUsage);
        });

        it('should return 404 if user not found', async () => {
            (db.user.findUnique as jest.Mock).mockResolvedValue(null);

            const response = await request(app).get('/api/quota/users/nonexistent');

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('User not found');
        });
    });

    describe('PUT /api/quota/users/:userId/tier', () => {
        it('should update user subscription tier', async () => {
            const mockUpdatedUser = {
                id: 'user123',
                username: 'testuser',
                subscriptionTier: SubscriptionTier.PRO,
            };

            (db.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);

            const response = await request(app)
                .put('/api/quota/users/user123/tier')
                .send({ tier: SubscriptionTier.PRO });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('User tier updated successfully');
            expect(response.body.user.subscriptionTier).toBe(SubscriptionTier.PRO);
        });

        it('should return 400 for invalid tier', async () => {
            const response = await request(app)
                .put('/api/quota/users/user123/tier')
                .send({ tier: 'INVALID_TIER' });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Invalid tier');
        });
    });

    describe('DELETE /api/quota/users/:userId/reset', () => {
        it('should reset all quotas for user', async () => {
            const mockUser = {
                username: 'testuser',
            };

            (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            resetQuota.mockResolvedValue(undefined);

            const response = await request(app).delete('/api/quota/users/user123/reset');

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('All quotas reset successfully');
            expect(resetQuota).toHaveBeenCalledWith('user123', undefined);
        });

        it('should reset specific category quota', async () => {
            const mockUser = {
                username: 'testuser',
            };

            (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            resetQuota.mockResolvedValue(undefined);

            const response = await request(app)
                .delete('/api/quota/users/user123/reset')
                .query({ category: 'analytics' });

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('analytics');
            expect(resetQuota).toHaveBeenCalledWith('user123', 'analytics');
        });

        it('should return 404 if user not found', async () => {
            (db.user.findUnique as jest.Mock).mockResolvedValue(null);

            const response = await request(app).delete('/api/quota/users/nonexistent/reset');

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('User not found');
        });
    });
});
