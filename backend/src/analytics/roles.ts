import { db } from '../db';

export async function getRoleDriftFlags(guildId: string, since?: Date) {
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
