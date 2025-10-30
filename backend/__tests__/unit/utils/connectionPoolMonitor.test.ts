/**
 * Tests for Connection Pool Monitor
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies
jest.mock('../../../src/db');
jest.mock('../../../src/utils/redis');

import * as db from '../../../src/db';
import {
    getSystemHealth,
    getConnectionPoolStats,
    getConnectionPoolAlerts,
    isConnectionPoolOverloaded,
} from '../../../src/utils/connectionPoolMonitor';
import * as redis from '../../../src/utils/redis';

describe('Connection Pool Monitor', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getSystemHealth', () => {
        it('should return healthy status when all systems are operational', async () => {
            // Mock database health check
            jest.spyOn(db, 'checkDatabaseHealth').mockResolvedValue({
                healthy: true,
                responseTime: 15,
            });

            // Mock connection pool metrics
            jest.spyOn(db, 'getConnectionPoolMetrics').mockResolvedValue({
                active: 3,
                idle: 2,
                total: 5,
                max: 100,
                utilizationPercent: '5.00',
                isPgBouncer: true,
                isShuttingDown: false,
            });

            // Mock Redis metrics
            jest.spyOn(redis, 'getRedisMetrics').mockResolvedValue({
                available: true,
                connected: true,
                status: 'ready',
                totalConnectionsReceived: '100',
                totalCommandsProcessed: '5000',
                instantaneousOpsPerSec: '25',
                usedMemory: '2MB',
            });

            jest.spyOn(redis, 'isRedisAvailable').mockResolvedValue(true);

            const health = await getSystemHealth();

            expect(health.healthy).toBe(true);
            expect(health.database.healthy).toBe(true);
            expect(health.database.responseTime).toBe(15);
            expect(health.database.connectionPool?.active).toBe(3);
            expect(health.database.connectionPool?.isPgBouncer).toBe(true);
            expect(health.redis.available).toBe(true);
            expect(health.redis.connected).toBe(true);
        });

        it('should return unhealthy status when database is down', async () => {
            jest.spyOn(db, 'checkDatabaseHealth').mockResolvedValue({
                healthy: false,
                error: 'Connection refused',
            });

            jest.spyOn(db, 'getConnectionPoolMetrics').mockResolvedValue({
                active: 0,
                idle: 0,
                total: 0,
                max: 100,
                utilizationPercent: '0',
                isPgBouncer: false,
                isShuttingDown: false,
                error: 'Connection refused',
            });

            jest.spyOn(redis, 'getRedisMetrics').mockResolvedValue({
                available: true,
                connected: true,
            });

            jest.spyOn(redis, 'isRedisAvailable').mockResolvedValue(true);

            const health = await getSystemHealth();

            expect(health.healthy).toBe(false);
            expect(health.database.healthy).toBe(false);
            expect(health.database.error).toBeDefined();
        });
    });

    describe('getConnectionPoolStats', () => {
        it('should return connection pool statistics', async () => {
            jest.spyOn(db, 'getConnectionPoolMetrics').mockResolvedValue({
                active: 10,
                idle: 5,
                total: 15,
                max: 100,
                utilizationPercent: '15.00',
                isPgBouncer: true,
                isShuttingDown: false,
            });

            jest.spyOn(redis, 'getRedisMetrics').mockResolvedValue({
                available: true,
                connected: true,
            });

            const stats = await getConnectionPoolStats();

            expect(stats.database.utilizationPercent).toBe(15.0);
            expect(stats.database.activeConnections).toBe(10);
            expect(stats.database.maxConnections).toBe(100);
            expect(stats.database.isHealthy).toBe(true);
            expect(stats.redis.available).toBe(true);
        });

        it('should handle database errors gracefully', async () => {
            jest.spyOn(db, 'getConnectionPoolMetrics').mockResolvedValue({
                active: 0,
                idle: 0,
                total: 0,
                max: 0,
                utilizationPercent: '0',
                isPgBouncer: false,
                isShuttingDown: false,
                error: 'Database error',
            });

            jest.spyOn(redis, 'getRedisMetrics').mockResolvedValue({
                available: false,
                connected: false,
            });

            const stats = await getConnectionPoolStats();

            expect(stats.database.isHealthy).toBe(false);
            expect(stats.redis.available).toBe(false);
        });
    });

    describe('isConnectionPoolOverloaded', () => {
        it('should return true when utilization exceeds threshold', async () => {
            jest.spyOn(db, 'getConnectionPoolMetrics').mockResolvedValue({
                active: 85,
                idle: 5,
                total: 90,
                max: 100,
                utilizationPercent: '90.00',
                isPgBouncer: true,
                isShuttingDown: false,
            });

            jest.spyOn(redis, 'getRedisMetrics').mockResolvedValue({
                available: true,
                connected: true,
            });

            const isOverloaded = await isConnectionPoolOverloaded(80);

            expect(isOverloaded).toBe(true);
        });

        it('should return false when utilization is below threshold', async () => {
            jest.spyOn(db, 'getConnectionPoolMetrics').mockResolvedValue({
                active: 50,
                idle: 20,
                total: 70,
                max: 100,
                utilizationPercent: '70.00',
                isPgBouncer: true,
                isShuttingDown: false,
            });

            jest.spyOn(redis, 'getRedisMetrics').mockResolvedValue({
                available: true,
                connected: true,
            });

            const isOverloaded = await isConnectionPoolOverloaded(80);

            expect(isOverloaded).toBe(false);
        });
    });

    describe('getConnectionPoolAlerts', () => {
        it('should return critical alert when utilization >= 90%', async () => {
            jest.spyOn(db, 'getConnectionPoolMetrics').mockResolvedValue({
                active: 90,
                idle: 5,
                total: 95,
                max: 100,
                utilizationPercent: '95.00',
                isPgBouncer: true,
                isShuttingDown: false,
            });

            jest.spyOn(redis, 'getRedisMetrics').mockResolvedValue({
                available: true,
                connected: true,
            });

            const alerts = await getConnectionPoolAlerts();

            expect(alerts).toHaveLength(1);
            expect(alerts[0]).toContain('CRITICAL');
            expect(alerts[0]).toContain('95');
        });

        it('should return warning alert when utilization >= 80%', async () => {
            jest.spyOn(db, 'getConnectionPoolMetrics').mockResolvedValue({
                active: 82,
                idle: 8,
                total: 85,
                max: 100,
                utilizationPercent: '85.00',
                isPgBouncer: true,
                isShuttingDown: false,
            });

            jest.spyOn(redis, 'getRedisMetrics').mockResolvedValue({
                available: true,
                connected: true,
            });

            const alerts = await getConnectionPoolAlerts();

            expect(alerts).toHaveLength(1);
            expect(alerts[0]).toContain('WARNING');
            expect(alerts[0]).toContain('85');
        });

        it('should return no alerts when utilization is healthy', async () => {
            jest.spyOn(db, 'getConnectionPoolMetrics').mockResolvedValue({
                active: 20,
                idle: 10,
                total: 30,
                max: 100,
                utilizationPercent: '30.00',
                isPgBouncer: true,
                isShuttingDown: false,
            });

            jest.spyOn(redis, 'getRedisMetrics').mockResolvedValue({
                available: true,
                connected: true,
            });

            const alerts = await getConnectionPoolAlerts();

            expect(alerts).toHaveLength(0);
        });

        it('should include Redis alerts when configured but unavailable', async () => {
            // Set Redis URL environment variable
            process.env.REDIS_URL = 'redis://localhost:6379';

            jest.spyOn(db, 'getConnectionPoolMetrics').mockResolvedValue({
                active: 10,
                idle: 5,
                total: 15,
                max: 100,
                utilizationPercent: '15.00',
                isPgBouncer: true,
                isShuttingDown: false,
            });

            jest.spyOn(redis, 'getRedisMetrics').mockResolvedValue({
                available: false,
                connected: false,
            });

            const alerts = await getConnectionPoolAlerts();

            const redisAlerts = alerts.filter((a) => a.includes('Redis'));
            expect(redisAlerts.length).toBeGreaterThan(0);

            // Clean up
            delete process.env.REDIS_URL;
        });
    });
});
