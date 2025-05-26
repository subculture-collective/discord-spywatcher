import { db } from '../db';
import { SuspicionEntry } from '../types/analytics';
import { getChannelDiversity } from './channels';
import { getClientDriftFlags } from './clients';
import { getGhostScores } from './ghosts';
import { getLurkerFlags } from './lurkers';
import { getMultiClientLoginCounts } from './presence';
import { getReactionStats } from './reactions';
import { getRoleDriftFlags } from './roles';
import { getBehaviorShiftFlags } from './shifts';

export async function getSuspicionScores(guildId: string, since?: Date) {
    since = since ?? new Date(Date.now() - 1000 * 60 * 60 * 24 * 7); // default: past 7 days
    const ghosts = await getGhostScores(guildId, since);
    const logins = await getMultiClientLoginCounts(guildId, since);
    const diversity = await getChannelDiversity(guildId, since);
    const reactionStats = await getReactionStats(guildId, since);
    const lurkers = await getLurkerFlags(guildId, since);
    const roleDrift = await getRoleDriftFlags(guildId, since);
    const shifts = await getBehaviorShiftFlags(guildId, since);
    const drift = await getClientDriftFlags(guildId, since);
    const joins = await db.joinEvent.findMany({
        where: {
            guildId,
            ...(since && { createdAt: { gte: since } }),
        },
    });

    const suspicionMap = new Map<string, SuspicionEntry>();

    // Add ghost data
    for (const g of ghosts) {
        suspicionMap.set(g.userId, {
            userId: g.userId,
            username: g.username,
            ghostScore: g.ghostScore,
            multiClientCount: 0,
            channelCount: 0,
            accountAgeDays: 9999,
            avgReactionTime: undefined,
            fastReactionCount: 0,
            suspicionScore: 0,
        });
    }

    // Add multi-client data
    for (const l of logins) {
        const existing: SuspicionEntry = suspicionMap.get(l.userId) ?? {
            userId: l.userId,
            username: l.username,
            ghostScore: 0,
            multiClientCount: 0,
            channelCount: 0,
            accountAgeDays: 9999,
            avgReactionTime: undefined,
            fastReactionCount: 0,
            suspicionScore: 0,
        };
        existing.multiClientCount = l.multiClientCount;
        suspicionMap.set(l.userId, existing);
    }

    // Add channel count
    for (const d of diversity) {
        const existing: SuspicionEntry = suspicionMap.get(d.userId) ?? {
            userId: d.userId,
            username: d.username,
            ghostScore: 0,
            multiClientCount: 0,
            channelCount: 0,
            accountAgeDays: 9999,
            avgReactionTime: undefined,
            fastReactionCount: 0,
            suspicionScore: 0,
        };
        existing.channelCount = d.channelCount;
        suspicionMap.set(d.userId, existing);
    }

    // Add account age
    for (const j of joins) {
        const existing = suspicionMap.get(j.userId);
        if (existing) {
            existing.accountAgeDays = j.accountAgeDays;
        }
    }

    // Add reaction stats
    for (const r of reactionStats) {
        const existing: SuspicionEntry = suspicionMap.get(r.userId) ?? {
            userId: r.userId,
            username: r.username,
            ghostScore: 0,
            multiClientCount: 0,
            channelCount: 0,
            accountAgeDays: 9999,
            avgReactionTime: undefined,
            fastReactionCount: 0,
            suspicionScore: 0,
        };

        existing.avgReactionTime = r.avgReactionTime;
        existing.fastReactionCount = r.fastReactionCount;

        suspicionMap.set(r.userId, existing);
    }

    // Add lurker data
    for (const l of lurkers) {
        const existing: SuspicionEntry = suspicionMap.get(l.userId) ?? {
            userId: l.userId,
            username: l.username,
            ghostScore: 0,
            multiClientCount: 0,
            channelCount: 0,
            accountAgeDays: 9999,
            avgReactionTime: undefined,
            fastReactionCount: 0,
            suspicionScore: 0,
        };

        (existing as any).lurkerScore = l.lurkerScore;
        (existing as any).presenceCount = l.presenceCount;

        suspicionMap.set(l.userId, existing);
    }

    // Add role drift data
    for (const r of roleDrift) {
        const existing: SuspicionEntry = suspicionMap.get(r.userId) ?? {
            userId: r.userId,
            username: r.username,
            ghostScore: 0,
            multiClientCount: 0,
            channelCount: 0,
            accountAgeDays: 9999,
            avgReactionTime: undefined,
            fastReactionCount: 0,
            suspicionScore: 0,
            lurkerScore: 0,
            presenceCount: 0,
        };

        existing.suspicionScore += r.roleDriftScore * 2;

        (existing as any).roleChangeCount = r.roleChangeCount;

        suspicionMap.set(r.userId, existing);
    }

    // Add behavior shift data
    for (const s of shifts) {
        const existing: SuspicionEntry = suspicionMap.get(s.userId) ?? {
            userId: s.userId,
            username: s.username,
            ghostScore: 0,
            multiClientCount: 0,
            channelCount: 0,
            accountAgeDays: 9999,
            avgReactionTime: undefined,
            fastReactionCount: 0,
            lurkerScore: 0,
            presenceCount: 0,
            suspicionScore: 0,
        };

        existing.suspicionScore += s.behaviorShiftScore * 2;

        (existing as any).messageDrop = s.messageDrop;
        (existing as any).typingSpike = s.typingSpike;

        suspicionMap.set(s.userId, existing);
    }

    // Add client drift data
    for (const d of drift) {
        const existing: SuspicionEntry = suspicionMap.get(d.userId) ?? {
            userId: d.userId,
            username: d.username,
            ghostScore: 0,
            multiClientCount: 0,
            channelCount: 0,
            accountAgeDays: 9999,
            avgReactionTime: undefined,
            fastReactionCount: 0,
            lurkerScore: 0,
            presenceCount: 0,
            suspicionScore: 0,
        };

        existing.suspicionScore += d.clientDriftScore * 2;

        (existing as any).oldClients = d.oldClients;
        (existing as any).newClients = d.newClients;

        suspicionMap.set(d.userId, existing);
    }

    // Calculate final score
    for (const entry of suspicionMap.values()) {
        const isNewAccount = entry.accountAgeDays < 14;
        const fastReactionCount = entry.fastReactionCount ?? 0;
        const avgReactionTime = entry.avgReactionTime ?? 9999;
        const lurkerScore = entry.lurkerScore ?? 0;

        entry.suspicionScore =
            entry.ghostScore * 2 +
            entry.multiClientCount * 1.5 +
            entry.channelCount * 1 +
            (isNewAccount ? 3 : 0) +
            fastReactionCount * 0.5 +
            (avgReactionTime < 3000 ? 2 : 0);
        entry.suspicionScore += lurkerScore * 4;
    }

    return Array.from(suspicionMap.values()).sort(
        (a, b) => b.suspicionScore - a.suspicionScore
    );
}
