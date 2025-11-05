import { getUserTimeline } from '../../../src/analytics/timeline';
import { db } from '../../../src/db';

jest.mock('../../../src/db', () => ({
    db: {
        presenceEvent: {
            findMany: jest.fn(),
            count: jest.fn(),
        },
        messageEvent: {
            findMany: jest.fn(),
            count: jest.fn(),
        },
        typingEvent: {
            findMany: jest.fn(),
            count: jest.fn(),
        },
        roleChangeEvent: {
            findMany: jest.fn(),
            count: jest.fn(),
        },
        joinEvent: {
            findMany: jest.fn(),
            count: jest.fn(),
        },
        deletedMessageEvent: {
            findMany: jest.fn(),
            count: jest.fn(),
        },
    },
}));

describe('Analytics - User Timeline', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getUserTimeline', () => {
        it('should return timeline with all event types', async () => {
            const baseDate = new Date('2024-01-01T12:00:00Z');
            
            const mockPresenceEvents = [
                {
                    id: 'presence1',
                    userId: 'user1',
                    username: 'Test User',
                    clients: ['web', 'mobile'],
                    metadata: null,
                    createdAt: new Date(baseDate.getTime() - 1000),
                },
            ];

            const mockMessageEvents = [
                {
                    id: 'message1',
                    userId: 'user1',
                    username: 'Test User',
                    channelId: 'channel1',
                    channel: 'general',
                    guildId: 'guild1',
                    content: 'Test message',
                    metadata: null,
                    createdAt: new Date(baseDate.getTime() - 2000),
                },
            ];

            (db.presenceEvent.findMany as jest.Mock).mockResolvedValue(mockPresenceEvents);
            (db.messageEvent.findMany as jest.Mock).mockResolvedValue(mockMessageEvents);
            (db.typingEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.roleChangeEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.joinEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.deletedMessageEvent.findMany as jest.Mock).mockResolvedValue([]);

            (db.presenceEvent.count as jest.Mock).mockResolvedValue(1);
            (db.messageEvent.count as jest.Mock).mockResolvedValue(1);
            (db.typingEvent.count as jest.Mock).mockResolvedValue(0);
            (db.roleChangeEvent.count as jest.Mock).mockResolvedValue(0);
            (db.joinEvent.count as jest.Mock).mockResolvedValue(0);
            (db.deletedMessageEvent.count as jest.Mock).mockResolvedValue(0);

            const result = await getUserTimeline({
                userId: 'user1',
                guildId: 'guild1',
            });

            expect(result.events).toHaveLength(2);
            expect(result.events[0].type).toBe('presence');
            expect(result.events[1].type).toBe('message');
            expect(result.totalCount).toBe(2);
        });

        it('should filter by event types', async () => {
            const mockMessageEvents = [
                {
                    id: 'message1',
                    userId: 'user1',
                    username: 'Test User',
                    channelId: 'channel1',
                    channel: 'general',
                    guildId: 'guild1',
                    content: 'Test message',
                    metadata: null,
                    createdAt: new Date(),
                },
            ];

            (db.presenceEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.messageEvent.findMany as jest.Mock).mockResolvedValue(mockMessageEvents);
            (db.typingEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.roleChangeEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.joinEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.deletedMessageEvent.findMany as jest.Mock).mockResolvedValue([]);

            (db.messageEvent.count as jest.Mock).mockResolvedValue(1);

            const result = await getUserTimeline({
                userId: 'user1',
                guildId: 'guild1',
                eventTypes: ['message'],
            });

            expect(result.events).toHaveLength(1);
            expect(result.events[0].type).toBe('message');
            expect(db.presenceEvent.findMany).not.toHaveBeenCalled();
        });

        it('should handle cursor-based pagination', async () => {
            const cursor = new Date('2024-01-01T12:00:00Z');
            
            (db.presenceEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.messageEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.typingEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.roleChangeEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.joinEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.deletedMessageEvent.findMany as jest.Mock).mockResolvedValue([]);

            (db.presenceEvent.count as jest.Mock).mockResolvedValue(0);
            (db.messageEvent.count as jest.Mock).mockResolvedValue(0);
            (db.typingEvent.count as jest.Mock).mockResolvedValue(0);
            (db.roleChangeEvent.count as jest.Mock).mockResolvedValue(0);
            (db.joinEvent.count as jest.Mock).mockResolvedValue(0);
            (db.deletedMessageEvent.count as jest.Mock).mockResolvedValue(0);

            await getUserTimeline({
                userId: 'user1',
                guildId: 'guild1',
                cursor: cursor.toISOString(),
            });

            // Verify cursor was used in query
            expect(db.presenceEvent.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        createdAt: expect.objectContaining({
                            lt: cursor,
                        }),
                    }),
                })
            );
        });

        it('should detect rapid activity patterns', async () => {
            const baseDate = new Date('2024-01-01T12:00:00Z');
            
            const mockTypingEvents = [
                {
                    id: 'typing1',
                    userId: 'user1',
                    username: 'Test User',
                    channelId: 'channel1',
                    channel: 'general',
                    guildId: 'guild1',
                    metadata: null,
                    createdAt: new Date(baseDate.getTime()),
                },
                {
                    id: 'typing2',
                    userId: 'user1',
                    username: 'Test User',
                    channelId: 'channel1',
                    channel: 'general',
                    guildId: 'guild1',
                    metadata: null,
                    createdAt: new Date(baseDate.getTime() - 500), // 500ms apart
                },
            ];

            (db.presenceEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.messageEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.typingEvent.findMany as jest.Mock).mockResolvedValue(mockTypingEvents);
            (db.roleChangeEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.joinEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.deletedMessageEvent.findMany as jest.Mock).mockResolvedValue([]);

            (db.presenceEvent.count as jest.Mock).mockResolvedValue(0);
            (db.messageEvent.count as jest.Mock).mockResolvedValue(0);
            (db.typingEvent.count as jest.Mock).mockResolvedValue(2);
            (db.roleChangeEvent.count as jest.Mock).mockResolvedValue(0);
            (db.joinEvent.count as jest.Mock).mockResolvedValue(0);
            (db.deletedMessageEvent.count as jest.Mock).mockResolvedValue(0);

            const result = await getUserTimeline({
                userId: 'user1',
                guildId: 'guild1',
                eventTypes: ['typing'],
            });

            // Second event should be flagged as anomalous
            expect(result.events).toHaveLength(2);
            expect(result.events[1].isAnomalous).toBe(true);
            expect(result.events[1].anomalyReason).toBe('Rapid activity detected');
        });

        it('should correctly determine hasMore based on fetched results', async () => {
            const baseDate = new Date('2024-01-01T12:00:00Z');
            
            // Create exactly limit + 1 events to test pagination
            const mockMessageEvents = Array.from({ length: 51 }, (_, i) => ({
                id: `message${i}`,
                userId: 'user1',
                username: 'Test User',
                channelId: 'channel1',
                channel: 'general',
                guildId: 'guild1',
                content: `Test message ${i}`,
                metadata: null,
                createdAt: new Date(baseDate.getTime() - i * 1000),
            }));

            (db.presenceEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.messageEvent.findMany as jest.Mock).mockResolvedValue(mockMessageEvents);
            (db.typingEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.roleChangeEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.joinEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.deletedMessageEvent.findMany as jest.Mock).mockResolvedValue([]);

            (db.presenceEvent.count as jest.Mock).mockResolvedValue(0);
            (db.messageEvent.count as jest.Mock).mockResolvedValue(51);
            (db.typingEvent.count as jest.Mock).mockResolvedValue(0);
            (db.roleChangeEvent.count as jest.Mock).mockResolvedValue(0);
            (db.joinEvent.count as jest.Mock).mockResolvedValue(0);
            (db.deletedMessageEvent.count as jest.Mock).mockResolvedValue(0);

            const result = await getUserTimeline({
                userId: 'user1',
                guildId: 'guild1',
                limit: 50,
            });

            // Should return exactly 50 events (the limit)
            expect(result.events).toHaveLength(50);
            // Should indicate there are more results
            expect(result.hasMore).toBe(true);
            expect(result.nextCursor).not.toBeNull();
        });

        it('should set hasMore to false when all results fit within limit', async () => {
            const baseDate = new Date('2024-01-01T12:00:00Z');
            
            // Create fewer than limit events
            const mockMessageEvents = Array.from({ length: 30 }, (_, i) => ({
                id: `message${i}`,
                userId: 'user1',
                username: 'Test User',
                channelId: 'channel1',
                channel: 'general',
                guildId: 'guild1',
                content: `Test message ${i}`,
                metadata: null,
                createdAt: new Date(baseDate.getTime() - i * 1000),
            }));

            (db.presenceEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.messageEvent.findMany as jest.Mock).mockResolvedValue(mockMessageEvents);
            (db.typingEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.roleChangeEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.joinEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.deletedMessageEvent.findMany as jest.Mock).mockResolvedValue([]);

            (db.presenceEvent.count as jest.Mock).mockResolvedValue(0);
            (db.messageEvent.count as jest.Mock).mockResolvedValue(30);
            (db.typingEvent.count as jest.Mock).mockResolvedValue(0);
            (db.roleChangeEvent.count as jest.Mock).mockResolvedValue(0);
            (db.joinEvent.count as jest.Mock).mockResolvedValue(0);
            (db.deletedMessageEvent.count as jest.Mock).mockResolvedValue(0);

            const result = await getUserTimeline({
                userId: 'user1',
                guildId: 'guild1',
                limit: 50,
            });

            // Should return all 30 events
            expect(result.events).toHaveLength(30);
            // Should indicate there are no more results
            expect(result.hasMore).toBe(false);
            expect(result.nextCursor).toBeNull();
        });

        it('should filter events by search query', async () => {
            const mockMessageEvents = [
                {
                    id: 'message1',
                    userId: 'user1',
                    username: 'Test User',
                    channelId: 'channel1',
                    channel: 'general',
                    guildId: 'guild1',
                    content: 'Hello world',
                    metadata: null,
                    createdAt: new Date(),
                },
            ];

            (db.presenceEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.messageEvent.findMany as jest.Mock).mockResolvedValue(mockMessageEvents);
            (db.typingEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.roleChangeEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.joinEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.deletedMessageEvent.findMany as jest.Mock).mockResolvedValue([]);

            (db.messageEvent.count as jest.Mock).mockResolvedValue(1);

            await getUserTimeline({
                userId: 'user1',
                guildId: 'guild1',
                search: 'hello',
            });

            // Verify search filter was applied
            expect(db.messageEvent.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        OR: expect.arrayContaining([
                            expect.objectContaining({
                                username: expect.objectContaining({
                                    contains: 'hello',
                                    mode: 'insensitive',
                                }),
                            }),
                        ]),
                    }),
                })
            );
        });

        it('should filter events by date range', async () => {
            const startDate = new Date('2024-01-01T00:00:00Z');
            const endDate = new Date('2024-01-31T23:59:59Z');
            
            (db.presenceEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.messageEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.typingEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.roleChangeEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.joinEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.deletedMessageEvent.findMany as jest.Mock).mockResolvedValue([]);

            (db.presenceEvent.count as jest.Mock).mockResolvedValue(0);
            (db.messageEvent.count as jest.Mock).mockResolvedValue(0);
            (db.typingEvent.count as jest.Mock).mockResolvedValue(0);
            (db.roleChangeEvent.count as jest.Mock).mockResolvedValue(0);
            (db.joinEvent.count as jest.Mock).mockResolvedValue(0);
            (db.deletedMessageEvent.count as jest.Mock).mockResolvedValue(0);

            await getUserTimeline({
                userId: 'user1',
                guildId: 'guild1',
                startDate,
                endDate,
            });

            // Verify date range filter was applied
            expect(db.presenceEvent.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        createdAt: expect.objectContaining({
                            gte: startDate,
                            lte: endDate,
                        }),
                    }),
                })
            );
        });
    });
});
