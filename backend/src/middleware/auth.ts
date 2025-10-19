import { NextFunction, Request, Response } from 'express';

import { AuthPayload, verifyAccessToken } from '../utils/auth';

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            user?: AuthPayload;
        }
    }
}

export function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction
): void {
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
