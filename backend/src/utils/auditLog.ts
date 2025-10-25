import { db } from '../db';

export enum AuditAction {
    ACCOUNT_CREATED = 'ACCOUNT_CREATED',
    ACCOUNT_DELETED = 'ACCOUNT_DELETED',
    ACCOUNT_DELETION_REQUESTED = 'ACCOUNT_DELETION_REQUESTED',
    ACCOUNT_DELETION_CANCELLED = 'ACCOUNT_DELETION_CANCELLED',
    DATA_EXPORTED = 'DATA_EXPORTED',
    DATA_UPDATED = 'DATA_UPDATED',
    CONSENT_GRANTED = 'CONSENT_GRANTED',
    CONSENT_REVOKED = 'CONSENT_REVOKED',
    PRIVACY_SETTINGS_CHANGED = 'PRIVACY_SETTINGS_CHANGED',
}

export interface AuditLogData {
    userId?: string;
    action: AuditAction | string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
    try {
        await db.auditLog.create({
            data: {
                userId: data.userId,
                action: data.action,
                details: data.details as never,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
            },
        });
    } catch (error) {
        console.error('Failed to create audit log:', error);
        // Don't throw - audit logging failures shouldn't break the main flow
    }
}

/**
 * Get audit logs for a specific user
 */
export async function getUserAuditLogs(
    userId: string,
    limit = 100
): Promise<
    Array<{
        id: string;
        action: string;
        details: unknown;
        ipAddress: string | null;
        userAgent: string | null;
        createdAt: Date;
    }>
> {
    return db.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
}

/**
 * Get all audit logs (admin only)
 */
export async function getAllAuditLogs(
    limit = 100,
    offset = 0
): Promise<
    Array<{
        id: string;
        userId: string | null;
        action: string;
        details: unknown;
        ipAddress: string | null;
        userAgent: string | null;
        createdAt: Date;
    }>
> {
    return db.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
    });
}
