/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any */
import axios from 'axios';
import express from 'express';

import { db } from '../db';
import { requireAdmin, requireAuth } from '../middleware/auth';
import {
    authLimiter,
    refreshLimiter,
    adminLimiter,
} from '../middleware/rateLimiter';
import { validateRequest, authSchemas } from '../middleware/validation';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
} from '../utils/auth';
import {
    clearRefreshTokenCookie,
    setRefreshTokenCookie,
} from '../utils/cookies';
import { env } from '../utils/env';

const router = express.Router();

// Use environment variable for allowed Discord IDs instead of hardcoding
const ALLOWED_DISCORD_IDS = env.ADMIN_DISCORD_IDS || [];

router.get(
    '/discord',
    authLimiter,
    validateRequest(authSchemas.discordCallback),
    async (req, res): Promise<void> => {
        // Safe: 'code' is guaranteed to exist and be a string due to validation middleware
        const code = req.query.code as string;
    console.log('client_id:', env.DISCORD_CLIENT_ID);
    console.log('client_secret:', env.DISCORD_CLIENT_SECRET);
    console.log('redirect_uri:', env.DISCORD_REDIRECT_URI);
    console.log('auth code from Discord:', code);

    try {
        const tokenRes = await axios.post(
            'https://discord.com/api/oauth2/token',
            new URLSearchParams({
                client_id: env.DISCORD_CLIENT_ID,
                client_secret: env.DISCORD_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code,
                redirect_uri: env.DISCORD_REDIRECT_URI,
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const { access_token, refresh_token } = tokenRes.data;

        const userRes = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        const {
            id: discordId,
            username,
            discriminator,
            avatar,
            email,
            locale,
            verified,
        } = userRes.data;

        if (!ALLOWED_DISCORD_IDS.includes(discordId)) {
            res.status(403).json({ error: 'Unauthorized Discord user' });
            return;
        }

        const ipAddress = req.ip;
        const userAgent = req.headers['user-agent'] || null;

        const dbUser = await db.user.upsert({
            where: { discordId },
            update: {
                username,
                discriminator,
                avatar,
                email,
                locale,
                verified: verified ?? false,
                ipAddress,
                userAgent,
                accessToken: access_token,
                refreshToken: refresh_token,
                refreshTokenIssuedAt: new Date(),
                accessTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
                lastSeenAt: new Date(),
            },
            create: {
                discordId,
                username,
                discriminator,
                avatar,
                email,
                locale,
                verified: verified ?? false,
                ipAddress,
                userAgent,
                accessToken: access_token,
                refreshToken: refresh_token,
                refreshTokenIssuedAt: new Date(),
                accessTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
                lastSeenAt: new Date(),
            },
        });

        if (dbUser.role === 'BANNED') {
            res.status(403).json({ error: 'This account is banned.' });
            return;
        }

        const guildsRes = await axios.get(
            'https://discord.com/api/users/@me/guilds',
            {
                headers: { Authorization: `Bearer ${access_token}` },
            }
        );

        const allGuilds = guildsRes.data;

        // Filter to only include guilds the bot is in (if BOT_GUILD_IDS is set)
        const botGuildIds = env.BOT_GUILD_IDS;

        const guilds =
            botGuildIds.length > 0
                ? allGuilds.filter((g: any) => botGuildIds.includes(g.id))
                : allGuilds;

        await db.guild.deleteMany({ where: { userId: dbUser.id } });
        for (const g of guilds) {
            await db.guild.create({
                data: {
                    guildId: g.id,
                    name: g.name,
                    icon: g.icon,
                    owner: g.owner,
                    permissions: g.permissions,
                    userId: dbUser.id,
                },
            });
        }

        const accessToken = generateAccessToken({
            userId: dbUser.id,
            discordId,
            username: `${username}#${discriminator}`,
            access: true,
            role: dbUser.role,
        });
        const refreshToken = generateRefreshToken({ discordId });

        setRefreshTokenCookie(res, refreshToken);

        res.json({ accessToken });
    } catch (err) {
        if (axios.isAxiosError(err)) {
            console.error('OAuth error:', err.response?.data || err.message);
            res.status(401).json({
                error: err.response?.data || 'OAuth failed',
            });
            return;
        }
        console.error('Unexpected error:', err);
        res.status(500).json({ error: 'Unexpected error' });
    }
});

router.post(
    '/refresh',
    refreshLimiter,
    validateRequest(authSchemas.refreshToken),
    async (req, res): Promise<void> => {
    const token = req.cookies?.refreshToken || req.body?.token;
    if (!token) {
        res.status(400).json({ error: 'Missing refresh token' });
        return;
    }

    try {
        const payload = verifyRefreshToken(token);
        console.log('🔄 refresh payload:', payload);
        const user = await db.user.upsert({
            where: { discordId: payload.discordId },
            update: {
                refreshTokenIssuedAt: new Date(),
            },
            create: {
                discordId: payload.discordId,
                username: payload.username || 'unknown',
                discriminator: payload.username?.split('#')[1] || '0000',
                role: payload.role || 'USER',
                verified: false,
                accessToken: '',
                refreshToken: '',
                accessTokenExpiresAt: new Date(0),
                lastSeenAt: new Date(),
                refreshTokenIssuedAt: new Date(),
            },
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Optional: Refresh token TTL = 7 days
        const maxAge = 7 * 24 * 60 * 60 * 1000;
        const isExpired =
            Date.now() - new Date(user.refreshTokenIssuedAt).getTime() > maxAge;

        if (isExpired) {
            res.status(401).json({ error: 'Refresh token expired' });
            return;
        }

        const newAccessToken = generateAccessToken({
            userId: user.id,
            discordId: user.discordId,
            username: `${user.username}#${user.discriminator}`,
            access: true,
            role: user.role,
        });

        await db.user.update({
            where: { discordId: user.discordId },
            data: { refreshTokenIssuedAt: new Date() },
        });

        console.log('✅ Refresh route hit. Sending new access token.');
        res.json({ accessToken: newAccessToken });
    } catch (_err) {
        res.status(401).json({ error: 'Invalid refresh token' });
    }
});

router.post('/logout', authLimiter, (req, res): void => {
    clearRefreshTokenCookie(res);
    res.status(200).json({ message: 'Logged out' });
});

router.get('/me', requireAuth, async (req, res): Promise<void> => {
    if (!req.user) {
        res.status(401).json({ error: 'No user in request' });
        return;
    }
    console.log('🔎 Auth payload:', req.user);
    try {
        const user = await db.user.findUnique({
            where: { discordId: req.user.discordId },
            include: { guilds: true },
        });

        if (!user) {
            console.warn('⚠️ DB user not found for:', req.user.discordId);
            res.status(404).json({ error: 'User not found in DB' });
            return;
        }

        res.json({
            discordId: user.discordId,
            username: `${user.username}#${user.discriminator}`,
            avatar: user.avatar,
            email: user.email,
            locale: user.locale,
            verified: user.verified,
            role: user.role,
            guilds: user.guilds,
        });
        return;
    } catch (err) {
        console.error('🔥 Error in /auth/me:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/settings', requireAuth, async (req, res): Promise<void> => {
    try {
        const user = await db.user.findUnique({
            where: { discordId: req.user!.discordId },
            select: {
                email: true,
                locale: true,
                verified: true,
                ipAddress: true,
                userAgent: true,
                lastSeenAt: true,
                createdAt: true,
            },
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json(user);
    } catch (err) {
        console.error('Settings fetch error:', err);
        res.status(500).json({ error: 'Failed to load settings' });
    }

    res.status(200).json({ message: 'Logged out' });
});

router.get('/admin/users', requireAuth, requireAdmin, adminLimiter, async (req, res) => {
    try {
        const users = await db.user.findMany({
            select: {
                id: true,
                discordId: true,
                username: true,
                discriminator: true,
                email: true,
                role: true,
                createdAt: true,
                lastSeenAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.json(users);
    } catch (err) {
        console.error('Failed to fetch users:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

router.post(
    '/admin/users/:discordId/role',
    requireAuth,
    requireAdmin,
    adminLimiter,
    validateRequest(authSchemas.updateRole),
    async (req, res): Promise<void> => {
        const { discordId } = req.params;
        const { role } = req.body;

        try {
            const updated = await db.user.update({
                where: { discordId },
                data: { role },
            });

            res.json({ message: 'Role updated', user: updated });
        } catch (err) {
            console.error('Role update failed:', err);
            res.status(500).json({ error: 'Failed to update role' });
        }
    }
);

router.get(
    '/debug/user/:discordId',
    validateRequest(authSchemas.debugUser),
    async (req, res): Promise<void> => {
    try {
        const user = await db.user.findUnique({
            where: { discordId: req.params.discordId },
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json(user);
    } catch (err) {
        console.error('Debug user fetch failed:', err);
        res.status(500).json({ error: 'Internal error' });
    }
});

export default router;
