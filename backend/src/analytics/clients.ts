import { db } from '../db';

export async function getClientDriftFlags(_guildId: string, _since?: Date) {
    const now = Date.now();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const twoWeeksAgo = new Date(now - oneWeek * 2);
    const oneWeekAgo = new Date(now - oneWeek);

    const past = await db.presenceEvent.findMany({
        where: {
            createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo },
        },
    });

    const recent = await db.presenceEvent.findMany({
        where: {
            createdAt: { gte: oneWeekAgo },
        },
    });

    const buildMap = (events: typeof past) => {
        const map = new Map<string, Set<string>>();
        for (const e of events) {
            const set = map.get(e.userId) ?? new Set();
            e.clients.split(',').forEach((c) => set.add(c));
            map.set(e.userId, set);
        }
        return map;
    };

    const pastMap = buildMap(past);
    const recentMap = buildMap(recent);

    const driftedUsers: {
        userId: string;
        username: string;
        clientDriftScore: number;
        oldClients: string[];
        newClients: string[];
    }[] = [];

    for (const [userId, oldSet] of pastMap.entries()) {
        const newSet = recentMap.get(userId);
        if (!newSet) continue;

        const oldClients = [...oldSet].sort();
        const newClients = [...newSet].sort();

        const hasDrifted =
            oldClients.join(',') !== newClients.join(',') &&
            newSet.size > oldSet.size;

        if (hasDrifted) {
            const oneName =
                past.find((p) => p.userId === userId)?.username ?? userId;
            driftedUsers.push({
                userId,
                username: oneName,
                clientDriftScore: 1,
                oldClients,
                newClients,
            });
        }
    }

    return driftedUsers;
}
