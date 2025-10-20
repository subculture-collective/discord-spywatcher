import * as crypto from 'crypto';
import jwt from 'jsonwebtoken';

import { db } from '../db';
import { AuthPayload } from './auth';
import { env } from './env';

/**
 * Generate a cryptographically secure refresh token
 */
export function generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a new refresh token with rotation family
 */
export async function createRefreshToken(
    userId: string,
    familyId?: string,
    userAgent?: string,
    ipAddress?: string
): Promise<string> {
    const token = generateSecureToken();
    const newFamilyId = familyId || crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.refreshToken.create({
        data: {
            token,
            userId,
            familyId: newFamilyId,
            expiresAt,
            userAgent,
            ipAddress,
        },
    });

    return token;
}

/**
 * Verify and rotate refresh token
 */
export async function verifyAndRotateRefreshToken(
    token: string,
    userAgent?: string,
    ipAddress?: string
): Promise<{ user: AuthPayload; newRefreshToken: string }> {
    // Find the refresh token in database
    const storedToken = await db.refreshToken.findUnique({
        where: { token },
        include: { user: true },
    });

    if (!storedToken) {
        throw new Error('Invalid refresh token');
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
        await db.refreshToken.delete({ where: { id: storedToken.id } });
        throw new Error('Refresh token expired');
    }

    // Check if token is revoked
    if (storedToken.revoked) {
        throw new Error('Refresh token revoked');
    }

    // Detect token reuse (security breach)
    if (storedToken.used) {
        console.warn(
            `⚠️ Token reuse detected for family ${storedToken.familyId}`
        );
        // Revoke entire token family
        await revokeTokenFamily(storedToken.familyId);
        throw new Error('Token reuse detected - all tokens revoked');
    }

    // Mark old token as used
    await db.refreshToken.update({
        where: { id: storedToken.id },
        data: { used: true },
    });

    // Generate new refresh token in same family
    const newRefreshToken = await createRefreshToken(
        storedToken.userId,
        storedToken.familyId,
        userAgent,
        ipAddress
    );

    // Return user payload and new token
    const user: AuthPayload = {
        userId: storedToken.user.id,
        discordId: storedToken.user.discordId,
        username: `${storedToken.user.username}#${storedToken.user.discriminator}`,
        role: storedToken.user.role,
        access: true,
    };

    return { user, newRefreshToken };
}

/**
 * Revoke all tokens in a family (when reuse is detected)
 */
export async function revokeTokenFamily(familyId: string): Promise<void> {
    await db.refreshToken.updateMany({
        where: { familyId },
        data: { revoked: true },
    });
}

/**
 * Revoke a specific refresh token
 */
export async function revokeRefreshToken(token: string): Promise<void> {
    await db.refreshToken.updateMany({
        where: { token },
        data: { revoked: true },
    });
}

/**
 * Revoke all refresh tokens for a user
 */
export async function revokeAllUserRefreshTokens(
    userId: string
): Promise<number> {
    const result = await db.refreshToken.updateMany({
        where: { userId },
        data: { revoked: true },
    });
    return result.count;
}

/**
 * Clean up expired and used refresh tokens
 */
export async function cleanupRefreshTokens(): Promise<number> {
    const result = await db.refreshToken.deleteMany({
        where: {
            OR: [
                { expiresAt: { lt: new Date() } },
                {
                    AND: [
                        { used: true },
                        {
                            createdAt: {
                                lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                            },
                        }, // Used tokens older than 24h
                    ],
                },
            ],
        },
    });
    return result.count;
}

/**
 * Encode refresh token as JWT (for backwards compatibility)
 */
export function encodeRefreshToken(payload: Partial<AuthPayload>): string {
    return jwt.sign(
        {
            discordId: payload.discordId,
            username: payload.username,
            role: payload.role,
        },
        env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );
}
