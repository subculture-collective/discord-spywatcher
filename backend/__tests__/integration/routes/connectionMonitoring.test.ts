/**
 * Integration tests for Connection Monitoring Routes
 */

import express from 'express';
import request from 'supertest';

import * as db from '../../../src/db';
import monitoringRoutes from '../../../src/routes/monitoring';

// Mock dependencies
jest.mock('../../../src/db', () => ({
    db: {
        $queryRaw: jest.fn(),
    },
    checkDatabaseHealth: jest.fn(),
    getConnectionPoolMetrics: jest.fn(),
}));

jest.mock('../../../src/utils/redis', () => ({
    getRedisClient: jest.fn(() => null),
    getRedisMetrics: jest.fn(),
    isRedisAvailable: jest.fn(),
}));

jest.mock('../../../src/utils/connectionPoolMonitor', () => ({
    getSystemHealth: jest.fn(),
    getConnectionPoolStats: jest.fn(),
    getConnectionPoolAlerts: jest.fn(),
}));

// Mock authentication middleware
jest.mock('../../../src/middleware/auth', () => ({
    requireAuth: (req: any, _res: any, next: any) => {
        req.user = { id: 'test-admin', username: 'admin', role: 'ADMIN' };
        next();
    },
    requireRole: () => (_req: any, _res: any, next: any) => next(),
}));

// Mock other dependencies
jest.mock('../../../src/middleware/slowQueryLogger', () => ({
    getSlowQueryLogs: jest.fn(() => ({ logs: [], total: 0 })),
    getSlowQueryStats: jest.fn(() => ({ totalQueries: 0 })),
    clearSlowQueryLogs: jest.fn(),
}));

jest.mock('../../../src/services/cache', () => ({
    cache: {
        getStats: jest.fn(),
        flushAll: jest.fn(),
        invalidateByTag: jest.fn(),
    },
}));

jest.mock('../../../src/utils/databaseMaintenance', () => ({
    checkDatabaseHealth: jest.fn(),
    getTableStats: jest.fn(),
    getIndexUsageStats: jest.fn(),
    getUnusedIndexes: jest.fn(),
    getSlowQueries: jest.fn(),
    generateMaintenanceReport: jest.fn(),
    analyzeAllTables: jest.fn(),
}));

import * as connectionPoolMonitor from '../../../src/utils/connectionPoolMonitor';

describe('Connection Monitoring Routes', () => {
    let app: express.Application;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/api/admin/monitoring', monitoringRoutes);
        jest.clearAllMocks();
    });

    describe('GET /connections/health', () => {
        it('should return system health status', async () => {
            const mockHealth = {
                healthy: true,
                timestamp: new Date().toISOString(),
                database: {
                    healthy: true,
                    responseTime: 12,
                    connectionPool: {
                        active: 3,
                        idle: 2,
                        total: 5,
                        max: 100,
                        utilizationPercent: '5.00',
                        isPgBouncer: true,
                        isShuttingDown: false,
                    },
                },
                redis: {
                    available: true,
                    connected: true,
                    status: 'ready',
                },
            };

            jest.spyOn(connectionPoolMonitor, 'getSystemHealth').mockResolvedValue(
                mockHealth
            );

            const response = await request(app).get(
                '/api/admin/monitoring/connections/health'
            );

            expect(response.status).toBe(200);
            expect(response.body.healthy).toBe(true);
            expect(response.body.database.healthy).toBe(true);
            expect(response.body.database.connectionPool.active).toBe(3);
            expect(response.body.redis.available).toBe(true);
        });

        it('should handle errors gracefully', async () => {
            jest.spyOn(connectionPoolMonitor, 'getSystemHealth').mockRejectedValue(
                new Error('Database connection failed')
            );

            const response = await request(app).get(
                '/api/admin/monitoring/connections/health'
            );

            expect(response.status).toBe(500);
            expect(response.body.error).toBeDefined();
        });
    });

    describe('GET /connections/pool', () => {
        it('should return connection pool statistics', async () => {
            const mockStats = {
                database: {
                    utilizationPercent: 15.0,
                    activeConnections: 10,
                    maxConnections: 100,
                    isHealthy: true,
                },
                redis: {
                    available: true,
                    connected: true,
                },
            };

            jest.spyOn(
                connectionPoolMonitor,
                'getConnectionPoolStats'
            ).mockResolvedValue(mockStats);

            const response = await request(app).get(
                '/api/admin/monitoring/connections/pool'
            );

            expect(response.status).toBe(200);
            expect(response.body.database.utilizationPercent).toBe(15.0);
            expect(response.body.database.activeConnections).toBe(10);
            expect(response.body.redis.available).toBe(true);
        });

        it('should handle errors gracefully', async () => {
            jest.spyOn(
                connectionPoolMonitor,
                'getConnectionPoolStats'
            ).mockRejectedValue(new Error('Failed to get stats'));

            const response = await request(app).get(
                '/api/admin/monitoring/connections/pool'
            );

            expect(response.status).toBe(500);
            expect(response.body.error).toBeDefined();
        });
    });

    describe('GET /connections/alerts', () => {
        it('should return connection pool alerts', async () => {
            const mockAlerts = [
                'WARNING: Database connection pool at 85% utilization',
            ];

            jest.spyOn(
                connectionPoolMonitor,
                'getConnectionPoolAlerts'
            ).mockResolvedValue(mockAlerts);

            const response = await request(app).get(
                '/api/admin/monitoring/connections/alerts'
            );

            expect(response.status).toBe(200);
            expect(response.body.alerts).toHaveLength(1);
            expect(response.body.alerts[0]).toContain('WARNING');
            expect(response.body.count).toBe(1);
            expect(response.body.timestamp).toBeDefined();
        });

        it('should return empty array when no alerts', async () => {
            jest.spyOn(
                connectionPoolMonitor,
                'getConnectionPoolAlerts'
            ).mockResolvedValue([]);

            const response = await request(app).get(
                '/api/admin/monitoring/connections/alerts'
            );

            expect(response.status).toBe(200);
            expect(response.body.alerts).toHaveLength(0);
            expect(response.body.count).toBe(0);
        });

        it('should handle errors gracefully', async () => {
            jest.spyOn(
                connectionPoolMonitor,
                'getConnectionPoolAlerts'
            ).mockRejectedValue(new Error('Failed to get alerts'));

            const response = await request(app).get(
                '/api/admin/monitoring/connections/alerts'
            );

            expect(response.status).toBe(500);
            expect(response.body.error).toBeDefined();
        });
    });

    describe('Database health endpoint', () => {
        it('should return database health status', async () => {
            const mockHealth = {
                connected: true,
                version: '15.3',
                responseTime: 8,
            };

            jest.spyOn(db, 'checkDatabaseHealth').mockResolvedValue(mockHealth);

            const response = await request(app).get(
                '/api/admin/monitoring/database/health'
            );

            expect(response.status).toBe(200);
            expect(response.body.connected).toBe(true);
        });
    });
});
