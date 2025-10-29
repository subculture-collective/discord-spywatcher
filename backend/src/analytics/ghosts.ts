import { db } from '../db';

/**
 * Optimized ghost detection query using a single aggregation
 * Ghost score = typing count / (message count + 1)
 * Higher scores indicate users who type but don't send messages (ghost typing)
 */
export async function getGhostScores(guildId: string, since?: Date) {
    const sinceDate = since || new Date(0); // Use epoch if no date provided

    // Single optimized query using raw SQL for better performance
    const result = await db.$queryRaw<
        {
            userId: string;
            username: string;
            typing_count: bigint;
            message_count: bigint;
            ghost_score: number;
        }[]
    >`
    SELECT 
      COALESCE(t."userId", m."userId") as "userId",
      COALESCE(t.username, m.username) as username,
      COALESCE(t.typing_count, 0) as typing_count,
      COALESCE(m.message_count, 0) as message_count,
      CASE 
        WHEN COALESCE(m.message_count, 0) = 0 
        THEN COALESCE(t.typing_count, 0)::float
        ELSE COALESCE(t.typing_count, 0)::float / COALESCE(m.message_count, 0)
      END as ghost_score
    FROM (
      SELECT "userId", "username", COUNT(*) as typing_count
      FROM "TypingEvent"
      WHERE "guildId" = ${guildId}
        AND "createdAt" >= ${sinceDate}::timestamptz
      GROUP BY "userId", "username"
    ) t
    FULL OUTER JOIN (
      SELECT "userId", "username", COUNT(*) as message_count
      FROM "MessageEvent"
      WHERE "guildId" = ${guildId}
        AND "createdAt" >= ${sinceDate}::timestamptz
      GROUP BY "userId", "username"
    ) m ON t."userId" = m."userId"
    WHERE COALESCE(t.typing_count, 0) > 0
    ORDER BY ghost_score DESC
    LIMIT 100
  `;

    // Convert bigint to number for JSON serialization
    return result.map((r) => ({
        userId: r.userId,
        username: r.username,
        typingCount: Number(r.typing_count),
        messageCount: Number(r.message_count),
        ghostScore: r.ghost_score,
    }));
}

/**
 * Legacy implementation kept for comparison and testing
 * @deprecated Use getGhostScores for better performance
 */
export async function getGhostScoresLegacy(guildId: string, since?: Date) {
    const typings = await db.typingEvent.groupBy({
        by: ['userId', 'username'],
        where: {
            guildId,
            ...(since && { createdAt: { gte: since } }),
        },
        _count: {
            userId: true,
        },
    });

    const messages = await db.messageEvent.groupBy({
        by: ['userId'],
        where: {
            guildId,
            ...(since && { createdAt: { gte: since } }),
        },
        _count: {
            userId: true,
        },
    });

    const messageMap = new Map(
        messages.map((m) => [m.userId, m._count.userId])
    );

    return typings
        .map((t) => {
            const messageCount = messageMap.get(t.userId) ?? 0;
            const ghostScore = t._count.userId / (messageCount + 1);

            return {
                userId: t.userId,
                username: t.username,
                typingCount: t._count.userId,
                messageCount,
                ghostScore,
            };
        })
        .sort((a, b) => b.ghostScore - a.ghostScore);
}
