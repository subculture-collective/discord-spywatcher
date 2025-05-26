import { BannedUser } from '@prisma/client';
import { db } from '../db';

export async function getBannedUserIds(): Promise<Set<string>> {
    const bans: BannedUser[] = await db.bannedUser.findMany();
    return new Set(bans.map((b) => b.userId));
}

export async function excludeBannedUsers<T extends { userId: string }>(
    results: T[],
    filter: boolean
): Promise<T[]> {
    if (!filter) return results;

    const bannedIds = await getBannedUserIds();
    return results.filter((r) => !bannedIds.has(r.userId));
}
