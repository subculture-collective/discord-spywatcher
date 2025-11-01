/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { Router } from 'express';

import { db } from '../db';
import {
    banIP,
    requireAuth,
    unbanIP,
    whitelistIP,
    removeIPFromWhitelist,
    getWhitelistedIPs,
} from '../middleware';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(requireAuth);
router.use(apiLimiter);

// IP Ban Management
/**
 * @openapi
 * /banned:
 *   get:
 *     tags:
 *       - Bans
 *     summary: Get banned IPs
 *     description: Returns list of all banned IP addresses
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response with banned IPs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BannedIP'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.get('/banned', async (req, res) => {
    const list = await db.blockedIP.findMany({
        orderBy: { createdAt: 'desc' },
    });
    res.json(list);
});

/**
 * @openapi
 * /ban:
 *   post:
 *     tags:
 *       - Bans
 *     summary: Ban an IP address
 *     description: Add an IP address to the ban list
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ip
 *             properties:
 *               ip:
 *                 type: string
 *                 description: IP address to ban
 *               reason:
 *                 type: string
 *                 description: Reason for ban
 *     responses:
 *       200:
 *         description: IP successfully banned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post('/ban', async (req, res): Promise<void> => {
    const { ip, reason } = req.body;
    if (!ip) res.status(400).json({ error: 'Missing IP' });

    await banIP(ip, reason);
    res.json({ message: `Banned ${ip}` });
});

/**
 * @openapi
 * /unban:
 *   post:
 *     tags:
 *       - Bans
 *     summary: Unban an IP address
 *     description: Remove an IP address from the ban list
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ip
 *             properties:
 *               ip:
 *                 type: string
 *                 description: IP address to unban
 *     responses:
 *       200:
 *         description: IP successfully unbanned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post('/unban', async (req, res): Promise<void> => {
    const { ip } = req.body;
    if (!ip) res.status(400).json({ error: 'Missing IP' });

    await unbanIP(ip);
    res.json({ message: `Unbanned ${ip}` });
});

// IP Whitelist Management
/**
 * @openapi
 * /whitelisted:
 *   get:
 *     tags:
 *       - Bans
 *     summary: Get whitelisted IPs
 *     description: Returns list of all whitelisted IP addresses
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response with whitelisted IPs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.get('/whitelisted', async (req, res) => {
    const list = await getWhitelistedIPs();
    res.json(list);
});

/**
 * @openapi
 * /whitelist:
 *   post:
 *     tags:
 *       - Bans
 *     summary: Add IP to whitelist
 *     description: Add an IP address to the whitelist
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ip
 *             properties:
 *               ip:
 *                 type: string
 *                 description: IP address to whitelist
 *               description:
 *                 type: string
 *                 description: Description for whitelist entry
 *     responses:
 *       200:
 *         description: IP successfully whitelisted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post('/whitelist', async (req, res): Promise<void> => {
    const { ip, description } = req.body;
    if (!ip) {
        res.status(400).json({ error: 'Missing IP address' });
        return;
    }

    await whitelistIP(ip, description);
    res.json({ message: `IP ${ip} added to whitelist` });
});

/**
 * @openapi
 * /whitelist:
 *   delete:
 *     tags:
 *       - Bans
 *     summary: Remove IP from whitelist
 *     description: Remove an IP address from the whitelist
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ip
 *             properties:
 *               ip:
 *                 type: string
 *                 description: IP address to remove from whitelist
 *     responses:
 *       200:
 *         description: IP successfully removed from whitelist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.delete('/whitelist', async (req, res): Promise<void> => {
    const { ip } = req.body;
    if (!ip) {
        res.status(400).json({ error: 'Missing IP address' });
        return;
    }

    await removeIPFromWhitelist(ip);
    res.json({ message: `IP ${ip} removed from whitelist` });
});

// User Ban Management
router.get('/userbans', async (req, res): Promise<void> => {
    const list = await db.bannedUser.findMany({
        orderBy: { createdAt: 'desc' },
    });
    res.json(list);
});

router.post('/userban', async (req, res): Promise<void> => {
    const { userId, username, reason } = req.body;
    if (!userId || !username) {
        res.status(400).json({ error: 'Missing userId or username' });
    }

    await db.bannedUser.upsert({
        where: { userId },
        update: { reason, username },
        create: { userId, username, reason },
    });

    res.json({ message: `Banned ${username}` });
});

router.post('/userunban', async (req, res): Promise<void> => {
    const { userId } = req.body;
    if (!userId) res.status(400).json({ error: 'Missing userId' });

    await db.bannedUser.delete({ where: { userId } }).catch(() => {});
    res.json({ message: `Unbanned user ${userId}` });
});

export default router;
