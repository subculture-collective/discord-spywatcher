import { db } from '../db';

export enum ConsentType {
    PRIVACY_POLICY = 'PRIVACY_POLICY',
    COOKIES = 'COOKIES',
    DATA_COLLECTION = 'DATA_COLLECTION',
    ANALYTICS = 'ANALYTICS',
    THIRD_PARTY_SHARING = 'THIRD_PARTY_SHARING',
}

export interface ConsentData {
    userId: string;
    consentType: ConsentType | string;
    granted: boolean;
    version: string;
}

/**
 * Log user consent
 */
export async function logConsent(data: ConsentData): Promise<void> {
    try {
        await db.consentLog.create({
            data: {
                userId: data.userId,
                consentType: data.consentType,
                granted: data.granted,
                version: data.version,
            },
        });
    } catch (error) {
        console.error('Failed to log consent:', error);
        throw error;
    }
}

/**
 * Get user's consent logs
 */
export async function getUserConsentLogs(userId: string): Promise<
    Array<{
        id: string;
        consentType: string;
        granted: boolean;
        version: string;
        createdAt: Date;
    }>
> {
    return db.consentLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
}

/**
 * Get latest consent for a specific type
 */
export async function getLatestConsent(
    userId: string,
    consentType: ConsentType | string
): Promise<{
    id: string;
    consentType: string;
    granted: boolean;
    version: string;
    createdAt: Date;
} | null> {
    return db.consentLog.findFirst({
        where: {
            userId,
            consentType,
        },
        orderBy: { createdAt: 'desc' },
    });
}

/**
 * Check if user has granted a specific consent
 */
export async function hasConsent(
    userId: string,
    consentType: ConsentType | string
): Promise<boolean> {
    const latestConsent = await getLatestConsent(userId, consentType);
    return latestConsent?.granted ?? false;
}
