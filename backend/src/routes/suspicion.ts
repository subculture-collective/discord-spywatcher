import { Router } from 'express';
import { getSuspicionScores } from '../analytics';
import { excludeBannedUsers, requireAuth } from '../middleware';
import { env } from '../utils/env';

const router = Router();

router.get('/suspicion', requireAuth, async (req, res) => {
    const since = req.query.since
        ? new Date(req.query.since as string)
        : undefined;
    const filterBanned = req.query.filterBanned === 'true';

    let data = await getSuspicionScores(env.DISCORD_GUILD_ID, since);

    data = await excludeBannedUsers(data, filterBanned);

    res.json(data);
});

export default router;
