import { SubscriptionTier } from '@prisma/client';

import {
    checkAndIncrementQuota,
    checkQuota,
    getEndpointCategory,
    getQuotaLimitsForTier,
    getQuotaUsage,
    getRateLimitsForTier,
    resetQuota,
} from '../../../src/utils/quotaManager';

// Mock Redis
const mockRedis = {
    get: jest.fn(),
    mget: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    del: jest.fn(),
    pipeline: jest.fn(),
    multi: jest.fn(),
};

jest.mock('../../../src/utils/redis', () => ({
    getRedisClient: jest.fn(() => mockRedis),
}));

describe('Quota Manager', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockRedis.pipeline.mockReturnValue({
            incr: jest.fn().mockReturnThis(),
            expire: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue([]),
        });
        mockRedis.multi.mockReturnValue({
            incr: jest.fn().mockReturnThis(),
            expire: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue([
                [null, 1],
                [null, true],
                [null, 1],
                [null, true],
            ]),
        });
    });

    describe('getEndpointCategory', () => {
        it('should categorize analytics endpoints', () => {
            expect(getEndpointCategory('/api/analytics/stats')).toBe('analytics');
        });

        it('should categorize admin endpoints', () => {
            expect(getEndpointCategory('/api/admin/users')).toBe('admin');
        });

        it('should categorize public endpoints', () => {
            expect(getEndpointCategory('/api/public/data')).toBe('public');
        });

        it('should default to api category', () => {
            expect(getEndpointCategory('/api/some/endpoint')).toBe('api');
        });
    });

    describe('getQuotaLimitsForTier', () => {
        it('should return FREE tier limits', () => {
            const limits = getQuotaLimitsForTier(SubscriptionTier.FREE);
            expect(limits.total.requests).toBe(1000);
            expect(limits.analytics.requests).toBe(100);
        });

        it('should return PRO tier limits', () => {
            const limits = getQuotaLimitsForTier(SubscriptionTier.PRO);
            expect(limits.total.requests).toBe(10000);
            expect(limits.analytics.requests).toBe(1000);
        });

        it('should return ENTERPRISE tier limits', () => {
            const limits = getQuotaLimitsForTier(SubscriptionTier.ENTERPRISE);
            expect(limits.total.requests).toBe(100000);
            expect(limits.analytics.requests).toBe(10000);
        });
    });

    describe('getRateLimitsForTier', () => {
        it('should return rate limits for each tier', () => {
            const freeLimits = getRateLimitsForTier(SubscriptionTier.FREE);
            expect(freeLimits.requestsPerMinute).toBe(30);

            const proLimits = getRateLimitsForTier(SubscriptionTier.PRO);
            expect(proLimits.requestsPerMinute).toBe(100);

            const enterpriseLimits = getRateLimitsForTier(SubscriptionTier.ENTERPRISE);
            expect(enterpriseLimits.requestsPerMinute).toBe(300);
        });
    });

    describe('checkAndIncrementQuota', () => {
        it('should atomically check and increment quota when allowed', async () => {
            const multi = {
                incr: jest.fn().mockReturnThis(),
                expire: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue([
                    [null, 51], // Category count after increment
                    [null, true],
                    [null, 251], // Total count after increment
                    [null, true],
                ]),
            };
            mockRedis.multi.mockReturnValue(multi);

            const result = await checkAndIncrementQuota('user123', SubscriptionTier.FREE, 'analytics');

            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(49); // 100 - 51
            expect(result.limit).toBe(100);
            expect(multi.incr).toHaveBeenCalledTimes(2);
            expect(multi.exec).toHaveBeenCalled();
        });

        it('should deny request when quota would be exceeded', async () => {
            const multi = {
                incr: jest.fn().mockReturnThis(),
                expire: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue([
                    [null, 101], // Category count exceeds limit
                    [null, true],
                    [null, 1001], // Total also exceeds
                    [null, true],
                ]),
            };
            mockRedis.multi.mockReturnValue(multi);

            const result = await checkAndIncrementQuota('user123', SubscriptionTier.FREE, 'analytics');

            expect(result.allowed).toBe(false);
            expect(result.remaining).toBe(0);
        });

        it('should deny access to admin endpoints for FREE tier', async () => {
            const result = await checkAndIncrementQuota('user123', SubscriptionTier.FREE, 'admin');

            expect(result.allowed).toBe(false);
            expect(result.limit).toBe(0);
        });
    });

    describe('checkQuota', () => {
        it('should allow request when under quota', async () => {
            mockRedis.get.mockResolvedValue('50'); // 50 requests used

            const result = await checkQuota('user123', SubscriptionTier.FREE, 'analytics');

            expect(result.allowed).toBe(true);
            expect(result.remaining).toBeGreaterThan(0);
            expect(result.limit).toBe(100);
        });

        it('should deny request when quota exceeded', async () => {
            mockRedis.get.mockResolvedValue('100'); // Quota exhausted

            const result = await checkQuota('user123', SubscriptionTier.FREE, 'analytics');

            expect(result.allowed).toBe(false);
            expect(result.remaining).toBe(0);
        });

        it('should deny access to admin endpoints for FREE tier', async () => {
            const result = await checkQuota('user123', SubscriptionTier.FREE, 'admin');

            expect(result.allowed).toBe(false);
            expect(result.limit).toBe(0);
        });

        it('should check both category and total limits', async () => {
            mockRedis.get
                .mockResolvedValueOnce('50') // Category usage
                .mockResolvedValueOnce('999'); // Total usage under limit

            const result = await checkQuota('user123', SubscriptionTier.FREE, 'api');

            expect(result.allowed).toBe(true);
        });

        it('should deny when total quota exceeded even if category has space', async () => {
            mockRedis.get
                .mockResolvedValueOnce('50') // Category usage OK
                .mockResolvedValueOnce('1000'); // Total quota exceeded

            const result = await checkQuota('user123', SubscriptionTier.FREE, 'api');

            expect(result.allowed).toBe(false);
        });
    });



    describe('getQuotaUsage', () => {
        it('should return usage for all categories', async () => {
            mockRedis.mget.mockResolvedValue(['50', '200', '0', '100', '350']);

            const usage = await getQuotaUsage('user123', SubscriptionTier.FREE);

            expect(usage.analytics?.used).toBe(50);
            expect(usage.api?.used).toBe(200);
            expect(usage.total?.used).toBe(350);
        });

        it('should handle missing usage data', async () => {
            mockRedis.mget.mockResolvedValue([null, null, null, null, null]);

            const usage = await getQuotaUsage('user123', SubscriptionTier.FREE);

            expect(usage.analytics?.used).toBe(0);
            expect(usage.total?.used).toBe(0);
        });
    });

    describe('resetQuota', () => {
        it('should reset specific category', async () => {
            await resetQuota('user123', 'analytics');

            expect(mockRedis.del).toHaveBeenCalledWith(
                expect.stringContaining('quota:user123:analytics:')
            );
        });

        it('should reset all categories when no category specified', async () => {
            await resetQuota('user123');

            expect(mockRedis.del).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(String),
                expect.any(String),
                expect.any(String),
                expect.any(String)
            );
        });
    });
});
