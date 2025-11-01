import { Router } from 'express';

import {
    getBehaviorShiftFlags,
    getChannelHeatmap,
    getClientDriftFlags,
    getGhostScores,
    getLurkerFlags,
    getRoleDriftFlags,
} from '../analytics';
import {
    excludeBannedUsers,
    requireAuth,
    validateGuild,
    analyticsLimiter,
} from '../middleware';

const router = Router();

// Apply analytics-specific rate limiting
router.use(analyticsLimiter);
router.use(requireAuth);
router.use(validateGuild);

/**
 * @openapi
 * /ghosts:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get ghost scores
 *     description: Returns users with high presence but low engagement (ghost score)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/SinceQuery'
 *       - $ref: '#/components/parameters/FilterBannedQuery'
 *     responses:
 *       200:
 *         description: Successful response with ghost scores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/GhostScore'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.get('/ghosts', async (req, res) => {
    const since = req.query.since
        ? new Date(req.query.since as string)
        : undefined;
    const guildId = req.guildId as string;
    let data = await getGhostScores(guildId, since);
    data = await excludeBannedUsers(data, req.query.filterBanned === 'true');
    res.json(data);
});

/**
 * @openapi
 * /heatmap:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get channel heatmap
 *     description: Returns channel activity heatmap with message counts and unique users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/SinceQuery'
 *       - $ref: '#/components/parameters/FilterBannedQuery'
 *     responses:
 *       200:
 *         description: Successful response with channel heatmap data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ChannelHeatmap'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.get('/heatmap', async (req, res) => {
    const since = req.query.since
        ? new Date(req.query.since as string)
        : undefined;
    const guildId = req.guildId as string;
    let data = await getChannelHeatmap({
        guildId,
        since,
    });
    data = await excludeBannedUsers(data, req.query.filterBanned === 'true');

    res.json(data);
});

/**
 * @openapi
 * /lurkers:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get lurker flags
 *     description: Returns users identified as lurkers (low activity patterns)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/SinceQuery'
 *       - $ref: '#/components/parameters/FilterBannedQuery'
 *     responses:
 *       200:
 *         description: Successful response with lurker data
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
router.get('/lurkers', async (req, res) => {
    const since = req.query.since
        ? new Date(req.query.since as string)
        : undefined;
    const guildId = req.guildId as string;
    let data = await getLurkerFlags(guildId, since);
    data = await excludeBannedUsers(data, req.query.filterBanned === 'true');

    res.json(data);
});

/**
 * @openapi
 * /roles:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get role drift flags
 *     description: Returns users with unusual role changes or patterns
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/SinceQuery'
 *       - $ref: '#/components/parameters/FilterBannedQuery'
 *     responses:
 *       200:
 *         description: Successful response with role drift data
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
router.get('/roles', async (req, res) => {
    const since = req.query.since
        ? new Date(req.query.since as string)
        : undefined;
    const guildId = req.guildId as string;
    let data = await getRoleDriftFlags(guildId, since);
    data = await excludeBannedUsers(data, req.query.filterBanned === 'true');

    res.json(data);
});

/**
 * @openapi
 * /clients:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get client drift flags
 *     description: Returns users with unusual client usage patterns
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/SinceQuery'
 *       - $ref: '#/components/parameters/FilterBannedQuery'
 *     responses:
 *       200:
 *         description: Successful response with client drift data
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
router.get('/clients', async (req, res) => {
    const since = req.query.since
        ? new Date(req.query.since as string)
        : undefined;
    const guildId = req.guildId as string;
    let data = await getClientDriftFlags(guildId, since);
    data = await excludeBannedUsers(data, req.query.filterBanned === 'true');

    res.json(data);
});

/**
 * @openapi
 * /shifts:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get behavior shift flags
 *     description: Returns users with significant behavioral changes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/SinceQuery'
 *       - $ref: '#/components/parameters/FilterBannedQuery'
 *     responses:
 *       200:
 *         description: Successful response with behavior shift data
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
router.get('/shifts', async (req, res) => {
    const since = req.query.since
        ? new Date(req.query.since as string)
        : undefined;
    const guildId = req.guildId as string;
    let data = await getBehaviorShiftFlags(guildId, since);
    data = await excludeBannedUsers(data, req.query.filterBanned === 'true');

    res.json(data);
});

export default router;
