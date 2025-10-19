import { Router } from 'express';

import {
    getBehaviorShiftFlags,
    getChannelHeatmap,
    getClientDriftFlags,
    getGhostScores,
    getLurkerFlags,
    getRoleDriftFlags,
} from '../analytics';
import { excludeBannedUsers, requireAuth, validateGuild } from '../middleware';
import { env } from '../utils/env';

const router = Router();

router.use(requireAuth);
router.use(validateGuild);

router.get('/ghosts', async (req, res) => {
    const since = req.query.since
        ? new Date(req.query.since as string)
        : undefined;
    const guildId = (req.query.guildId as string) || env.DISCORD_GUILD_ID;
    let data = await getGhostScores(guildId, since);
    data = await excludeBannedUsers(data, req.query.filterBanned === 'true');
    res.json(data);
});

router.get('/heatmap', async (req, res) => {
    const since = req.query.since
        ? new Date(req.query.since as string)
        : undefined;
    const guildId = (req.query.guildId as string) || env.DISCORD_GUILD_ID;
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
    const guildId = (req.query.guildId as string) || env.DISCORD_GUILD_ID;
    let data = await getLurkerFlags(guildId, since);
    data = await excludeBannedUsers(data, req.query.filterBanned === 'true');

    res.json(data);
});

router.get('/roles', async (req, res) => {
    const since = req.query.since
        ? new Date(req.query.since as string)
        : undefined;
    const guildId = (req.query.guildId as string) || env.DISCORD_GUILD_ID;
    let data = await getRoleDriftFlags(guildId, since);
    data = await excludeBannedUsers(data, req.query.filterBanned === 'true');

    res.json(data);
});

router.get('/clients', async (req, res) => {
    const since = req.query.since
        ? new Date(req.query.since as string)
        : undefined;
    const guildId = (req.query.guildId as string) || env.DISCORD_GUILD_ID;
    let data = await getClientDriftFlags(guildId, since);
    data = await excludeBannedUsers(data, req.query.filterBanned === 'true');

    res.json(data);
});

router.get('/shifts', async (req, res) => {
    const since = req.query.since
        ? new Date(req.query.since as string)
        : undefined;
    const guildId = (req.query.guildId as string) || env.DISCORD_GUILD_ID;
    let data = await getBehaviorShiftFlags(guildId, since);
    data = await excludeBannedUsers(data, req.query.filterBanned === 'true');

    res.json(data);
});

export default router;
