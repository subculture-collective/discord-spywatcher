import { db } from '../db';

/**
 * Log a login attempt
 */
export async function logLoginAttempt(
    userId: string,
    ipAddress: string,
    userAgent?: string,
    success = true,
    reason?: string
): Promise<void> {
    await db.loginLog.create({
        data: {
            userId,
            ipAddress,
            userAgent,
            success,
            reason,
        },
    });
}

/**
 * Get recent login attempts for a user
 */
export async function getUserLoginHistory(userId: string, limit = 10) {
    return db.loginLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
}

/**
 * Check for suspicious login patterns
 */
export async function detectSuspiciousLogin(
    userId: string,
    ipAddress: string
): Promise<{ suspicious: boolean; reason?: string }> {
    // Get recent successful logins
    const recentLogins = await db.loginLog.findMany({
        where: {
            userId,
            success: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
    });

    if (recentLogins.length === 0) {
        return { suspicious: false };
    }

    // Check if IP is new
    const knownIPs = new Set(recentLogins.map((log) => log.ipAddress));
    if (!knownIPs.has(ipAddress)) {
        return {
            suspicious: true,
            reason: 'Login from new IP address',
        };
    }

    // Check for rapid failed attempts
    const recentFailed = await db.loginLog.count({
        where: {
            userId,
            success: false,
            createdAt: {
                gte: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
            },
        },
    });

    if (recentFailed >= 3) {
        return {
            suspicious: true,
            reason: 'Multiple failed login attempts',
        };
    }

    return { suspicious: false };
}
