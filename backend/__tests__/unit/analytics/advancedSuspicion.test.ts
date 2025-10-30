import { calculateAdvancedSuspicion } from '../../../src/analytics/advancedSuspicion';
import { db } from '../../../src/db';

// Mock the database
jest.mock('../../../src/db', () => ({
    db: {
        messageEvent: {
            findMany: jest.fn(),
            count: jest.fn(),
            groupBy: jest.fn(),
        },
        typingEvent: {
            count: jest.fn(),
        },
        presenceEvent: {
            count: jest.fn(),
            findMany: jest.fn(),
        },
        reactionTime: {
            findMany: jest.fn(),
            aggregate: jest.fn(),
        },
        joinEvent: {
            findFirst: jest.fn(),
            groupBy: jest.fn(),
        },
    },
}));

describe('Advanced Suspicion Detection', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('calculateAdvancedSuspicion', () => {
        it('should detect high ghost score for users with presence but no messages', async () => {
            // Mock data for a ghost user
            (db.messageEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.typingEvent.count as jest.Mock).mockResolvedValue(0);
            (db.presenceEvent.count as jest.Mock).mockResolvedValue(50);
            (db.presenceEvent.findMany as jest.Mock).mockResolvedValue([
                { clients: ['desktop'] },
            ]);
            (db.reactionTime.findMany as jest.Mock).mockResolvedValue([]);
            (db.reactionTime.aggregate as jest.Mock).mockResolvedValue({
                _avg: { deltaMs: 5000 },
            });
            (db.joinEvent.findFirst as jest.Mock).mockResolvedValue({
                accountAgeDays: 100,
                username: 'GhostUser',
            });
            (db.messageEvent.groupBy as jest.Mock).mockResolvedValue([
                { userId: 'user1', _count: { userId: 10 } },
            ]);

            const result = await calculateAdvancedSuspicion(
                'test-user-id',
                'test-guild-id'
            );

            expect(result.factors.ghostScore).toBeGreaterThan(70);
            expect(result.reasons.some(r => r.includes('High presence'))).toBe(true);
        });

        it('should detect lurker behavior', async () => {
            // Mock data for a lurker
            (db.messageEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.typingEvent.count as jest.Mock).mockResolvedValue(0);
            (db.presenceEvent.count as jest.Mock).mockResolvedValue(15);
            (db.presenceEvent.findMany as jest.Mock).mockResolvedValue([
                { clients: ['desktop'] },
            ]);
            (db.reactionTime.findMany as jest.Mock).mockResolvedValue([]);
            (db.reactionTime.aggregate as jest.Mock).mockResolvedValue({
                _avg: { deltaMs: 5000 },
            });
            (db.joinEvent.findFirst as jest.Mock).mockResolvedValue({
                accountAgeDays: 100,
                username: 'LurkerUser',
            });
            (db.messageEvent.groupBy as jest.Mock).mockResolvedValue([
                { userId: 'user1', _count: { userId: 10 } },
            ]);

            const result = await calculateAdvancedSuspicion(
                'test-user-id',
                'test-guild-id'
            );

            expect(result.factors.lurkerScore).toBeGreaterThan(70);
            expect(result.reasons.some(r => r.includes('Lurker behavior'))).toBe(true);
        });

        it('should detect multi-client frequency', async () => {
            // Mock data for multi-client user
            (db.messageEvent.findMany as jest.Mock).mockResolvedValue([
                {
                    content: 'Test message',
                    createdAt: new Date(),
                    username: 'TestUser',
                },
            ]);
            (db.typingEvent.count as jest.Mock).mockResolvedValue(5);
            (db.presenceEvent.count as jest.Mock).mockResolvedValue(10);
            (db.presenceEvent.findMany as jest.Mock).mockResolvedValue([
                { clients: ['desktop', 'mobile'] },
                { clients: ['desktop', 'mobile', 'web'] },
                { clients: ['desktop', 'mobile'] },
                { clients: ['desktop', 'mobile'] },
                { clients: ['desktop', 'mobile'] },
            ]);
            (db.reactionTime.findMany as jest.Mock).mockResolvedValue([]);
            (db.reactionTime.aggregate as jest.Mock).mockResolvedValue({
                _avg: { deltaMs: 5000 },
            });
            (db.joinEvent.findFirst as jest.Mock).mockResolvedValue({
                accountAgeDays: 100,
                username: 'MultiClientUser',
            });
            (db.messageEvent.groupBy as jest.Mock).mockResolvedValue([
                { userId: 'user1', _count: { userId: 10 } },
            ]);

            const result = await calculateAdvancedSuspicion(
                'test-user-id',
                'test-guild-id'
            );

            expect(result.factors.multiClientFreq).toBeGreaterThan(50);
        });

        it('should detect timing anomalies for bot-like behavior', async () => {
            // Mock data for bot with consistent reaction times
            const consistentReactionTimes = Array(50)
                .fill(null)
                .map(() => ({ deltaMs: 250 })); // Very consistent 250ms reactions

            (db.messageEvent.findMany as jest.Mock).mockResolvedValue([
                {
                    content: 'Test',
                    createdAt: new Date(),
                    username: 'BotUser',
                },
            ]);
            (db.typingEvent.count as jest.Mock).mockResolvedValue(5);
            (db.presenceEvent.count as jest.Mock).mockResolvedValue(10);
            (db.presenceEvent.findMany as jest.Mock).mockResolvedValue([
                { clients: ['desktop'] },
            ]);
            (db.reactionTime.findMany as jest.Mock).mockResolvedValue(
                consistentReactionTimes
            );
            (db.reactionTime.aggregate as jest.Mock).mockResolvedValue({
                _avg: { deltaMs: 5000 },
            });
            (db.joinEvent.findFirst as jest.Mock).mockResolvedValue({
                accountAgeDays: 100,
                username: 'BotUser',
            });
            (db.messageEvent.groupBy as jest.Mock).mockResolvedValue([
                { userId: 'user1', _count: { userId: 10 } },
            ]);

            const result = await calculateAdvancedSuspicion(
                'test-user-id',
                'test-guild-id'
            );

            expect(result.factors.timingAnomalies).toBeGreaterThan(30);
        });

        it('should detect new account suspicion', async () => {
            // Mock data for new account
            (db.messageEvent.findMany as jest.Mock).mockResolvedValue([
                {
                    content: 'Hello',
                    createdAt: new Date(),
                    username: 'NewUser',
                },
            ]);
            (db.typingEvent.count as jest.Mock).mockResolvedValue(5);
            (db.presenceEvent.count as jest.Mock).mockResolvedValue(10);
            (db.presenceEvent.findMany as jest.Mock).mockResolvedValue([
                { clients: ['desktop'] },
            ]);
            (db.reactionTime.findMany as jest.Mock).mockResolvedValue([]);
            (db.reactionTime.aggregate as jest.Mock).mockResolvedValue({
                _avg: { deltaMs: 5000 },
            });
            (db.joinEvent.findFirst as jest.Mock).mockResolvedValue({
                accountAgeDays: 5, // 5 day old account
                username: 'NewUser',
            });
            (db.messageEvent.groupBy as jest.Mock).mockResolvedValue([
                { userId: 'user1', _count: { userId: 10 } },
            ]);

            const result = await calculateAdvancedSuspicion(
                'test-user-id',
                'test-guild-id'
            );

            expect(result.factors.accountAge).toBe(5);
            expect(result.reasons.some(r => r.includes('New account'))).toBe(true);
        });

        it('should calculate confidence levels correctly', async () => {
            // High suspicion scenario
            (db.messageEvent.findMany as jest.Mock).mockResolvedValue([]);
            (db.typingEvent.count as jest.Mock).mockResolvedValue(0);
            (db.presenceEvent.count as jest.Mock).mockResolvedValue(100);
            (db.presenceEvent.findMany as jest.Mock).mockResolvedValue(
                Array(20).fill({ clients: ['desktop', 'mobile'] })
            );
            (db.reactionTime.findMany as jest.Mock).mockResolvedValue([]);
            (db.reactionTime.aggregate as jest.Mock).mockResolvedValue({
                _avg: { deltaMs: 5000 },
            });
            (db.joinEvent.findFirst as jest.Mock).mockResolvedValue({
                accountAgeDays: 2,
                username: 'SuspiciousUser',
            });
            (db.messageEvent.groupBy as jest.Mock).mockResolvedValue([
                { userId: 'user1', _count: { userId: 10 } },
            ]);

            const result = await calculateAdvancedSuspicion(
                'test-user-id',
                'test-guild-id'
            );

            expect(result.totalScore).toBeGreaterThan(60);
            expect(['high', 'medium', 'low']).toContain(result.confidence);
        });

        it('should provide recommended actions', async () => {
            // Normal user
            (db.messageEvent.findMany as jest.Mock).mockResolvedValue([
                {
                    content: 'Normal message',
                    createdAt: new Date(),
                    username: 'NormalUser',
                },
            ]);
            (db.typingEvent.count as jest.Mock).mockResolvedValue(10);
            (db.presenceEvent.count as jest.Mock).mockResolvedValue(15);
            (db.presenceEvent.findMany as jest.Mock).mockResolvedValue([
                { clients: ['desktop'] },
            ]);
            (db.reactionTime.findMany as jest.Mock).mockResolvedValue([
                { deltaMs: 3000 },
            ]);
            (db.reactionTime.aggregate as jest.Mock).mockResolvedValue({
                _avg: { deltaMs: 5000 },
            });
            (db.joinEvent.findFirst as jest.Mock).mockResolvedValue({
                accountAgeDays: 200,
                username: 'NormalUser',
            });
            (db.messageEvent.groupBy as jest.Mock).mockResolvedValue([
                { userId: 'user1', _count: { userId: 10 } },
            ]);

            const result = await calculateAdvancedSuspicion(
                'test-user-id',
                'test-guild-id'
            );

            expect(result.recommendedAction).toBeDefined();
            expect(typeof result.recommendedAction).toBe('string');
        });
    });
});
