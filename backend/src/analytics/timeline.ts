import { db as prisma } from '../db';

export interface TimelineEvent {
    id: string;
    type:
        | 'presence'
        | 'message'
        | 'typing'
        | 'role'
        | 'join'
        | 'deleted_message';
    userId: string;
    username: string;
    timestamp: Date;
    metadata: Record<string, unknown>;
    // Pattern detection flags
    isAnomalous?: boolean;
    anomalyReason?: string;
}

export interface TimelineQuery {
    userId: string;
    guildId: string;
    limit?: number;
    cursor?: string; // ISO timestamp for cursor-based pagination
    eventTypes?: string[];
    startDate?: Date;
    endDate?: Date;
}

export interface TimelineResult {
    events: TimelineEvent[];
    nextCursor: string | null;
    hasMore: boolean;
    totalCount: number;
}

/**
 * Fetches unified timeline of all user activity events
 * Uses cursor-based pagination for efficient scrolling
 */
export async function getUserTimeline(
    query: TimelineQuery
): Promise<TimelineResult> {
    const {
        userId,
        guildId,
        limit = 50,
        cursor,
        eventTypes = [
            'presence',
            'message',
            'typing',
            'role',
            'join',
            'deleted_message',
        ],
        startDate,
        endDate,
    } = query;

    // Parse cursor (ISO timestamp) or use current time
    const cursorDate = cursor ? new Date(cursor) : new Date();

    // Build where clause for date filtering
    const dateFilter = {
        createdAt: {
            lt: cursorDate,
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
        },
    };

    const baseFilter = {
        userId,
        ...dateFilter,
    };

    const guildFilter = {
        userId,
        guildId,
        ...dateFilter,
    };

    // Fetch events in parallel (fetch limit + 1 to detect if there are more results)
    const fetchLimit = limit + 1;
    const [
        presenceEvents,
        messageEvents,
        typingEvents,
        roleEvents,
        joinEvents,
        deletedMessageEvents,
    ] = await Promise.all([
        eventTypes.includes('presence')
            ? prisma.presenceEvent.findMany({
                  where: baseFilter,
                  orderBy: { createdAt: 'desc' },
                  take: fetchLimit,
              })
            : Promise.resolve([]),
        eventTypes.includes('message')
            ? prisma.messageEvent.findMany({
                  where: guildFilter,
                  orderBy: { createdAt: 'desc' },
                  take: fetchLimit,
              })
            : Promise.resolve([]),
        eventTypes.includes('typing')
            ? prisma.typingEvent.findMany({
                  where: guildFilter,
                  orderBy: { createdAt: 'desc' },
                  take: fetchLimit,
              })
            : Promise.resolve([]),
        eventTypes.includes('role')
            ? prisma.roleChangeEvent.findMany({
                  where: guildFilter,
                  orderBy: { createdAt: 'desc' },
                  take: fetchLimit,
              })
            : Promise.resolve([]),
        eventTypes.includes('join')
            ? prisma.joinEvent.findMany({
                  where: guildFilter,
                  orderBy: { createdAt: 'desc' },
                  take: fetchLimit,
              })
            : Promise.resolve([]),
        eventTypes.includes('deleted_message')
            ? prisma.deletedMessageEvent.findMany({
                  where: guildFilter,
                  orderBy: { createdAt: 'desc' },
                  take: fetchLimit,
              })
            : Promise.resolve([]),
    ]);

    // Transform and merge events
    const timeline: TimelineEvent[] = [
        ...presenceEvents.map(
            (e): TimelineEvent => ({
                id: e.id,
                type: 'presence' as const,
                userId: e.userId,
                username: e.username,
                timestamp: e.createdAt,
                metadata: {
                    clients: e.clients,
                    ...(e.metadata as Record<string, unknown>),
                },
            })
        ),
        ...messageEvents.map(
            (e): TimelineEvent => ({
                id: e.id,
                type: 'message' as const,
                userId: e.userId,
                username: e.username,
                timestamp: e.createdAt,
                metadata: {
                    channelId: e.channelId,
                    channel: e.channel,
                    guildId: e.guildId,
                    content: e.content,
                    ...(e.metadata as Record<string, unknown>),
                },
            })
        ),
        ...typingEvents.map(
            (e): TimelineEvent => ({
                id: e.id,
                type: 'typing' as const,
                userId: e.userId,
                username: e.username,
                timestamp: e.createdAt,
                metadata: {
                    channelId: e.channelId,
                    channel: e.channel,
                    guildId: e.guildId,
                    ...(e.metadata as Record<string, unknown>),
                },
            })
        ),
        ...roleEvents.map(
            (e): TimelineEvent => ({
                id: e.id,
                type: 'role' as const,
                userId: e.userId,
                username: e.username,
                timestamp: e.createdAt,
                metadata: {
                    guildId: e.guildId,
                    addedRoles: e.addedRoles,
                    ...(e.metadata as Record<string, unknown>),
                },
            })
        ),
        ...joinEvents.map(
            (e): TimelineEvent => ({
                id: e.id,
                type: 'join' as const,
                userId: e.userId,
                username: e.username,
                timestamp: e.createdAt,
                metadata: {
                    guildId: e.guildId,
                    accountAgeDays: e.accountAgeDays,
                    ...(e.metadata as Record<string, unknown>),
                },
            })
        ),
        ...deletedMessageEvents.map(
            (e): TimelineEvent => ({
                id: e.id,
                type: 'deleted_message' as const,
                userId: e.userId,
                username: e.username,
                timestamp: e.createdAt,
                metadata: {
                    channelId: e.channelId,
                    channel: e.channel,
                    guildId: e.guildId,
                    ...(e.metadata as Record<string, unknown>),
                },
            })
        ),
    ];

    // Sort by timestamp descending
    timeline.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Check if there are more results than requested limit
    const hasMore = timeline.length > limit;

    // Take only requested limit
    const limitedTimeline = timeline.slice(0, limit);

    // Detect patterns and mark anomalous events
    const enrichedTimeline = detectPatterns(limitedTimeline);

    // Determine next cursor
    const nextCursor = hasMore
        ? limitedTimeline[limitedTimeline.length - 1].timestamp.toISOString()
        : null;

    // Get total count (approximate for performance)
    const totalCount = await getApproximateEventCount(
        userId,
        guildId,
        eventTypes,
        startDate,
        endDate
    );

    return {
        events: enrichedTimeline,
        nextCursor,
        hasMore,
        totalCount,
    };
}

/**
 * Detect patterns and anomalies in timeline events
 */
function detectPatterns(events: TimelineEvent[]): TimelineEvent[] {
    if (events.length === 0) return events;

    // Detect rapid succession of events (spam-like behavior)
    for (let i = 1; i < events.length; i++) {
        const current = events[i];
        const previous = events[i - 1];
        const timeDiff =
            previous.timestamp.getTime() - current.timestamp.getTime();

        // Flag rapid typing/messaging (< 1 second apart)
        if (
            (current.type === 'typing' || current.type === 'message') &&
            (previous.type === 'typing' || previous.type === 'message') &&
            timeDiff < 1000
        ) {
            current.isAnomalous = true;
            current.anomalyReason = 'Rapid activity detected';
        }

        // Flag unusual presence changes (< 5 seconds apart)
        if (
            current.type === 'presence' &&
            previous.type === 'presence' &&
            timeDiff < 5000
        ) {
            current.isAnomalous = true;
            current.anomalyReason = 'Frequent presence changes';
        }
    }

    // Detect suspicious patterns: message immediately after join (< 10 seconds)
    for (let i = 1; i < events.length; i++) {
        const current = events[i];
        const previous = events[i - 1];
        const timeDiff =
            previous.timestamp.getTime() - current.timestamp.getTime();

        if (
            previous.type === 'message' &&
            current.type === 'join' &&
            timeDiff < 10000
        ) {
            previous.isAnomalous = true;
            previous.anomalyReason = 'Message shortly after joining';
        }
    }

    return events;
}

/**
 * Get approximate total count of events for pagination info
 */
async function getApproximateEventCount(
    userId: string,
    guildId: string,
    eventTypes: string[],
    startDate?: Date,
    endDate?: Date
): Promise<number> {
    const dateFilter = {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
    };

    const baseFilter = {
        userId,
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
    };

    const guildFilter = {
        userId,
        guildId,
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
    };

    // Count events in parallel
    const counts = await Promise.all([
        eventTypes.includes('presence')
            ? prisma.presenceEvent.count({ where: baseFilter })
            : Promise.resolve(0),
        eventTypes.includes('message')
            ? prisma.messageEvent.count({ where: guildFilter })
            : Promise.resolve(0),
        eventTypes.includes('typing')
            ? prisma.typingEvent.count({ where: guildFilter })
            : Promise.resolve(0),
        eventTypes.includes('role')
            ? prisma.roleChangeEvent.count({ where: guildFilter })
            : Promise.resolve(0),
        eventTypes.includes('join')
            ? prisma.joinEvent.count({ where: guildFilter })
            : Promise.resolve(0),
        eventTypes.includes('deleted_message')
            ? prisma.deletedMessageEvent.count({ where: guildFilter })
            : Promise.resolve(0),
    ]);

    return counts.reduce((sum: number, count: number) => sum + count, 0);
}
