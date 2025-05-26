import { db } from '../db';

export async function getGhostScores(guildId: string, since?: Date) {
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
