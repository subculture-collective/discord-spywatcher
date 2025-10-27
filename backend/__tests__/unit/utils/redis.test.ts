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
        it('should return empty array when Redis client is null', async () => {
            jest.resetModules();
            jest.mock('../../../src/utils/env', () => ({
                env: {
                    REDIS_URL: undefined,
                    ENABLE_REDIS_RATE_LIMITING: true,
                },
            }));

            const { scanKeys } = require('../../../src/utils/redis');
            const keys = await scanKeys('violations:*');
            expect(keys).toEqual([]);
        });

        it('should scan keys with pattern using SCAN command', async () => {
            const mockClient = {
                scan: jest
                    .fn()
                    .mockResolvedValueOnce(['5', ['violations:192.168.1.1', 'violations:192.168.1.2']])
                    .mockResolvedValueOnce(['0', ['violations:192.168.1.3']]),
            };

            jest.resetModules();
            jest.mock('../../../src/utils/env', () => ({
                env: {
                    REDIS_URL: 'redis://localhost:6379',
                    ENABLE_REDIS_RATE_LIMITING: true,
                },
            }));

            // Mock getRedisClient to return our mock client
            jest.mock('../../../src/utils/redis', () => {
                const originalModule = jest.requireActual('../../../src/utils/redis');
                return {
                    ...originalModule,
                    getRedisClient: () => mockClient,
                };
            });

            const { scanKeys } = require('../../../src/utils/redis');
            const keys = await scanKeys('violations:*', 100);

            expect(mockClient.scan).toHaveBeenCalledTimes(2);
            expect(mockClient.scan).toHaveBeenCalledWith('0', 'MATCH', 'violations:*', 'COUNT', 100);
            expect(keys).toEqual([
                'violations:192.168.1.1',
                'violations:192.168.1.2',
                'violations:192.168.1.3',
            ]);
        });

        it('should handle scan errors gracefully', async () => {
            const mockClient = {
                scan: jest.fn().mockRejectedValue(new Error('Redis error')),
            };

            jest.resetModules();
            jest.mock('../../../src/utils/env', () => ({
                env: {
                    REDIS_URL: 'redis://localhost:6379',
                    ENABLE_REDIS_RATE_LIMITING: true,
                },
            }));

            jest.mock('../../../src/utils/redis', () => {
                const originalModule = jest.requireActual('../../../src/utils/redis');
                return {
                    ...originalModule,
                    getRedisClient: () => mockClient,
                };
            });

            const { scanKeys } = require('../../../src/utils/redis');
            const keys = await scanKeys('violations:*');

            expect(keys).toEqual([]);
        });
    });

    describe('deleteKeysByPattern', () => {
        it('should return 0 when Redis client is null', async () => {
            jest.resetModules();
            jest.mock('../../../src/utils/env', () => ({
                env: {
                    REDIS_URL: undefined,
                    ENABLE_REDIS_RATE_LIMITING: true,
                },
            }));

            const { deleteKeysByPattern } = require('../../../src/utils/redis');
            const deleted = await deleteKeysByPattern('violations:*');
            expect(deleted).toBe(0);
        });

        it('should delete keys matching pattern using SCAN', async () => {
            const mockClient = {
                scan: jest
                    .fn()
                    .mockResolvedValueOnce(['5', ['key1', 'key2']])
                    .mockResolvedValueOnce(['0', ['key3']]),
                del: jest.fn().mockResolvedValueOnce(2).mockResolvedValueOnce(1),
            };

            jest.resetModules();
            jest.mock('../../../src/utils/env', () => ({
                env: {
                    REDIS_URL: 'redis://localhost:6379',
                    ENABLE_REDIS_RATE_LIMITING: true,
                },
            }));

            jest.mock('../../../src/utils/redis', () => {
                const originalModule = jest.requireActual('../../../src/utils/redis');
                return {
                    ...originalModule,
                    getRedisClient: () => mockClient,
                };
            });

            const { deleteKeysByPattern } = require('../../../src/utils/redis');
            const deleted = await deleteKeysByPattern('violations:*', 100);

            expect(mockClient.scan).toHaveBeenCalledTimes(2);
            expect(mockClient.del).toHaveBeenCalledTimes(2);
            expect(mockClient.del).toHaveBeenCalledWith('key1', 'key2');
            expect(mockClient.del).toHaveBeenCalledWith('key3');
            expect(deleted).toBe(3);
        });

        it('should handle delete errors gracefully', async () => {
            const mockClient = {
                scan: jest.fn().mockRejectedValue(new Error('Redis error')),
            };

            jest.resetModules();
            jest.mock('../../../src/utils/env', () => ({
                env: {
                    REDIS_URL: 'redis://localhost:6379',
                    ENABLE_REDIS_RATE_LIMITING: true,
                },
            }));

            jest.mock('../../../src/utils/redis', () => {
                const originalModule = jest.requireActual('../../../src/utils/redis');
                return {
                    ...originalModule,
                    getRedisClient: () => mockClient,
                };
            });

            const { deleteKeysByPattern } = require('../../../src/utils/redis');
            const deleted = await deleteKeysByPattern('violations:*');

            expect(deleted).toBe(0);
        });
    });

    describe('getKeyValuesByPattern', () => {
        it('should return empty map when Redis client is null', async () => {
            jest.resetModules();
            jest.mock('../../../src/utils/env', () => ({
                env: {
                    REDIS_URL: undefined,
                    ENABLE_REDIS_RATE_LIMITING: true,
                },
            }));

            const { getKeyValuesByPattern } = require('../../../src/utils/redis');
            const result = await getKeyValuesByPattern('violations:*');
            expect(result.size).toBe(0);
        });

        it('should get key-value pairs using SCAN and pipeline', async () => {
            const mockPipeline = {
                get: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue([
                    [null, '5'],
                    [null, '3'],
                ]),
            };

            const mockClient = {
                scan: jest.fn().mockResolvedValueOnce(['0', ['violations:ip1', 'violations:ip2']]),
                pipeline: jest.fn().mockReturnValue(mockPipeline),
            };

            jest.resetModules();
            jest.mock('../../../src/utils/env', () => ({
                env: {
                    REDIS_URL: 'redis://localhost:6379',
                    ENABLE_REDIS_RATE_LIMITING: true,
                },
            }));

            jest.mock('../../../src/utils/redis', () => {
                const originalModule = jest.requireActual('../../../src/utils/redis');
                return {
                    ...originalModule,
                    getRedisClient: () => mockClient,
                };
            });

            const { getKeyValuesByPattern } = require('../../../src/utils/redis');
            const result = await getKeyValuesByPattern('violations:*');

            expect(mockClient.scan).toHaveBeenCalledTimes(1);
            expect(mockClient.pipeline).toHaveBeenCalled();
            expect(mockPipeline.get).toHaveBeenCalledTimes(2);
            expect(result.size).toBe(2);
            expect(result.get('violations:ip1')).toBe('5');
            expect(result.get('violations:ip2')).toBe('3');
        });
    });

    describe('countKeysByPattern', () => {
        it('should return 0 when Redis client is null', async () => {
            jest.resetModules();
            jest.mock('../../../src/utils/env', () => ({
                env: {
                    REDIS_URL: undefined,
                    ENABLE_REDIS_RATE_LIMITING: true,
                },
            }));

            const { countKeysByPattern } = require('../../../src/utils/redis');
            const count = await countKeysByPattern('violations:*');
            expect(count).toBe(0);
        });

        it('should count keys matching pattern using SCAN', async () => {
            const mockClient = {
                scan: jest
                    .fn()
                    .mockResolvedValueOnce(['5', ['key1', 'key2', 'key3']])
                    .mockResolvedValueOnce(['0', ['key4', 'key5']]),
            };

            jest.resetModules();
            jest.mock('../../../src/utils/env', () => ({
                env: {
                    REDIS_URL: 'redis://localhost:6379',
                    ENABLE_REDIS_RATE_LIMITING: true,
                },
            }));

            jest.mock('../../../src/utils/redis', () => {
                const originalModule = jest.requireActual('../../../src/utils/redis');
                return {
                    ...originalModule,
                    getRedisClient: () => mockClient,
                };
            });

            const { countKeysByPattern } = require('../../../src/utils/redis');
            const count = await countKeysByPattern('violations:*');

            expect(mockClient.scan).toHaveBeenCalledTimes(2);
            expect(count).toBe(5);
        });

        it('should handle count errors gracefully', async () => {
            const mockClient = {
                scan: jest.fn().mockRejectedValue(new Error('Redis error')),
            };

            jest.resetModules();
            jest.mock('../../../src/utils/env', () => ({
                env: {
                    REDIS_URL: 'redis://localhost:6379',
                    ENABLE_REDIS_RATE_LIMITING: true,
                },
            }));

            jest.mock('../../../src/utils/redis', () => {
                const originalModule = jest.requireActual('../../../src/utils/redis');
                return {
                    ...originalModule,
                    getRedisClient: () => mockClient,
                };
            });

            const { countKeysByPattern } = require('../../../src/utils/redis');
            const count = await countKeysByPattern('violations:*');

            expect(count).toBe(0);
        });
    });
});
