import { NextFunction, Request, Response } from 'express';
import { env } from '../utils/env';

export function validateGuild(req: Request, res: Response, next: NextFunction) {
    const guildId = (req.query.guildId as string) || env.DISCORD_GUILD_ID;
    if (env.BOT_GUILD_IDS.length && !env.BOT_GUILD_IDS.includes(guildId)) {
        return res.status(403).json({ error: 'Guild not authorized' });
    }
    (req as any).guildId = guildId;
    next();
}
