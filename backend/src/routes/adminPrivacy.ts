/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Router } from 'express';

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
import {
    parsePaginationParams,
    buildPaginationResult,
} from '../utils/pagination';

const router = Router();

/**
 * @openapi
 * /admin/privacy/audit-logs:
 *   get:
 *     tags:
 *       - Admin Privacy
 *     summary: Get all audit logs
 *     description: |
 *       Retrieve all privacy-related audit logs with pagination.
 *       Admin only. Supports pagination via query parameters.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageQuery'
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Paginated list of audit logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.get(
    '/audit-logs',
    requireAuth,
    requireAdmin,
    adminLimiter,
    validateRequest(privacySchemas.auditLogsQuery),
    async (req, res): Promise<void> => {
        try {
            const { page = 1, limit = 50 } = parsePaginationParams(req.query);
            const offset = (page - 1) * limit;

            const [logs, total] = await Promise.all([
                getAllAuditLogs(limit, offset),
                db.auditLog.count(),
            ]);

            const result = buildPaginationResult(logs, total, page, limit);

            res.json(result);
        } catch (err) {
            console.error('Failed to fetch audit logs:', err);
            res.status(500).json({ error: 'Failed to fetch audit logs' });
        }
    }
);

/**
 * @openapi
 * /admin/privacy/deletion-requests:
 *   get:
 *     tags:
 *       - Admin Privacy
 *     summary: Get all pending deletion requests
 *     description: Retrieve all pending account deletion requests. Admin only.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending deletion requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 requests:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
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
 * @openapi
 * /admin/privacy/retention-policies:
 *   get:
 *     tags:
 *       - Admin Privacy
 *     summary: Get all data retention policies
 *     description: Retrieve all configured data retention policies. Admin only.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of retention policies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 policies:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
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

        if (enabled !== undefined && typeof enabled !== 'boolean') {
            res.status(400).json({
                error: 'enabled must be a boolean',
            });
            return;
        }

        try {
            await updateRetentionPolicy(
                dataType,
                retentionDays,
                enabled !== undefined ? Boolean(enabled) : true
            );

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
                            gte: new Date(
                                Date.now() - 30 * 24 * 60 * 60 * 1000
                            ),
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
