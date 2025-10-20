import { NextFunction, Request, Response } from 'express';

import { db } from '../db';
import { verifyApiKey } from '../utils/apiKeys';
import { AuthPayload } from '../utils/auth';

/**
 * Middleware to authenticate using API key
 * Checks for API key in Authorization header: "Bearer spy_live_..."
 */
export async function requireApiKey(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing authorization header' });
        return;
    }

    const apiKey = authHeader.split(' ')[1];

    // Check if it's an API key (starts with spy_live_)
    if (!apiKey.startsWith('spy_live_')) {
        res.status(401).json({ error: 'Invalid API key format' });
        return;
    }

    try {
        const verified = await verifyApiKey(apiKey);

        if (!verified) {
            res.status(403).json({ error: 'Invalid or revoked API key' });
            return;
        }

        // Fetch user details
        const user = await db.user.findUnique({
            where: { id: verified.userId },
        });

        if (!user) {
            res.status(403).json({ error: 'User not found' });
            return;
        }

        if (user.role === 'BANNED') {
            res.status(403).json({ error: 'Account is banned' });
            return;
        }

        // Attach user to request
        req.user = {
            userId: user.id,
            discordId: user.discordId,
            username: `${user.username}#${user.discriminator}`,
            role: user.role,
            access: true,
        } as AuthPayload;

        next();
    } catch (err) {
        console.error('API key verification error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Middleware that accepts either JWT or API key authentication
 */
export async function requireAuthOrApiKey(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing authorization header' });
        return;
    }

    const token = authHeader.split(' ')[1];

    // Check if it's an API key
    if (token.startsWith('spy_live_')) {
        return requireApiKey(req, res, next);
    }

    // Otherwise, use JWT authentication
    const { requireAuth } = await import('./auth');
    return requireAuth(req, res, next);
}
