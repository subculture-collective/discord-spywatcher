import * as analyticsModule from '../../../src/analytics';
import { AnalyticsBroadcaster } from '../../../src/services/analyticsBroadcaster';
import * as websocketModule from '../../../src/services/websocket';

// Mock the analytics functions
jest.mock('../../../src/analytics', () => ({
    getGhostScores: jest.fn(),
    getLurkerFlags: jest.fn(),
    getChannelDiversity: jest.fn(),
}));

// Mock the websocket service
jest.mock('../../../src/services/websocket', () => ({
    websocketService: {
        emitAnalyticsUpdate: jest.fn(),
    },
}));

describe('AnalyticsBroadcaster', () => {
    let broadcaster: AnalyticsBroadcaster;
    const mockGuildId = 'test-guild-123';

    beforeEach(() => {
        broadcaster = new AnalyticsBroadcaster();
        jest.clearAllMocks();
    });

    afterEach(() => {
        broadcaster.clearThrottles();
    });

    describe('broadcastAnalyticsUpdate', () => {
        it('should fetch and broadcast analytics data', async () => {
            // Mock analytics data
            const mockGhosts = [
                { userId: 'user-1', username: 'Ghost1', ghostScore: 100 },
                { userId: 'user-2', username: 'Ghost2', ghostScore: 90 },
            ];

            const mockLurkers = [
                {
                    userId: 'user-3',
                    username: 'Lurker1',
                    lurkerScore: 80,
                    channelCount: 5,
                },
                {
                    userId: 'user-4',
                    username: 'Lurker2',
                    lurkerScore: 70,
                    channelCount: 3,
                },
            ];

            const mockChannels = [
                {
                    userId: 'user-5',
                    username: 'Diverse1',
                    channelCount: 10,
                },
                {
                    userId: 'user-6',
                    username: 'Diverse2',
                    channelCount: 8,
                },
            ];

            (analyticsModule.getGhostScores as jest.Mock).mockResolvedValue(
                mockGhosts
            );
            (analyticsModule.getLurkerFlags as jest.Mock).mockResolvedValue(
                mockLurkers
            );
            (
                analyticsModule.getChannelDiversity as jest.Mock
            ).mockResolvedValue(mockChannels);

            // Call broadcastImmediate to bypass throttling
            await broadcaster.broadcastImmediate(mockGuildId);

            // Verify analytics functions were called
            expect(analyticsModule.getGhostScores).toHaveBeenCalledWith(
                mockGuildId,
                expect.any(Date)
            );
            expect(analyticsModule.getLurkerFlags).toHaveBeenCalledWith(
                mockGuildId,
                expect.any(Date)
            );
            expect(analyticsModule.getChannelDiversity).toHaveBeenCalledWith(
                mockGuildId,
                expect.any(Date)
            );

            // Verify WebSocket emission
            expect(
                websocketModule.websocketService.emitAnalyticsUpdate
            ).toHaveBeenCalledWith(mockGuildId, {
                ghosts: mockGhosts.slice(0, 10),
                lurkers: mockLurkers.slice(0, 10),
                channelDiversity: mockChannels.slice(0, 20),
                timestamp: expect.any(String),
            });
        });

        it('should handle errors gracefully', async () => {
            const consoleErrorSpy = jest
                .spyOn(console, 'error')
                .mockImplementation();

            (analyticsModule.getGhostScores as jest.Mock).mockRejectedValue(
                new Error('Database error')
            );

            await broadcaster.broadcastImmediate(mockGuildId);

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining(
                    'Failed to broadcast analytics for guild'
                ),
                expect.any(Error)
            );

            consoleErrorSpy.mockRestore();
        });

        it('should limit results to top 10 ghosts and lurkers', async () => {
            const manyGhosts = Array.from({ length: 20 }, (_, i) => ({
                userId: `user-${i}`,
                username: `Ghost${i}`,
                ghostScore: 100 - i,
            }));

            const manyLurkers = Array.from({ length: 20 }, (_, i) => ({
                userId: `user-${i}`,
                username: `Lurker${i}`,
                lurkerScore: 100 - i,
                channelCount: 10 - i,
            }));

            const manyChannels = Array.from({ length: 30 }, (_, i) => ({
                userId: `user-${i}`,
                username: `User${i}`,
                channelCount: 30 - i,
            }));

            (analyticsModule.getGhostScores as jest.Mock).mockResolvedValue(
                manyGhosts
            );
            (analyticsModule.getLurkerFlags as jest.Mock).mockResolvedValue(
                manyLurkers
            );
            (
                analyticsModule.getChannelDiversity as jest.Mock
            ).mockResolvedValue(manyChannels);

            await broadcaster.broadcastImmediate(mockGuildId);

            const emitCall = (
                websocketModule.websocketService.emitAnalyticsUpdate as jest.Mock
            ).mock.calls[0];

            expect(emitCall[1].ghosts).toHaveLength(10);
            expect(emitCall[1].lurkers).toHaveLength(10);
            expect(emitCall[1].channelDiversity).toHaveLength(20);
        });
    });

    describe('throttling', () => {
        it('should throttle broadcasts to 30 seconds', async () => {
            jest.useFakeTimers();

            const mockData = {
                ghosts: [],
                lurkers: [],
                channels: [],
            };

            (analyticsModule.getGhostScores as jest.Mock).mockResolvedValue(
                mockData.ghosts
            );
            (analyticsModule.getLurkerFlags as jest.Mock).mockResolvedValue(
                mockData.lurkers
            );
            (
                analyticsModule.getChannelDiversity as jest.Mock
            ).mockResolvedValue(mockData.channels);

            // First call should execute immediately
            await broadcaster.broadcastAnalyticsUpdate(mockGuildId);
            await Promise.resolve(); // Wait for async operations

            expect(
                websocketModule.websocketService.emitAnalyticsUpdate
            ).toHaveBeenCalledTimes(1);

            // Second call within 30 seconds should be throttled
            await broadcaster.broadcastAnalyticsUpdate(mockGuildId);
            await Promise.resolve();

            expect(
                websocketModule.websocketService.emitAnalyticsUpdate
            ).toHaveBeenCalledTimes(1); // Still 1, not 2

            // Advance time by 30 seconds
            jest.advanceTimersByTime(30000);

            // Third call after 30 seconds should execute
            await broadcaster.broadcastAnalyticsUpdate(mockGuildId);
            await Promise.resolve();

            expect(
                websocketModule.websocketService.emitAnalyticsUpdate
            ).toHaveBeenCalledTimes(2);

            jest.useRealTimers();
        });
    });

    describe('clearThrottles', () => {
        it('should clear all throttled functions', async () => {
            const mockData = {
                ghosts: [],
                lurkers: [],
                channels: [],
            };

            (analyticsModule.getGhostScores as jest.Mock).mockResolvedValue(
                mockData.ghosts
            );
            (analyticsModule.getLurkerFlags as jest.Mock).mockResolvedValue(
                mockData.lurkers
            );
            (
                analyticsModule.getChannelDiversity as jest.Mock
            ).mockResolvedValue(mockData.channels);

            // Create a throttled function
            await broadcaster.broadcastAnalyticsUpdate(mockGuildId);

            // Clear throttles
            broadcaster.clearThrottles();

            // Verify that the throttle has been cleared
            // (Internal state verification - indirect test)
            expect(() => broadcaster.clearThrottles()).not.toThrow();
        });
    });
});
