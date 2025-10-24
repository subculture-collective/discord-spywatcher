/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import express from 'express';

import { db } from '../db';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { adminLimiter } from '../middleware/rateLimiter';
import { validateRequest, privacySchemas } from '../middleware/validation';
import { getPendingDeletions } from '../utils/accountDeletion';
import { getAllAuditLogs } from '../utils/auditLog';
import {
    getAllRetentionPolicies,
    updateRetentionPolicy,
    cleanupOldData,
} from '../utils/dataRetention';

const router = express.Router();

/**
 * Get all audit logs (admin only)
 * GET /api/admin/privacy/audit-logs
 */
router.get(
    '/audit-logs',
    requireAuth,
    requireAdmin,
    adminLimiter,
    validateRequest(privacySchemas.auditLogsQuery),
    async (req, res): Promise<void> => {
        const limit = parseInt(req.query.limit as string) || 100;
        const offset = parseInt(req.query.offset as string) || 0;

        try {
            const logs = await getAllAuditLogs(limit, offset);
            const total = await db.auditLog.count();

            res.json({
                logs,
                pagination: {
                    limit,
                    offset,
                    total,
                },
            });
        } catch (err) {
            console.error('Failed to fetch audit logs:', err);
            res.status(500).json({ error: 'Failed to fetch audit logs' });
        }
    }
);

/**
 * Get all pending deletion requests (admin only)
 * GET /api/admin/privacy/deletion-requests
 */
router.get(
    '/deletion-requests',
    requireAuth,
    requireAdmin,
    adminLimiter,
    async (req, res): Promise<void> => {
        try {
            const requests = await getPendingDeletions();

            res.json({ requests });
        } catch (err) {
            console.error('Failed to fetch deletion requests:', err);
            res.status(500).json({
                error: 'Failed to fetch deletion requests',
            });
        }
    }
);

/**
 * Get all data retention policies (admin only)
 * GET /api/admin/privacy/retention-policies
 */
router.get(
    '/retention-policies',
    requireAuth,
    requireAdmin,
    adminLimiter,
    async (req, res): Promise<void> => {
        try {
            const policies = await getAllRetentionPolicies();

            res.json({ policies });
        } catch (err) {
            console.error('Failed to fetch retention policies:', err);
            res.status(500).json({
                error: 'Failed to fetch retention policies',
            });
        }
    }
);

/**
 * Update a data retention policy (admin only)
 * PATCH /api/admin/privacy/retention-policies/:dataType
 */
router.patch(
    '/retention-policies/:dataType',
    requireAuth,
    requireAdmin,
    adminLimiter,
    validateRequest(privacySchemas.updateRetentionPolicy),
    async (req, res): Promise<void> => {
        const { dataType } = req.params;
        const { retentionDays, enabled } = req.body;

        if (typeof retentionDays !== 'number' || retentionDays < 1) {
            res.status(400).json({
                error: 'retentionDays must be a positive number',
            });
            return;
        }

        try {
            await updateRetentionPolicy(dataType, retentionDays, enabled);

            res.json({
                message: 'Retention policy updated',
                dataType,
                retentionDays,
                enabled,
            });
        } catch (err) {
            console.error('Failed to update retention policy:', err);
            res.status(500).json({
                error: 'Failed to update retention policy',
            });
        }
    }
);

/**
 * Trigger manual data cleanup (admin only)
 * POST /api/admin/privacy/cleanup
 */
router.post(
    '/cleanup',
    requireAuth,
    requireAdmin,
    adminLimiter,
    async (req, res): Promise<void> => {
        try {
            const results = await cleanupOldData();

            res.json({
                message: 'Data cleanup completed',
                results,
            });
        } catch (err) {
            console.error('Failed to cleanup old data:', err);
            res.status(500).json({ error: 'Failed to cleanup old data' });
        }
    }
);

/**
 * Get privacy statistics (admin only)
 * GET /api/admin/privacy/statistics
 */
router.get(
    '/statistics',
    requireAuth,
    requireAdmin,
    adminLimiter,
    async (req, res): Promise<void> => {
        try {
            const [
                totalUsers,
                pendingDeletions,
                completedDeletions,
                dataExportsLast30Days,
                consentStats,
            ] = await Promise.all([
                db.user.count(),
                db.deletionRequest.count({
                    where: { status: 'PENDING' },
                }),
                db.deletionRequest.count({
                    where: { status: 'COMPLETED' },
                }),
                db.auditLog.count({
                    where: {
                        action: 'DATA_EXPORTED',
                        createdAt: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                        },
                    },
                }),
                db.consentLog.groupBy({
                    by: ['consentType'],
                    _count: {
                        id: true,
                    },
                }),
            ]);

            res.json({
                users: {
                    total: totalUsers,
                },
                deletions: {
                    pending: pendingDeletions,
                    completed: completedDeletions,
                },
                dataExports: {
                    last30Days: dataExportsLast30Days,
                },
                consent: consentStats.map((stat) => ({
                    type: stat.consentType,
                    count: stat._count.id,
                })),
            });
        } catch (err) {
            console.error('Failed to fetch privacy statistics:', err);
            res.status(500).json({
                error: 'Failed to fetch privacy statistics',
            });
        }
    }
);

export default router;
