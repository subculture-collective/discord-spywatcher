import { Router, Request, Response } from 'express';

import { db } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Validation constants
const VALID_SEVERITIES = ['MINOR', 'MAJOR', 'CRITICAL'] as const;
const VALID_STATUSES = [
    'INVESTIGATING',
    'IDENTIFIED',
    'MONITORING',
    'RESOLVED',
] as const;

// All routes require authentication and admin role
router.use(requireAuth);
router.use(requireRole(['ADMIN']));

/**
 * POST /api/admin/incidents
 * Create a new incident
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const {
            title,
            description,
            severity,
            status,
            affectedServices,
            initialUpdate,
        } = req.body as {
            title?: string;
            description?: string;
            severity?: string;
            status?: string;
            affectedServices?: string[];
            initialUpdate?: string;
        };

        // Validate required fields
        if (!title || !description) {
            res.status(400).json({
                error: 'Title and description are required',
            });
            return;
        }

        // Validate severity
        if (
            severity &&
            !VALID_SEVERITIES.includes(
                severity as (typeof VALID_SEVERITIES)[number]
            )
        ) {
            res.status(400).json({
                error: `Invalid severity. Must be one of: ${VALID_SEVERITIES.join(', ')}`,
            });
            return;
        }

        // Validate status
        if (
            status &&
            !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])
        ) {
            res.status(400).json({
                error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
            });
            return;
        }

        // Validate affectedServices is an array
        if (affectedServices && !Array.isArray(affectedServices)) {
            res.status(400).json({
                error: 'affectedServices must be an array',
            });
            return;
        }

        const incident = await db.incident.create({
            data: {
                title,
                description,
                severity:
                    (severity as 'MINOR' | 'MAJOR' | 'CRITICAL') || 'MINOR',
                status:
                    (status as
                        | 'INVESTIGATING'
                        | 'IDENTIFIED'
                        | 'MONITORING'
                        | 'RESOLVED') || 'INVESTIGATING',
                affectedServices: affectedServices || [],
                updates: initialUpdate
                    ? {
                          create: {
                              message: initialUpdate,
                              status:
                                  (status as
                                      | 'INVESTIGATING'
                                      | 'IDENTIFIED'
                                      | 'MONITORING'
                                      | 'RESOLVED') || 'INVESTIGATING',
                          },
                      }
                    : undefined,
            },
            include: {
                updates: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
            },
        });

        console.log(`Incident created: ${incident.id} - ${incident.title}`);

        res.status(201).json(incident);
    } catch (error) {
        console.error('Failed to create incident:', error);
        res.status(500).json({
            error: 'Failed to create incident',
        });
    }
});

/**
 * PATCH /api/admin/incidents/:id
 * Update an existing incident
 */
router.patch('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            severity,
            status,
            affectedServices,
            resolvedAt,
            updateMessage,
        } = req.body as {
            title?: string;
            description?: string;
            severity?: string;
            status?: string;
            affectedServices?: string[];
            resolvedAt?: string;
            updateMessage?: string;
        };

        // Check if incident exists
        const existingIncident = await db.incident.findUnique({
            where: { id },
        });

        if (!existingIncident) {
            res.status(404).json({ error: 'Incident not found' });
            return;
        }

        // Validate severity if provided
        if (
            severity &&
            !VALID_SEVERITIES.includes(
                severity as (typeof VALID_SEVERITIES)[number]
            )
        ) {
            res.status(400).json({
                error: `Invalid severity. Must be one of: ${VALID_SEVERITIES.join(', ')}`,
            });
            return;
        }

        // Validate status if provided
        if (
            status &&
            !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])
        ) {
            res.status(400).json({
                error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
            });
            return;
        }

        // Validate affectedServices if provided
        if (affectedServices && !Array.isArray(affectedServices)) {
            res.status(400).json({
                error: 'affectedServices must be an array',
            });
            return;
        }

        // Prepare update data
        const updateData: {
            title?: string;
            description?: string;
            severity?: 'MINOR' | 'MAJOR' | 'CRITICAL';
            status?: 'INVESTIGATING' | 'IDENTIFIED' | 'MONITORING' | 'RESOLVED';
            affectedServices?: string[];
            resolvedAt?: Date | null;
            updates?: {
                create: {
                    message: string;
                    status?:
                        | 'INVESTIGATING'
                        | 'IDENTIFIED'
                        | 'MONITORING'
                        | 'RESOLVED';
                };
            };
        } = {};

        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (severity !== undefined)
            updateData.severity = severity as 'MINOR' | 'MAJOR' | 'CRITICAL';
        if (status !== undefined)
            updateData.status = status as
                | 'INVESTIGATING'
                | 'IDENTIFIED'
                | 'MONITORING'
                | 'RESOLVED';
        if (affectedServices !== undefined)
            updateData.affectedServices = affectedServices;

        // Auto-set resolvedAt if status is RESOLVED
        if (status === 'RESOLVED' && !existingIncident.resolvedAt) {
            updateData.resolvedAt = new Date();
        } else if (resolvedAt !== undefined) {
            updateData.resolvedAt = resolvedAt ? new Date(resolvedAt) : null;
        }

        // Add update message if provided
        if (updateMessage) {
            updateData.updates = {
                create: {
                    message: updateMessage,
                    status:
                        (status as
                            | 'INVESTIGATING'
                            | 'IDENTIFIED'
                            | 'MONITORING'
                            | 'RESOLVED') || existingIncident.status,
                },
            };
        }

        const incident = await db.incident.update({
            where: { id },
            data: updateData,
            include: {
                updates: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
            },
        });

        console.log(`Incident updated: ${incident.id} - ${incident.title}`);

        res.json(incident);
    } catch (error) {
        console.error('Failed to update incident:', error);
        res.status(500).json({
            error: 'Failed to update incident',
        });
    }
});

/**
 * POST /api/admin/incidents/:id/updates
 * Add an update to an incident
 */
router.post('/:id/updates', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { message, status } = req.body as {
            message?: string;
            status?: string;
        };

        if (!message) {
            res.status(400).json({ error: 'Update message is required' });
            return;
        }

        // Validate status if provided
        if (
            status &&
            !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])
        ) {
            res.status(400).json({
                error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
            });
            return;
        }

        // Check if incident exists
        const incident = await db.incident.findUnique({
            where: { id },
        });

        if (!incident) {
            res.status(404).json({ error: 'Incident not found' });
            return;
        }

        // Create the update
        const update = await db.incidentUpdate.create({
            data: {
                incidentId: id,
                message,
                status: status as
                    | 'INVESTIGATING'
                    | 'IDENTIFIED'
                    | 'MONITORING'
                    | 'RESOLVED'
                    | undefined,
            },
        });

        // Update incident status if status is provided
        if (status) {
            await db.incident.update({
                where: { id },
                data: {
                    status: status as
                        | 'INVESTIGATING'
                        | 'IDENTIFIED'
                        | 'MONITORING'
                        | 'RESOLVED',
                    resolvedAt:
                        status === 'RESOLVED' && !incident.resolvedAt
                            ? new Date()
                            : undefined,
                },
            });
        }

        console.log(`Update added to incident: ${id}`);

        res.status(201).json(update);
    } catch (error) {
        console.error('Failed to add incident update:', error);
        res.status(500).json({
            error: 'Failed to add incident update',
        });
    }
});

/**
 * DELETE /api/admin/incidents/:id
 * Delete an incident (soft delete by marking as resolved)
 */
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { permanent } = req.query;

        const incident = await db.incident.findUnique({
            where: { id },
        });

        if (!incident) {
            res.status(404).json({ error: 'Incident not found' });
            return;
        }

        if (permanent === 'true') {
            // Permanent deletion (cascades to updates)
            await db.incident.delete({
                where: { id },
            });

            console.log(`Incident permanently deleted: ${id}`);

            res.json({
                message: 'Incident permanently deleted',
            });
        } else {
            // Soft delete - mark as resolved
            await db.incident.update({
                where: { id },
                data: {
                    status: 'RESOLVED',
                    resolvedAt: incident.resolvedAt || new Date(),
                },
            });

            console.log(`Incident resolved (soft deleted): ${id}`);

            res.json({
                message: 'Incident marked as resolved',
            });
        }
    } catch (error) {
        console.error('Failed to delete incident:', error);
        res.status(500).json({
            error: 'Failed to delete incident',
        });
    }
});

/**
 * GET /api/admin/incidents
 * List all incidents with filtering
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const { status, severity, limit = '50' } = req.query;

        const limitNum = parseInt(limit as string, 10);
        if (limitNum < 1 || limitNum > 100) {
            res.status(400).json({ error: 'Limit must be between 1 and 100' });
            return;
        }

        const where: {
            status?: 'INVESTIGATING' | 'IDENTIFIED' | 'MONITORING' | 'RESOLVED';
            severity?: 'MINOR' | 'MAJOR' | 'CRITICAL';
        } = {};

        if (status) {
            where.status = status as
                | 'INVESTIGATING'
                | 'IDENTIFIED'
                | 'MONITORING'
                | 'RESOLVED';
        }
        if (severity) {
            where.severity = severity as 'MINOR' | 'MAJOR' | 'CRITICAL';
        }

        const incidents = await db.incident.findMany({
            where,
            take: limitNum,
            orderBy: {
                startedAt: 'desc',
            },
            include: {
                updates: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 5, // Include last 5 updates
                },
            },
        });

        res.json({
            incidents,
            count: incidents.length,
        });
    } catch (error) {
        console.error('Failed to list incidents:', error);
        res.status(500).json({
            error: 'Failed to list incidents',
        });
    }
});

export default router;
