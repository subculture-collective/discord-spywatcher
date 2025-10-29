import Redis from 'ioredis';

import { getRedisClient } from '../utils/redis';

/**
 * PubSubService - Provides real-time publish/subscribe functionality using Redis
 * 
 * Features:
 * - Publish events to channels
 * - Subscribe to channels for real-time updates
 * - Multiple subscribers per channel
 * - Pattern-based subscriptions
 */
export class PubSubService {
    private publisher: Redis | null = null;
    private subscriber: Redis | null = null;
    private channelPrefix: string = 'spywatcher:pubsub:';
    private messageHandlers: Map<string, Set<(message: unknown) => void>> = new Map();

    constructor() {
        this.initialize();
    }

    /**
     * Initialize publisher and subscriber connections
     */
    private initialize(): void {
        const redis = getRedisClient();
        if (!redis) {
            console.warn('Redis not available, Pub/Sub functionality disabled');
            return;
        }

        // Use the existing Redis client for publishing
        this.publisher = redis;

        // Create a duplicate connection for subscribing (Redis requirement)
        this.subscriber = redis.duplicate();

        // Set up message handler
        this.subscriber.on('message', (channel: string, message: string) => {
            this.handleMessage(channel, message);
        });

        this.subscriber.on('error', (err: Error) => {
            console.error('Redis subscriber error:', err);
        });

        console.log('✅ Pub/Sub service initialized');
    }

    /**
     * Publish a message to a channel
     * @param channel - Channel name (without prefix)
     * @param data - Data to publish
     */
    async publish(channel: string, data: unknown): Promise<void> {
        if (!this.publisher) {
            console.warn('Pub/Sub not available, skipping publish');
            return;
        }

        try {
            const fullChannel = this.channelPrefix + channel;
            const message = JSON.stringify(data);
            await this.publisher.publish(fullChannel, message);
        } catch (error) {
            console.error(`Failed to publish to channel ${channel}:`, error);
        }
    }

    /**
     * Subscribe to a channel
     * @param channel - Channel name (without prefix)
     * @param handler - Message handler function
     */
    async subscribe(channel: string, handler: (message: unknown) => void): Promise<void> {
        if (!this.subscriber) {
            console.warn('Pub/Sub not available, skipping subscribe');
            return;
        }

        try {
            const fullChannel = this.channelPrefix + channel;

            // Add handler to the set
            if (!this.messageHandlers.has(fullChannel)) {
                this.messageHandlers.set(fullChannel, new Set());
                // Subscribe to channel if this is the first handler
                await this.subscriber.subscribe(fullChannel);
                console.log(`Subscribed to channel: ${channel}`);
            }

            const handlers = this.messageHandlers.get(fullChannel);
            if (handlers) {
                handlers.add(handler);
            }
        } catch (error) {
            console.error(`Failed to subscribe to channel ${channel}:`, error);
        }
    }

    /**
     * Unsubscribe from a channel
     * @param channel - Channel name (without prefix)
     * @param handler - Message handler function to remove
     */
    async unsubscribe(channel: string, handler: (message: unknown) => void): Promise<void> {
        if (!this.subscriber) {
            return;
        }

        try {
            const fullChannel = this.channelPrefix + channel;
            const handlers = this.messageHandlers.get(fullChannel);

            if (handlers) {
                handlers.delete(handler);

                // If no more handlers, unsubscribe from channel
                if (handlers.size === 0) {
                    this.messageHandlers.delete(fullChannel);
                    await this.subscriber.unsubscribe(fullChannel);
                    console.log(`Unsubscribed from channel: ${channel}`);
                }
            }
        } catch (error) {
            console.error(`Failed to unsubscribe from channel ${channel}:`, error);
        }
    }

    /**
     * Handle incoming messages
     */
    private handleMessage(channel: string, message: string): void {
        try {
            const handlers = this.messageHandlers.get(channel);
            if (!handlers || handlers.size === 0) {
                return;
            }

            const data: unknown = JSON.parse(message);

            // Call all handlers for this channel
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error('Error in message handler:', error);
                }
            });
        } catch (error) {
            console.error('Failed to handle message:', error);
        }
    }

    /**
     * Publish analytics update
     * @param guildId - Guild ID
     * @param type - Type of analytics update
     * @param data - Analytics data
     */
    async publishAnalyticsUpdate(
        guildId: string,
        type: 'ghosts' | 'lurkers' | 'heatmap' | 'roles' | 'clients' | 'shifts',
        data: unknown
    ): Promise<void> {
        await this.publish(`analytics:${type}:${guildId}`, {
            guildId,
            type,
            data,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Publish notification
     * @param userId - User ID
     * @param notification - Notification data
     */
    async publishNotification(userId: string, notification: unknown): Promise<void> {
        await this.publish(`notifications:${userId}`, {
            userId,
            notification,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Publish user presence update
     * @param userId - User ID
     * @param presence - Presence data
     */
    async publishPresenceUpdate(userId: string, presence: unknown): Promise<void> {
        await this.publish(`presence:${userId}`, {
            userId,
            presence,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Close all connections
     */
    async close(): Promise<void> {
        if (this.subscriber) {
            await this.subscriber.quit();
            this.subscriber = null;
        }
        // Don't close publisher as it's the shared Redis client
        this.publisher = null;
        this.messageHandlers.clear();
        console.log('✅ Pub/Sub service closed');
    }
}

/**
 * Singleton instance of PubSubService
 */
export const pubsub = new PubSubService();
