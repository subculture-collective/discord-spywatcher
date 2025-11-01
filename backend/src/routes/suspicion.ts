import { Router } from 'express';

import {
    calculateAdvancedSuspicion,
    getSuspicionScores,
} from '../analytics';
import { excludeBannedUsers, requireAuth, validateGuild } from '../middleware';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();
router.use(validateGuild);
router.use(apiLimiter);

/**
 * @openapi
 * /suspicion:
 *   get:
 *     tags:
 *       - Suspicion
 *     summary: Get suspicion scores
 *     description: Returns suspicion scores for users based on behavior analysis
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/SinceQuery'
 *       - $ref: '#/components/parameters/FilterBannedQuery'
 *     responses:
 *       200:
 *         description: Successful response with suspicion scores
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
router.get('/suspicion', requireAuth, async (req, res) => {
    const since = req.query.since
        ? new Date(req.query.since as string)
        : undefined;
    const filterBanned = req.query.filterBanned === 'true';

    const guildId = req.guildId as string;
    let data = await getSuspicionScores(guildId, since);

    data = await excludeBannedUsers(data, filterBanned);

    res.json(data);
});

/**
 * @openapi
 * /suspicion/{userId}:
 *   get:
 *     tags:
 *       - Suspicion
 *     summary: Get detailed suspicion analysis for a user
 *     description: Returns detailed suspicion analysis for a specific user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to analyze
 *       - $ref: '#/components/parameters/SinceQuery'
 *     responses:
 *       200:
 *         description: Detailed suspicion analysis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         description: Internal server error
 */
// New endpoint for detailed suspicion analysis of a specific user
router.get('/suspicion/:userId', requireAuth, async (req, res) => {
    const { userId } = req.params;
    const since = req.query.since
        ? new Date(req.query.since as string)
        : undefined;

    const guildId = req.guildId as string;

    try {
        const suspicionDetail = await calculateAdvancedSuspicion(
            userId,
            guildId,
            since
        );
        res.json(suspicionDetail);
    } catch (error) {
        console.error('Error calculating advanced suspicion:', error);
        res.status(500).json({
            error: 'Failed to calculate suspicion details',
        });
    }
});

export default router;
