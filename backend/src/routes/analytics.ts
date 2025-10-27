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
    redisCacheMiddleware,
    etagMiddleware,
    analyticsCache,
} from '../middleware';

const router = Router();

// Apply analytics-specific rate limiting and caching
router.use(analyticsLimiter);
router.use(requireAuth);
router.use(validateGuild);

router.get('/ghosts', async (req, res) => {
    const since = req.query.since
        ? new Date(req.query.since as string)
        : undefined;
    const guildId = req.guildId as string;
    let data = await getGhostScores(guildId, since);
    data = await excludeBannedUsers(data, req.query.filterBanned === 'true');
    res.json(data);
});

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

router.get('/lurkers', async (req, res) => {
    const since = req.query.since
        ? new Date(req.query.since as string)
        : undefined;
    const guildId = req.guildId as string;
    let data = await getLurkerFlags(guildId, since);
    data = await excludeBannedUsers(data, req.query.filterBanned === 'true');

    res.json(data);
});

router.get('/roles', async (req, res) => {
    const since = req.query.since
        ? new Date(req.query.since as string)
        : undefined;
    const guildId = req.guildId as string;
    let data = await getRoleDriftFlags(guildId, since);
    data = await excludeBannedUsers(data, req.query.filterBanned === 'true');

    res.json(data);
});

router.get('/clients', async (req, res) => {
    const since = req.query.since
        ? new Date(req.query.since as string)
        : undefined;
    const guildId = req.guildId as string;
    let data = await getClientDriftFlags(guildId, since);
    data = await excludeBannedUsers(data, req.query.filterBanned === 'true');

    res.json(data);
});

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
