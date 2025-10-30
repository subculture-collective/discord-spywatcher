import { db } from '../db';
import {
    SuspicionFactors,
    SuspicionResult,
    UserActivityData,
} from '../types/analytics';

// Constants
const MAX_SAMPLE_SIZE = 100;
const MAX_MESSAGES_FOR_SIMILARITY = 20;

/**
 * Calculate advanced suspicion score with multi-factor analysis
 */
export async function calculateAdvancedSuspicion(
    userId: string,
    guildId: string,
    since?: Date
): Promise<SuspicionResult> {
    const sinceDate = since || new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);

    // Fetch user activity data
    const userData = await getUserActivityData(userId, guildId, sinceDate);

    // Get guild averages for comparison
    const guildAvg = await getGuildAverages(guildId, sinceDate);

    // Calculate individual factor scores
    const factors: SuspicionFactors = {
        ghostScore: calculateGhostScore(userData),
        lurkerScore: calculateLurkerScore(userData),
        multiClientFreq: await calculateMultiClientFrequency(
            userId,
            guildId,
            sinceDate
        ),
        timingAnomalies: calculateTimingAnomalies(userData, guildAvg),
        accountAge: userData.accountAgeDays,
        activityPattern: calculateActivityPattern(userData),
        contentSimilarity: calculateContentSimilarity(userData),
    };

    // Calculate weighted suspicion score
    const weights = {
        ghostScore: 0.2,
        lurkerScore: 0.15,
        multiClientFreq: 0.2,
        timingAnomalies: 0.15,
        accountAge: 0.1,
        activityPattern: 0.1,
        contentSimilarity: 0.1,
    };

    let totalScore = 0;
    for (const [key, value] of Object.entries(factors)) {
        if (key === 'accountAge') {
            // Account age: newer is more suspicious (inverse scoring)
            const ageScore = Math.max(0, 100 - (value / 365) * 100);
            totalScore += ageScore * weights[key as keyof typeof weights];
        } else {
            totalScore += value * weights[key as keyof typeof weights];
        }
    }

    // Determine confidence level
    const confidence: 'high' | 'medium' | 'low' =
        totalScore > 80 ? 'high' : totalScore > 60 ? 'medium' : 'low';

    // Generate human-readable reasons
    const reasons = generateReasons(factors, userData);

    // Determine recommended action
    const recommendedAction = getRecommendedAction(totalScore);

    return {
        userId: userData.userId,
        username: userData.username,
        totalScore: Math.round(totalScore),
        confidence,
        factors,
        reasons,
        recommendedAction,
    };
}

/**
 * Fetch comprehensive user activity data
 */
async function getUserActivityData(
    userId: string,
    guildId: string,
    since: Date
): Promise<UserActivityData> {
    // Fetch messages
    const messages = await db.messageEvent.findMany({
        where: {
            userId,
            guildId,
            createdAt: { gte: since },
        },
        select: {
            content: true,
            createdAt: true,
            username: true,
        },
        orderBy: { createdAt: 'desc' },
        take: MAX_SAMPLE_SIZE,
    });

    // Fetch typing events
    const typingCount = await db.typingEvent.count({
        where: {
            userId,
            guildId,
            createdAt: { gte: since },
        },
    });

    // Fetch presence events
    const presenceCount = await db.presenceEvent.count({
        where: {
            userId,
            createdAt: { gte: since },
        },
    });

    // Fetch reaction times
    const reactionTimes = await db.reactionTime.findMany({
        where: {
            observerId: userId,
            guildId,
            createdAt: { gte: since },
        },
        select: {
            deltaMs: true,
        },
        orderBy: { createdAt: 'desc' },
        take: MAX_SAMPLE_SIZE,
    });

    // Fetch account age from join event
    const joinEvent = await db.joinEvent.findFirst({
        where: {
            userId,
            guildId,
        },
        orderBy: { createdAt: 'desc' },
    });

    // Calculate hourly message distribution
    const hourlyDistribution = new Array<number>(24).fill(0);
    for (const msg of messages) {
        const hour = msg.createdAt.getHours();
        if (hour >= 0 && hour < 24) {
            hourlyDistribution[hour]++;
        }
    }

    // Get username from most recent message or join event
    const username = messages[0]?.username || joinEvent?.username || 'Unknown User';

    return {
        userId,
        username,
        messageCount: messages.length,
        typingCount,
        presenceCount,
        reactionTimes: reactionTimes.map((rt) => rt.deltaMs),
        hourlyMessageDistribution: hourlyDistribution,
        messageContents: messages.map((m) => m.content),
        accountAgeDays: joinEvent?.accountAgeDays ?? 9999,
    };
}

/**
 * Get guild-wide averages for comparison
 */
async function getGuildAverages(
    guildId: string,
    since: Date
): Promise<{ reactionTime: number; messagesPerUser: number }> {
    // Average reaction time across guild
    const avgReactionResult = await db.reactionTime.aggregate({
        where: {
            guildId,
            createdAt: { gte: since },
        },
        _avg: {
            deltaMs: true,
        },
    });

    // Average messages per user
    const messageStats = await db.messageEvent.groupBy({
        by: ['userId'],
        where: {
            guildId,
            createdAt: { gte: since },
        },
        _count: {
            userId: true,
        },
    });

    const avgMessages =
        messageStats.length > 0
            ? messageStats.reduce((sum, s) => sum + s._count.userId, 0) /
              messageStats.length
            : 0;

    return {
        reactionTime: avgReactionResult._avg.deltaMs ?? 5000,
        messagesPerUser: avgMessages,
    };
}

/**
 * Calculate ghost score: presence vs engagement
 */
function calculateGhostScore(userData: UserActivityData): number {
    if (userData.presenceCount === 0) return 0;

    const engagementRatio =
        userData.messageCount / (userData.presenceCount + 1);

    // Low engagement compared to presence = high ghost score
    if (engagementRatio < 0.01) return 100;
    if (engagementRatio < 0.05) return 80;
    if (engagementRatio < 0.1) return 60;
    if (engagementRatio < 0.2) return 40;

    return 0;
}

/**
 * Calculate lurker score: typing vs actual messages
 */
function calculateLurkerScore(userData: UserActivityData): number {
    if (userData.presenceCount === 0) return 0;

    const hasActivity =
        userData.messageCount > 0 || userData.typingCount > 0;
    if (!hasActivity && userData.presenceCount >= 5) {
        return 100; // Pure lurker
    }

    // High presence, low activity
    if (userData.presenceCount >= 10 && userData.messageCount < 2) {
        return 80;
    }

    return 0;
}

/**
 * Calculate multi-client frequency
 */
async function calculateMultiClientFrequency(
    userId: string,
    guildId: string,
    since: Date
): Promise<number> {
    const presenceEvents = await db.presenceEvent.findMany({
        where: {
            userId,
            createdAt: { gte: since },
        },
        select: {
            clients: true,
        },
    });

    if (presenceEvents.length === 0) return 0;

    // Count events with multiple clients
    const multiClientCount = presenceEvents.filter(
        (e) => e.clients.length > 1
    ).length;
    const ratio = multiClientCount / presenceEvents.length;

    // High ratio = suspicious
    if (ratio > 0.5) return 100;
    if (ratio > 0.3) return 70;
    if (ratio > 0.1) return 40;

    return 0;
}

/**
 * Calculate timing anomalies from reaction times
 */
function calculateTimingAnomalies(
    userData: UserActivityData,
    guildAvg: { reactionTime: number }
): number {
    const times = userData.reactionTimes;

    if (times.length < 10) return 0;

    // Calculate average and standard deviation
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const variance =
        times.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / times.length;
    const stdDev = Math.sqrt(variance);

    // Very low standard deviation = bot-like (too consistent)
    const lowStdDevScore = stdDev < 100 ? 100 : Math.max(0, (1000 - stdDev) / 10);

    // Consistently fast reactions = suspicious
    const fastReactionScore = avg < 500 ? (500 - avg) / 5 : 0;

    // Deviation from guild average
    // Guard against division by zero
    const safeGuildReactionTime = guildAvg.reactionTime > 0 ? guildAvg.reactionTime : 5000;
    const deviationFromNorm =
        Math.abs(avg - safeGuildReactionTime) / safeGuildReactionTime;
    const deviationScore = Math.min(100, deviationFromNorm * 100);

    return Math.min(
        100,
        (lowStdDevScore + fastReactionScore + deviationScore) / 3
    );
}

/**
 * Calculate activity pattern regularity
 */
function calculateActivityPattern(userData: UserActivityData): number {
    const hourBuckets = userData.hourlyMessageDistribution;

    // Need sufficient data
    if (userData.messageCount < 10) return 0;

    // Calculate variance in hourly distribution
    const mean = hourBuckets.reduce((a, b) => a + b, 0) / 24;
    const variance =
        hourBuckets.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / 24;

    // Low variance = too regular (bot-like)
    if (variance < 5) return 80;

    // Very high variance = sporadic automated activity
    if (variance > 100) return 60;

    // Check for perfect regularity (same count multiple times)
    const uniqueCounts = new Set(hourBuckets.filter((h) => h > 0));
    if (uniqueCounts.size === 1 && userData.messageCount > 20) {
        return 90; // Perfect regularity is suspicious
    }

    return 0;
}

/**
 * Calculate content similarity for copy-paste detection
 */
function calculateContentSimilarity(userData: UserActivityData): number {
    const messages = userData.messageContents;

    if (messages.length < 5) return 0;

    // Calculate similarity between messages
    let similarPairs = 0;
    let totalPairs = 0;

    const maxMessages = Math.min(messages.length, MAX_MESSAGES_FOR_SIMILARITY);
    for (let i = 0; i < maxMessages; i++) {
        const messageI = messages[i];
        if (!messageI) continue;
        
        for (let j = i + 1; j < maxMessages; j++) {
            const messageJ = messages[j];
            if (!messageJ) continue;
            
            totalPairs++;
            const similarity = calculateStringSimilarity(messageI, messageJ);
            if (similarity > 0.8) {
                similarPairs++;
            }
        }
    }

    if (totalPairs === 0) return 0;

    const similarityRatio = similarPairs / totalPairs;

    // High similarity = suspicious (copy-paste behavior)
    if (similarityRatio > 0.5) return 100;
    if (similarityRatio > 0.3) return 70;
    if (similarityRatio > 0.1) return 40;

    return 0;
}

/**
 * Simple string similarity using Jaccard index
 */
function calculateStringSimilarity(str1: string, str2: string): number {
    const tokens1 = new Set(str1.toLowerCase().split(/\s+/));
    const tokens2 = new Set(str2.toLowerCase().split(/\s+/));

    const intersection = new Set(
        [...tokens1].filter((x) => tokens2.has(x))
    );
    const union = new Set([...tokens1, ...tokens2]);

    return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Generate human-readable reasons for suspicion
 */
function generateReasons(
    factors: SuspicionFactors,
    userData: UserActivityData
): string[] {
    const reasons: string[] = [];

    if (factors.ghostScore > 70) {
        reasons.push(
            `High presence (${userData.presenceCount}) but low engagement (${userData.messageCount} messages)`
        );
    }

    if (factors.lurkerScore > 70) {
        reasons.push(
            `Lurker behavior detected - observing without participating`
        );
    }

    if (factors.multiClientFreq > 70) {
        reasons.push(
            `Frequently online from multiple devices simultaneously`
        );
    }

    if (factors.timingAnomalies > 70) {
        reasons.push(
            `Unusual timing patterns in messages and reactions (bot-like consistency)`
        );
    }

    if (factors.activityPattern > 70) {
        reasons.push(
            `Suspiciously regular activity patterns (automated behavior)`
        );
    }

    if (factors.accountAge < 30) {
        reasons.push(`New account (${factors.accountAge} days old)`);
    }

    if (factors.contentSimilarity > 70) {
        reasons.push(
            `High message similarity detected (possible copy-paste or scripted messages)`
        );
    }

    if (reasons.length === 0) {
        reasons.push('Monitoring for suspicious patterns');
    }

    return reasons;
}

/**
 * Get recommended action based on suspicion score
 */
function getRecommendedAction(totalScore: number): string {
    if (totalScore > 90) {
        return 'Consider banning - very high suspicion';
    }
    if (totalScore > 75) {
        return 'Monitor closely - high suspicion';
    }
    if (totalScore > 60) {
        return 'Investigate further - moderate suspicion';
    }
    return 'No immediate action needed';
}
