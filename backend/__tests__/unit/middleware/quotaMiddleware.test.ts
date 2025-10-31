import { SubscriptionTier } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';

import { quotaEnforcement, quotaHeaders } from '../../../src/middleware/quotaMiddleware';

// Mock database
jest.mock('../../../src/db', () => ({
    db: {
        user: {
            findUnique: jest.fn(),
        },
    },
}));

// Mock Redis
jest.mock('../../../src/utils/redis', () => ({
    getRedisClient: jest.fn(() => null),
}));

// Mock quota manager
jest.mock('../../../src/utils/quotaManager', () => ({
    checkQuota: jest.fn(),
    checkAndIncrementQuota: jest.fn(),
    getEndpointCategory: jest.fn((path: string) => {
        if (path.includes('analytics')) return 'analytics';
        return 'api';
    }),
}));

describe('Quota Middleware', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockDb: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockCheckQuota: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockCheckAndIncrementQuota: any;

    beforeEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        mockDb = require('../../../src/db').db;
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const quotaManager = require('../../../src/utils/quotaManager');
        mockCheckQuota = quotaManager.checkQuota;
        mockCheckAndIncrementQuota = quotaManager.checkAndIncrementQuota;
        mockReq = {
            user: {
                userId: 'user123',
                discordId: 'discord123',
                username: 'testuser',
                role: 'USER',
                access: true,
            },
            path: '/api/test',
        };
        mockRes = {
            setHeader: jest.fn(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            on: jest.fn(),
        };
        mockNext = jest.fn();
        jest.clearAllMocks();
    });

    describe('quotaEnforcement', () => {
        it('should pass through unauthenticated requests', async () => {
            mockReq.user = undefined;

            const middleware = quotaEnforcement();
            await middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockDb.user.findUnique).not.toHaveBeenCalled();
        });

        it('should allow request when quota available', async () => {
            mockDb.user.findUnique.mockResolvedValue({
                subscriptionTier: SubscriptionTier.FREE,
            });

            mockCheckAndIncrementQuota.mockResolvedValue({
                allowed: true,
                remaining: 50,
                limit: 100,
                reset: 86400,
            });

            const middleware = quotaEnforcement();
            await middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.setHeader).toHaveBeenCalledWith('X-Quota-Limit', 100);
            expect(mockRes.setHeader).toHaveBeenCalledWith('X-Quota-Remaining', 50);
            expect(mockNext).toHaveBeenCalled();
        });

        it('should block request when quota exceeded', async () => {
            mockDb.user.findUnique.mockResolvedValue({
                subscriptionTier: SubscriptionTier.FREE,
            });

            mockCheckAndIncrementQuota.mockResolvedValue({
                allowed: false,
                remaining: 0,
                limit: 100,
                reset: 86400,
            });

            const middleware = quotaEnforcement();
            await middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(429);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Quota exceeded',
                })
            );
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 403 if user not found', async () => {
            mockDb.user.findUnique.mockResolvedValue(null);

            const middleware = quotaEnforcement();
            await middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'User not found' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should fail open when checkAndIncrementQuota throws error', async () => {
            mockDb.user.findUnique.mockResolvedValue({
                subscriptionTier: SubscriptionTier.FREE,
            });

            mockCheckAndIncrementQuota.mockRejectedValue(new Error('Redis error'));

            const middleware = quotaEnforcement();
            await middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('quotaHeaders', () => {
        it('should add quota headers to response', async () => {
            mockDb.user.findUnique.mockResolvedValue({
                subscriptionTier: SubscriptionTier.PRO,
            });

            mockCheckQuota.mockResolvedValue({
                allowed: true,
                remaining: 500,
                limit: 1000,
                reset: 86400,
            });

            const middleware = quotaHeaders();
            await middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.setHeader).toHaveBeenCalledWith('X-Quota-Limit', 1000);
            expect(mockRes.setHeader).toHaveBeenCalledWith('X-Quota-Remaining', 500);
            expect(mockNext).toHaveBeenCalled();
        });

        it('should pass through if user not authenticated', async () => {
            mockReq.user = undefined;

            const middleware = quotaHeaders();
            await middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.setHeader).not.toHaveBeenCalled();
        });

        it('should not fail on error', async () => {
            mockDb.user.findUnique.mockRejectedValue(new Error('Database error'));

            const middleware = quotaHeaders();
            await middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });
    });
});
