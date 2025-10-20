import * as crypto from 'crypto';

import { db } from '../db';

/**
 * Create a new session for a user
 */
export async function createSession(
    userId: string,
    userAgent?: string,
    ipAddress?: string
): Promise<string> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session = await db.session.create({
        data: {
            userId,
            userAgent,
            ipAddress,
            expiresAt,
        },
    });

    return session.id;
}

/**
 * Update session activity timestamp
 */
export async function updateSessionActivity(sessionId: string): Promise<void> {
    await db.session.update({
        where: { id: sessionId },
        data: { lastActivity: new Date() },
    });
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(userId: string) {
    return db.session.findMany({
        where: {
            userId,
            expiresAt: {
                gt: new Date(),
            },
        },
        orderBy: {
            lastActivity: 'desc',
        },
    });
}

/**
 * Revoke a specific session
 */
export async function revokeSession(sessionId: string): Promise<void> {
    await db.session.delete({
        where: { id: sessionId },
    });
}

/**
 * Revoke all sessions for a user
 */
export async function revokeAllUserSessions(userId: string): Promise<number> {
    const result = await db.session.deleteMany({
        where: { userId },
    });
    return result.count;
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
    const result = await db.session.deleteMany({
        where: {
            expiresAt: {
                lt: new Date(),
            },
        },
    });
    return result.count;
}

/**
 * Generate a unique session fingerprint
 */
export function generateSessionFingerprint(
    userAgent?: string,
    ipAddress?: string
): string {
    const data = `${userAgent || ''}:${ipAddress || ''}`;
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Check concurrent session limit
 */
export async function checkSessionLimit(
    userId: string,
    maxSessions = 5
): Promise<boolean> {
    const count = await db.session.count({
        where: {
            userId,
            expiresAt: {
                gt: new Date(),
            },
        },
    });

    return count < maxSessions;
}
