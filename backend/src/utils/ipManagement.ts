import { db } from '../db';

/**
 * Auto-block an IP address due to abuse
 */
export async function autoBlockOnAbuse(
    ipAddress: string,
    durationSeconds: number
): Promise<void> {
    try {
        // Check if IP is already blocked
        const existing = await db.blockedIP.findFirst({
            where: { ip: ipAddress },
        });

        if (existing) {
            console.log(`IP ${ipAddress} is already blocked`);
            return;
        }

        // Check if IP is whitelisted
        const whitelisted = await db.whitelistedIP.findFirst({
            where: { ip: ipAddress },
        });

        if (whitelisted) {
            console.log(
                `IP ${ipAddress} is whitelisted, not blocking despite abuse`
            );
            return;
        }

        // Block the IP
        await db.blockedIP.create({
            data: {
                ip: ipAddress,
                reason: `Auto-blocked due to abuse detected at ${new Date().toISOString()} for ${durationSeconds} seconds`,
            },
        });

        console.log(
            `🔒 Blocked IP ${ipAddress} for ${durationSeconds} seconds`
        );

        // Schedule unblock if duration is specified
        if (durationSeconds > 0) {
            setTimeout(
                async () => {
                    try {
                        await db.blockedIP.deleteMany({
                            where: { ip: ipAddress },
                        });
                        console.log(`🔓 Auto-unblocked IP ${ipAddress}`);
                    } catch (error) {
                        console.error(
                            `Failed to auto-unblock IP ${ipAddress}:`,
                            error
                        );
                    }
                },
                durationSeconds * 1000
            );
        }
    } catch (error) {
        console.error(`Failed to auto-block IP ${ipAddress}:`, error);
        throw error;
    }
}

/**
 * Manually block an IP address
 */
export async function blockIP(
    ipAddress: string,
    reason?: string
): Promise<void> {
    await db.blockedIP.create({
        data: {
            ip: ipAddress,
            reason: reason || 'Manually blocked',
        },
    });
}

/**
 * Unblock an IP address
 */
export async function unblockIP(ipAddress: string): Promise<void> {
    await db.blockedIP.deleteMany({
        where: { ip: ipAddress },
    });
}

/**
 * Check if an IP is blocked
 */
export async function isIPBlocked(ipAddress: string): Promise<boolean> {
    const blocked = await db.blockedIP.findFirst({
        where: { ip: ipAddress },
    });
    return !!blocked;
}

/**
 * Check if an IP is whitelisted
 */
export async function isIPWhitelisted(ipAddress: string): Promise<boolean> {
    const whitelisted = await db.whitelistedIP.findFirst({
        where: { ip: ipAddress },
    });
    return !!whitelisted;
}

/**
 * Get all blocked IPs
 */
export async function getBlockedIPs() {
    return db.blockedIP.findMany({
        orderBy: { createdAt: 'desc' },
    });
}

/**
 * Get all whitelisted IPs
 */
export async function getWhitelistedIPs() {
    return db.whitelistedIP.findMany({
        orderBy: { createdAt: 'desc' },
    });
}
