import { getLurkerFlags } from '../../../src/analytics/lurkers';
import { db } from '../../../src/db';

jest.mock('../../../src/db', () => ({
    db: {
        presenceEvent: {
            findMany: jest.fn(),
        },
        typingEvent: {
            findMany: jest.fn(),
        },
        messageEvent: {
            findMany: jest.fn(),
        },
    },
}));

describe('Analytics - Lurker Flags', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getLurkerFlags', () => {
        it('should identify lurkers with presence but no activity', async () => {
            const mockPresence = [
                { userId: 'lurker1', username: 'Lurker One', createdAt: new Date() },
                { userId: 'lurker1', username: 'Lurker One', createdAt: new Date() },
                { userId: 'lurker1', username: 'Lurker One', createdAt: new Date() },
                { userId: 'lurker1', username: 'Lurker One', createdAt: new Date() },
                { userId: 'lurker1', username: 'Lurker One', createdAt: new Date() },
                { userId: 'active1', username: 'Active User', createdAt: new Date() },
            ];

            const mockTyping = [
                { userId: 'active1', username: 'Active User', guildId: 'guild1', createdAt: new Date() },
            ];

            const mockMessages = [
                { userId: 'active1', guildId: 'guild1', createdAt: new Date() },
            ];

            (db.presenceEvent.findMany as jest.Mock).mockResolvedValue(mockPresence);
            (db.typingEvent.findMany as jest.Mock).mockResolvedValue(mockTyping);
            (db.messageEvent.findMany as jest.Mock).mockResolvedValue(mockMessages);

            const result = await getLurkerFlags('guild1');

            expect(result).toHaveLength(1);
            expect(result[0].userId).toBe('lurker1');
            expect(result[0].username).toBe('Lurker One');
            expect(result[0].lurkerScore).toBe(1); // >= 5 presence events
            expect(result[0].presenceCount).toBe(5);
        });

        it('should not flag users with less than 5 presence events', async () => {
            const mockPresence = [
                { userId: 'user1', username: 'User One', createdAt: new Date() },
                { userId: 'user1', username: 'User One', createdAt: new Date() },
            ];

            const mockTyping: any[] = [];
            const mockMessages: any[] = [];

            (db.presenceEvent.findMany as jest.Mock).mockResolvedValue(mockPresence);
            (db.typingEvent.findMany as jest.Mock).mockResolvedValue(mockTyping);
            (db.messageEvent.findMany as jest.Mock).mockResolvedValue(mockMessages);

            const result = await getLurkerFlags('guild1');

            expect(result).toHaveLength(1);
            expect(result[0].lurkerScore).toBe(0); // < 5 presence events
        });

        it('should exclude active users from lurker list', async () => {
            const mockPresence = [
                { userId: 'active1', username: 'Active', createdAt: new Date() },
                { userId: 'active1', username: 'Active', createdAt: new Date() },
                { userId: 'active1', username: 'Active', createdAt: new Date() },
                { userId: 'active1', username: 'Active', createdAt: new Date() },
                { userId: 'active1', username: 'Active', createdAt: new Date() },
                { userId: 'active1', username: 'Active', createdAt: new Date() },
            ];

            const mockTyping = [
                { userId: 'active1', username: 'Active', guildId: 'guild1', createdAt: new Date() },
            ];

            const mockMessages: any[] = [];

            (db.presenceEvent.findMany as jest.Mock).mockResolvedValue(mockPresence);
            (db.typingEvent.findMany as jest.Mock).mockResolvedValue(mockTyping);
            (db.messageEvent.findMany as jest.Mock).mockResolvedValue(mockMessages);

            const result = await getLurkerFlags('guild1');

            expect(result).toHaveLength(0); // Active in typing
        });

        it('should filter by date when provided', async () => {
            const since = new Date('2024-01-01');
            
            (db.presenceEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.typingEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.messageEvent.findMany as jest.Mock).mockResolvedValue([]);

            await getLurkerFlags('guild1', since);

            expect(db.presenceEvent.findMany).toHaveBeenCalledWith({
                where: {
                    createdAt: { gte: since },
                },
            });

            expect(db.typingEvent.findMany).toHaveBeenCalledWith({
                where: {
                    guildId: 'guild1',
                    createdAt: { gte: since },
                },
            });
        });

        it('should return empty array when no lurkers', async () => {
            (db.presenceEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.typingEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.messageEvent.findMany as jest.Mock).mockResolvedValue([]);

            const result = await getLurkerFlags('guild1');

            expect(result).toEqual([]);
        });

        it('should aggregate presence count per user', async () => {
            const mockPresence = [
                { userId: 'user1', username: 'User', createdAt: new Date() },
                { userId: 'user1', username: 'User', createdAt: new Date() },
                { userId: 'user1', username: 'User', createdAt: new Date() },
                { userId: 'user2', username: 'User Two', createdAt: new Date() },
                { userId: 'user2', username: 'User Two', createdAt: new Date() },
                { userId: 'user2', username: 'User Two', createdAt: new Date() },
                { userId: 'user2', username: 'User Two', createdAt: new Date() },
                { userId: 'user2', username: 'User Two', createdAt: new Date() },
                { userId: 'user2', username: 'User Two', createdAt: new Date() },
            ];

            (db.presenceEvent.findMany as jest.Mock).mockResolvedValue(mockPresence);
            (db.typingEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.messageEvent.findMany as jest.Mock).mockResolvedValue([]);

            const result = await getLurkerFlags('guild1');

            expect(result).toHaveLength(2);
            
            const user1 = result.find(u => u.userId === 'user1');
            const user2 = result.find(u => u.userId === 'user2');
            
            expect(user1?.presenceCount).toBe(3);
            expect(user2?.presenceCount).toBe(6);
            expect(user2?.lurkerScore).toBe(1); // >= 5
        });
    });
});
