import { db } from '../db';
import { cache } from '../services/cache';

/**
 * Get behavior shift flags for users with changing activity patterns
 * This function is cached for 5 minutes to reduce database load
 */
export async function getBehaviorShiftFlags(guildId: string, _since?: Date) {
    // Generate cache key based on parameters
    const cacheKey = `analytics:shifts:${guildId}:${_since?.getTime() || 'all'}`;

    // Use cache.remember pattern - returns cached data or executes callback
    return cache.remember(
        cacheKey,
        300, // 5 minutes TTL
        async () => {
            return getBehaviorShiftFlagsUncached(guildId, _since);
        },
        {
            tags: [`guild:${guildId}`, 'analytics:shifts'],
        }
    );
}

/**
 * Internal uncached implementation using optimized database aggregation
 * Reduces 4 separate queries into 1 single query with CTEs
 */
async function getBehaviorShiftFlagsUncached(guildId: string, _since?: Date) {
    const now = Date.now();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const twoWeeksAgo = new Date(now - oneWeek * 2);
    const oneWeekAgo = new Date(now - oneWeek);

    // Single optimized query using Common Table Expressions (CTEs)
    const result = await db.$queryRaw<
        {
            userId: string;
            username: string;
            old_messages: bigint;
            new_messages: bigint;
            old_typing: bigint;
            new_typing: bigint;
        }[]
    >`
    WITH past_messages AS (
      SELECT "userId", MAX("username") as username, COUNT(*) as count
      FROM "MessageEvent"
      WHERE "guildId" = ${guildId}
        AND "createdAt" >= ${twoWeeksAgo}::timestamptz
        AND "createdAt" < ${oneWeekAgo}::timestamptz
      GROUP BY "userId"
    ),
    recent_messages AS (
      SELECT "userId", MAX("username") as username, COUNT(*) as count
      FROM "MessageEvent"
      WHERE "guildId" = ${guildId}
        AND "createdAt" >= ${oneWeekAgo}::timestamptz
      GROUP BY "userId"
    ),
    past_typing AS (
      SELECT "userId", MAX("username") as username, COUNT(*) as count
      FROM "TypingEvent"
      WHERE "guildId" = ${guildId}
        AND "createdAt" >= ${twoWeeksAgo}::timestamptz
        AND "createdAt" < ${oneWeekAgo}::timestamptz
      GROUP BY "userId"
    ),
    recent_typing AS (
      SELECT "userId", MAX("username") as username, COUNT(*) as count
      FROM "TypingEvent"
      WHERE "guildId" = ${guildId}
        AND "createdAt" >= ${oneWeekAgo}::timestamptz
      GROUP BY "userId"
    )
    SELECT 
      COALESCE(pm."userId", rm."userId", pt."userId", rt."userId") as "userId",
      COALESCE(pm.username, rm.username, pt.username, rt.username) as username,
      COALESCE(pm.count, 0) as old_messages,
      COALESCE(rm.count, 0) as new_messages,
      COALESCE(pt.count, 0) as old_typing,
      COALESCE(rt.count, 0) as new_typing
    FROM past_messages pm
    FULL OUTER JOIN recent_messages rm ON pm."userId" = rm."userId"
    FULL OUTER JOIN past_typing pt ON COALESCE(pm."userId", rm."userId") = pt."userId"
    FULL OUTER JOIN recent_typing rt ON COALESCE(pm."userId", rm."userId", pt."userId") = rt."userId"
    WHERE COALESCE(pm.count, 0) + COALESCE(rm.count, 0) + COALESCE(pt.count, 0) + COALESCE(rt.count, 0) > 0
    LIMIT 200
  `;

    return result.map((r) => {
        const oldMessages = Number(r.old_messages);
        const newMessages = Number(r.new_messages);
        const oldTyping = Number(r.old_typing);
        const newTyping = Number(r.new_typing);

        const messageDrop = oldMessages > 0 && newMessages === 0;
        const typingSpike = newTyping > oldTyping * 2 && oldTyping >= 5;

        return {
            userId: r.userId,
            username: r.username,
            behaviorShiftScore: (messageDrop ? 1 : 0) + (typingSpike ? 1 : 0),
            messageDrop,
            typingSpike,
        };
    });
}

/**
 * Legacy implementation kept for comparison
 * @deprecated Use getBehaviorShiftFlags for better performance
 */
export async function getBehaviorShiftFlagsLegacy(
    guildId: string,
    _since?: Date
) {
    const now = Date.now();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const twoWeeksAgo = new Date(now - oneWeek * 2);
    const oneWeekAgo = new Date(now - oneWeek);

    const pastMessages = await db.messageEvent.findMany({
        where: {
            guildId,
            createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo },
        },
    });

    const recentMessages = await db.messageEvent.findMany({
        where: {
            guildId,
            createdAt: { gte: oneWeekAgo },
        },
    });

    const pastTyping = await db.typingEvent.findMany({
        where: {
            guildId,
            createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo },
        },
    });

    const recentTyping = await db.typingEvent.findMany({
        where: {
            guildId,
            createdAt: { gte: oneWeekAgo },
        },
    });

    const userStats = new Map<
        string,
        {
            username: string;
            oldMessages: number;
            newMessages: number;
            oldTyping: number;
            newTyping: number;
        }
    >();

    const add = (
        userId: string,
        username: string,
        type: 'oldMessages' | 'newMessages' | 'oldTyping' | 'newTyping'
    ) => {
        const existing = userStats.get(userId) ?? {
            username,
            oldMessages: 0,
            newMessages: 0,
            oldTyping: 0,
            newTyping: 0,
        };
        // eslint-disable-next-line security/detect-object-injection
        existing[type]++;
        userStats.set(userId, existing);
    };

    pastMessages.forEach((m) => add(m.userId, m.username, 'oldMessages'));
    recentMessages.forEach((m) => add(m.userId, m.username, 'newMessages'));
    pastTyping.forEach((t) => add(t.userId, t.username, 'oldTyping'));
    recentTyping.forEach((t) => add(t.userId, t.username, 'newTyping'));

    return Array.from(userStats.entries()).map(([userId, s]) => {
        const messageDrop = s.oldMessages > 0 && s.newMessages === 0;
        const typingSpike = s.newTyping > s.oldTyping * 2 && s.oldTyping >= 5;

        return {
            userId,
            username: s.username,
            behaviorShiftScore: (messageDrop ? 1 : 0) + (typingSpike ? 1 : 0),
            messageDrop,
            typingSpike,
        };
    });
}
