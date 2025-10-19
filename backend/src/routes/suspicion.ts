import { Router } from 'express';

import { getSuspicionScores } from '../analytics';
import { excludeBannedUsers, requireAuth, validateGuild } from '../middleware';

const router = Router();
router.use(validateGuild);

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

export default router;
