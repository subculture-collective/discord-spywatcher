import { RequestHandler } from 'express';

import { env } from '../utils/env';

export const validateGuild: RequestHandler = (req, res, next) => {
    const guildId = (req.query.guildId as string) || env.DISCORD_GUILD_ID;

    if (!guildId) {
        res.status(400).json({ error: 'Guild ID is required' });
        return;
    }

    if (!env.BOT_GUILD_IDS.includes(guildId)) {
        res.status(403).json({ error: 'Guild not authorized' });
        return;
    }

    req.guildId = guildId;
    next();
};
