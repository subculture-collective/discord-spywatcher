import { RequestHandler } from 'express';
import { env } from '../utils/env';

export const validateGuild: RequestHandler = async (req, res, next) => {
    const guildId = (req.query.guildId as string) || env.DISCORD_GUILD_ID;

    if (!env.BOT_GUILD_IDS.includes(guildId)) {
        res.status(403).json({ error: 'Guild not authorized' });
        return;
    }

    (req as any).guildId = guildId;
    next();
};
