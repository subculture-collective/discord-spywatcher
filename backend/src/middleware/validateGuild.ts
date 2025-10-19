import { RequestHandler } from 'express';

import { env } from '../utils/env';

export const validateGuild: RequestHandler = (req, res, next) => {
    const guildId = (req.query.guildId as string) || env.DISCORD_GUILD_ID;

    if (!env.BOT_GUILD_IDS.includes(guildId)) {
        res.status(403).json({ error: 'Guild not authorized' });
        return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (req as any).guildId = guildId;
    next();
};
