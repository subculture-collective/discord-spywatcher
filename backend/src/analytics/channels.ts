import { db } from '../db';
import { cache } from '../services/cache';

/**
 * Optimized channel diversity using database aggregation
 * Calculates the number of unique channels each user has typed in
 * 
 * This function is cached for 5 minutes to reduce database load
 */
export async function getChannelDiversity(guildId: string, since?: Date) {
    // Generate cache key based on parameters
    const cacheKey = `analytics:channels:${guildId}:${since?.getTime() || 'all'}`;
    
    // Use cache.remember pattern - returns cached data or executes callback
    return cache.remember(
        cacheKey,
        300, // 5 minutes TTL
        async () => {
            return getChannelDiversityUncached(guildId, since);
        },
        {
            tags: [`guild:${guildId}`, 'analytics:channels']
        }
    );
}

/**
 * Internal uncached implementation using optimized database aggregation
 */
async function getChannelDiversityUncached(guildId: string, since?: Date) {
    const sinceDate = since || new Date(0);

    // Single optimized query using database aggregation
    const result = await db.$queryRaw<
        {
            userId: string;
            username: string;
            channel_count: bigint;
        }[]
    >`
    SELECT 
      "userId",
      MAX("username") as username,
      COUNT(DISTINCT "channelId") as channel_count
    FROM "TypingEvent"
    WHERE "guildId" = ${guildId}
      AND "createdAt" >= ${sinceDate}::timestamptz
    GROUP BY "userId"
    ORDER BY channel_count DESC
    LIMIT 100
  `;

    return result.map((r) => ({
        userId: r.userId,
        username: r.username,
        channelCount: Number(r.channel_count),
    }));
}

/**
 * Legacy implementation kept for comparison
 * @deprecated Use getChannelDiversity for better performance
 */
export async function getChannelDiversityLegacy(guildId: string, since?: Date) {
    const events = await db.typingEvent.findMany({
        where: {
            guildId,
            ...(since && { createdAt: { gte: since } }),
        },
        select: {
            userId: true,
            username: true,
            channelId: true,
        },
    });

    const userMap = new Map<
        string,
        { username: string; channels: Set<string> }
    >();

    for (const event of events) {
        const entry = userMap.get(event.userId) ?? {
            username: event.username,
            channels: new Set(),
        };
        entry.channels.add(event.channelId);
        userMap.set(event.userId, entry);
    }

    return Array.from(userMap.entries())
        .map(([userId, { username, channels }]) => ({
            userId,
            username,
            channelCount: channels.size,
        }))
        .sort((a, b) => b.channelCount - a.channelCount);
}
