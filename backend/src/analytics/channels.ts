import { db } from '../db';

export async function getChannelDiversity(guildId: string, since?: Date) {
    const events = await db.typingEvent.findMany({
        where: {
            guildId,
            ...(since && { createdAt: { gte: since } }),
        },
        select: {
            userId: true,
            username: true,
            channelId: true,
        },
    });

    const userMap = new Map<
        string,
        { username: string; channels: Set<string> }
    >();

    for (const event of events) {
        const entry = userMap.get(event.userId) ?? {
            username: event.username,
            channels: new Set(),
        };
        entry.channels.add(event.channelId);
        userMap.set(event.userId, entry);
    }

    return Array.from(userMap.entries())
        .map(([userId, { username, channels }]) => ({
            userId,
            username,
            channelCount: channels.size,
        }))
        .sort((a, b) => b.channelCount - a.channelCount);
}
