import { getGhostScores } from '../../../src/analytics/ghosts';
import { db } from '../../../src/db';

// Mock the database
jest.mock('../../../src/db', () => ({
    db: {
        typingEvent: {
            groupBy: jest.fn(),
        },
        messageEvent: {
            groupBy: jest.fn(),
        },
    },
}));

describe('Analytics - Ghost Scores', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getGhostScores', () => {
        it('should calculate ghost scores correctly', async () => {
            const mockTypings = [
                {
                    userId: 'user1',
                    username: 'User One',
                    _count: { userId: 10 },
                },
                {
                    userId: 'user2',
                    username: 'User Two',
                    _count: { userId: 5 },
                },
            ];

            const mockMessages = [
                {
                    userId: 'user1',
                    _count: { userId: 2 },
                },
                {
                    userId: 'user2',
                    _count: { userId: 10 },
                },
            ];

            (db.typingEvent.groupBy as jest.Mock).mockResolvedValue(
                mockTypings
            );
            (db.messageEvent.groupBy as jest.Mock).mockResolvedValue(
                mockMessages
            );

            const result = await getGhostScores('test-guild-id');

            expect(result).toHaveLength(2);
            expect(result[0].userId).toBe('user1');
            expect(result[0].username).toBe('User One');
            expect(result[0].typingCount).toBe(10);
            expect(result[0].messageCount).toBe(2);
            expect(result[0].ghostScore).toBeCloseTo(10 / 3);

            expect(result[1].userId).toBe('user2');
            expect(result[1].ghostScore).toBeCloseTo(5 / 11);
        });

        it('should handle users with no messages', async () => {
            const mockTypings = [
                {
                    userId: 'user1',
                    username: 'Ghost User',
                    _count: { userId: 20 },
                },
            ];

            const mockMessages: any[] = [];

            (db.typingEvent.groupBy as jest.Mock).mockResolvedValue(
                mockTypings
            );
            (db.messageEvent.groupBy as jest.Mock).mockResolvedValue(
                mockMessages
            );

            const result = await getGhostScores('test-guild-id');

            expect(result).toHaveLength(1);
            expect(result[0].userId).toBe('user1');
            expect(result[0].messageCount).toBe(0);
            expect(result[0].ghostScore).toBe(20);
        });

        it('should filter by date when provided', async () => {
            const mockTypings: any[] = [];
            const mockMessages: any[] = [];
            const since = new Date('2024-01-01');

            (db.typingEvent.groupBy as jest.Mock).mockResolvedValue(
                mockTypings
            );
            (db.messageEvent.groupBy as jest.Mock).mockResolvedValue(
                mockMessages
            );

            await getGhostScores('test-guild-id', since);

            expect(db.typingEvent.groupBy).toHaveBeenCalledWith({
                by: ['userId', 'username'],
                where: {
                    guildId: 'test-guild-id',
                    createdAt: { gte: since },
                },
                _count: {
                    userId: true,
                },
            });
        });

        it('should return empty array when no data', async () => {
            (db.typingEvent.groupBy as jest.Mock).mockResolvedValue([]);
            (db.messageEvent.groupBy as jest.Mock).mockResolvedValue([]);

            const result = await getGhostScores('test-guild-id');

            expect(result).toEqual([]);
        });

        it('should sort by ghost score descending', async () => {
            const mockTypings = [
                {
                    userId: 'user1',
                    username: 'Low Ghost',
                    _count: { userId: 5 },
                },
                {
                    userId: 'user2',
                    username: 'High Ghost',
                    _count: { userId: 20 },
                },
            ];

            const mockMessages = [
                {
                    userId: 'user1',
                    _count: { userId: 10 },
                },
                {
                    userId: 'user2',
                    _count: { userId: 2 },
                },
            ];

            (db.typingEvent.groupBy as jest.Mock).mockResolvedValue(
                mockTypings
            );
            (db.messageEvent.groupBy as jest.Mock).mockResolvedValue(
                mockMessages
            );

            const result = await getGhostScores('test-guild-id');

            expect(result[0].userId).toBe('user2'); // Higher ghost score
            expect(result[1].userId).toBe('user1'); // Lower ghost score
        });
    });
});
