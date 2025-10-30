import { throttle } from 'lodash';

import {
    getChannelDiversity,
    getGhostScores,
    getLurkerFlags,
} from '../analytics';

import { websocketService } from './websocket';

/**
 * Service for broadcasting throttled analytics updates via WebSocket
 */
export class AnalyticsBroadcaster {
    private throttledBroadcasters: Map<
        string,
        ReturnType<typeof throttle>
    > = new Map();

    /**
     * Broadcast analytics update for a guild (throttled to 30 seconds)
     */
    broadcastAnalyticsUpdate(guildId: string): void {
        // Get or create throttled function for this guild
        let throttledFn = this.throttledBroadcasters.get(guildId);

        if (!throttledFn) {
            // Create a throttled function that executes at most once per 30 seconds
            throttledFn = throttle(
                async (id: string) => {
                    await this.performBroadcast(id);
                },
                30000, // 30 seconds
                { leading: true, trailing: false }
            );
            this.throttledBroadcasters.set(guildId, throttledFn);
        }

        // Call the throttled function
        void throttledFn(guildId);
    }

    /**
     * Perform the actual broadcast (called by throttled function)
     */
    private async performBroadcast(guildId: string): Promise<void> {
        try {
            const since = new Date(
                Date.now() - 1000 * 60 * 60 * 24 * 7
            ); // Past 7 days

            // Fetch analytics data in parallel
            const [ghosts, lurkers, channelDiversity] = await Promise.all([
                getGhostScores(guildId, since),
                getLurkerFlags(guildId, since),
                getChannelDiversity(guildId, since),
            ]);

            // Broadcast to all clients subscribed to this guild's analytics
            websocketService.emitAnalyticsUpdate(guildId, {
                ghosts: ghosts.slice(0, 10), // Top 10 only
                lurkers: lurkers.slice(0, 10), // Top 10 only
                channelDiversity: channelDiversity.slice(0, 20), // Top 20 users
                timestamp: new Date().toISOString(),
            });

            console.log(
                `[Analytics] Broadcast analytics update for guild ${guildId}`
            );
        } catch (error) {
            console.error(
                `Failed to broadcast analytics for guild ${guildId}:`,
                error
            );
        }
    }

    /**
     * Force immediate broadcast (bypasses throttling)
     */
    async broadcastImmediate(guildId: string): Promise<void> {
        await this.performBroadcast(guildId);
    }

    /**
     * Clear all throttled functions (useful for testing)
     */
    clearThrottles(): void {
        this.throttledBroadcasters.forEach((fn) => {
            fn.cancel();
        });
        this.throttledBroadcasters.clear();
    }
}

/**
 * Singleton instance of AnalyticsBroadcaster
 */
export const analyticsBroadcaster = new AnalyticsBroadcaster();
