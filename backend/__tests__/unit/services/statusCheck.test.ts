/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '../../../src/db';
import {
    performHealthCheck,
    recordStatusCheck,
    getUptimePercentage,
    getHistoricalStatus,
    cleanupOldStatusChecks,
} from '../../../src/services/statusCheck';

// Mock dependencies
jest.mock('../../../src/db', () => ({
    db: {
        $queryRaw: jest.fn(),
        statusCheck: {
            create: jest.fn(),
            count: jest.fn(),
            findMany: jest.fn(),
            deleteMany: jest.fn(),
        },
    },
}));

jest.mock('../../../src/utils/redis', () => ({
    getRedisClient: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('Status Check Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('performHealthCheck', () => {
        it('should return healthy status when all services are up', async () => {
            // Mock successful database check
            (db.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

            // Mock successful Redis check (not configured)
            const { getRedisClient } = require('../../../src/utils/redis');
            getRedisClient.mockReturnValue(null);

            // Mock successful Discord API check
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
            });

            const result = await performHealthCheck();

            expect(result.overall).toBe(true);
            expect(result.database.healthy).toBe(true);
            expect(result.redis.healthy).toBe(true);
            expect(result.discord.healthy).toBe(true);
            expect(result.database.latency).toBeGreaterThanOrEqual(0);
        });

        it('should return unhealthy when database is down', async () => {
            // Mock failed database check
            (db.$queryRaw as jest.Mock).mockRejectedValue(
                new Error('Connection failed')
            );

            // Mock successful Redis check (not configured)
            const { getRedisClient } = require('../../../src/utils/redis');
            getRedisClient.mockReturnValue(null);

            // Mock successful Discord API check
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
            });

            const result = await performHealthCheck();

            expect(result.overall).toBe(false);
            expect(result.database.healthy).toBe(false);
            expect(result.database.error).toBe('Connection failed');
        });

        it('should measure latency for all services', async () => {
            // Mock successful database check
            (db.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

            // Mock successful Redis check
            const mockRedis = {
                ping: jest.fn().mockResolvedValue('PONG'),
            };
            const { getRedisClient } = require('../../../src/utils/redis');
            getRedisClient.mockReturnValue(mockRedis);

            // Mock successful Discord API check
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
            });

            const result = await performHealthCheck();

            expect(result.database.latency).toBeDefined();
            expect(result.redis.latency).toBeDefined();
            expect(result.discord.latency).toBeDefined();
            expect(result.database.latency).toBeGreaterThanOrEqual(0);
            expect(result.redis.latency).toBeGreaterThanOrEqual(0);
            expect(result.discord.latency).toBeGreaterThanOrEqual(0);
        });
    });

    describe('recordStatusCheck', () => {
        it('should record a healthy status check', async () => {
            const healthStatus = {
                database: { healthy: true, latency: 10 },
                redis: { healthy: true, latency: 5 },
                discord: { healthy: true, latency: 50 },
                overall: true,
            };

            await recordStatusCheck(healthStatus);

            expect(db.statusCheck.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    status: 'healthy',
                    database: true,
                    databaseLatency: 10,
                    redis: true,
                    redisLatency: 5,
                    discord: true,
                    discordLatency: 50,
                    overall: true,
                }),
            });
        });

        it('should record a degraded status when database is healthy but others fail', async () => {
            const healthStatus = {
                database: { healthy: true, latency: 10 },
                redis: { healthy: false, latency: 100, error: 'Timeout' },
                discord: { healthy: false, latency: 200, error: 'Network error' },
                overall: false,
            };

            await recordStatusCheck(healthStatus);

            expect(db.statusCheck.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    status: 'degraded',
                    database: true,
                    redis: false,
                    discord: false,
                    overall: false,
                }),
            });
        });

        it('should record a down status when database fails', async () => {
            const healthStatus = {
                database: { healthy: false, latency: 500, error: 'Connection refused' },
                redis: { healthy: true, latency: 5 },
                discord: { healthy: true, latency: 50 },
                overall: false,
            };

            await recordStatusCheck(healthStatus);

            expect(db.statusCheck.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    status: 'down',
                    database: false,
                }),
            });
        });

        it('should not throw error if recording fails', async () => {
            const healthStatus = {
                database: { healthy: true, latency: 10 },
                redis: { healthy: true, latency: 5 },
                discord: { healthy: true, latency: 50 },
                overall: true,
            };

            (db.statusCheck.create as jest.Mock).mockRejectedValue(
                new Error('Database error')
            );

            // Should not throw
            await expect(recordStatusCheck(healthStatus)).resolves.not.toThrow();
        });
    });

    describe('getUptimePercentage', () => {
        it('should calculate uptime percentage correctly', async () => {
            (db.statusCheck.count as jest.Mock)
                .mockResolvedValueOnce(100) // total checks
                .mockResolvedValueOnce(95); // healthy checks

            const uptime = await getUptimePercentage(24);

            expect(uptime).toBe(95);
        });

        it('should return 100% when no checks exist', async () => {
            (db.statusCheck.count as jest.Mock)
                .mockResolvedValueOnce(0) // total checks
                .mockResolvedValueOnce(0); // healthy checks

            const uptime = await getUptimePercentage(24);

            expect(uptime).toBe(100);
        });

        it('should handle errors gracefully', async () => {
            (db.statusCheck.count as jest.Mock).mockRejectedValue(
                new Error('Database error')
            );

            const uptime = await getUptimePercentage(24);

            expect(uptime).toBe(100); // Returns 100 on error
        });
    });

    describe('getHistoricalStatus', () => {
        it('should return historical status checks', async () => {
            const mockData = [
                {
                    id: '1',
                    timestamp: new Date(),
                    status: 'healthy',
                    database: true,
                    databaseLatency: 10,
                    redis: true,
                    redisLatency: 5,
                    discord: true,
                    discordLatency: 50,
                    overall: true,
                },
            ];

            (db.statusCheck.findMany as jest.Mock).mockResolvedValue(mockData);

            const result = await getHistoricalStatus(100);

            expect(result).toEqual(mockData);
            expect(db.statusCheck.findMany).toHaveBeenCalledWith({
                take: 100,
                orderBy: {
                    timestamp: 'desc',
                },
                select: expect.any(Object),
            });
        });

        it('should return empty array on error', async () => {
            (db.statusCheck.findMany as jest.Mock).mockRejectedValue(
                new Error('Database error')
            );

            const result = await getHistoricalStatus(100);

            expect(result).toEqual([]);
        });
    });

    describe('cleanupOldStatusChecks', () => {
        it('should delete old status checks', async () => {
            (db.statusCheck.deleteMany as jest.Mock).mockResolvedValue({
                count: 50,
            });

            const result = await cleanupOldStatusChecks();

            expect(result).toBe(50);
            expect(db.statusCheck.deleteMany).toHaveBeenCalledWith({
                where: {
                    timestamp: {
                        lt: expect.any(Date),
                    },
                },
            });
        });

        it('should return 0 on error', async () => {
            (db.statusCheck.deleteMany as jest.Mock).mockRejectedValue(
                new Error('Database error')
            );

            const result = await cleanupOldStatusChecks();

            expect(result).toBe(0);
        });
    });
});
