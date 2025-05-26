import { Router } from 'express';
import {
    getBehaviorShiftFlags,
    getChannelHeatmap,
    getClientDriftFlags,
    getGhostScores,
    getLurkerFlags,
    getRoleDriftFlags,
} from '../analytics';
import { excludeBannedUsers, requireAuth } from '../middleware';

import { env } from '../utils/env';

const router = Router();

router.use(requireAuth);

router.get('/ghosts', async (req, res) => {
    const since = req.query.since
        ? new Date(req.query.since as string)
        : undefined;
    let data = await getGhostScores(env.DISCORD_GUILD_ID, since);
    data = await excludeBannedUsers(data, req.query.filterBanned === 'true');
    res.json(data);
});

router.get('/heatmap', async (req, res) => {
    const since = req.query.since
        ? new Date(req.query.since as string)
        : undefined;
    let data = await getChannelHeatmap({ guildId: env.DISCORD_GUILD_ID, since });
    data = await excludeBannedUsers(data, req.query.filterBanned === 'true');

    res.json(data);
});

router.get('/lurkers', async (req, res) => {
    const since = req.query.since
        ? new Date(req.query.since as string)
        : undefined;
    let data = await getLurkerFlags(env.DISCORD_GUILD_ID, since);
    data = await excludeBannedUsers(data, req.query.filterBanned === 'true');

    res.json(data);
});

router.get('/roles', async (req, res) => {
    const since = req.query.since
        ? new Date(req.query.since as string)
        : undefined;
    let data = await getRoleDriftFlags(env.DISCORD_GUILD_ID, since);
    data = await excludeBannedUsers(data, req.query.filterBanned === 'true');

    res.json(data);
});

router.get('/clients', async (req, res) => {
    const since = req.query.since
        ? new Date(req.query.since as string)
        : undefined;
    let data = await getClientDriftFlags(env.DISCORD_GUILD_ID, since);
    data = await excludeBannedUsers(data, req.query.filterBanned === 'true');

    res.json(data);
});

router.get('/shifts', async (req, res) => {
    const since = req.query.since
        ? new Date(req.query.since as string)
        : undefined;
    let data = await getBehaviorShiftFlags(env.DISCORD_GUILD_ID, since);
    data = await excludeBannedUsers(data, req.query.filterBanned === 'true');

    res.json(data);
});

export default router;
