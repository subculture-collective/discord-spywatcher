// src/state/recentMessages.ts
type RecentMessage = {
    userId: string;
    username: string;
    timestamp: number;
};

const recentMessages = new Map<string, RecentMessage>(); // channelId -> message

export function updateRecentMessage(channelId: string, message: RecentMessage) {
    recentMessages.set(channelId, message);
}

export function getRecentMessage(channelId: string): RecentMessage | undefined {
    return recentMessages.get(channelId);
}
