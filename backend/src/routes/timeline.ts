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
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 50)),
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
 * GET /timeline/:userId
 * Fetches comprehensive timeline of user activity with all event types
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
                details: queryResult.error.errors,
            });
        }

        const { limit, cursor, eventTypes, startDate, endDate } = queryResult.data;

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
