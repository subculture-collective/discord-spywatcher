import { db } from '../db';

export async function getBehaviorShiftFlags(guildId: string, _since?: Date) {
    const now = Date.now();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const twoWeeksAgo = new Date(now - oneWeek * 2);
    const oneWeekAgo = new Date(now - oneWeek);

    const pastMessages = await db.messageEvent.findMany({
        where: {
            guildId,
            createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo },
        },
    });

    const recentMessages = await db.messageEvent.findMany({
        where: {
            guildId,
            createdAt: { gte: oneWeekAgo },
        },
    });

    const pastTyping = await db.typingEvent.findMany({
        where: {
            guildId,
            createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo },
        },
    });

    const recentTyping = await db.typingEvent.findMany({
        where: {
            guildId,
            createdAt: { gte: oneWeekAgo },
        },
    });

    const userStats = new Map<
        string,
        {
            username: string;
            oldMessages: number;
            newMessages: number;
            oldTyping: number;
            newTyping: number;
        }
    >();

    const add = (
        userId: string,
        username: string,
        type: 'oldMessages' | 'newMessages' | 'oldTyping' | 'newTyping'
    ) => {
        const existing = userStats.get(userId) ?? {
            username,
            oldMessages: 0,
            newMessages: 0,
            oldTyping: 0,
            newTyping: 0,
        };
        // eslint-disable-next-line security/detect-object-injection
        existing[type]++;
        userStats.set(userId, existing);
    };

    pastMessages.forEach((m) => add(m.userId, m.username, 'oldMessages'));
    recentMessages.forEach((m) => add(m.userId, m.username, 'newMessages'));
    pastTyping.forEach((t) => add(t.userId, t.username, 'oldTyping'));
    recentTyping.forEach((t) => add(t.userId, t.username, 'newTyping'));

    return Array.from(userStats.entries()).map(([userId, s]) => {
        const messageDrop = s.oldMessages > 0 && s.newMessages === 0;
        const typingSpike = s.newTyping > s.oldTyping * 2 && s.oldTyping >= 5;

        return {
            userId,
            username: s.username,
            behaviorShiftScore: (messageDrop ? 1 : 0) + (typingSpike ? 1 : 0),
            messageDrop,
            typingSpike,
        };
    });
}
