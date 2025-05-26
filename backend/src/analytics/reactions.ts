import { db } from '../db';

export async function getReactionStats(guildId: string, since?: Date) {
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
