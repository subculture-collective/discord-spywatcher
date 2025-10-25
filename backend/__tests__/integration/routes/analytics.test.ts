import express, { Application } from 'express';
import request from 'supertest';

import {
    getGhostScores,
    getChannelHeatmap,
    getLurkerFlags,
} from '../../../src/analytics';
import analyticsRouter from '../../../src/routes/analytics';
import { generateAccessToken } from '../../../src/utils/auth';

// Mock the analytics functions
jest.mock('../../../src/analytics', () => ({
    getGhostScores: jest.fn(),
    getChannelHeatmap: jest.fn(),
    getLurkerFlags: jest.fn(),
    getRoleDriftFlags: jest.fn(),
    getClientDriftFlags: jest.fn(),
    getBehaviorShiftFlags: jest.fn(),
}));

// Mock the middleware
jest.mock('../../../src/middleware', () => ({
    requireAuth: jest.fn((req, res, next) => next()),
    validateGuild: jest.fn((req, res, next) => next()),
    excludeBannedUsers: jest.fn((data) => Promise.resolve(data)),
    analyticsLimiter: jest.fn((req, res, next) => next()),
}));

describe('Integration - Analytics Routes', () => {
    let app: Application;
    let authToken: string;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.use('/api/analytics', analyticsRouter);

        // Generate a valid auth token
        authToken = generateAccessToken({
            discordId: '123',
            username: 'test',
            role: 'USER',
            access: true,
        });
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/analytics/ghosts', () => {
        it('should return ghost scores', async () => {
            const mockData = [
                {
                    userId: 'user1',
                    username: 'Test User',
                    typingCount: 10,
                    messageCount: 2,
                    ghostScore: 3.33,
                },
            ];

            (getGhostScores as jest.Mock).mockResolvedValue(mockData);

            const response = await request(app)
                .get('/api/analytics/ghosts')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toEqual(mockData);
            expect(getGhostScores).toHaveBeenCalled();
        });

        it('should handle query parameters', async () => {
            (getGhostScores as jest.Mock).mockResolvedValue([]);

            await request(app)
                .get('/api/analytics/ghosts?since=2024-01-01&filterBanned=true')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(getGhostScores).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(Date)
            );
        });
    });

    describe('GET /api/analytics/heatmap', () => {
        it('should return channel heatmap data', async () => {
            const mockData = [
                {
                    channelId: 'channel1',
                    channelName: 'general',
                    activityScore: 100,
                },
            ];

            (getChannelHeatmap as jest.Mock).mockResolvedValue(mockData);

            const response = await request(app)
                .get('/api/analytics/heatmap')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toEqual(mockData);
        });
    });

    describe('GET /api/analytics/lurkers', () => {
        it('should return lurker flags', async () => {
            const mockData = [
                {
                    userId: 'lurker1',
                    username: 'Lurker User',
                    voiceMinutes: 100,
                    messageCount: 1,
                    lurkerScore: 50,
                },
            ];

            (getLurkerFlags as jest.Mock).mockResolvedValue(mockData);

            const response = await request(app)
                .get('/api/analytics/lurkers')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toEqual(mockData);
        });
    });

    describe('Error handling', () => {
        it('should handle analytics function errors', async () => {
            (getGhostScores as jest.Mock).mockRejectedValue(
                new Error('Database error')
            );

            await request(app)
                .get('/api/analytics/ghosts')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(500);
        });
    });
});
