import { CacheService } from '../../../src/services/cache';
import { getRedisClient } from '../../../src/utils/redis';

// Mock Redis client
jest.mock('../../../src/utils/redis');

describe('CacheService', () => {
    let cacheService: CacheService;
    let mockRedis: {
        get: jest.Mock;
        setex: jest.Mock;
        del: jest.Mock;
        sadd: jest.Mock;
        expire: jest.Mock;
        smembers: jest.Mock;
        scan: jest.Mock;
        info: jest.Mock;
        pipeline: jest.Mock;
        exec: jest.Mock;
    };

    beforeEach(() => {
        // Create mock Redis client
        mockRedis = {
            get: jest.fn(),
            setex: jest.fn(),
            del: jest.fn(),
            sadd: jest.fn(),
            expire: jest.fn(),
            smembers: jest.fn(),
            scan: jest.fn(),
            info: jest.fn(),
            pipeline: jest.fn(() => ({
                sadd: jest.fn().mockReturnThis(),
                expire: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue([]),
            })),
            exec: jest.fn(),
        };

        (getRedisClient as jest.Mock).mockReturnValue(mockRedis);
        cacheService = new CacheService();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('get', () => {
        it('should return null when Redis is not available', async () => {
            (getRedisClient as jest.Mock).mockReturnValue(null);
            const result = await cacheService.get('test-key');
            expect(result).toBeNull();
        });

        it('should return null when key does not exist', async () => {
            mockRedis.get.mockResolvedValue(null);
            const result = await cacheService.get('test-key');
            expect(result).toBeNull();
        });

        it('should return parsed value when key exists', async () => {
            const testData = { foo: 'bar', num: 42 };
            mockRedis.get.mockResolvedValue(JSON.stringify(testData));
            
            const result = await cacheService.get<typeof testData>('test-key');
            
            expect(result).toEqual(testData);
            expect(mockRedis.get).toHaveBeenCalledWith('spywatcher:test-key');
        });

        it('should handle JSON parse errors gracefully', async () => {
            mockRedis.get.mockResolvedValue('invalid-json');
            
            const result = await cacheService.get('test-key');
            
            expect(result).toBeNull();
        });
    });

    describe('set', () => {
        it('should do nothing when Redis is not available', async () => {
            (getRedisClient as jest.Mock).mockReturnValue(null);
            await cacheService.set('test-key', { foo: 'bar' });
            expect(mockRedis.setex).not.toHaveBeenCalled();
        });

        it('should set value with default TTL', async () => {
            const testData = { foo: 'bar' };
            mockRedis.setex.mockResolvedValue('OK');
            
            await cacheService.set('test-key', testData);
            
            expect(mockRedis.setex).toHaveBeenCalledWith(
                'spywatcher:test-key',
                300, // Default TTL
                JSON.stringify(testData)
            );
        });

        it('should set value with custom TTL', async () => {
            const testData = { foo: 'bar' };
            mockRedis.setex.mockResolvedValue('OK');
            
            await cacheService.set('test-key', testData, { ttl: 600 });
            
            expect(mockRedis.setex).toHaveBeenCalledWith(
                'spywatcher:test-key',
                600,
                JSON.stringify(testData)
            );
        });

        it('should store tags when provided', async () => {
            const testData = { foo: 'bar' };
            const mockPipeline = {
                sadd: jest.fn().mockReturnThis(),
                expire: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue([]),
            };
            mockRedis.pipeline.mockReturnValue(mockPipeline);
            mockRedis.setex.mockResolvedValue('OK');
            
            await cacheService.set('test-key', testData, { 
                ttl: 300, 
                tags: ['tag1', 'tag2'] 
            });
            
            expect(mockRedis.setex).toHaveBeenCalled();
            expect(mockRedis.pipeline).toHaveBeenCalled();
            expect(mockPipeline.sadd).toHaveBeenCalledTimes(2);
            expect(mockPipeline.expire).toHaveBeenCalledTimes(2);
            expect(mockPipeline.exec).toHaveBeenCalled();
        });
    });

    describe('delete', () => {
        it('should do nothing when Redis is not available', async () => {
            (getRedisClient as jest.Mock).mockReturnValue(null);
            await cacheService.delete('test-key');
            expect(mockRedis.del).not.toHaveBeenCalled();
        });

        it('should delete key', async () => {
            mockRedis.del.mockResolvedValue(1);
            
            await cacheService.delete('test-key');
            
            expect(mockRedis.del).toHaveBeenCalledWith('spywatcher:test-key');
        });
    });

    describe('deleteMany', () => {
        it('should do nothing when Redis is not available', async () => {
            (getRedisClient as jest.Mock).mockReturnValue(null);
            await cacheService.deleteMany(['key1', 'key2']);
            expect(mockRedis.del).not.toHaveBeenCalled();
        });

        it('should do nothing when keys array is empty', async () => {
            await cacheService.deleteMany([]);
            expect(mockRedis.del).not.toHaveBeenCalled();
        });

        it('should delete multiple keys', async () => {
            mockRedis.del.mockResolvedValue(2);
            
            await cacheService.deleteMany(['key1', 'key2']);
            
            expect(mockRedis.del).toHaveBeenCalledWith(
                'spywatcher:key1',
                'spywatcher:key2'
            );
        });
    });

    describe('invalidateByTag', () => {
        it('should return 0 when Redis is not available', async () => {
            (getRedisClient as jest.Mock).mockReturnValue(null);
            const result = await cacheService.invalidateByTag('test-tag');
            expect(result).toBe(0);
        });

        it('should return 0 when no keys found for tag', async () => {
            mockRedis.smembers.mockResolvedValue([]);
            
            const result = await cacheService.invalidateByTag('test-tag');
            
            expect(result).toBe(0);
            expect(mockRedis.smembers).toHaveBeenCalledWith('spywatcher:tag:test-tag');
        });

        it('should delete keys associated with tag', async () => {
            mockRedis.smembers.mockResolvedValue(['key1', 'key2', 'key3']);
            mockRedis.del.mockResolvedValue(3);
            
            const result = await cacheService.invalidateByTag('test-tag');
            
            expect(result).toBe(3);
            expect(mockRedis.del).toHaveBeenCalledWith('key1', 'key2', 'key3');
            expect(mockRedis.del).toHaveBeenCalledWith('spywatcher:tag:test-tag');
        });
    });

    describe('invalidateByTags', () => {
        it('should invalidate multiple tags', async () => {
            mockRedis.smembers
                .mockResolvedValueOnce(['key1', 'key2'])
                .mockResolvedValueOnce(['key3']);
            mockRedis.del.mockResolvedValue(1);
            
            const result = await cacheService.invalidateByTags(['tag1', 'tag2']);
            
            expect(result).toBe(3); // 2 keys from tag1 + 1 key from tag2
            expect(mockRedis.smembers).toHaveBeenCalledTimes(2);
        });

        it('should return 0 for empty tags array', async () => {
            const result = await cacheService.invalidateByTags([]);
            expect(result).toBe(0);
        });
    });

    describe('remember', () => {
        it('should return cached value if available', async () => {
            const cachedData = { foo: 'cached' };
            mockRedis.get.mockResolvedValue(JSON.stringify(cachedData));
            
            const callback = jest.fn().mockResolvedValue({ foo: 'fresh' });
            const result = await cacheService.remember('test-key', 300, callback);
            
            expect(result).toEqual(cachedData);
            expect(callback).not.toHaveBeenCalled();
        });

        it('should call callback and cache result on miss', async () => {
            mockRedis.get.mockResolvedValue(null);
            mockRedis.setex.mockResolvedValue('OK');
            const freshData = { foo: 'fresh' };
            const callback = jest.fn().mockResolvedValue(freshData);
            
            const result = await cacheService.remember('test-key', 300, callback);
            
            expect(result).toEqual(freshData);
            expect(callback).toHaveBeenCalled();
            expect(mockRedis.setex).toHaveBeenCalledWith(
                'spywatcher:test-key',
                300,
                JSON.stringify(freshData)
            );
        });

        it('should support tags in remember pattern', async () => {
            mockRedis.get.mockResolvedValue(null);
            mockRedis.setex.mockResolvedValue('OK');
            const mockPipeline = {
                sadd: jest.fn().mockReturnThis(),
                expire: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue([]),
            };
            mockRedis.pipeline.mockReturnValue(mockPipeline);
            
            const freshData = { foo: 'fresh' };
            const callback = jest.fn().mockResolvedValue(freshData);
            
            const result = await cacheService.remember(
                'test-key',
                300,
                callback,
                { tags: ['tag1'] }
            );
            
            expect(result).toEqual(freshData);
            expect(mockPipeline.sadd).toHaveBeenCalled();
        });
    });

    describe('clearPattern', () => {
        it('should return 0 when Redis is not available', async () => {
            (getRedisClient as jest.Mock).mockReturnValue(null);
            const result = await cacheService.clearPattern('test-*');
            expect(result).toBe(0);
        });

        it('should delete keys matching pattern', async () => {
            mockRedis.scan
                .mockResolvedValueOnce(['10', ['key1', 'key2']])
                .mockResolvedValueOnce(['0', ['key3']]);
            mockRedis.del.mockResolvedValue(1);
            
            const result = await cacheService.clearPattern('test-*');
            
            expect(result).toBe(3);
            expect(mockRedis.scan).toHaveBeenCalledTimes(2);
            expect(mockRedis.del).toHaveBeenCalledWith('key1', 'key2');
            expect(mockRedis.del).toHaveBeenCalledWith('key3');
        });
    });

    describe('getStats', () => {
        it('should return null when Redis is not available', async () => {
            (getRedisClient as jest.Mock).mockReturnValue(null);
            const stats = await cacheService.getStats();
            expect(stats).toBeNull();
        });

        it('should return cache statistics', async () => {
            mockRedis.info
                .mockResolvedValueOnce('keyspace_hits:1000\nkeyspace_misses:200\nevicted_keys:5')
                .mockResolvedValueOnce('used_memory_human:2.5M');
            mockRedis.scan.mockResolvedValue(['0', []]);
            
            const stats = await cacheService.getStats();
            
            expect(stats).toEqual({
                hits: 1000,
                misses: 200,
                hitRate: 83.33,
                memoryUsed: '2.5M',
                evictedKeys: 5,
                keyCount: 0,
            });
        });

        it('should calculate hit rate correctly', async () => {
            mockRedis.info
                .mockResolvedValueOnce('keyspace_hits:800\nkeyspace_misses:200\nevicted_keys:0')
                .mockResolvedValueOnce('used_memory_human:1M');
            mockRedis.scan.mockResolvedValue(['0', []]);
            
            const stats = await cacheService.getStats();
            
            expect(stats?.hitRate).toBe(80);
        });
    });

    describe('warm', () => {
        it('should do nothing when Redis is not available', async () => {
            (getRedisClient as jest.Mock).mockReturnValue(null);
            await cacheService.warm([
                { key: 'key1', value: { foo: 'bar' } }
            ]);
            expect(mockRedis.setex).not.toHaveBeenCalled();
        });

        it('should warm cache with entries', async () => {
            mockRedis.setex.mockResolvedValue('OK');
            
            await cacheService.warm([
                { key: 'key1', value: { foo: 'bar' }, options: { ttl: 600 } },
                { key: 'key2', value: { baz: 'qux' } },
            ]);
            
            expect(mockRedis.setex).toHaveBeenCalledTimes(2);
        });
    });
});
