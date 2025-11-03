import { Router } from 'express';
import { z } from 'zod';

import { getUserTimeline } from '../analytics';
import { requireAuth, validateGuild } from '../middleware';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();
router.use(validateGuild);
router.use(apiLimiter);

// Validation schema for timeline query parameters
const timelineQuerySchema = z.object({
    limit: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 50)),
    cursor: z.string().optional(),
    eventTypes: z
        .string()
        .optional()
        .transform((val) => (val ? val.split(',') : undefined)),
    startDate: z
        .string()
        .optional()
        .transform((val) => (val ? new Date(val) : undefined)),
    endDate: z
        .string()
        .optional()
        .transform((val) => (val ? new Date(val) : undefined)),
});

/**
 * @openapi
 * /timeline/{userId}:
 *   get:
 *     tags:
 *       - Timeline
 *     summary: Get user activity timeline
 *     description: Fetches comprehensive timeline of user activity with all event types
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to fetch timeline for
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of events to return
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Cursor for pagination
 *       - in: query
 *         name: eventTypes
 *         schema:
 *           type: string
 *         description: Comma-separated list of event types to filter
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for timeline
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for timeline
 *     responses:
 *       200:
 *         description: User timeline events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 events:
 *                   type: array
 *                   items:
 *                     type: object
 *                 nextCursor:
 *                   type: string
 *                   nullable: true
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.get('/timeline/:userId', requireAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        const guildId = req.guildId as string;

        // Validate and parse query parameters
        const queryResult = timelineQuerySchema.safeParse(req.query);

        if (!queryResult.success) {
            return res.status(400).json({
                error: 'Invalid query parameters',
                details: queryResult.error.issues,
            });
        }

        const { limit, cursor, eventTypes, startDate, endDate } =
            queryResult.data;

        // Fetch timeline
        const timeline = await getUserTimeline({
            userId,
            guildId,
            limit,
            cursor,
            eventTypes,
            startDate,
            endDate,
        });

        res.json(timeline);
    } catch (error) {
        console.error('Error fetching user timeline:', error);
        res.status(500).json({
            error: 'Failed to fetch user timeline',
        });
    }
});

export default router;
