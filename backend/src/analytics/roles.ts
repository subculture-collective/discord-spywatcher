import { db } from '../db';
import { cache } from '../services/cache';

/**
 * Get role drift flags for users with frequent role changes
 * This function is cached for 10 minutes to reduce database load
 */
export async function getRoleDriftFlags(guildId: string, since?: Date) {
    // Generate cache key based on parameters
    const cacheKey = `analytics:roles:${guildId}:${since?.getTime() || 'all'}`;
    
    // Use cache.remember pattern - returns cached data or executes callback
    return cache.remember(
        cacheKey,
        600, // 10 minutes TTL
        async () => {
            return getRoleDriftFlagsUncached(guildId, since);
        },
        {
            tags: [`guild:${guildId}`, 'analytics:roles']
        }
    );
}

/**
 * Internal uncached implementation
 */
async function getRoleDriftFlagsUncached(guildId: string, since?: Date) {
    const events = await db.roleChangeEvent.findMany({
        where: {
            guildId,
            ...(since && { createdAt: { gte: since } }),
        },
    });

    const map = new Map<string, { username: string; count: number }>();

    for (const e of events) {
        const entry = map.get(e.userId) ?? { username: e.username, count: 0 };
        entry.count += 1;
        map.set(e.userId, entry);
    }

    return Array.from(map.entries()).map(([userId, { username, count }]) => ({
        userId,
        username,
        roleChangeCount: count,
        roleDriftScore: count >= 2 ? 1 : 0, // configurable threshold
    }));
}
