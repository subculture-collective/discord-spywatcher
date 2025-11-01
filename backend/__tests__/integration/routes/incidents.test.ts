/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
import express, { Application } from 'express';
import request from 'supertest';

import incidentsRoutes from '../../../src/routes/incidents';

// Mock the database
jest.mock('../../../src/db', () => ({
    db: {
        incident: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        incidentUpdate: {
            create: jest.fn(),
        },
    },
}));

// Mock auth middleware
jest.mock('../../../src/middleware/auth', () => ({
    requireAuth: jest.fn((req, res, next) => {
        req.user = { id: 'test-user', role: 'ADMIN' };
        next();
    }),
    requireRole: jest.fn(() => (req: any, res: any, next: any) => next()),
}));

describe('Incidents Routes', () => {
    let app: Application;
    let mockDb: any;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.use('/api/admin/incidents', incidentsRoutes);

        mockDb = require('../../../src/db').db;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/admin/incidents', () => {
        it('should create a new incident', async () => {
            const newIncident = {
                id: '1',
                title: 'Database outage',
                description: 'Database is down',
                status: 'INVESTIGATING',
                severity: 'CRITICAL',
                affectedServices: ['database'],
                startedAt: new Date(),
                resolvedAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                metadata: null,
                updates: [],
            };

            mockDb.incident.create.mockResolvedValue(newIncident);

            const response = await request(app)
                .post('/api/admin/incidents')
                .send({
                    title: 'Database outage',
                    description: 'Database is down',
                    severity: 'CRITICAL',
                    affectedServices: ['database'],
                });

            expect(response.status).toBe(201);
            expect(response.body.title).toBe('Database outage');
            expect(mockDb.incident.create).toHaveBeenCalled();
        });

        it('should create incident with initial update', async () => {
            const newIncident = {
                id: '1',
                title: 'API slow',
                description: 'API experiencing high latency',
                status: 'INVESTIGATING',
                severity: 'MAJOR',
                affectedServices: ['api'],
                startedAt: new Date(),
                resolvedAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                metadata: null,
                updates: [
                    {
                        id: 'u1',
                        message: 'We are investigating the issue',
                        status: 'INVESTIGATING',
                        createdAt: new Date(),
                    },
                ],
            };

            mockDb.incident.create.mockResolvedValue(newIncident);

            const response = await request(app)
                .post('/api/admin/incidents')
                .send({
                    title: 'API slow',
                    description: 'API experiencing high latency',
                    severity: 'MAJOR',
                    affectedServices: ['api'],
                    initialUpdate: 'We are investigating the issue',
                });

            expect(response.status).toBe(201);
            expect(response.body.updates).toHaveLength(1);
        });

        it('should return 400 if title is missing', async () => {
            const response = await request(app)
                .post('/api/admin/incidents')
                .send({
                    description: 'Some description',
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('required');
        });

        it('should return 400 for invalid severity', async () => {
            const response = await request(app)
                .post('/api/admin/incidents')
                .send({
                    title: 'Test',
                    description: 'Test',
                    severity: 'INVALID',
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('severity');
        });
    });

    describe('PATCH /api/admin/incidents/:id', () => {
        it('should update an incident', async () => {
            const existingIncident = {
                id: '1',
                title: 'Old title',
                status: 'INVESTIGATING',
                resolvedAt: null,
            };

            const updatedIncident = {
                ...existingIncident,
                title: 'Updated title',
                status: 'IDENTIFIED',
                updates: [],
            };

            mockDb.incident.findUnique.mockResolvedValue(existingIncident);
            mockDb.incident.update.mockResolvedValue(updatedIncident);

            const response = await request(app)
                .patch('/api/admin/incidents/1')
                .send({
                    title: 'Updated title',
                    status: 'IDENTIFIED',
                });

            expect(response.status).toBe(200);
            expect(response.body.title).toBe('Updated title');
            expect(mockDb.incident.update).toHaveBeenCalled();
        });

        it('should auto-set resolvedAt when status is RESOLVED', async () => {
            const existingIncident = {
                id: '1',
                title: 'Test incident',
                status: 'MONITORING',
                resolvedAt: null,
            };

            mockDb.incident.findUnique.mockResolvedValue(existingIncident);
            mockDb.incident.update.mockResolvedValue({
                ...existingIncident,
                status: 'RESOLVED',
                resolvedAt: new Date(),
                updates: [],
            });

            await request(app).patch('/api/admin/incidents/1').send({
                status: 'RESOLVED',
            });

            expect(mockDb.incident.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        status: 'RESOLVED',
                        resolvedAt: expect.any(Date),
                    }),
                })
            );
        });

        it('should add update message when provided', async () => {
            const existingIncident = {
                id: '1',
                title: 'Test',
                status: 'INVESTIGATING',
                resolvedAt: null,
            };

            mockDb.incident.findUnique.mockResolvedValue(existingIncident);
            mockDb.incident.update.mockResolvedValue({
                ...existingIncident,
                updates: [],
            });

            await request(app).patch('/api/admin/incidents/1').send({
                updateMessage: 'We have identified the issue',
            });

            expect(mockDb.incident.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        updates: {
                            create: {
                                message: 'We have identified the issue',
                                status: 'INVESTIGATING',
                            },
                        },
                    }),
                })
            );
        });

        it('should return 404 if incident not found', async () => {
            mockDb.incident.findUnique.mockResolvedValue(null);

            const response = await request(app)
                .patch('/api/admin/incidents/nonexistent')
                .send({
                    title: 'Updated',
                });

            expect(response.status).toBe(404);
        });
    });

    describe('POST /api/admin/incidents/:id/updates', () => {
        it('should add an update to an incident', async () => {
            const existingIncident = {
                id: '1',
                title: 'Test',
                status: 'INVESTIGATING',
                resolvedAt: null,
            };

            const newUpdate = {
                id: 'u1',
                incidentId: '1',
                message: 'Issue identified',
                status: 'IDENTIFIED',
                createdAt: new Date(),
            };

            mockDb.incident.findUnique.mockResolvedValue(existingIncident);
            mockDb.incidentUpdate.create.mockResolvedValue(newUpdate);
            mockDb.incident.update.mockResolvedValue(existingIncident);

            const response = await request(app)
                .post('/api/admin/incidents/1/updates')
                .send({
                    message: 'Issue identified',
                    status: 'IDENTIFIED',
                });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Issue identified');
            expect(mockDb.incidentUpdate.create).toHaveBeenCalled();
            expect(mockDb.incident.update).toHaveBeenCalled();
        });

        it('should return 400 if message is missing', async () => {
            const response = await request(app)
                .post('/api/admin/incidents/1/updates')
                .send({});

            expect(response.status).toBe(400);
        });

        it('should return 404 if incident not found', async () => {
            mockDb.incident.findUnique.mockResolvedValue(null);

            const response = await request(app)
                .post('/api/admin/incidents/nonexistent/updates')
                .send({
                    message: 'Test update',
                });

            expect(response.status).toBe(404);
        });
    });

    describe('DELETE /api/admin/incidents/:id', () => {
        it('should soft delete incident by marking as resolved', async () => {
            const existingIncident = {
                id: '1',
                title: 'Test',
                status: 'INVESTIGATING',
                resolvedAt: null,
            };

            mockDb.incident.findUnique.mockResolvedValue(existingIncident);
            mockDb.incident.update.mockResolvedValue({
                ...existingIncident,
                status: 'RESOLVED',
                resolvedAt: new Date(),
            });

            const response = await request(app).delete(
                '/api/admin/incidents/1'
            );

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('resolved');
            expect(mockDb.incident.update).toHaveBeenCalled();
        });

        it('should permanently delete incident when requested', async () => {
            const existingIncident = {
                id: '1',
                title: 'Test',
            };

            mockDb.incident.findUnique.mockResolvedValue(existingIncident);
            mockDb.incident.delete.mockResolvedValue(existingIncident);

            const response = await request(app).delete(
                '/api/admin/incidents/1?permanent=true'
            );

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('permanently deleted');
            expect(mockDb.incident.delete).toHaveBeenCalled();
        });

        it('should return 404 if incident not found', async () => {
            mockDb.incident.findUnique.mockResolvedValue(null);

            const response = await request(app).delete(
                '/api/admin/incidents/nonexistent'
            );

            expect(response.status).toBe(404);
        });
    });

    describe('GET /api/admin/incidents', () => {
        it('should list incidents', async () => {
            const mockIncidents = [
                {
                    id: '1',
                    title: 'Incident 1',
                    status: 'INVESTIGATING',
                    severity: 'MAJOR',
                    startedAt: new Date(),
                    resolvedAt: null,
                    updates: [],
                },
                {
                    id: '2',
                    title: 'Incident 2',
                    status: 'RESOLVED',
                    severity: 'MINOR',
                    startedAt: new Date(),
                    resolvedAt: new Date(),
                    updates: [],
                },
            ];

            mockDb.incident.findMany.mockResolvedValue(mockIncidents);

            const response = await request(app).get('/api/admin/incidents');

            expect(response.status).toBe(200);
            expect(response.body.incidents).toHaveLength(2);
            expect(response.body.count).toBe(2);
        });

        it('should filter incidents by status', async () => {
            mockDb.incident.findMany.mockResolvedValue([]);

            await request(app).get(
                '/api/admin/incidents?status=INVESTIGATING'
            );

            expect(mockDb.incident.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        status: 'INVESTIGATING',
                    },
                })
            );
        });

        it('should filter incidents by severity', async () => {
            mockDb.incident.findMany.mockResolvedValue([]);

            await request(app).get('/api/admin/incidents?severity=CRITICAL');

            expect(mockDb.incident.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        severity: 'CRITICAL',
                    },
                })
            );
        });

        it('should validate limit parameter', async () => {
            const response = await request(app).get(
                '/api/admin/incidents?limit=500'
            );

            expect(response.status).toBe(400);
        });
    });
});
