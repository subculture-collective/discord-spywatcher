import { db } from '../db';

/**
 * Sanitize IP address for logging to prevent log injection
 * Validates IPv4 and IPv6 format
 */
function sanitizeIPForLog(ip: string): string {
    // IPv4: digits and dots only
    // IPv6: hex digits, colons, and brackets for IPv6
    // Strict validation to prevent any injection
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
    
    if (ipv4Regex.test(ip) || ipv6Regex.test(ip)) {
        return ip.substring(0, 45); // Max IPv6 length
    }
    return '[invalid-ip]';
}

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
            console.log('IP is already blocked');
            return;
        }

        // Check if IP is whitelisted
        const whitelisted = await db.whitelistedIP.findFirst({
            where: { ip: ipAddress },
        });

        if (whitelisted) {
            console.log(
                'IP is whitelisted, not blocking despite abuse'
            );
            return;
        }

        // Block the IP - don't include raw IP in reason field
        await db.blockedIP.create({
            data: {
                ip: ipAddress,
                reason: `Auto-blocked due to abuse detected at ${new Date().toISOString()} for ${durationSeconds} seconds`,
            },
        });

        const sanitizedIP = sanitizeIPForLog(ipAddress);
        console.log(
            `🔒 Blocked IP ${sanitizedIP} for ${durationSeconds} seconds`
        );

        // Schedule unblock if duration is specified
        if (durationSeconds > 0) {
            setTimeout(
                async () => {
                    try {
                        await db.blockedIP.deleteMany({
                            where: { ip: ipAddress },
                        });
                        console.log(`🔓 Auto-unblocked IP ${sanitizeIPForLog(ipAddress)}`);
                    } catch (error) {
                        console.error(
                            'Failed to auto-unblock IP'
                        );
                    }
                },
                durationSeconds * 1000
            );
        }
    } catch (error) {
        console.error('Failed to auto-block IP');
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
