import { Router, Request, Response } from 'express';

import { requireAuth, requireRole } from '../middleware/auth';
import {
    banIP,
    unbanIP,
    temporarilyBlockIP,
    removeTemporaryBlock,
    whitelistIP,
    removeIPFromWhitelist,
    isIPBlocked,
    isIPWhitelisted,
    getBlockedIPs,
    getWhitelistedIPs,
    getRateLimitViolations,
} from '../middleware/ipBlock';
import { sanitizeForLog } from '../utils/security';

const router = Router();

// All routes require authentication and admin role
router.use(requireAuth);
router.use(requireRole(['ADMIN']));

/**
 * GET /api/admin/ip-management/blocked
 * Get all permanently blocked IPs
 */
router.get('/blocked', async (_req: Request, res: Response) => {
    try {
        const blocked = await getBlockedIPs();
        res.json({ blocked });
    } catch (error) {
        console.error('Failed to get blocked IPs:', error);
        res.status(500).json({ error: 'Failed to retrieve blocked IPs' });
    }
});

/**
 * GET /api/admin/ip-management/whitelisted
 * Get all whitelisted IPs
 */
router.get('/whitelisted', async (_req: Request, res: Response) => {
    try {
        const whitelisted = await getWhitelistedIPs();
        res.json({ whitelisted });
    } catch (error) {
        console.error('Failed to get whitelisted IPs:', error);
        res.status(500).json({ error: 'Failed to retrieve whitelisted IPs' });
    }
});

/**
 * GET /api/admin/ip-management/check/:ip
 * Check the status of a specific IP
 */
router.get('/check/:ip', async (req: Request, res: Response) => {
    try {
        const { ip } = req.params;

        if (!ip || !/^[\d.:a-fA-F]+$/.test(ip)) {
            res.status(400).json({ error: 'Invalid IP address format' });
            return;
        }

        const [blocked, whitelisted, violations] = await Promise.all([
            isIPBlocked(ip),
            isIPWhitelisted(ip),
            getRateLimitViolations(ip),
        ]);

        res.json({
            ip,
            blocked,
            whitelisted,
            violations,
            status: whitelisted ? 'whitelisted' : blocked ? 'blocked' : 'normal',
        });
    } catch (error) {
        console.error('Failed to check IP status:', error);
        res.status(500).json({ error: 'Failed to check IP status' });
    }
});

/**
 * POST /api/admin/ip-management/block
 * Permanently block an IP
 */
router.post('/block', async (req: Request, res: Response) => {
    try {
        const { ip, reason } = req.body as { ip: string; reason?: string };

        if (!ip || !/^[\d.:a-fA-F]+$/.test(ip)) {
            res.status(400).json({ error: 'Invalid IP address format' });
            return;
        }

        await banIP(ip, reason);

        const username = ((req as { user?: { username?: string } }).user?.username) || 'unknown';
        console.log(`Admin ${sanitizeForLog(username)} blocked IP ${sanitizeForLog(ip)}`);

        res.json({
            message: 'IP permanently blocked',
            ip,
            reason,
        });
    } catch (error) {
        console.error('Failed to block IP:', error);
        res.status(500).json({ error: 'Failed to block IP' });
    }
});

/**
 * POST /api/admin/ip-management/temp-block
 * Temporarily block an IP
 */
router.post('/temp-block', async (req: Request, res: Response) => {
    try {
        const { ip, duration, reason } = req.body as {
            ip: string;
            duration?: number;
            reason?: string;
        };

        if (!ip || !/^[\d.:a-fA-F]+$/.test(ip)) {
            res.status(400).json({ error: 'Invalid IP address format' });
            return;
        }

        const blockDuration = duration || 3600; // Default 1 hour

        if (blockDuration < 60 || blockDuration > 86400) {
            res.status(400).json({
                error: 'Duration must be between 60 seconds and 24 hours',
            });
            return;
        }

        await temporarilyBlockIP(ip, blockDuration, reason);

        const username = ((req as { user?: { username?: string } }).user?.username) || 'unknown';
        console.log(
            `Admin ${sanitizeForLog(username)} temporarily blocked IP ${sanitizeForLog(ip)} for ${sanitizeForLog(String(blockDuration))}s`
        );

        res.json({
            message: 'IP temporarily blocked',
            ip,
            duration: blockDuration,
            reason,
        });
    } catch (error) {
        console.error('Failed to temporarily block IP:', error);
        res.status(500).json({ error: 'Failed to temporarily block IP' });
    }
});

/**
 * DELETE /api/admin/ip-management/unblock/:ip
 * Remove a permanent IP block
 */
router.delete('/unblock/:ip', async (req: Request, res: Response) => {
    try {
        const { ip } = req.params;

        if (!ip || !/^[\d.:a-fA-F]+$/.test(ip)) {
            res.status(400).json({ error: 'Invalid IP address format' });
            return;
        }

        await unbanIP(ip);

        const username = ((req as { user?: { username?: string } }).user?.username) || 'unknown';
        console.log(`Admin ${sanitizeForLog(username)} unblocked IP ${sanitizeForLog(ip)}`);

        res.json({
            message: 'IP unblocked successfully',
            ip,
        });
    } catch (error) {
        console.error('Failed to unblock IP:', error);
        res.status(500).json({ error: 'Failed to unblock IP' });
    }
});

/**
 * DELETE /api/admin/ip-management/temp-unblock/:ip
 * Remove a temporary IP block
 */
router.delete('/temp-unblock/:ip', async (req: Request, res: Response) => {
    try {
        const { ip } = req.params;

        if (!ip || !/^[\d.:a-fA-F]+$/.test(ip)) {
            res.status(400).json({ error: 'Invalid IP address format' });
            return;
        }

        await removeTemporaryBlock(ip);

        const username = ((req as { user?: { username?: string } }).user?.username) || 'unknown';
        console.log(
            `Admin ${sanitizeForLog(username)} removed temporary block for IP ${sanitizeForLog(ip)}`
        );

        res.json({
            message: 'Temporary block removed successfully',
            ip,
        });
    } catch (error) {
        console.error('Failed to remove temporary block:', error);
        res.status(500).json({ error: 'Failed to remove temporary block' });
    }
});

/**
 * POST /api/admin/ip-management/whitelist
 * Add an IP to the whitelist
 */
router.post('/whitelist', async (req: Request, res: Response) => {
    try {
        const { ip, reason } = req.body as { ip: string; reason?: string };

        if (!ip || !/^[\d.:a-fA-F]+$/.test(ip)) {
            res.status(400).json({ error: 'Invalid IP address format' });
            return;
        }

        await whitelistIP(ip, reason);

        const username = ((req as { user?: { username?: string } }).user?.username) || 'unknown';
        console.log(`Admin ${sanitizeForLog(username)} whitelisted IP ${sanitizeForLog(ip)}`);

        res.json({
            message: 'IP added to whitelist',
            ip,
            reason,
        });
    } catch (error) {
        console.error('Failed to whitelist IP:', error);
        res.status(500).json({ error: 'Failed to whitelist IP' });
    }
});

/**
 * DELETE /api/admin/ip-management/whitelist/:ip
 * Remove an IP from the whitelist
 */
router.delete('/whitelist/:ip', async (req: Request, res: Response) => {
    try {
        const { ip } = req.params;

        if (!ip || !/^[\d.:a-fA-F]+$/.test(ip)) {
            res.status(400).json({ error: 'Invalid IP address format' });
            return;
        }

        await removeIPFromWhitelist(ip);

        const username = ((req as { user?: { username?: string } }).user?.username) || 'unknown';
        console.log(
            `Admin ${sanitizeForLog(username)} removed IP ${sanitizeForLog(ip)} from whitelist`
        );

        res.json({
            message: 'IP removed from whitelist',
            ip,
        });
    } catch (error) {
        console.error('Failed to remove IP from whitelist:', error);
        res.status(500).json({ error: 'Failed to remove IP from whitelist' });
    }
});

export default router;
