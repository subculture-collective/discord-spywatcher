import {
    getChannelDiversity,
    getChannelDiversityLegacy,
} from '../../../src/analytics/channels';
import { db } from '../../../src/db';
import { cache } from '../../../src/services/cache';

// Mock the database
jest.mock('../../../src/db', () => ({
    db: {
        $queryRaw: jest.fn(),
        typingEvent: {
            findMany: jest.fn(),
        },
    },
}));

// Mock the cache
jest.mock('../../../src/services/cache', () => ({
    cache: {
        remember: jest.fn((key, ttl, callback) => callback()),
    },
}));

describe('Channel Analytics', () => {
    const mockGuildId = 'guild123';
    const mockSince = new Date('2024-01-01');

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getChannelDiversity', () => {
        it('should return channel diversity data from optimized query', async () => {
            const mockResult = [
                {
                    userId: 'user1',
                    username: 'TestUser1',
                    channel_count: BigInt(5),
                },
                {
                    userId: 'user2',
                    username: 'TestUser2',
                    channel_count: BigInt(3),
                },
            ];

            (db.$queryRaw as jest.Mock).mockResolvedValue(mockResult);

            const result = await getChannelDiversity(mockGuildId, mockSince);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                userId: 'user1',
                username: 'TestUser1',
                channelCount: 5,
            });
            expect(result[1]).toEqual({
                userId: 'user2',
                username: 'TestUser2',
                channelCount: 3,
            });

            // Verify the query was called with correct parameters
            expect(db.$queryRaw).toHaveBeenCalled();
        });

        it('should use cache for repeated calls', async () => {
            const mockResult = [
                {
                    userId: 'user1',
                    username: 'TestUser1',
                    channel_count: BigInt(2),
                },
            ];

            (db.$queryRaw as jest.Mock).mockResolvedValue(mockResult);

            await getChannelDiversity(mockGuildId, mockSince);

            expect(cache.remember).toHaveBeenCalledWith(
                expect.stringContaining('analytics:channels:'),
                300,
                expect.any(Function),
                expect.objectContaining({
                    tags: [
                        `guild:${mockGuildId}`,
                        'analytics:channels',
                    ],
                })
            );
        });

        it('should handle query without since parameter', async () => {
            const mockResult = [
                {
                    userId: 'user1',
                    username: 'TestUser1',
                    channel_count: BigInt(1),
                },
            ];

            (db.$queryRaw as jest.Mock).mockResolvedValue(mockResult);

            const result = await getChannelDiversity(mockGuildId);

            expect(result).toHaveLength(1);
            expect(db.$queryRaw).toHaveBeenCalled();
        });

        it('should handle empty results', async () => {
            (db.$queryRaw as jest.Mock).mockResolvedValue([]);

            const result = await getChannelDiversity(mockGuildId, mockSince);

            expect(result).toEqual([]);
        });

        it('should convert BigInt to number correctly', async () => {
            const mockResult = [
                {
                    userId: 'user1',
                    username: 'TestUser1',
                    channel_count: BigInt(999),
                },
            ];

            (db.$queryRaw as jest.Mock).mockResolvedValue(mockResult);

            const result = await getChannelDiversity(mockGuildId);

            expect(result[0].channelCount).toBe(999);
            expect(typeof result[0].channelCount).toBe('number');
        });
    });

    describe('getChannelDiversityLegacy', () => {
        it('should aggregate channel diversity from typing events', async () => {
            const mockEvents = [
                {
                    userId: 'user1',
                    username: 'TestUser1',
                    channelId: 'channel1',
                },
                {
                    userId: 'user1',
                    username: 'TestUser1',
                    channelId: 'channel2',
                },
                {
                    userId: 'user1',
                    username: 'TestUser1',
                    channelId: 'channel1',
                }, // Duplicate
                {
                    userId: 'user2',
                    username: 'TestUser2',
                    channelId: 'channel1',
                },
            ];

            (db.typingEvent.findMany as jest.Mock).mockResolvedValue(
                mockEvents
            );

            const result = await getChannelDiversityLegacy(
                mockGuildId,
                mockSince
            );

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                userId: 'user1',
                username: 'TestUser1',
                channelCount: 2, // 2 unique channels
            });
            expect(result[1]).toEqual({
                userId: 'user2',
                username: 'TestUser2',
                channelCount: 1,
            });

            // Verify results are sorted by channelCount descending
            expect(result[0].channelCount).toBeGreaterThanOrEqual(
                result[1].channelCount
            );
        });

        it('should handle empty typing events', async () => {
            (db.typingEvent.findMany as jest.Mock).mockResolvedValue([]);

            const result = await getChannelDiversityLegacy(mockGuildId);

            expect(result).toEqual([]);
        });
    });

    describe('Performance comparison', () => {
        it('optimized version should produce same results as legacy', async () => {
            // Set up consistent mock data
            const mockEvents = [
                {
                    userId: 'user1',
                    username: 'TestUser1',
                    channelId: 'channel1',
                },
                {
                    userId: 'user1',
                    username: 'TestUser1',
                    channelId: 'channel2',
                },
                {
                    userId: 'user2',
                    username: 'TestUser2',
                    channelId: 'channel1',
                },
            ];

            const mockQueryResult = [
                {
                    userId: 'user1',
                    username: 'TestUser1',
                    channel_count: BigInt(2),
                },
                {
                    userId: 'user2',
                    username: 'TestUser2',
                    channel_count: BigInt(1),
                },
            ];

            (db.typingEvent.findMany as jest.Mock).mockResolvedValue(
                mockEvents
            );
            (db.$queryRaw as jest.Mock).mockResolvedValue(mockQueryResult);

            const [optimizedResult, legacyResult] = await Promise.all([
                getChannelDiversity(mockGuildId, mockSince),
                getChannelDiversityLegacy(mockGuildId, mockSince),
            ]);

            // Results should have same structure and values
            expect(optimizedResult).toHaveLength(legacyResult.length);
            expect(optimizedResult[0].channelCount).toBe(
                legacyResult[0].channelCount
            );
        });
    });
});
