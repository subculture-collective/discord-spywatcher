import { NextFunction, Request, Response } from 'express';
import { db } from '../db';

export async function blockKnownBadIPs(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const ip = req.ip;
    const blocked = await db.blockedIP.findUnique({ where: { ip } });

    if (blocked) {
        res.status(403).json({ error: 'Access denied from this IP' });
    }

    next();
}

export async function banIP(ip: string, reason?: string) {
    try {
        await db.blockedIP.upsert({
            where: { ip },
            update: { reason },
            create: { ip, reason },
        });
    } catch (err) {
        console.error(`Failed to ban IP ${ip}:`, err);
    }
}

export async function unbanIP(ip: string) {
    try {
        await db.blockedIP.delete({ where: { ip } });
    } catch (err) {
        console.warn(`Attempted to unban IP ${ip}, but it wasn't found.`);
    }
}
