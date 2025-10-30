import { cache } from './cache';
import { pubsub } from './pubsub';

/**
 * CacheInvalidationService - Handles cache invalidation on data changes
 * 
 * This service provides utilities to invalidate cache entries when data
 * is created, updated, or deleted, ensuring data consistency.
 */
export class CacheInvalidationService {
    /**
     * Invalidate cache when a message event is created
     * @param guildId - Guild ID where the message was created
     */
    async onMessageCreated(guildId: string): Promise<void> {
        try {
            // Invalidate all analytics caches for this guild
            await Promise.all([
                cache.invalidateByTag(`guild:${guildId}`),
                cache.invalidateByTag('analytics:ghosts'),
                cache.invalidateByTag('analytics:lurkers'),
                cache.invalidateByTag('analytics:heatmap'),
                cache.invalidateByTag('analytics:shifts'),
            ]);

            // Publish real-time update
            await pubsub.publish(`cache:invalidated:${guildId}`, {
                event: 'message_created',
                guildId,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            console.error('Failed to invalidate cache on message created:', error);
        }
    }

    /**
     * Invalidate cache when a typing event is created
     * @param guildId - Guild ID where typing occurred
     */
    async onTypingEvent(guildId: string): Promise<void> {
        try {
            // Invalidate ghost and heatmap analytics
            await Promise.all([
                cache.invalidateByTag(`guild:${guildId}`),
                cache.invalidateByTag('analytics:ghosts'),
                cache.invalidateByTag('analytics:heatmap'),
            ]);

            // Publish real-time update
            await pubsub.publish(`cache:invalidated:${guildId}`, {
                event: 'typing_event',
                guildId,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            console.error('Failed to invalidate cache on typing event:', error);
        }
    }

    /**
     * Invalidate cache when a presence event is created
     * @param userId - User ID with presence change
     */
    async onPresenceUpdate(userId: string): Promise<void> {
        try {
            // Invalidate lurker and client drift analytics
            await Promise.all([
                cache.invalidateByTag('analytics:lurkers'),
                cache.invalidateByTag('analytics:clients'),
            ]);

            // Publish real-time update
            await pubsub.publish(`cache:invalidated:${userId}`, {
                event: 'presence_updated',
                userId,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            console.error('Failed to invalidate cache on presence update:', error);
        }
    }

    /**
     * Invalidate cache when a role change event occurs
     * @param guildId - Guild ID where role changed
     */
    async onRoleChanged(guildId: string): Promise<void> {
        try {
            // Invalidate role analytics
            await Promise.all([
                cache.invalidateByTag(`guild:${guildId}`),
                cache.invalidateByTag('analytics:roles'),
            ]);

            // Publish real-time update
            await pubsub.publish(`cache:invalidated:${guildId}`, {
                event: 'role_changed',
                guildId,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            console.error('Failed to invalidate cache on role change:', error);
        }
    }

    /**
     * Invalidate cache when a member joins
     * @param guildId - Guild ID where member joined
     */
    async onMemberJoined(guildId: string): Promise<void> {
        try {
            // Invalidate guild-related caches
            await cache.invalidateByTag(`guild:${guildId}`);

            // Publish real-time update
            await pubsub.publish(`cache:invalidated:${guildId}`, {
                event: 'member_joined',
                guildId,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            console.error('Failed to invalidate cache on member join:', error);
        }
    }

    /**
     * Invalidate all analytics caches for a guild
     * @param guildId - Guild ID
     */
    async invalidateAllAnalytics(guildId: string): Promise<void> {
        try {
            await Promise.all([
                cache.invalidateByTag(`guild:${guildId}`),
                cache.invalidateByTag('analytics:ghosts'),
                cache.invalidateByTag('analytics:lurkers'),
                cache.invalidateByTag('analytics:heatmap'),
                cache.invalidateByTag('analytics:roles'),
                cache.invalidateByTag('analytics:clients'),
                cache.invalidateByTag('analytics:shifts'),
            ]);

            console.log(`Invalidated all analytics caches for guild: ${guildId}`);
        } catch (error) {
            console.error('Failed to invalidate all analytics:', error);
        }
    }

    /**
     * Batch invalidation for multiple guilds
     * Useful for bulk operations
     */
    async invalidateMultipleGuilds(guildIds: string[]): Promise<void> {
        try {
            await Promise.all(
                guildIds.map(guildId => this.invalidateAllAnalytics(guildId))
            );
        } catch (error) {
            console.error('Failed to invalidate multiple guilds:', error);
        }
    }
}

/**
 * Singleton instance of CacheInvalidationService
 */
export const cacheInvalidation = new CacheInvalidationService();
