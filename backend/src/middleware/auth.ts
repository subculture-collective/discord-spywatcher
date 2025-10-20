import { NextFunction, Request, Response } from 'express';

import { AuthPayload, verifyAccessToken } from '../utils/auth';
import { checkGuildAccess, checkUserPermission } from '../utils/permissions';
import { Role } from '@prisma/client';

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
        
        // Check if user is banned
        if (payload.role === 'BANNED') {
            console.warn('❌ Banned user attempted access:', payload.discordId);
            res.status(403).json({ error: 'Account is banned' });
            return;
        }
        
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

/**
 * Middleware to require specific roles
 * Usage: requireRole(['ADMIN', 'MODERATOR'])
 */
export function requireRole(allowedRoles: Role[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                error: 'Forbidden — insufficient role',
            });
            return;
        }

        next();
    };
}

/**
 * Middleware to require specific permission
 * Usage: requirePermission('analytics.view')
 */
export function requirePermission(permissionName: string) {
    return async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        try {
            const hasPermission = await checkUserPermission(
                req.user.userId!,
                permissionName
            );

            if (!hasPermission) {
                res.status(403).json({
                    error: 'Forbidden — missing permission',
                    required: permissionName,
                });
                return;
            }

            next();
        } catch (err) {
            console.error('Permission check error:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
}

/**
 * Middleware to require guild access
 * Expects guildId in req.params or req.query
 */
export function requireGuildAccess(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const guildId = (req.params.guildId || req.query.guildId) as string;

    if (!guildId) {
        res.status(400).json({ error: 'Missing guildId parameter' });
        return;
    }

    checkGuildAccess(req.user.userId!, guildId)
        .then((hasAccess) => {
            if (!hasAccess) {
                res.status(403).json({
                    error: 'Forbidden — no access to this guild',
                });
                return;
            }
            next();
        })
        .catch((err) => {
            console.error('Guild access check error:', err);
            res.status(500).json({ error: 'Internal server error' });
        });
}
