export type SuspicionScoreEntry = {
    userId: string;
    username: string;
    ghostScore: number;
    multiClientCount: number;
    channelCount: number;
    accountAgeDays: number;
    suspicionScore: number;
};

export type ChannelHeatmap = {
    userId: string;
    username: string;
    channelId: string;
    channel: string;
    count: number;
};

export type GroupedTypingEvent = {
    userId: string;
    username: string;
    channelId: string;
    channel: string;
    _count: {
        channelId: number;
    };
};

export type SuspicionEntry = {
    userId: string;
    username: string;

    ghostScore: number;
    multiClientCount: number;
    channelCount: number;
    accountAgeDays: number;

    avgReactionTime?: number;
    fastReactionCount?: number;

    suspicionScore: number;

    lurkerScore?: number;
    presenceCount?: number;

    roleChangeCount?: number;

    messageDrop?: boolean;
    typingSpike?: boolean;

    oldClients?: string[];
    newClients?: string[];
};