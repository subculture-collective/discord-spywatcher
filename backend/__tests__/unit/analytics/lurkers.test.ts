import { getLurkerScores } from '../../../src/analytics/lurkers';
import { db } from '../../../src/db';

jest.mock('../../../src/db', () => ({
    db: {
        messageEvent: {
            groupBy: jest.fn(),
        },
        voiceEvent: {
            groupBy: jest.fn(),
        },
    },
}));

describe('Analytics - Lurker Scores', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getLurkerScores', () => {
        it('should calculate lurker scores correctly', async () => {
            const mockMessages = [
                {
                    userId: 'user1',
                    username: 'User One',
                    _count: { userId: 2 },
                },
                {
                    userId: 'user2',
                    username: 'User Two',
                    _count: { userId: 10 },
                },
            ];

            const mockVoiceEvents = [
                {
                    userId: 'user1',
                    _sum: { durationMinutes: 100 },
                },
                {
                    userId: 'user2',
                    _sum: { durationMinutes: 20 },
                },
            ];

            (db.messageEvent.groupBy as jest.Mock).mockResolvedValue(mockMessages);
            (db.voiceEvent.groupBy as jest.Mock).mockResolvedValue(mockVoiceEvents);

            const result = await getLurkerScores('test-guild-id');

            expect(result).toHaveLength(2);
            expect(result[0].userId).toBe('user1');
            expect(result[0].voiceMinutes).toBe(100);
            expect(result[0].messageCount).toBe(2);
            expect(result[0].lurkerScore).toBeCloseTo(100 / 3);

            expect(result[1].userId).toBe('user2');
            expect(result[1].lurkerScore).toBeCloseTo(20 / 11);
        });

        it('should handle users with no messages', async () => {
            const mockMessages: any[] = [];
            const mockVoiceEvents = [
                {
                    userId: 'lurker1',
                    _sum: { durationMinutes: 200 },
                },
            ];

            (db.messageEvent.groupBy as jest.Mock).mockResolvedValue(mockMessages);
            (db.voiceEvent.groupBy as jest.Mock).mockResolvedValue(mockVoiceEvents);

            const result = await getLurkerScores('test-guild-id');

            expect(result).toHaveLength(1);
            expect(result[0].userId).toBe('lurker1');
            expect(result[0].messageCount).toBe(0);
            expect(result[0].lurkerScore).toBe(200);
        });

        it('should handle users with no voice time', async () => {
            const mockMessages = [
                {
                    userId: 'active1',
                    username: 'Active User',
                    _count: { userId: 50 },
                },
            ];
            const mockVoiceEvents: any[] = [];

            (db.messageEvent.groupBy as jest.Mock).mockResolvedValue(mockMessages);
            (db.voiceEvent.groupBy as jest.Mock).mockResolvedValue(mockVoiceEvents);

            const result = await getLurkerScores('test-guild-id');

            expect(result).toHaveLength(0);
        });

        it('should filter by date when provided', async () => {
            const mockMessages: any[] = [];
            const mockVoiceEvents: any[] = [];
            const since = new Date('2024-01-01');

            (db.messageEvent.groupBy as jest.Mock).mockResolvedValue(mockMessages);
            (db.voiceEvent.groupBy as jest.Mock).mockResolvedValue(mockVoiceEvents);

            await getLurkerScores('test-guild-id', since);

            expect(db.voiceEvent.groupBy).toHaveBeenCalledWith({
                by: ['userId'],
                where: {
                    guildId: 'test-guild-id',
                    createdAt: { gte: since },
                },
                _sum: {
                    durationMinutes: true,
                },
            });
        });

        it('should sort by lurker score descending', async () => {
            const mockMessages = [
                {
                    userId: 'user1',
                    username: 'Low Lurker',
                    _count: { userId: 20 },
                },
                {
                    userId: 'user2',
                    username: 'High Lurker',
                    _count: { userId: 2 },
                },
            ];

            const mockVoiceEvents = [
                {
                    userId: 'user1',
                    _sum: { durationMinutes: 50 },
                },
                {
                    userId: 'user2',
                    _sum: { durationMinutes: 100 },
                },
            ];

            (db.messageEvent.groupBy as jest.Mock).mockResolvedValue(mockMessages);
            (db.voiceEvent.groupBy as jest.Mock).mockResolvedValue(mockVoiceEvents);

            const result = await getLurkerScores('test-guild-id');

            expect(result[0].userId).toBe('user2'); // Higher lurker score
            expect(result[1].userId).toBe('user1'); // Lower lurker score
        });

        it('should handle null voice duration', async () => {
            const mockMessages = [
                {
                    userId: 'user1',
                    username: 'Test User',
                    _count: { userId: 5 },
                },
            ];

            const mockVoiceEvents = [
                {
                    userId: 'user1',
                    _sum: { durationMinutes: null },
                },
            ];

            (db.messageEvent.groupBy as jest.Mock).mockResolvedValue(mockMessages);
            (db.voiceEvent.groupBy as jest.Mock).mockResolvedValue(mockVoiceEvents);

            const result = await getLurkerScores('test-guild-id');

            expect(result).toHaveLength(0);
        });
    });
});
