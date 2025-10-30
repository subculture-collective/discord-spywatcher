import { db } from '../db';
import { cache } from '../services/cache';
import { ChannelHeatmap, GroupedTypingEvent } from '../types/analytics';

/**
 * Get channel heatmap data showing typing activity by channel
 * This function is cached for 15 minutes to reduce database load
 */
export async function getChannelHeatmap({
    guildId,
    since,
}: {
    guildId: string;
    since?: Date;
}): Promise<ChannelHeatmap[]> {
    // Generate cache key based on parameters
    const cacheKey = `analytics:heatmap:${guildId}:${since?.getTime() || 'all'}`;
    
    // Use cache.remember pattern - returns cached data or executes callback
    return cache.remember(
        cacheKey,
        900, // 15 minutes TTL
        async () => {
            return getChannelHeatmapUncached({ guildId, since });
        },
        {
            tags: [`guild:${guildId}`, 'analytics:heatmap']
        }
    );
}

/**
 * Internal uncached implementation
 */
async function getChannelHeatmapUncached({
    guildId,
    since,
}: {
    guildId: string;
    since?: Date;
}): Promise<ChannelHeatmap[]> {
    const rawData = await db.typingEvent.groupBy({
        by: ['userId', 'username', 'channelId', 'channel'] as const,
        where: {
            guildId,
            ...(since && { createdAt: { gte: since } }),
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

    const data = rawData as GroupedTypingEvent[];

    return data.map((d) => ({
        userId: d.userId,
        username: d.username,
        channelId: d.channelId,
        channel: d.channel,
        count: d._count.channelId,
    }));
}
