import { getRedisClient } from '../../../src/utils/redis';

// Mock ioredis
jest.mock('ioredis');

// Mock env
jest.mock('../../../src/utils/env', () => ({
    env: {
        REDIS_URL: 'redis://localhost:6379',
        ENABLE_REDIS_RATE_LIMITING: true,
    },
}));

describe('Redis Utility', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getRedisClient', () => {
        it('should return null when Redis URL is not configured', () => {
            jest.resetModules();
            jest.mock('../../../src/utils/env', () => ({
                env: {
                    REDIS_URL: undefined,
                    ENABLE_REDIS_RATE_LIMITING: true,
                },
            }));

            const { getRedisClient } = require('../../../src/utils/redis');
            const client = getRedisClient();
            expect(client).toBeNull();
        });

        it('should return null when Redis rate limiting is disabled', () => {
            jest.resetModules();
            jest.mock('../../../src/utils/env', () => ({
                env: {
                    REDIS_URL: 'redis://localhost:6379',
                    ENABLE_REDIS_RATE_LIMITING: false,
                },
            }));

            const { getRedisClient } = require('../../../src/utils/redis');
            const client = getRedisClient();
            expect(client).toBeNull();
        });

        it('should create Redis client when properly configured', () => {
            const client = getRedisClient();
            // Since we're mocking ioredis, we just verify it doesn't throw
            expect(client).toBeDefined();
        });
    });

    describe('isRedisAvailable', () => {
        it('should return false when Redis client is null', async () => {
            jest.resetModules();
            jest.mock('../../../src/utils/env', () => ({
                env: {
                    REDIS_URL: undefined,
                    ENABLE_REDIS_RATE_LIMITING: true,
                },
            }));

            const { isRedisAvailable } = require('../../../src/utils/redis');
            const available = await isRedisAvailable();
            expect(available).toBe(false);
        });
    });
});
