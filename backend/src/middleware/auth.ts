import { NextFunction, Request, Response } from 'express';
import { AuthPayload, verifyAccessToken } from '../utils/auth';
import { env } from '../utils/env';

declare global {
    namespace Express {
        interface Request {
            user?: AuthPayload;
        }
    }
}

const ADMIN_DISCORD_IDS = env.ADMIN_DISCORD_IDS;

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        console.warn('❌ Missing or malformed Authorization header');
        res.status(401).json({ error: 'Missing authorization header' });
        return;
    }

    const token = authHeader.split(' ')[1];
    try {
        const payload = verifyAccessToken(token);
        console.log('✅ Authenticated payload:', payload);
        req.user = payload;
        next();
    } catch (err) {
        console.error('❌ Token verification failed:', err);
        res.status(403).json({ error: 'Forbidden — invalid token' });
    }
}

export function requireAdmin(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    if (!req.user || req.user.role !== 'ADMIN') {
        res.status(403).json({ error: 'Forbidden — admin access required' });
        return;
    }
    next();
}
