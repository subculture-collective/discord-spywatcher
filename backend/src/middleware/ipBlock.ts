import { NextFunction, Request, Response } from 'express';

import { db } from '../db';
import { getRedisClient } from '../utils/redis';
import { sanitizeForLog } from '../utils/security';

const redis = getRedisClient();

/**
 * Middleware to block known bad IPs (both temporary and permanent)
 * Whitelisted IPs bypass all blocking checks
 */
export async function blockKnownBadIPs(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const ip = req.ip;
    
    if (!ip) {
        next();
        return;
    }

    // Check if IP is whitelisted (bypass all blocks)
    try {
        const whitelisted = await db.whitelistedIP.findUnique({ where: { ip } });
        if (whitelisted) {
            // IP is whitelisted, allow through
            next();
            return;
        }
    } catch (err) {
        console.error('Database check failed for IP whitelist:', err);
        // Continue to blocking checks even if whitelist check fails
    }

    // Check Redis for temporary blocks (if Redis is available)
    if (redis) {
        try {
            const isTemporarilyBlocked = await redis.get(`blocked:${ip}`);
            if (isTemporarilyBlocked) {
                const ttl = await redis.ttl(`blocked:${ip}`);
                res.status(403).json({
                    error: 'Access denied from this IP',
                    reason: 'Temporary block due to suspicious activity',
                    retryAfter: ttl > 0 ? ttl : undefined,
                });
                return;
            }
        } catch (err) {
            console.error('Redis check failed for IP block:', err);
            // Continue to database check even if Redis fails
        }
    }

    // Check database for permanent blocks
    try {
        const blocked = await db.blockedIP.findUnique({ where: { ip } });

        if (blocked) {
            res.status(403).json({
                error: 'Access denied from this IP',
                reason: blocked.reason || 'IP address permanently blocked',
            });
            return;
        }
    } catch (err) {
        console.error('Database check failed for IP block:', err);
        // Continue even if database check fails
    }

    next();
}

/**
 * Permanently ban an IP address
 */
export async function banIP(ip: string, reason?: string): Promise<void> {
    try {
        await db.blockedIP.upsert({
            where: { ip },
            update: { reason },
            create: { ip, reason },
        });
        console.log(`IP ${sanitizeForLog(ip)} permanently banned. Reason: ${sanitizeForLog(reason) || 'N/A'}`);
    } catch (err) {
        console.error(`Failed to ban IP ${sanitizeForLog(ip)}:`, err);
        throw err;
    }
}

/**
 * Temporarily block an IP address (Redis required)
 * @param ip - IP address to block
 * @param duration - Block duration in seconds (default: 3600 = 1 hour)
 * @param reason - Reason for blocking
 */
export async function temporarilyBlockIP(
    ip: string,
    duration: number = 3600,
    reason?: string
): Promise<void> {
    if (!redis) {
        console.warn('Redis not available, cannot create temporary IP block');
        return;
    }

    try {
        await redis.set(`blocked:${ip}`, '1', 'EX', duration);
        console.log(`IP ${sanitizeForLog(ip)} temporarily blocked for ${duration} seconds. Reason: ${sanitizeForLog(reason || 'N/A')}`);

        // Log the block in audit log
        await db.auditLog.create({
            data: {
                action: 'TEMP_IP_BLOCK',
                details: { ip, duration, reason },
                ipAddress: ip,
                createdAt: new Date(),
            },
        });
    } catch (err) {
        console.error(`Failed to temporarily block IP ${sanitizeForLog(ip)}:`, err);
        throw err;
    }
}

/**
 * Automatically block an IP on abuse detection
 * @param ip - IP address to block
 * @param duration - Block duration in seconds (default: 3600 = 1 hour)
 */
export async function autoBlockOnAbuse(
    ip: string,
    duration: number = 3600
): Promise<void> {
    await temporarilyBlockIP(ip, duration, 'Automatic block due to abuse detection');
}

/**
 * Remove a permanent IP ban
 */
export async function unbanIP(ip: string): Promise<void> {
    try {
        await db.blockedIP.delete({ where: { ip } });
        console.log(`IP ${sanitizeForLog(ip)} unbanned successfully`);
    } catch (_err) {
        console.warn(`Attempted to unban IP ${sanitizeForLog(ip)}, but it wasn't found.`);
    }
}

/**
 * Remove a temporary IP block (Redis)
 */
export async function removeTemporaryBlock(ip: string): Promise<void> {
    if (!redis) {
        console.warn('Redis not available, cannot remove temporary IP block');
        return;
    }

    try {
        await redis.del(`blocked:${ip}`);
        console.log(`Temporary block removed for IP ${sanitizeForLog(ip)}`);
    } catch (err) {
        console.error(`Failed to remove temporary block for IP ${sanitizeForLog(ip)}:`, err);
    }
}

/**
 * Check if an IP is blocked (temporary or permanent)
 */
export async function isIPBlocked(ip: string): Promise<boolean> {
    // Check temporary blocks in Redis
    if (redis) {
        try {
            const tempBlock = await redis.get(`blocked:${ip}`);
            if (tempBlock) return true;
        } catch (err) {
            console.error('Redis check failed:', err);
        }
    }

    // Check permanent blocks in database
    try {
        const permBlock = await db.blockedIP.findUnique({ where: { ip } });
        return !!permBlock;
    } catch (err) {
        console.error('Database check failed:', err);
        return false;
    }
}

/**
 * Add an IP to the whitelist
 */
export async function whitelistIP(ip: string, reason?: string): Promise<void> {
    try {
        await db.whitelistedIP.upsert({
            where: { ip },
            update: { reason },
            create: { ip, reason },
        });
        console.log(`IP ${sanitizeForLog(ip)} added to whitelist. Reason: ${sanitizeForLog(reason) || 'N/A'}`);
        
        // Log the action in audit log
        await db.auditLog.create({
            data: {
                action: 'IP_WHITELISTED',
                details: { ip, reason },
                ipAddress: ip,
                createdAt: new Date(),
            },
        });
    } catch (err) {
        console.error(`Failed to whitelist IP ${sanitizeForLog(ip)}:`, err);
        throw err;
    }
}

/**
 * Remove an IP from the whitelist
 */
export async function removeIPFromWhitelist(ip: string): Promise<void> {
    try {
        await db.whitelistedIP.delete({ where: { ip } });
        console.log(`IP ${sanitizeForLog(ip)} removed from whitelist`);
        
        // Log the action in audit log
        await db.auditLog.create({
            data: {
                action: 'IP_WHITELIST_REMOVED',
                details: { ip },
                ipAddress: ip,
                createdAt: new Date(),
            },
        });
    } catch (_err) {
        console.warn(`Attempted to remove IP ${sanitizeForLog(ip)} from whitelist, but it wasn't found.`);
    }
}

/**
 * Check if an IP is whitelisted
 */
export async function isIPWhitelisted(ip: string): Promise<boolean> {
    try {
        const whitelisted = await db.whitelistedIP.findUnique({ where: { ip } });
        return !!whitelisted;
    } catch (err) {
        console.error('Database check failed for whitelist:', err);
        return false;
    }
}

/**
 * Get all whitelisted IPs
 */
export async function getWhitelistedIPs(): Promise<Array<{ ip: string; reason?: string; createdAt: Date }>> {
    try {
        const whitelisted = await db.whitelistedIP.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return whitelisted.map(w => ({
            ip: w.ip,
            reason: w.reason || undefined,
            createdAt: w.createdAt,
        }));
    } catch (err) {
        console.error('Failed to get whitelisted IPs:', err);
        return [];
    }
}

/**
 * Get all blocked IPs
 */
export async function getBlockedIPs(): Promise<Array<{ ip: string; reason?: string; createdAt: Date }>> {
    try {
        const blocked = await db.blockedIP.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return blocked.map(b => ({
            ip: b.ip,
            reason: b.reason || undefined,
            createdAt: b.createdAt,
        }));
    } catch (err) {
        console.error('Failed to get blocked IPs:', err);
        return [];
    }
}

/**
 * Get rate limit violations for an IP
 */
export async function getRateLimitViolations(ip: string): Promise<number> {
    if (!redis) {
        return 0;
    }
    
    try {
        const violations = await redis.get(`violations:${ip}`);
        return violations ? parseInt(violations, 10) : 0;
    } catch (err) {
        console.error('Failed to get rate limit violations:', err);
        return 0;
    }
}

