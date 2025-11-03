/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Router } from 'express';

import { db } from '../db';
import { requireAuth } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { validateRequest, privacySchemas } from '../middleware/validation';
import { AuditAction, createAuditLog } from '../utils/auditLog';

const router = Router();

/**
 * Export user data (GDPR Article 15 - Right to Access)
 * GET /api/privacy/export
 */
router.get(
    '/export',
    requireAuth,
    authLimiter,
    async (req, res): Promise<void> => {
        const userId = req.user!.userId;
        const discordId = req.user!.discordId;

        const xForwardedFor = req.headers['x-forwarded-for'];
        const ipAddress =
            req.ip ||
            (typeof xForwardedFor === 'string'
                ? xForwardedFor.split(',')[0].trim()
                : 'unknown');
        const userAgent = req.headers['user-agent'] || undefined;

        try {
            // Fetch all user data
            const [
                profile,
                guilds,
                sessions,
                refreshTokens,
                apiKeys,
                loginLogs,
                consentLogs,
                deletionRequest,
                presenceEvents,
                messageEvents,
                typingEvents,
                joinEvents,
                reactionTimes,
                roleChangeEvents,
                deletedMessageEvents,
            ] = await Promise.all([
                db.user.findUnique({
                    where: { id: userId },
                    select: {
                        id: true,
                        discordId: true,
                        username: true,
                        discriminator: true,
                        avatar: true,
                        email: true,
                        locale: true,
                        verified: true,
                        role: true,
                        lastSeenAt: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                }),
                db.guild.findMany({ where: { userId } }),
                db.session.findMany({
                    where: { userId },
                    select: {
                        id: true,
                        userAgent: true,
                        ipAddress: true,
                        lastActivity: true,
                        expiresAt: true,
                        createdAt: true,
                    },
                }),
                db.refreshToken.findMany({
                    where: { userId },
                    select: {
                        id: true,
                        used: true,
                        revoked: true,
                        expiresAt: true,
                        userAgent: true,
                        ipAddress: true,
                        createdAt: true,
                    },
                }),
                db.apiKey.findMany({
                    where: { userId },
                    select: {
                        id: true,
                        name: true,
                        scopes: true,
                        lastUsedAt: true,
                        expiresAt: true,
                        revoked: true,
                        createdAt: true,
                    },
                }),
                db.loginLog.findMany({
                    where: { userId },
                    select: {
                        ipAddress: true,
                        userAgent: true,
                        success: true,
                        reason: true,
                        createdAt: true,
                    },
                    orderBy: { createdAt: 'desc' },
                }),
                db.consentLog.findMany({
                    where: { userId },
                    select: {
                        consentType: true,
                        granted: true,
                        version: true,
                        createdAt: true,
                    },
                    orderBy: { createdAt: 'desc' },
                }),
                db.deletionRequest.findUnique({ where: { userId } }),
                db.presenceEvent.findMany({
                    where: { userId: discordId },
                    orderBy: { createdAt: 'desc' },
                }),
                db.messageEvent.findMany({
                    where: { userId: discordId },
                    orderBy: { createdAt: 'desc' },
                }),
                db.typingEvent.findMany({
                    where: { userId: discordId },
                    orderBy: { createdAt: 'desc' },
                }),
                db.joinEvent.findMany({
                    where: { userId: discordId },
                    orderBy: { createdAt: 'desc' },
                }),
                db.reactionTime.findMany({
                    where: {
                        OR: [{ observerId: discordId }, { actorId: discordId }],
                    },
                    orderBy: { createdAt: 'desc' },
                }),
                db.roleChangeEvent.findMany({
                    where: { userId: discordId },
                    orderBy: { createdAt: 'desc' },
                }),
                db.deletedMessageEvent.findMany({
                    where: { userId: discordId },
                    orderBy: { createdAt: 'desc' },
                }),
            ]);

            const userData = {
                exportDate: new Date().toISOString(),
                exportVersion: '1.0',
                userId,
                profile,
                guilds,
                sessions,
                refreshTokens,
                apiKeys,
                loginLogs,
                consentLogs,
                deletionRequest,
                activityData: {
                    presenceEvents,
                    messageEvents,
                    typingEvents,
                    joinEvents,
                    reactionTimes,
                    roleChangeEvents,
                    deletedMessageEvents,
                },
            };

            // Log the data export
            await createAuditLog({
                userId,
                action: AuditAction.DATA_EXPORTED,
                ipAddress,
                userAgent,
            });

            res.json(userData);
        } catch (err) {
            console.error('Failed to export user data:', err);
            res.status(500).json({ error: 'Failed to export data' });
        }
    }
);

/**
 * Request account deletion (GDPR Article 17 - Right to Erasure)
 * POST /api/privacy/delete-request
 */
router.post(
    '/delete-request',
    requireAuth,
    authLimiter,
    validateRequest(privacySchemas.deleteRequest),
    async (req, res): Promise<void> => {
        const userId = req.user!.userId;
        const { reason } = req.body;

        const xForwardedFor = req.headers['x-forwarded-for'];
        const ipAddress =
            req.ip ||
            (typeof xForwardedFor === 'string'
                ? xForwardedFor.split(',')[0].trim()
                : 'unknown');
        const userAgent = req.headers['user-agent'] || undefined;

        try {
            // Check if a deletion request already exists
            const existingRequest = await db.deletionRequest.findUnique({
                where: { userId },
            });

            if (existingRequest) {
                if (existingRequest.status === 'PENDING') {
                    res.status(400).json({
                        error: 'Deletion request already exists',
                        scheduledFor: existingRequest.scheduledFor,
                    });
                    return;
                }
            }

            // Create deletion request with 30-day grace period
            const scheduledFor = new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
            );

            await db.deletionRequest.upsert({
                where: { userId },
                update: {
                    reason,
                    requestedAt: new Date(),
                    scheduledFor,
                    status: 'PENDING',
                },
                create: {
                    userId,
                    reason,
                    scheduledFor,
                    status: 'PENDING',
                },
            });

            // Log the deletion request
            await createAuditLog({
                userId,
                action: AuditAction.ACCOUNT_DELETION_REQUESTED,
                details: { reason, scheduledFor: scheduledFor.toISOString() },
                ipAddress,
                userAgent,
            });

            res.json({
                message: 'Account deletion requested',
                scheduledFor,
                gracePeriodDays: 30,
            });
        } catch (err) {
            console.error('Failed to request account deletion:', err);
            res.status(500).json({
                error: 'Failed to request account deletion',
            });
        }
    }
);

/**
 * Cancel account deletion request
 * POST /api/privacy/cancel-deletion
 */
router.post(
    '/cancel-deletion',
    requireAuth,
    authLimiter,
    async (req, res): Promise<void> => {
        const userId = req.user!.userId;

        const xForwardedFor = req.headers['x-forwarded-for'];
        const ipAddress =
            req.ip ||
            (typeof xForwardedFor === 'string'
                ? xForwardedFor.split(',')[0].trim()
                : 'unknown');
        const userAgent = req.headers['user-agent'] || undefined;

        try {
            const deletionRequest = await db.deletionRequest.findUnique({
                where: { userId },
            });

            if (!deletionRequest || deletionRequest.status !== 'PENDING') {
                res.status(404).json({
                    error: 'No pending deletion request found',
                });
                return;
            }

            await db.deletionRequest.update({
                where: { userId },
                data: { status: 'CANCELLED' },
            });

            // Log the cancellation
            await createAuditLog({
                userId,
                action: AuditAction.ACCOUNT_DELETION_CANCELLED,
                ipAddress,
                userAgent,
            });

            res.json({ message: 'Account deletion cancelled' });
        } catch (err) {
            console.error('Failed to cancel account deletion:', err);
            res.status(500).json({
                error: 'Failed to cancel account deletion',
            });
        }
    }
);

/**
 * Get deletion request status
 * GET /api/privacy/deletion-status
 */
router.get(
    '/deletion-status',
    requireAuth,
    authLimiter,
    async (req, res): Promise<void> => {
        const userId = req.user!.userId;

        try {
            const deletionRequest = await db.deletionRequest.findUnique({
                where: { userId },
            });

            if (!deletionRequest) {
                res.json({ hasPendingDeletion: false });
                return;
            }

            res.json({
                hasPendingDeletion: deletionRequest.status === 'PENDING',
                status: deletionRequest.status,
                requestedAt: deletionRequest.requestedAt,
                scheduledFor: deletionRequest.scheduledFor,
                reason: deletionRequest.reason,
            });
        } catch (err) {
            console.error('Failed to get deletion status:', err);
            res.status(500).json({ error: 'Failed to get deletion status' });
        }
    }
);

/**
 * Update user profile (GDPR Article 16 - Right to Rectification)
 * PATCH /api/privacy/profile
 */
router.patch(
    '/profile',
    requireAuth,
    authLimiter,
    validateRequest(privacySchemas.updateProfile),
    async (req, res): Promise<void> => {
        const userId = req.user!.userId;
        const { email, locale } = req.body;

        const xForwardedFor = req.headers['x-forwarded-for'];
        const ipAddress =
            req.ip ||
            (typeof xForwardedFor === 'string'
                ? xForwardedFor.split(',')[0].trim()
                : 'unknown');
        const userAgent = req.headers['user-agent'] || undefined;

        try {
            const updateData: { email?: string; locale?: string } = {};

            if (email !== undefined) {
                updateData.email = email;
            }
            if (locale !== undefined) {
                updateData.locale = locale;
            }

            if (Object.keys(updateData).length === 0) {
                res.status(400).json({ error: 'No fields to update' });
                return;
            }

            const updatedUser = await db.user.update({
                where: { id: userId },
                data: updateData,
                select: {
                    id: true,
                    discordId: true,
                    username: true,
                    discriminator: true,
                    email: true,
                    locale: true,
                },
            });

            // Log the profile update
            await createAuditLog({
                userId,
                action: AuditAction.DATA_UPDATED,
                details: { updatedFields: Object.keys(updateData) },
                ipAddress,
                userAgent,
            });

            res.json({
                message: 'Profile updated',
                user: updatedUser,
            });
        } catch (err) {
            console.error('Failed to update profile:', err);
            res.status(500).json({ error: 'Failed to update profile' });
        }
    }
);

export default router;
