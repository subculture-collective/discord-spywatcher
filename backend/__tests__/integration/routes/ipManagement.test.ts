import request from 'supertest';
import express from 'express';

import ipManagementRoutes from '../../../src/routes/ipManagement';
import { db } from '../../../src/db';

// Mock database
jest.mock('../../../src/db', () => ({
    db: {
        whitelistedIP: {
            findUnique: jest.fn(),
            upsert: jest.fn(),
            delete: jest.fn(),
            findMany: jest.fn(),
        },
        blockedIP: {
            findUnique: jest.fn(),
            upsert: jest.fn(),
            delete: jest.fn(),
            findMany: jest.fn(),
        },
        auditLog: {
            create: jest.fn(),
        },
    },
}));

// Mock Redis
jest.mock('../../../src/utils/redis', () => ({
    getRedisClient: jest.fn(() => ({
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn(),
        setex: jest.fn(),
        del: jest.fn(),
        ttl: jest.fn(),
    })),
}));

// Mock authentication middleware
jest.mock('../../../src/middleware/auth', () => ({
    requireAuth: (req: any, res: any, next: any) => {
        req.user = { id: 'test-user', username: 'testadmin', role: 'ADMIN' };
        next();
    },
    requireRole: () => (req: any, res: any, next: any) => next(),
}));

describe('IP Management Routes', () => {
    let app: express.Application;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/api/admin/ip-management', ipManagementRoutes);
        jest.clearAllMocks();
    });

    describe('GET /blocked', () => {
        it('should return list of blocked IPs', async () => {
            const mockBlocked = [
                { ip: '192.168.1.1', reason: 'Malicious', createdAt: new Date() },
                { ip: '10.0.0.1', reason: 'Spam', createdAt: new Date() },
            ];

            (db.blockedIP.findMany as jest.Mock).mockResolvedValue(mockBlocked);

            const response = await request(app).get('/api/admin/ip-management/blocked');

            expect(response.status).toBe(200);
            expect(response.body.blocked).toHaveLength(2);
        });
    });

    describe('GET /whitelisted', () => {
        it('should return list of whitelisted IPs', async () => {
            const mockWhitelisted = [
                { ip: '192.168.1.100', reason: 'Office', createdAt: new Date() },
            ];

            (db.whitelistedIP.findMany as jest.Mock).mockResolvedValue(
                mockWhitelisted
            );

            const response = await request(app).get(
                '/api/admin/ip-management/whitelisted'
            );

            expect(response.status).toBe(200);
            expect(response.body.whitelisted).toHaveLength(1);
        });
    });

    describe('GET /check/:ip', () => {
        it('should check IP status', async () => {
            (db.blockedIP.findUnique as jest.Mock).mockResolvedValue(null);
            (db.whitelistedIP.findUnique as jest.Mock).mockResolvedValue(null);

            const response = await request(app).get(
                '/api/admin/ip-management/check/192.168.1.1'
            );

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status');
        });

        it('should reject invalid IP format', async () => {
            const response = await request(app).get(
                '/api/admin/ip-management/check/invalid-ip'
            );

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Invalid IP address format');
        });
    });

    describe('POST /block', () => {
        it('should block an IP permanently', async () => {
            (db.blockedIP.upsert as jest.Mock).mockResolvedValue({
                ip: '192.168.1.1',
                reason: 'Test',
            });

            const response = await request(app)
                .post('/api/admin/ip-management/block')
                .send({ ip: '192.168.1.1', reason: 'Test' });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('IP permanently blocked');
            expect(db.blockedIP.upsert).toHaveBeenCalled();
        });

        it('should reject invalid IP format', async () => {
            const response = await request(app)
                .post('/api/admin/ip-management/block')
                .send({ ip: 'invalid-ip', reason: 'Test' });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /temp-block', () => {
        it('should temporarily block an IP', async () => {
            const response = await request(app)
                .post('/api/admin/ip-management/temp-block')
                .send({ ip: '192.168.1.1', duration: 3600, reason: 'Test' });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('IP temporarily blocked');
        });

        it('should reject invalid duration', async () => {
            const response = await request(app)
                .post('/api/admin/ip-management/temp-block')
                .send({ ip: '192.168.1.1', duration: 30, reason: 'Test' });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Duration must be');
        });
    });

    describe('DELETE /unblock/:ip', () => {
        it('should unblock an IP', async () => {
            (db.blockedIP.delete as jest.Mock).mockResolvedValue({
                ip: '192.168.1.1',
            });

            const response = await request(app).delete(
                '/api/admin/ip-management/unblock/192.168.1.1'
            );

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('IP unblocked successfully');
        });
    });

    describe('POST /whitelist', () => {
        it('should add IP to whitelist', async () => {
            (db.whitelistedIP.upsert as jest.Mock).mockResolvedValue({
                ip: '192.168.1.1',
                reason: 'Admin',
            });
            (db.auditLog.create as jest.Mock).mockResolvedValue({});

            const response = await request(app)
                .post('/api/admin/ip-management/whitelist')
                .send({ ip: '192.168.1.1', reason: 'Admin' });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('IP added to whitelist');
            expect(db.whitelistedIP.upsert).toHaveBeenCalled();
        });
    });

    describe('DELETE /whitelist/:ip', () => {
        it('should remove IP from whitelist', async () => {
            (db.whitelistedIP.delete as jest.Mock).mockResolvedValue({
                ip: '192.168.1.1',
            });
            (db.auditLog.create as jest.Mock).mockResolvedValue({});

            const response = await request(app).delete(
                '/api/admin/ip-management/whitelist/192.168.1.1'
            );

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('IP removed from whitelist');
        });
    });
});
