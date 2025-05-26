import { db } from '../db';
import { ChannelHeatmap, GroupedTypingEvent } from '../types/analytics';

export async function getChannelHeatmap({
    guildId,
    since,
}: {
    guildId: string;
    since?: Date;
}): Promise<ChannelHeatmap[]> {
    const rawData = await db.typingEvent.groupBy({
        by: ['userId', 'username', 'channelId', 'channel'] as const,
        where: {
            guildId,
            ...(since && { createdAt: { gte: since } }),
        },
        _count: {
            channelId: true,
        },
        orderBy: {
            _count: {
                channelId: 'desc',
            },
        },
    });

    const data = rawData as GroupedTypingEvent[];

    return data.map((d) => ({
        userId: d.userId,
        username: d.username,
        channelId: d.channelId,
        channel: d.channel,
        count: d._count.channelId,
    }));
}
