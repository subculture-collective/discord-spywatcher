import { db } from '../db';

/**
 * Optimized reaction statistics using database aggregation
 * Calculates average reaction time and fast reaction count per user
 */
export async function getReactionStats(guildId: string, since?: Date) {
    const sinceDate = since || new Date(0);

    // Single aggregation query for better performance
    const result = await db.$queryRaw<
        {
            userId: string;
            username: string;
            avg_reaction_time: number;
            fast_reaction_count: bigint;
            total_count: bigint;
        }[]
    >`
    SELECT 
      "observerId" as "userId",
      MAX("observerName") as username,
      AVG("deltaMs")::float as avg_reaction_time,
      COUNT(*) FILTER (WHERE "deltaMs" < 3000) as fast_reaction_count,
      COUNT(*) as total_count
    FROM "ReactionTime"
    WHERE "guildId" = ${guildId}
      AND "createdAt" >= ${sinceDate}::timestamptz
    GROUP BY "observerId"
    HAVING COUNT(*) > 0
    ORDER BY avg_reaction_time ASC
  `;

    return result.map((r) => ({
        userId: r.userId,
        username: r.username,
        avgReactionTime: r.avg_reaction_time,
        fastReactionCount: Number(r.fast_reaction_count),
    }));
}

/**
 * Legacy implementation kept for comparison
 * @deprecated Use getReactionStats for better performance
 */
export async function getReactionStatsLegacy(guildId: string, since?: Date) {
    const reactions = await db.reactionTime.findMany({
        where: {
            guildId,
            ...(since && { createdAt: { gte: since } }),
        },
    });

    const userMap = new Map<
        string,
        {
            username: string;
            fastCount: number;
            totalCount: number;
            totalMs: number;
        }
    >();

    for (const r of reactions) {
        const entry = userMap.get(r.observerId) ?? {
            username: r.observerName,
            fastCount: 0,
            totalCount: 0,
            totalMs: 0,
        };

        entry.totalCount += 1;
        entry.totalMs += r.deltaMs;
        if (r.deltaMs < 3000) entry.fastCount += 1;

        userMap.set(r.observerId, entry);
    }

    return Array.from(userMap.entries()).map(([userId, e]) => ({
        userId,
        username: e.username,
        avgReactionTime: e.totalMs / e.totalCount,
        fastReactionCount: e.fastCount,
    }));
}
