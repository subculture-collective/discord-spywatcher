/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
import express, { Application } from 'express';
import request from 'supertest';

import healthRoutes, { resetDiscordApiCache } from '../../../src/routes/health';

// Mock the database
jest.mock('../../../src/db', () => ({
    db: {
        $queryRaw: jest.fn(),
    },
}));

// Mock redis
jest.mock('../../../src/utils/redis', () => ({
    getRedisClient: jest.fn(),
}));

// Mock fetch for Discord API check
global.fetch = jest.fn();

describe('Health Check Routes', () => {
    let app: Application;
    let mockDb: any;
    let mockGetRedisClient: any;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.use('/health', healthRoutes);

        mockDb = require('../../../src/db').db;
        mockGetRedisClient = require('../../../src/utils/redis').getRedisClient;
    });

    afterEach(() => {
        jest.clearAllMocks();
        resetDiscordApiCache();
    });

    describe('GET /health/live', () => {
        it('should return 200 with status ok', async () => {
            const response = await request(app).get('/health/live');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status', 'ok');
            expect(response.body).toHaveProperty('timestamp');
        });

        it('should return ISO timestamp', async () => {
            const response = await request(app).get('/health/live');

            const timestamp = response.body.timestamp;
            expect(timestamp).toBeTruthy();
            expect(() => new Date(timestamp)).not.toThrow();
        });
    });

    describe('GET /health/ready', () => {
        it('should return 200 when all services are healthy', async () => {
            // Mock successful database check
            mockDb.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

            // Mock successful Redis check
            const mockRedis = {
                ping: jest.fn().mockResolvedValue('PONG'),
            };
            mockGetRedisClient.mockReturnValue(mockRedis);

            // Mock successful Discord API check
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
            });

            const response = await request(app).get('/health/ready');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status', 'healthy');
            expect(response.body).toHaveProperty('checks');
            expect(response.body.checks).toEqual({
                database: true,
                redis: true,
                discord: true,
            });
        });

        it('should return 503 when database is unhealthy', async () => {
            // Mock failed database check
            mockDb.$queryRaw.mockRejectedValue(new Error('Database connection failed'));

            // Mock successful Redis check
            const mockRedis = {
                ping: jest.fn().mockResolvedValue('PONG'),
            };
            mockGetRedisClient.mockReturnValue(mockRedis);

            // Mock successful Discord API check
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
            });

            const response = await request(app).get('/health/ready');

            expect(response.status).toBe(503);
            expect(response.body).toHaveProperty('status', 'unhealthy');
            expect(response.body.checks.database).toBe(false);
        });

        it('should return 503 when Redis is unhealthy', async () => {
            // Mock successful database check
            mockDb.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

            // Mock failed Redis check
            const mockRedis = {
                ping: jest.fn().mockRejectedValue(new Error('Redis connection failed')),
            };
            mockGetRedisClient.mockReturnValue(mockRedis);

            // Mock successful Discord API check
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
            });

            const response = await request(app).get('/health/ready');

            expect(response.status).toBe(503);
            expect(response.body).toHaveProperty('status', 'unhealthy');
            expect(response.body.checks.redis).toBe(false);
        });

        it('should return 503 when Discord API is unhealthy', async () => {
            // Mock successful database check
            mockDb.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

            // Mock successful Redis check
            const mockRedis = {
                ping: jest.fn().mockResolvedValue('PONG'),
            };
            mockGetRedisClient.mockReturnValue(mockRedis);

            // Mock failed Discord API check
            (global.fetch as jest.Mock).mockRejectedValue(new Error('Discord API failed'));

            const response = await request(app).get('/health/ready');

            expect(response.status).toBe(503);
            expect(response.body).toHaveProperty('status', 'unhealthy');
            expect(response.body.checks.discord).toBe(false);
        });

        it('should handle Redis being optional (not configured)', async () => {
            // Mock successful database check
            mockDb.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

            // Mock Redis not configured
            mockGetRedisClient.mockReturnValue(null);

            // Mock successful Discord API check
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
            });

            const response = await request(app).get('/health/ready');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status', 'healthy');
            expect(response.body.checks.redis).toBe(true);
        });
    });
});
