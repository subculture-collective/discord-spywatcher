import { db } from '../db';

import { AuditAction, createAuditLog } from './auditLog';
import { sanitizeForLog } from './security';

/**
 * Process pending account deletions
 * This should be called periodically (e.g., daily cron job)
 */
export async function processPendingDeletions(): Promise<{
    processed: number;
    errors: number;
}> {
    let processed = 0;
    let errors = 0;

    try {
        // Find all pending deletion requests that are due
        const pendingDeletions = await db.deletionRequest.findMany({
            where: {
                status: 'PENDING',
                scheduledFor: {
                    lte: new Date(),
                },
            },
            include: {
                user: true,
            },
        });

        console.log(
            `Found ${pendingDeletions.length} accounts scheduled for deletion`
        );

        for (const deletionRequest of pendingDeletions) {
            try {
                await deleteUserAccount(
                    deletionRequest.userId,
                    deletionRequest.user.discordId
                );

                // Mark deletion as completed
                await db.deletionRequest.update({
                    where: { id: deletionRequest.id },
                    data: { status: 'COMPLETED' },
                });

                processed++;
            } catch (err) {
                console.error(
                    `Failed to delete account ${deletionRequest.userId}:`,
                    err
                );
                errors++;
            }
        }

        console.log(`Processed ${processed} deletions with ${errors} errors`);
    } catch (err) {
        console.error('Failed to process pending deletions:', err);
        throw err;
    }

    return { processed, errors };
}

/**
 * Delete all user data (hard delete)
 */
export async function deleteUserAccount(
    userId: string,
    discordId: string
): Promise<void> {
    try {
        // Log the account deletion before deleting
        await createAuditLog({
            userId,
            action: AuditAction.ACCOUNT_DELETED,
            details: { deletedAt: new Date().toISOString() },
        });

        // Delete activity data related to the user's Discord ID
        await Promise.all([
            db.presenceEvent.deleteMany({ where: { userId: discordId } }),
            db.messageEvent.deleteMany({ where: { userId: discordId } }),
            db.typingEvent.deleteMany({ where: { userId: discordId } }),
            db.joinEvent.deleteMany({ where: { userId: discordId } }),
            db.roleChangeEvent.deleteMany({ where: { userId: discordId } }),
            db.deletedMessageEvent.deleteMany({ where: { userId: discordId } }),
            db.reactionTime.deleteMany({
                where: {
                    OR: [{ observerId: discordId }, { actorId: discordId }],
                },
            }),
        ]);

        // Delete user-related data (cascading deletes will handle related records)
        // The following are deleted automatically via onDelete: Cascade:
        // - Guild
        // - RefreshToken
        // - Session
        // - ApiKey
        // - LoginLog
        // - ConsentLog
        // - DeletionRequest
        await db.user.delete({
            where: { id: userId },
        });

        console.log(`Successfully deleted account: ${sanitizeForLog(userId)}`);
    } catch (err) {
        console.error(
            `Failed to delete account ${sanitizeForLog(userId)}:`,
            err
        );
        throw err;
    }
}

/**
 * Get all pending deletion requests (admin)
 */
export async function getPendingDeletions(): Promise<
    Array<{
        id: string;
        userId: string;
        user: {
            discordId: string;
            username: string;
            email: string | null;
        };
        reason: string | null;
        requestedAt: Date;
        scheduledFor: Date;
        status: string;
    }>
> {
    return db.deletionRequest.findMany({
        where: {
            status: 'PENDING',
        },
        include: {
            user: {
                select: {
                    discordId: true,
                    username: true,
                    email: true,
                },
            },
        },
        orderBy: {
            scheduledFor: 'asc',
        },
    });
}
