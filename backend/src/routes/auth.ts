/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any */
import * as crypto from 'crypto';

import axios from 'axios';
import express from 'express';

import { db } from '../db';
import {
    requireAdmin,
    requireAuth,
    requirePermission,
} from '../middleware/auth';
import {
    authLimiter,
    refreshLimiter,
    adminLimiter,
} from '../middleware/rateLimiter';
import { validateRequest, authSchemas } from '../middleware/validation';
import { createApiKey, getUserApiKeys, revokeApiKey } from '../utils/apiKeys';
import { generateAccessToken } from '../utils/auth';
import {
    clearRefreshTokenCookie,
    setRefreshTokenCookie,
} from '../utils/cookies';
import { env } from '../utils/env';
import { logLoginAttempt, detectSuspiciousLogin } from '../utils/loginLog';
import {
    createRefreshToken,
    verifyAndRotateRefreshToken,
    revokeRefreshToken,
    revokeAllUserRefreshTokens,
} from '../utils/refreshToken';
import { sanitizeForLog } from '../utils/security';
import {
    createSession,
    getUserSessions,
    revokeSession,
    revokeAllUserSessions,
} from '../utils/sessions';

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
        const state = req.query.state as string;

        // State parameter validation for CSRF protection
        // In production, you should validate this against a stored state
        if (!state) {
            console.warn('⚠️ Missing state parameter in OAuth callback');
        }

        console.log('client_id:', env.DISCORD_CLIENT_ID);
        console.log('client_secret:', env.DISCORD_CLIENT_SECRET);
        console.log('redirect_uri:', env.DISCORD_REDIRECT_URI);
        console.log('auth code from Discord:', code);

        const xForwardedFor = req.headers['x-forwarded-for'];
        const ipAddress =
            req.ip ||
            (typeof xForwardedFor === 'string'
                ? xForwardedFor.split(',')[0].trim()
                : 'unknown');
        const userAgent = req.headers['user-agent'] || undefined;

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
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );

            const { access_token, refresh_token, scope } = tokenRes.data;

            // Validate scopes
            const requiredScopes = ['identify', 'guilds'];
            const grantedScopes = scope ? scope.split(' ') : [];
            const hasRequiredScopes = requiredScopes.every((s) =>
                grantedScopes.includes(s)
            );

            if (!hasRequiredScopes) {
                console.warn('⚠️ Missing required OAuth scopes');
            }

            const userRes = await axios.get(
                'https://discord.com/api/users/@me',
                {
                    headers: { Authorization: `Bearer ${access_token}` },
                }
            );

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
                await logLoginAttempt(
                    discordId,
                    ipAddress,
                    userAgent,
                    false,
                    'Discord ID not in allowed list'
                );
                res.status(403).json({ error: 'Unauthorized Discord user' });
                return;
            }

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
                await logLoginAttempt(
                    dbUser.id,
                    ipAddress,
                    userAgent,
                    false,
                    'Account is banned'
                );
                res.status(403).json({ error: 'This account is banned.' });
                return;
            }

            // Check for suspicious login
            const suspicionCheck = await detectSuspiciousLogin(
                dbUser.id,
                ipAddress
            );
            if (suspicionCheck.suspicious) {
                console.warn(
                    `⚠️ Suspicious login detected: ${suspicionCheck.reason}`
                );
                // In production, you might want to require additional verification
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

            // Generate access token (15 minutes)
            const accessToken = generateAccessToken({
                userId: dbUser.id,
                discordId,
                username: `${username}#${discriminator}`,
                access: true,
                role: dbUser.role,
            });

            // Create refresh token with rotation family
            const familyId = crypto.randomUUID();
            const newRefreshToken = await createRefreshToken(
                dbUser.id,
                familyId,
                userAgent,
                ipAddress
            );

            // Create session
            await createSession(dbUser.id, userAgent, ipAddress);

            // Log successful login
            await logLoginAttempt(dbUser.id, ipAddress, userAgent, true);

            setRefreshTokenCookie(res, newRefreshToken);

            res.json({ accessToken });
        } catch (err) {
            if (axios.isAxiosError(err)) {
                console.error(
                    'OAuth error:',
                    err.response?.data || err.message
                );
                res.status(401).json({
                    error: err.response?.data || 'OAuth failed',
                });
                return;
            }
            console.error('Unexpected error:', err);
            res.status(500).json({ error: 'Unexpected error' });
        }
    }
);

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

        const userAgent = req.headers['user-agent'] || undefined;
        const xForwardedFor = req.headers['x-forwarded-for'];
        const ipAddress =
            req.ip ||
            (typeof xForwardedFor === 'string'
                ? xForwardedFor.split(',')[0].trim()
                : 'unknown');

        try {
            // Verify and rotate the refresh token
            const { user, newRefreshToken } = await verifyAndRotateRefreshToken(
                token,
                userAgent,
                ipAddress
            );

            // Generate new access token
            const newAccessToken = generateAccessToken({
                userId: user.userId,
                discordId: user.discordId,
                username: user.username,
                access: true,
                role: user.role,
            });

            // Set new refresh token cookie
            setRefreshTokenCookie(res, newRefreshToken);

            console.log('✅ Refresh route hit. Tokens rotated successfully.');
            res.json({ accessToken: newAccessToken });
        } catch (err) {
            const error = err as Error;
            console.error('❌ Refresh token error:', error.message);

            // Clear invalid token from cookie
            clearRefreshTokenCookie(res);

            res.status(401).json({
                error: 'Invalid refresh token',
                detail: error.message,
            });
        }
    }
);

router.post('/logout', authLimiter, async (req, res): Promise<void> => {
    const token = req.cookies?.refreshToken || req.body?.token;

    if (token) {
        try {
            // Revoke the refresh token
            await revokeRefreshToken(token);
            console.log('✅ Refresh token revoked');
        } catch (err) {
            console.error('Failed to revoke refresh token:', err);
        }
    }

    clearRefreshTokenCookie(res);
    res.status(200).json({ message: 'Logged out' });
});

router.get('/me', requireAuth, async (req, res): Promise<void> => {
    if (!req.user) {
        res.status(401).json({ error: 'No user in request' });
        return;
    }
    console.log('🔎 Auth payload:', sanitizeForLog(req.user));
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

// ============================================================================
// Session Management Routes
// ============================================================================

router.get('/sessions', requireAuth, async (req, res): Promise<void> => {
    try {
        const sessions = await getUserSessions(req.user!.userId);

        res.json({
            sessions: sessions.map((s) => ({
                id: s.id,
                userAgent: s.userAgent,
                ipAddress: s.ipAddress,
                lastActivity: s.lastActivity,
                createdAt: s.createdAt,
                expiresAt: s.expiresAt,
            })),
        });
    } catch (err) {
        console.error('Failed to fetch sessions:', err);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

router.delete(
    '/sessions/:sessionId',
    requireAuth,
    async (req, res): Promise<void> => {
        const { sessionId } = req.params;

        try {
            // Verify the session belongs to the user
            const session = await db.session.findUnique({
                where: { id: sessionId },
            });

            if (!session) {
                res.status(404).json({ error: 'Session not found' });
                return;
            }

            if (session.userId !== req.user!.userId) {
                res.status(403).json({
                    error: "Cannot revoke another user's session",
                });
                return;
            }

            await revokeSession(sessionId);
            res.json({ message: 'Session revoked' });
        } catch (err) {
            console.error('Failed to revoke session:', err);
            res.status(500).json({ error: 'Failed to revoke session' });
        }
    }
);

router.post(
    '/sessions/revoke-all',
    requireAuth,
    async (req, res): Promise<void> => {
        try {
            const count = await revokeAllUserSessions(req.user!.userId);

            // Also revoke all refresh tokens
            await revokeAllUserRefreshTokens(req.user!.userId);

            // Clear cookie
            clearRefreshTokenCookie(res);

            res.json({
                message: 'All sessions revoked',
                count,
            });
        } catch (err) {
            console.error('Failed to revoke all sessions:', err);
            res.status(500).json({ error: 'Failed to revoke all sessions' });
        }
    }
);

router.get('/login-history', requireAuth, async (req, res): Promise<void> => {
    try {
        const { getUserLoginHistory } = await import('../utils/loginLog');
        const history = await getUserLoginHistory(req.user!.userId, 20);

        res.json({
            history: history.map((log) => ({
                ipAddress: log.ipAddress,
                userAgent: log.userAgent,
                success: log.success,
                reason: log.reason,
                createdAt: log.createdAt,
            })),
        });
    } catch (err) {
        console.error('Failed to fetch login history:', err);
        res.status(500).json({ error: 'Failed to fetch login history' });
    }
});

// ============================================================================
// Admin Routes
// ============================================================================

router.get(
    '/admin/users',
    requireAuth,
    requireAdmin,
    adminLimiter,
    async (req, res) => {
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
    }
);

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
    }
);

// ============================================================================
// Admin Session Management Routes
// ============================================================================

router.get(
    '/admin/sessions',
    requireAuth,
    requirePermission('sessions.view.all'),
    async (req, res): Promise<void> => {
        try {
            const sessions = await db.session.findMany({
                where: {
                    expiresAt: {
                        gt: new Date(),
                    },
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            discordId: true,
                            username: true,
                            discriminator: true,
                        },
                    },
                },
                orderBy: {
                    lastActivity: 'desc',
                },
            });

            res.json({
                sessions: sessions.map((s) => ({
                    id: s.id,
                    user: s.user,
                    userAgent: s.userAgent,
                    ipAddress: s.ipAddress,
                    lastActivity: s.lastActivity,
                    createdAt: s.createdAt,
                    expiresAt: s.expiresAt,
                })),
            });
        } catch (err) {
            console.error('Failed to fetch all sessions:', err);
            res.status(500).json({ error: 'Failed to fetch sessions' });
        }
    }
);

router.delete(
    '/admin/sessions/:sessionId',
    requireAuth,
    requirePermission('sessions.revoke.all'),
    async (req, res): Promise<void> => {
        const { sessionId } = req.params;

        try {
            await revokeSession(sessionId);
            res.json({ message: 'Session revoked' });
        } catch (err) {
            console.error('Failed to revoke session:', err);
            res.status(500).json({ error: 'Failed to revoke session' });
        }
    }
);

router.post(
    '/admin/users/:userId/revoke-sessions',
    requireAuth,
    requirePermission('sessions.revoke.all'),
    async (req, res): Promise<void> => {
        const { userId } = req.params;

        try {
            const sessionCount = await revokeAllUserSessions(userId);
            const tokenCount = await revokeAllUserRefreshTokens(userId);

            res.json({
                message: 'All user sessions and tokens revoked',
                sessionsRevoked: sessionCount,
                tokensRevoked: tokenCount,
            });
        } catch (err) {
            console.error('Failed to revoke user sessions:', err);
            res.status(500).json({ error: 'Failed to revoke user sessions' });
        }
    }
);

// ============================================================================
// API Key Routes
// ============================================================================

router.post(
    '/api-keys',
    requireAuth,
    requirePermission('apikeys.create'),
    async (req, res): Promise<void> => {
        const { name, scopes, expiresInDays } = req.body;

        if (!name || typeof name !== 'string') {
            res.status(400).json({ error: 'Invalid or missing name' });
            return;
        }

        try {
            const { id, key } = await createApiKey(
                req.user!.userId,
                name,
                scopes || [],
                expiresInDays
            );

            res.status(201).json({
                id,
                key,
                name,
                scopes: scopes || [],
                warning:
                    'Save this key now. You will not be able to see it again.',
            });
        } catch (err) {
            console.error('Failed to create API key:', err);
            res.status(500).json({ error: 'Failed to create API key' });
        }
    }
);

router.get(
    '/api-keys',
    requireAuth,
    requirePermission('apikeys.view.own'),
    async (req, res): Promise<void> => {
        try {
            const apiKeys = await getUserApiKeys(req.user!.userId);

            res.json({
                apiKeys: apiKeys.map((k) => ({
                    id: k.id,
                    name: k.name,
                    scopes: JSON.parse(k.scopes),
                    lastUsedAt: k.lastUsedAt,
                    expiresAt: k.expiresAt,
                    createdAt: k.createdAt,
                })),
            });
        } catch (err) {
            console.error('Failed to fetch API keys:', err);
            res.status(500).json({ error: 'Failed to fetch API keys' });
        }
    }
);

router.delete(
    '/api-keys/:keyId',
    requireAuth,
    requirePermission('apikeys.revoke.own'),
    async (req, res): Promise<void> => {
        const { keyId } = req.params;

        try {
            // Verify the key belongs to the user
            const apiKey = await db.apiKey.findUnique({
                where: { id: keyId },
            });

            if (!apiKey) {
                res.status(404).json({ error: 'API key not found' });
                return;
            }

            if (apiKey.userId !== req.user!.userId) {
                res.status(403).json({
                    error: "Cannot revoke another user's API key",
                });
                return;
            }

            await revokeApiKey(keyId);
            res.json({ message: 'API key revoked' });
        } catch (err) {
            console.error('Failed to revoke API key:', err);
            res.status(500).json({ error: 'Failed to revoke API key' });
        }
    }
);

// ============================================================================
// Admin Permission Routes
// ============================================================================

router.get(
    '/admin/permissions',
    requireAuth,
    requireAdmin,
    async (req, res): Promise<void> => {
        try {
            const permissions = await db.permission.findMany({
                orderBy: [{ category: 'asc' }, { name: 'asc' }],
            });

            res.json({ permissions });
        } catch (err) {
            console.error('Failed to fetch permissions:', err);
            res.status(500).json({ error: 'Failed to fetch permissions' });
        }
    }
);

router.get(
    '/admin/roles/:role/permissions',
    requireAuth,
    requireAdmin,
    async (req, res): Promise<void> => {
        const { role } = req.params;

        try {
            const { getRolePermissions } = await import('../utils/permissions');
            const { Role } = await import('@prisma/client');
            // Validate that role is a valid Role enum value
            const validRoles = Object.values(Role).map(String);
            if (!validRoles.includes(role)) {
                res.status(400).json({ error: 'Invalid role' });
                return;
            }
            const permissions = await getRolePermissions(
                role as (typeof Role)[keyof typeof Role]
            );

            res.json({ role, permissions });
        } catch (err) {
            console.error('Failed to fetch role permissions:', err);
            res.status(500).json({ error: 'Failed to fetch role permissions' });
        }
    }
);

export default router;
