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
