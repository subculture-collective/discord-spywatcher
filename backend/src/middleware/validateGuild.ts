import { RequestHandler } from 'express';

import { env } from '../utils/env';

// Add a minimal type for the env shape used here and assert once.
type EnvVars = {
    DISCORD_GUILD_ID?: string;
    BOT_GUILD_IDS: string[];
};

export const validateGuild: RequestHandler = (req, res, next) => {
    const { DISCORD_GUILD_ID, BOT_GUILD_IDS } = env as unknown as EnvVars;

    const queryGuildId =
        typeof req.query.guildId === 'string' ? req.query.guildId : undefined;
    const guildId = queryGuildId ?? DISCORD_GUILD_ID;

    if (!guildId) {
        res.status(400).json({ error: 'Guild ID is required' });
        return;
    }

    if (!BOT_GUILD_IDS.includes(guildId)) {
        res.status(403).json({ error: 'Guild not authorized' });
        return;
    }

    req.guildId = guildId;
    next();
};
