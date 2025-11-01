/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
import express, { Application } from 'express';
import request from 'supertest';

import statusRoutes from '../../../src/routes/status';

// Mock the database
jest.mock('../../../src/db', () => ({
    db: {
        statusCheck: {
            findMany: jest.fn(),
            count: jest.fn(),
        },
        incident: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
        },
    },
}));

// Mock the status check service
jest.mock('../../../src/services/statusCheck', () => ({
    performHealthCheck: jest.fn(),
    getUptimePercentage: jest.fn(),
    getHistoricalStatus: jest.fn(),
}));

describe('Status Routes', () => {
    let app: Application;
    let mockDb: any;
    let mockStatusCheckService: any;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.use('/api/status', statusRoutes);

        mockDb = require('../../../src/db').db;
        mockStatusCheckService = require('../../../src/services/statusCheck');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/status', () => {
        it('should return current system status', async () => {
            // Mock health check
            mockStatusCheckService.performHealthCheck.mockResolvedValue({
                database: { healthy: true, latency: 10 },
                redis: { healthy: true, latency: 5 },
                discord: { healthy: true, latency: 50 },
                overall: true,
            });

            // Mock uptime
            mockStatusCheckService.getUptimePercentage
                .mockResolvedValueOnce(99.9)
                .mockResolvedValueOnce(99.5)
                .mockResolvedValueOnce(99.0);

            // Mock no active incidents
            mockDb.incident.findMany.mockResolvedValue([]);

            const response = await request(app).get('/api/status');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status', 'healthy');
            expect(response.body).toHaveProperty('services');
            expect(response.body.services.database).toEqual({
                status: 'operational',
                latency: 10,
            });
            expect(response.body).toHaveProperty('uptime');
            expect(response.body.uptime['24h']).toBe(99.9);
            expect(response.body.uptime['7d']).toBe(99.5);
            expect(response.body.uptime['30d']).toBe(99.0);
        });

        it('should return degraded status when services are unhealthy', async () => {
            mockStatusCheckService.performHealthCheck.mockResolvedValue({
                database: { healthy: true, latency: 10 },
                redis: { healthy: false, latency: 500 },
                discord: { healthy: true, latency: 50 },
                overall: false,
            });

            mockStatusCheckService.getUptimePercentage
                .mockResolvedValueOnce(95.0)
                .mockResolvedValueOnce(96.0)
                .mockResolvedValueOnce(97.0);

            mockDb.incident.findMany.mockResolvedValue([]);

            const response = await request(app).get('/api/status');

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('degraded');
            expect(response.body.services.redis.status).toBe('down');
        });

        it('should show critical incident status', async () => {
            mockStatusCheckService.performHealthCheck.mockResolvedValue({
                database: { healthy: true, latency: 10 },
                redis: { healthy: true, latency: 5 },
                discord: { healthy: true, latency: 50 },
                overall: true,
            });

            mockStatusCheckService.getUptimePercentage
                .mockResolvedValue(99.9);

            mockDb.incident.findMany.mockResolvedValue([
                {
                    id: '1',
                    title: 'Critical outage',
                    status: 'INVESTIGATING',
                    severity: 'CRITICAL',
                    startedAt: new Date(),
                    affectedServices: ['database'],
                },
            ]);

            const response = await request(app).get('/api/status');

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('down');
            expect(response.body.incidents.critical).toBe(1);
        });
    });

    describe('GET /api/status/history', () => {
        it('should return historical status data', async () => {
            const mockHistory = [
                {
                    timestamp: new Date('2024-01-01T00:00:00Z'),
                    status: 'healthy',
                    overall: true,
                    database: true,
                    databaseLatency: 10,
                    redis: true,
                    redisLatency: 5,
                    discord: true,
                    discordLatency: 50,
                },
                {
                    timestamp: new Date('2024-01-01T00:05:00Z'),
                    status: 'healthy',
                    overall: true,
                    database: true,
                    databaseLatency: 12,
                    redis: true,
                    redisLatency: 6,
                    discord: true,
                    discordLatency: 55,
                },
            ];

            mockDb.statusCheck.findMany.mockResolvedValue(mockHistory);

            const response = await request(app).get('/api/status/history');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('uptime');
            expect(response.body).toHaveProperty('history');
            expect(response.body.history).toHaveLength(2);
            expect(response.body).toHaveProperty('avgLatency');
        });

        it('should validate limit parameter', async () => {
            const response = await request(app).get(
                '/api/status/history?limit=5000'
            );

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        it('should validate hours parameter', async () => {
            const response = await request(app).get(
                '/api/status/history?hours=1000'
            );

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        it('should calculate average latencies correctly', async () => {
            const mockHistory = [
                {
                    timestamp: new Date('2024-01-01T00:00:00Z'),
                    status: 'healthy',
                    overall: true,
                    database: true,
                    databaseLatency: 10,
                    redis: true,
                    redisLatency: 5,
                    discord: true,
                    discordLatency: 50,
                },
                {
                    timestamp: new Date('2024-01-01T00:05:00Z'),
                    status: 'healthy',
                    overall: true,
                    database: true,
                    databaseLatency: 20,
                    redis: true,
                    redisLatency: 10,
                    discord: true,
                    discordLatency: 60,
                },
            ];

            mockDb.statusCheck.findMany.mockResolvedValue(mockHistory);

            const response = await request(app).get('/api/status/history');

            expect(response.status).toBe(200);
            expect(response.body.avgLatency.database).toBe(15);
            expect(response.body.avgLatency.redis).toBe(7.5);
            expect(response.body.avgLatency.discord).toBe(55);
        });
    });

    describe('GET /api/status/incidents', () => {
        it('should return list of active incidents', async () => {
            const mockIncidents = [
                {
                    id: '1',
                    title: 'Database latency issues',
                    description: 'Investigating high latency',
                    status: 'INVESTIGATING',
                    severity: 'MAJOR',
                    startedAt: new Date(),
                    resolvedAt: null,
                    affectedServices: ['database'],
                    updates: [],
                },
            ];

            mockDb.incident.findMany.mockResolvedValue(mockIncidents);

            const response = await request(app).get('/api/status/incidents');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('incidents');
            expect(response.body.incidents).toHaveLength(1);
            expect(response.body.count).toBe(1);
        });

        it('should filter resolved incidents by default', async () => {
            mockDb.incident.findMany.mockResolvedValue([]);

            await request(app).get('/api/status/incidents');

            expect(mockDb.incident.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        status: { not: 'RESOLVED' },
                    },
                })
            );
        });

        it('should include resolved incidents when requested', async () => {
            mockDb.incident.findMany.mockResolvedValue([]);

            await request(app).get('/api/status/incidents?resolved=true');

            expect(mockDb.incident.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {},
                })
            );
        });

        it('should validate limit parameter', async () => {
            const response = await request(app).get(
                '/api/status/incidents?limit=500'
            );

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /api/status/incidents/:id', () => {
        it('should return incident details', async () => {
            const mockIncident = {
                id: '1',
                title: 'Database outage',
                description: 'Complete database failure',
                status: 'RESOLVED',
                severity: 'CRITICAL',
                startedAt: new Date('2024-01-01T00:00:00Z'),
                resolvedAt: new Date('2024-01-01T02:00:00Z'),
                affectedServices: ['database'],
                updates: [
                    {
                        id: 'u1',
                        message: 'Investigating issue',
                        status: 'INVESTIGATING',
                        createdAt: new Date('2024-01-01T00:05:00Z'),
                    },
                    {
                        id: 'u2',
                        message: 'Issue resolved',
                        status: 'RESOLVED',
                        createdAt: new Date('2024-01-01T02:00:00Z'),
                    },
                ],
            };

            mockDb.incident.findUnique.mockResolvedValue(mockIncident);

            const response = await request(app).get('/api/status/incidents/1');

            expect(response.status).toBe(200);
            expect(response.body.id).toBe('1');
            expect(response.body.title).toBe('Database outage');
            expect(response.body.updates).toHaveLength(2);
        });

        it('should return 404 for non-existent incident', async () => {
            mockDb.incident.findUnique.mockResolvedValue(null);

            const response = await request(app).get(
                '/api/status/incidents/nonexistent'
            );

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error');
        });
    });
});
