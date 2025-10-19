import { getChannelHeatmap } from '../../../src/analytics/heatmap';
import { db } from '../../../src/db';

jest.mock('../../../src/db', () => ({
    db: {
        typingEvent: {
            groupBy: jest.fn(),
        },
    },
}));

describe('Analytics - Channel Heatmap', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getChannelHeatmap', () => {
        it('should return channel activity heatmap', async () => {
            const mockData = [
                {
                    userId: 'user1',
                    username: 'User One',
                    channelId: 'channel1',
                    channel: 'general',
                    _count: { channelId: 50 },
                },
                {
                    userId: 'user2',
                    username: 'User Two',
                    channelId: 'channel2',
                    channel: 'off-topic',
                    _count: { channelId: 30 },
                },
            ];

            (db.typingEvent.groupBy as jest.Mock).mockResolvedValue(mockData);

            const result = await getChannelHeatmap({ guildId: 'test-guild-id' });

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                userId: 'user1',
                username: 'User One',
                channelId: 'channel1',
                channel: 'general',
                count: 50,
            });
        });

        it('should filter by date when provided', async () => {
            const since = new Date('2024-01-01');
            (db.typingEvent.groupBy as jest.Mock).mockResolvedValue([]);

            await getChannelHeatmap({ guildId: 'test-guild-id', since });

            expect(db.typingEvent.groupBy).toHaveBeenCalledWith({
                by: ['userId', 'username', 'channelId', 'channel'],
                where: {
                    guildId: 'test-guild-id',
                    createdAt: { gte: since },
                },
                _count: {
                    channelId: true,
                },
                orderBy: {
                    _count: {
                        channelId: 'desc',
                    },
                },
            });
        });

        it('should return empty array when no data', async () => {
            (db.typingEvent.groupBy as jest.Mock).mockResolvedValue([]);

            const result = await getChannelHeatmap({ guildId: 'test-guild-id' });

            expect(result).toEqual([]);
        });

        it('should order by count descending', async () => {
            const mockData = [
                {
                    userId: 'user1',
                    username: 'User One',
                    channelId: 'channel1',
                    channel: 'general',
                    _count: { channelId: 100 },
                },
                {
                    userId: 'user2',
                    username: 'User Two',
                    channelId: 'channel2',
                    channel: 'off-topic',
                    _count: { channelId: 50 },
                },
            ];

            (db.typingEvent.groupBy as jest.Mock).mockResolvedValue(mockData);

            const result = await getChannelHeatmap({ guildId: 'test-guild-id' });

            expect(result[0].count).toBeGreaterThan(result[1].count);
        });

        it('should handle multiple users in same channel', async () => {
            const mockData = [
                {
                    userId: 'user1',
                    username: 'User One',
                    channelId: 'channel1',
                    channel: 'general',
                    _count: { channelId: 50 },
                },
                {
                    userId: 'user2',
                    username: 'User Two',
                    channelId: 'channel1',
                    channel: 'general',
                    _count: { channelId: 30 },
                },
            ];

            (db.typingEvent.groupBy as jest.Mock).mockResolvedValue(mockData);

            const result = await getChannelHeatmap({ guildId: 'test-guild-id' });

            expect(result).toHaveLength(2);
            expect(result[0].channelId).toBe('channel1');
            expect(result[1].channelId).toBe('channel1');
        });
    });
});
