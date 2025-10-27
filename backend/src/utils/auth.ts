import jwt, { JwtPayload } from 'jsonwebtoken';

import { env } from './env';
import { sanitizeForLog } from './security';

const JWT_SECRET = env.JWT_SECRET;
const JWT_REFRESH_SECRET = env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
    throw new Error('Missing JWT_SECRET or JWT_REFRESH_SECRET in .env');
}

export interface AuthPayload extends JwtPayload {
    userId: string;
    discordId: string;
    username?: string;
    access?: boolean;
    role: 'USER' | 'ADMIN' | 'MODERATOR' | 'BANNED';
}

// Access token (15 min)
export function generateAccessToken(payload: Partial<AuthPayload>): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

export function verifyAccessToken(token: string): AuthPayload {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded !== 'object' || decoded === null) {
        throw new Error('Invalid token structure');
    }

    const payload = decoded as Partial<AuthPayload>;
    console.log('🧪 Decoded payload:', sanitizeForLog(payload)); // <--- Add this

    if (!payload.discordId || !payload.access || !payload.role) {
        console.error('❌ Invalid payload fields:', {
            discordId: sanitizeForLog(payload.discordId),
            access: sanitizeForLog(payload.access),
            role: sanitizeForLog(payload.role),
        });
        throw new Error('Invalid access token payload');
    }

    return payload as AuthPayload;
}

// Refresh token (7 days)
export function generateRefreshToken(payload: Partial<AuthPayload>): string {
    return jwt.sign(
        {
            discordId: payload.discordId,
            username: payload.username,
            role: payload.role,
        },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );
}

export function verifyRefreshToken(token: string): AuthPayload {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    if (typeof decoded !== 'object' || decoded === null) {
        throw new Error('Invalid refresh token');
    }

    const payload = decoded as Partial<AuthPayload>;
    if (!payload.discordId) {
        throw new Error('Missing discordId in refresh token');
    }

    return payload as AuthPayload;
}
