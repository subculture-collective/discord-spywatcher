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
    });
});
