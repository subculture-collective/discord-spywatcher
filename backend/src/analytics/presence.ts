import { db } from '../db';
import { cache } from '../services/cache';

/**
 * Optimized multi-client login detection using database aggregation
 * Counts presence events where users have multiple clients (2+)
 * 
 * This function is cached for 5 minutes to reduce database load
 */
export async function getMultiClientLoginCounts(guildId: string, since?: Date) {
    // Generate cache key based on parameters
    const cacheKey = `analytics:presence:${guildId}:${since?.getTime() || 'all'}`;
    
    // Use cache.remember pattern - returns cached data or executes callback
    return cache.remember(
        cacheKey,
        300, // 5 minutes TTL
        async () => {
            return getMultiClientLoginCountsUncached(guildId, since);
        },
        {
            tags: [`guild:${guildId}`, 'analytics:presence']
        }
    );
}

/**
 * Internal uncached implementation using optimized database aggregation
 */
async function getMultiClientLoginCountsUncached(_guildId: string, since?: Date) {
    const sinceDate = since || new Date(0);

    // Single optimized query using database aggregation
    // Uses partial index idx_presence_multi_client for better performance
    const result = await db.$queryRaw<
        {
            userId: string;
            username: string;
            multi_client_count: bigint;
        }[]
    >`
    SELECT 
      "userId",
      MAX("username") as username,
      COUNT(*) as multi_client_count
    FROM "PresenceEvent"
    WHERE "createdAt" >= ${sinceDate}::timestamptz
      AND array_length(clients, 1) >= 2
    GROUP BY "userId"
    HAVING COUNT(*) > 0
    ORDER BY multi_client_count DESC
    LIMIT 100
  `;

    return result.map((r) => ({
        userId: r.userId,
        username: r.username,
        multiClientCount: Number(r.multi_client_count),
    }));
}

/**
 * Legacy implementation kept for comparison
 * @deprecated Use getMultiClientLoginCounts for better performance
 */
export async function getMultiClientLoginCountsLegacy(_guildId: string, since?: Date) {
    const events = await db.presenceEvent.findMany({
        where: {
            createdAt: since ? { gte: since } : undefined,
        },
    });

    const userMap = new Map<string, { username: string; count: number }>();

    for (const e of events) {
        const clientCount = e.clients.length;

        if (clientCount >= 2) {
            const current = userMap.get(e.userId) ?? {
                username: e.username,
                count: 0,
            };
            current.count += 1;
            userMap.set(e.userId, current);
        }
    }

    return Array.from(userMap.entries())
        .map(([userId, { username, count }]) => ({
            userId,
            username,
            multiClientCount: count,
        }))
        .sort((a, b) => b.multiClientCount - a.multiClientCount);
}
