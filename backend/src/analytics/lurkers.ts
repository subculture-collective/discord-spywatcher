import { db } from '../db';

export async function getLurkerFlags(guildId: string, since?: Date) {
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
