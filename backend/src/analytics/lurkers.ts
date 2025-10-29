import { db } from '../db';

/**
 * Optimized lurker detection using a single aggregation query
 * Lurkers are users with presence events but no typing or messaging activity
 */
export async function getLurkerFlags(guildId: string, since?: Date) {
    const sinceDate = since || new Date(0);

    // Single optimized query that identifies lurkers
    const result = await db.$queryRaw<
        {
            userId: string;
            username: string;
            presence_count: bigint;
            activity_count: bigint;
            lurker_score: number;
        }[]
    >`
    SELECT 
      p."userId",
      p.username,
      p.presence_count,
      COALESCE(a.activity_count, 0) as activity_count,
      CASE 
        WHEN COALESCE(a.activity_count, 0) = 0 AND p.presence_count >= 5 THEN 1
        ELSE 0
      END as lurker_score
    FROM (
      SELECT "userId", "username", COUNT(*) as presence_count
      FROM "PresenceEvent"
      WHERE "createdAt" >= ${sinceDate}::timestamptz
      GROUP BY "userId", "username"
    ) p
    LEFT JOIN (
      SELECT "userId", COUNT(*) as activity_count
      FROM (
        SELECT "userId" FROM "TypingEvent" 
        WHERE "guildId" = ${guildId} AND "createdAt" >= ${sinceDate}::timestamptz
        UNION ALL
        SELECT "userId" FROM "MessageEvent" 
        WHERE "guildId" = ${guildId} AND "createdAt" >= ${sinceDate}::timestamptz
      ) combined
      GROUP BY "userId"
    ) a ON p."userId" = a."userId"
    WHERE COALESCE(a.activity_count, 0) = 0
    ORDER BY p.presence_count DESC
  `;

    return result.map((r) => ({
        userId: r.userId,
        username: r.username,
        lurkerScore: r.lurker_score,
        presenceCount: Number(r.presence_count),
    }));
}

/**
 * Legacy implementation kept for comparison
 * @deprecated Use getLurkerFlags for better performance
 */
export async function getLurkerFlagsLegacy(guildId: string, since?: Date) {
    const presence = await db.presenceEvent.findMany({
        where: {
            ...(since && { createdAt: { gte: since } }),
        },
    });

    const typing = await db.typingEvent.findMany({
        where: {
            guildId,
            ...(since && { createdAt: { gte: since } }),
        },
    });

    const messages = await db.messageEvent.findMany({
        where: {
            guildId,
            ...(since && { createdAt: { gte: since } }),
        },
    });

    // Aggregate
    const activeUserIds = new Set([
        ...typing.map((e) => e.userId),
        ...messages.map((e) => e.userId),
    ]);

    const presenceMap = new Map<string, { username: string; count: number }>();

    for (const p of presence) {
        if (!activeUserIds.has(p.userId)) {
            const current = presenceMap.get(p.userId) ?? {
                username: p.username,
                count: 0,
            };
            current.count += 1;
            presenceMap.set(p.userId, current);
        }
    }

    return Array.from(presenceMap.entries()).map(
        ([userId, { username, count }]) => ({
            userId,
            username,
            lurkerScore: count >= 5 ? 1 : 0,
            presenceCount: count,
        })
    );
}
