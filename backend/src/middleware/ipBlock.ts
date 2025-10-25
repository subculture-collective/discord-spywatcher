import { NextFunction, Request, Response } from 'express';

import { db } from '../db';
import { getRedisClient } from '../utils/redis';
import { sanitizeForLog } from '../utils/security';

const redis = getRedisClient();

/**
 * Middleware to block known bad IPs (both temporary and permanent)
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
        console.log(`IP ${sanitizeForLog(ip)} temporarily blocked for ${duration} seconds. Reason: ${sanitizeForLog(reason) || 'N/A'}`);

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

