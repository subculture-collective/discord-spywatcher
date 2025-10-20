import * as crypto from 'crypto';

import { db } from '../db';

/**
 * Generate a cryptographically secure API key
 */
export function generateApiKey(): string {
    // Format: spy_live_<random_hex>
    const randomPart = crypto.randomBytes(32).toString('hex');
    return `spy_live_${randomPart}`;
}

/**
 * Hash an API key for storage
 */
export function hashApiKey(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Create a new API key for a user
 */
export async function createApiKey(
    userId: string,
    name: string,
    scopes: string[] = [],
    expiresInDays?: number
): Promise<{ id: string; key: string }> {
    const apiKey = generateApiKey();
    const hashedKey = hashApiKey(apiKey);

    const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : undefined;

    const record = await db.apiKey.create({
        data: {
            key: hashedKey,
            name,
            userId,
            scopes: JSON.stringify(scopes),
            expiresAt,
        },
    });

    // Return the plain key only once (it won't be stored)
    return {
        id: record.id,
        key: apiKey,
    };
}

/**
 * Verify an API key and return the user ID
 */
export async function verifyApiKey(apiKey: string): Promise<{
    userId: string;
    scopes: string[];
} | null> {
    const hashedKey = hashApiKey(apiKey);

    const record = await db.apiKey.findUnique({
        where: { key: hashedKey },
        include: { user: true },
    });

    if (!record) {
        return null;
    }

    // Check if revoked
    if (record.revoked) {
        return null;
    }

    // Check if expired
    if (record.expiresAt && record.expiresAt < new Date()) {
        return null;
    }

    // Update last used timestamp
    await db.apiKey.update({
        where: { id: record.id },
        data: { lastUsedAt: new Date() },
    });

    const scopes = JSON.parse(record.scopes) as string[];

    return {
        userId: record.userId,
        scopes,
    };
}

/**
 * List API keys for a user
 */
export async function getUserApiKeys(userId: string) {
    return db.apiKey.findMany({
        where: {
            userId,
            revoked: false,
        },
        select: {
            id: true,
            name: true,
            scopes: true,
            lastUsedAt: true,
            expiresAt: true,
            createdAt: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(keyId: string): Promise<void> {
    await db.apiKey.update({
        where: { id: keyId },
        data: { revoked: true },
    });
}

/**
 * Revoke all API keys for a user
 */
export async function revokeAllUserApiKeys(userId: string): Promise<number> {
    const result = await db.apiKey.updateMany({
        where: { userId },
        data: { revoked: true },
    });
    return result.count;
}
