import { db } from '../db';

export async function getMultiClientLoginCounts(guildId: string, since?: Date) {
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
