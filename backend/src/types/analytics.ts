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

export interface SuspicionFactors {
    ghostScore: number; // 0-100
    lurkerScore: number; // 0-100
    multiClientFreq: number; // 0-100
    timingAnomalies: number; // 0-100
    accountAge: number; // days
    activityPattern: number; // 0-100
    contentSimilarity: number; // 0-100
}

export interface SuspicionResult {
    userId: string;
    username: string;
    totalScore: number;
    confidence: 'high' | 'medium' | 'low';
    factors: SuspicionFactors;
    reasons: string[];
    recommendedAction: string;
}

export interface UserActivityData {
    userId: string;
    username: string;
    messageCount: number;
    typingCount: number;
    presenceCount: number;
    reactionTimes: number[];
    hourlyMessageDistribution: number[];
    messageContents: string[];
    accountAgeDays: number;
}
