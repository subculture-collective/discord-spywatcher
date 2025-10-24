import { db } from '../db';

export enum DataType {
    PRESENCE_EVENTS = 'PRESENCE_EVENTS',
    MESSAGE_EVENTS = 'MESSAGE_EVENTS',
    TYPING_EVENTS = 'TYPING_EVENTS',
    DELETED_MESSAGE_EVENTS = 'DELETED_MESSAGE_EVENTS',
    JOIN_EVENTS = 'JOIN_EVENTS',
    REACTION_TIMES = 'REACTION_TIMES',
    ROLE_CHANGE_EVENTS = 'ROLE_CHANGE_EVENTS',
    SESSIONS = 'SESSIONS',
    AUDIT_LOGS = 'AUDIT_LOGS',
}

// Default retention periods in days
export const DEFAULT_RETENTION_PERIODS: Record<string, number> = {
    [DataType.PRESENCE_EVENTS]: 90,
    [DataType.MESSAGE_EVENTS]: 90,
    [DataType.TYPING_EVENTS]: 90,
    [DataType.DELETED_MESSAGE_EVENTS]: 30,
    [DataType.JOIN_EVENTS]: 90,
    [DataType.REACTION_TIMES]: 90,
    [DataType.ROLE_CHANGE_EVENTS]: 90,
    [DataType.SESSIONS]: 30,
    [DataType.AUDIT_LOGS]: 365,
};

/**
 * Initialize default data retention policies if they don't exist
 */
export async function initializeRetentionPolicies(): Promise<void> {
    const entries = Object.keys(DEFAULT_RETENTION_PERIODS) as Array<
        keyof typeof DEFAULT_RETENTION_PERIODS
    >;
    
    for (const dataType of entries) {
        const retentionDays = DEFAULT_RETENTION_PERIODS[dataType];
        await db.dataRetentionPolicy.upsert({
            where: { dataType },
            update: {},
            create: {
                dataType,
                retentionDays,
                description: `Default retention policy for ${dataType}`,
                enabled: true,
            },
        });
    }
}

/**
 * Get retention policy for a specific data type
 */
export async function getRetentionPolicy(
    dataType: DataType | string
): Promise<{
    id: string;
    dataType: string;
    retentionDays: number;
    enabled: boolean;
} | null> {
    return db.dataRetentionPolicy.findUnique({
        where: { dataType },
    });
}

/**
 * Update retention policy
 */
export async function updateRetentionPolicy(
    dataType: DataType | string,
    retentionDays: number,
    enabled = true
): Promise<void> {
    await db.dataRetentionPolicy.upsert({
        where: { dataType },
        update: {
            retentionDays,
            enabled,
        },
        create: {
            dataType,
            retentionDays,
            enabled,
        },
    });
}

/**
 * Clean up old data based on retention policies
 */
export async function cleanupOldData(): Promise<{
    [key: string]: number;
}> {
    const results: { [key: string]: number } = {};

    try {
        // Get all enabled retention policies
        const policies = await db.dataRetentionPolicy.findMany({
            where: { enabled: true },
        });

        for (const policy of policies) {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

            let deletedCount = 0;

            switch (policy.dataType) {
                case DataType.PRESENCE_EVENTS:
                    deletedCount = (
                        await db.presenceEvent.deleteMany({
                            where: { createdAt: { lt: cutoffDate } },
                        })
                    ).count;
                    break;

                case DataType.MESSAGE_EVENTS:
                    deletedCount = (
                        await db.messageEvent.deleteMany({
                            where: { createdAt: { lt: cutoffDate } },
                        })
                    ).count;
                    break;

                case DataType.TYPING_EVENTS:
                    deletedCount = (
                        await db.typingEvent.deleteMany({
                            where: { createdAt: { lt: cutoffDate } },
                        })
                    ).count;
                    break;

                case DataType.DELETED_MESSAGE_EVENTS:
                    deletedCount = (
                        await db.deletedMessageEvent.deleteMany({
                            where: { createdAt: { lt: cutoffDate } },
                        })
                    ).count;
                    break;

                case DataType.JOIN_EVENTS:
                    deletedCount = (
                        await db.joinEvent.deleteMany({
                            where: { createdAt: { lt: cutoffDate } },
                        })
                    ).count;
                    break;

                case DataType.REACTION_TIMES:
                    deletedCount = (
                        await db.reactionTime.deleteMany({
                            where: { createdAt: { lt: cutoffDate } },
                        })
                    ).count;
                    break;

                case DataType.ROLE_CHANGE_EVENTS:
                    deletedCount = (
                        await db.roleChangeEvent.deleteMany({
                            where: { createdAt: { lt: cutoffDate } },
                        })
                    ).count;
                    break;

                case DataType.SESSIONS:
                    deletedCount = (
                        await db.session.deleteMany({
                            where: { expiresAt: { lt: cutoffDate } },
                        })
                    ).count;
                    break;

                case DataType.AUDIT_LOGS:
                    deletedCount = (
                        await db.auditLog.deleteMany({
                            where: { createdAt: { lt: cutoffDate } },
                        })
                    ).count;
                    break;

                default:
                    console.warn(
                        `Unknown data type for cleanup: ${policy.dataType}`
                    );
                    continue;
            }

            // Update last cleanup time
            await db.dataRetentionPolicy.update({
                where: { dataType: policy.dataType },
                data: { lastCleanupAt: new Date() },
            });

            results[policy.dataType] = deletedCount;
            console.log(
                `Cleaned up ${deletedCount} records of ${policy.dataType} older than ${policy.retentionDays} days`
            );
        }
    } catch (error) {
        console.error('Error during data cleanup:', error);
        throw error;
    }

    return results;
}

/**
 * Get all retention policies
 */
export async function getAllRetentionPolicies(): Promise<
    Array<{
        id: string;
        dataType: string;
        retentionDays: number;
        description: string | null;
        enabled: boolean;
        lastCleanupAt: Date | null;
    }>
> {
    return db.dataRetentionPolicy.findMany({
        orderBy: { dataType: 'asc' },
    });
}
