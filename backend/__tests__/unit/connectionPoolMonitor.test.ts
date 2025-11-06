/**
 * Unit tests for Connection Pool Monitor
 */

import * as db from '../../src/db';
import * as redis from '../../src/utils/redis';
import {
    getSystemHealth,
    getConnectionPoolStats,
    getConnectionPoolAlerts,
    isConnectionPoolOverloaded,
} from '../../src/utils/connectionPoolMonitor';

// Mock dependencies
jest.mock('../../src/db', () => ({
    checkDatabaseHealth: jest.fn(),
    getConnectionPoolMetrics: jest.fn(),
}));

jest.mock('../../src/utils/redis', () => ({
    getRedisMetrics: jest.fn(),
    isRedisAvailable: jest.fn(),
}));

describe('Connection Pool Monitor', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Clear environment variables
        delete process.env.REDIS_URL;
    });

    describe('getSystemHealth', () => {
        it('should return healthy status when all services are healthy', async () => {
            const mockDbHealth = {
                healthy: true,
                responseTime: 10,
            };

            const mockDbMetrics = {
                active: 5,
                idle: 3,
                total: 8,
                max: 100,
                utilizationPercent: '8.00',
                isPgBouncer: true,
                isShuttingDown: false,
            };

            const mockRedisMetrics = {
                available: true,
                connected: true,
                status: 'ready',
            };

            jest.spyOn(db, 'checkDatabaseHealth').mockResolvedValue(
                mockDbHealth
            );
            jest.spyOn(db, 'getConnectionPoolMetrics').mockResolvedValue(
                mockDbMetrics
            );
            jest.spyOn(redis, 'getRedisMetrics').mockResolvedValue(
                mockRedisMetrics
            );
            jest.spyOn(redis, 'isRedisAvailable').mockResolvedValue(true);

            const health = await getSystemHealth();

            expect(health.healthy).toBe(true);
            expect(health.database.healthy).toBe(true);
            expect(health.database.connectionPool?.active).toBe(5);
            expect(health.database.connectionPool?.isPgBouncer).toBe(true);
            expect(health.redis.available).toBe(true);
            expect(health.timestamp).toBeDefined();
        });

        it('should return unhealthy status when database is down', async () => {
            const mockDbHealth = {
                healthy: false,
                error: 'Connection refused',
            };

            const mockDbMetrics = {
                active: 0,
                idle: 0,
                total: 0,
                max: 100,
                utilizationPercent: '0',
                isPgBouncer: false,
                isShuttingDown: false,
                error: 'Connection failed',
            };

            const mockRedisMetrics = {
                available: false,
                connected: false,
            };

            jest.spyOn(db, 'checkDatabaseHealth').mockResolvedValue(
                mockDbHealth
            );
            jest.spyOn(db, 'getConnectionPoolMetrics').mockResolvedValue(
                mockDbMetrics
            );
            jest.spyOn(redis, 'getRedisMetrics').mockResolvedValue(
                mockRedisMetrics
            );
            jest.spyOn(redis, 'isRedisAvailable').mockResolvedValue(false);

            const health = await getSystemHealth();

            expect(health.healthy).toBe(false);
            expect(health.database.healthy).toBe(false);
            expect(health.database.error).toBe('Connection refused');
        });

        it('should handle Redis being optional', async () => {
            const mockDbHealth = {
                healthy: true,
                responseTime: 10,
            };

            const mockDbMetrics = {
                active: 5,
                idle: 3,
                total: 8,
                max: 100,
                utilizationPercent: '8.00',
                isPgBouncer: false,
                isShuttingDown: false,
            };

            const mockRedisMetrics = {
                available: false,
                connected: false,
            };

            jest.spyOn(db, 'checkDatabaseHealth').mockResolvedValue(
                mockDbHealth
            );
            jest.spyOn(db, 'getConnectionPoolMetrics').mockResolvedValue(
                mockDbMetrics
            );
            jest.spyOn(redis, 'getRedisMetrics').mockResolvedValue(
                mockRedisMetrics
            );
            jest.spyOn(redis, 'isRedisAvailable').mockResolvedValue(false);

            const health = await getSystemHealth();

            expect(health.healthy).toBe(true); // Still healthy without Redis
            expect(health.database.healthy).toBe(true);
            expect(health.redis.available).toBe(false);
        });
    });

    describe('getConnectionPoolStats', () => {
        it('should return connection pool statistics', async () => {
            const mockDbMetrics = {
                active: 10,
                idle: 5,
                total: 15,
                max: 100,
                utilizationPercent: '15.00',
                isPgBouncer: true,
                isShuttingDown: false,
            };

            const mockRedisMetrics = {
                available: true,
                connected: true,
                status: 'ready',
            };

            jest.spyOn(db, 'getConnectionPoolMetrics').mockResolvedValue(
                mockDbMetrics
            );
            jest.spyOn(redis, 'getRedisMetrics').mockResolvedValue(
                mockRedisMetrics
            );

            const stats = await getConnectionPoolStats();

            expect(stats.database.utilizationPercent).toBe(15.0);
            expect(stats.database.activeConnections).toBe(10);
            expect(stats.database.maxConnections).toBe(100);
            expect(stats.database.isHealthy).toBe(true);
            expect(stats.redis.available).toBe(true);
        });

        it('should handle database errors gracefully', async () => {
            const mockDbMetrics = {
                active: 0,
                idle: 0,
                total: 0,
                max: 0,
                utilizationPercent: '0',
                isPgBouncer: false,
                isShuttingDown: false,
                error: 'Connection failed',
            };

            const mockRedisMetrics = {
                available: false,
                connected: false,
            };

            jest.spyOn(db, 'getConnectionPoolMetrics').mockResolvedValue(
                mockDbMetrics
            );
            jest.spyOn(redis, 'getRedisMetrics').mockResolvedValue(
                mockRedisMetrics
            );

            const stats = await getConnectionPoolStats();

            expect(stats.database.isHealthy).toBe(false);
            expect(stats.database.utilizationPercent).toBe(0);
        });
    });

    describe('getConnectionPoolAlerts', () => {
        it('should return warning when utilization is between 80-90%', async () => {
            const mockDbMetrics = {
                active: 85,
                idle: 0,
                total: 85,
                max: 100,
                utilizationPercent: '85.00',
                isPgBouncer: true,
                isShuttingDown: false,
            };

            const mockRedisMetrics = {
                available: true,
                connected: true,
            };

            jest.spyOn(db, 'getConnectionPoolMetrics').mockResolvedValue(
                mockDbMetrics
            );
            jest.spyOn(redis, 'getRedisMetrics').mockResolvedValue(
                mockRedisMetrics
            );

            const alerts = await getConnectionPoolAlerts();

            expect(alerts).toHaveLength(1);
            expect(alerts[0]).toContain('WARNING');
            expect(alerts[0]).toContain('85%');
        });

        it('should return critical alert when utilization is above 90%', async () => {
            const mockDbMetrics = {
                active: 92,
                idle: 0,
                total: 92,
                max: 100,
                utilizationPercent: '92.00',
                isPgBouncer: true,
                isShuttingDown: false,
            };

            const mockRedisMetrics = {
                available: true,
                connected: true,
            };

            jest.spyOn(db, 'getConnectionPoolMetrics').mockResolvedValue(
                mockDbMetrics
            );
            jest.spyOn(redis, 'getRedisMetrics').mockResolvedValue(
                mockRedisMetrics
            );

            const alerts = await getConnectionPoolAlerts();

            expect(alerts).toHaveLength(1);
            expect(alerts[0]).toContain('CRITICAL');
            expect(alerts[0]).toContain('92%');
        });

        it('should return no alerts when utilization is low', async () => {
            const mockDbMetrics = {
                active: 10,
                idle: 5,
                total: 15,
                max: 100,
                utilizationPercent: '15.00',
                isPgBouncer: true,
                isShuttingDown: false,
            };

            const mockRedisMetrics = {
                available: true,
                connected: true,
            };

            jest.spyOn(db, 'getConnectionPoolMetrics').mockResolvedValue(
                mockDbMetrics
            );
            jest.spyOn(redis, 'getRedisMetrics').mockResolvedValue(
                mockRedisMetrics
            );

            const alerts = await getConnectionPoolAlerts();

            expect(alerts).toHaveLength(0);
        });

        it('should alert when Redis is configured but unavailable', async () => {
            process.env.REDIS_URL = 'redis://localhost:6379';

            const mockDbMetrics = {
                active: 10,
                idle: 5,
                total: 15,
                max: 100,
                utilizationPercent: '15.00',
                isPgBouncer: true,
                isShuttingDown: false,
            };

            const mockRedisMetrics = {
                available: false,
                connected: false,
            };

            jest.spyOn(db, 'getConnectionPoolMetrics').mockResolvedValue(
                mockDbMetrics
            );
            jest.spyOn(redis, 'getRedisMetrics').mockResolvedValue(
                mockRedisMetrics
            );

            const alerts = await getConnectionPoolAlerts();

            expect(alerts.length).toBeGreaterThan(0);
            expect(alerts.some((a) => a.includes('Redis'))).toBe(true);
        });
    });

    describe('isConnectionPoolOverloaded', () => {
        it('should return true when utilization exceeds threshold', async () => {
            const mockDbMetrics = {
                active: 85,
                idle: 0,
                total: 85,
                max: 100,
                utilizationPercent: '85.00',
                isPgBouncer: true,
                isShuttingDown: false,
            };

            const mockRedisMetrics = {
                available: true,
                connected: true,
            };

            jest.spyOn(db, 'getConnectionPoolMetrics').mockResolvedValue(
                mockDbMetrics
            );
            jest.spyOn(redis, 'getRedisMetrics').mockResolvedValue(
                mockRedisMetrics
            );

            const isOverloaded = await isConnectionPoolOverloaded(80);

            expect(isOverloaded).toBe(true);
        });

        it('should return false when utilization is below threshold', async () => {
            const mockDbMetrics = {
                active: 50,
                idle: 10,
                total: 60,
                max: 100,
                utilizationPercent: '60.00',
                isPgBouncer: true,
                isShuttingDown: false,
            };

            const mockRedisMetrics = {
                available: true,
                connected: true,
            };

            jest.spyOn(db, 'getConnectionPoolMetrics').mockResolvedValue(
                mockDbMetrics
            );
            jest.spyOn(redis, 'getRedisMetrics').mockResolvedValue(
                mockRedisMetrics
            );

            const isOverloaded = await isConnectionPoolOverloaded(80);

            expect(isOverloaded).toBe(false);
        });

        it('should use default threshold of 80% when not specified', async () => {
            const mockDbMetrics = {
                active: 81,
                idle: 0,
                total: 81,
                max: 100,
                utilizationPercent: '81.00',
                isPgBouncer: true,
                isShuttingDown: false,
            };

            const mockRedisMetrics = {
                available: true,
                connected: true,
            };

            jest.spyOn(db, 'getConnectionPoolMetrics').mockResolvedValue(
                mockDbMetrics
            );
            jest.spyOn(redis, 'getRedisMetrics').mockResolvedValue(
                mockRedisMetrics
            );

            const isOverloaded = await isConnectionPoolOverloaded();

            expect(isOverloaded).toBe(true);
        });
    });
});
