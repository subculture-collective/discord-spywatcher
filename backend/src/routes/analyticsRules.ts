import { PrismaClient } from '@prisma/client';
import { Router } from 'express';

import { requireAuth } from '../middleware';
import logger from '../middleware/winstonLogger';
import { executeRule } from '../services/rulesEngine';

const router = Router();
const prisma = new PrismaClient();

router.use(requireAuth);

/**
 * @openapi
 * /rules/templates:
 *   get:
 *     tags:
 *       - Analytics Rules
 *     summary: Get rule templates
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of templates
 */
router.get('/rules/templates', async (req, res) => {
    try {
        const templates = await prisma.ruleTemplate.findMany({
            orderBy: { usageCount: 'desc' },
        });

        res.json(templates);
    } catch (error) {
        logger.error('Failed to fetch templates', { error });
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
});

/**
 * @openapi
 * /rules/templates/{id}/use:
 *   post:
 *     tags:
 *       - Analytics Rules
 *     summary: Create a rule from a template
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Rule created from template
 */
router.post('/rules/templates/:id/use', async (req, res) => {
    try {
        const userId = req.user?.userId as string;
        const { id } = req.params;

        const template = await prisma.ruleTemplate.findUnique({
            where: { id },
        });

        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        // Create rule from template
        const rule = await prisma.analyticsRule.create({
            data: {
                userId,
                name: template.name,
                description: template.description,
                status: 'DRAFT',
                triggerType: 'SCHEDULED',
                conditions: template.conditions as unknown,
                actions: template.actions as unknown,
                metadata: (template.metadata || {}) as unknown,
            },
        });

        // Increment template usage count
        await prisma.ruleTemplate.update({
            where: { id },
            data: { usageCount: { increment: 1 } },
        });

        res.status(201).json(rule);
    } catch (error) {
        logger.error('Failed to create rule from template', { error });
        res.status(500).json({ error: 'Failed to create rule from template' });
    }
});

/**
 * @openapi
 * /rules:
 *   get:
 *     tags:
 *       - Analytics Rules
 *     summary: Get all rules for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of rules
 */
router.get('/rules', async (req, res) => {
    try {
        const userId = req.user?.userId as string;

        const rules = await prisma.analyticsRule.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                executions: {
                    take: 5,
                    orderBy: { startedAt: 'desc' },
                },
            },
        });

        res.json(rules);
    } catch (error) {
        logger.error('Failed to fetch rules', { error });
        res.status(500).json({ error: 'Failed to fetch rules' });
    }
});

/**
 * @openapi
 * /rules/{id}:
 *   get:
 *     tags:
 *       - Analytics Rules
 *     summary: Get a specific rule
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rule details
 *       404:
 *         description: Rule not found
 */
router.get('/rules/:id', async (req, res) => {
    try {
        const userId = req.user?.userId as string;
        const { id } = req.params;

        const rule = await prisma.analyticsRule.findFirst({
            where: { id, userId },
            include: {
                executions: {
                    take: 10,
                    orderBy: { startedAt: 'desc' },
                },
            },
        });

        if (!rule) {
            return res.status(404).json({ error: 'Rule not found' });
        }

        res.json(rule);
    } catch (error) {
        logger.error('Failed to fetch rule', { error });
        res.status(500).json({ error: 'Failed to fetch rule' });
    }
});

/**
 * @openapi
 * /rules:
 *   post:
 *     tags:
 *       - Analytics Rules
 *     summary: Create a new rule
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - conditions
 *               - actions
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, PAUSED, DRAFT]
 *               triggerType:
 *                 type: string
 *                 enum: [SCHEDULED, REALTIME, MANUAL]
 *               schedule:
 *                 type: string
 *               conditions:
 *                 type: array
 *               actions:
 *                 type: array
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Rule created
 */
router.post('/rules', async (req, res) => {
    try {
        const userId = req.user?.userId as string;
        const {
            name,
            description,
            status,
            triggerType,
            schedule,
            conditions,
            actions,
            metadata,
        } = req.body as {
            name?: string;
            description?: string;
            status?: string;
            triggerType?: string;
            schedule?: string;
            conditions?: unknown;
            actions?: unknown;
            metadata?: unknown;
        };

        // Validate required fields
        if (!name || !conditions || !actions) {
            return res.status(400).json({
                error: 'Name, conditions, and actions are required',
            });
        }

        const rule = await prisma.analyticsRule.create({
            data: {
                userId,
                name,
                description,
                status: status || 'DRAFT',
                triggerType: triggerType || 'SCHEDULED',
                schedule,
                conditions,
                actions,
                metadata: metadata || {},
            },
        });

        res.status(201).json(rule);
    } catch (error) {
        logger.error('Failed to create rule', { error });
        res.status(500).json({ error: 'Failed to create rule' });
    }
});

/**
 * @openapi
 * /rules/{id}:
 *   put:
 *     tags:
 *       - Analytics Rules
 *     summary: Update a rule
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rule updated
 */
router.put('/rules/:id', async (req, res) => {
    try {
        const userId = req.user?.userId as string;
        const { id } = req.params;
        const {
            name,
            description,
            status,
            triggerType,
            schedule,
            conditions,
            actions,
            metadata,
        } = req.body as {
            name?: string;
            description?: string;
            status?: string;
            triggerType?: string;
            schedule?: string;
            conditions?: unknown;
            actions?: unknown;
            metadata?: unknown;
        };

        // Verify ownership
        const existing = await prisma.analyticsRule.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            return res.status(404).json({ error: 'Rule not found' });
        }

        const updateData: Record<string, unknown> = {};
        if (name) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (status) updateData.status = status;
        if (triggerType) updateData.triggerType = triggerType;
        if (schedule !== undefined) updateData.schedule = schedule;
        if (conditions) updateData.conditions = conditions;
        if (actions) updateData.actions = actions;
        if (metadata !== undefined) updateData.metadata = metadata;

        const rule = await prisma.analyticsRule.update({
            where: { id },
            data: updateData,
        });

        res.json(rule);
    } catch (error) {
        logger.error('Failed to update rule', { error: error as Error });
        res.status(500).json({ error: 'Failed to update rule' });
    }
});

/**
 * @openapi
 * /rules/{id}:
 *   delete:
 *     tags:
 *       - Analytics Rules
 *     summary: Delete a rule
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Rule deleted
 */
router.delete('/rules/:id', async (req, res) => {
    try {
        const userId = req.user?.userId as string;
        const { id } = req.params;

        // Verify ownership
        const existing = await prisma.analyticsRule.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            return res.status(404).json({ error: 'Rule not found' });
        }

        await prisma.analyticsRule.delete({ where: { id } });

        res.status(204).send();
    } catch (error) {
        logger.error('Failed to delete rule', { error });
        res.status(500).json({ error: 'Failed to delete rule' });
    }
});

/**
 * @openapi
 * /rules/{id}/execute:
 *   post:
 *     tags:
 *       - Analytics Rules
 *     summary: Manually execute a rule
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       202:
 *         description: Rule execution started
 */
router.post('/rules/:id/execute', async (req, res) => {
    try {
        const userId = req.user?.userId as string;
        const { id } = req.params;

        // Verify ownership
        const rule = await prisma.analyticsRule.findFirst({
            where: { id, userId },
        });

        if (!rule) {
            return res.status(404).json({ error: 'Rule not found' });
        }

        // Execute asynchronously
        executeRule(id).catch((error: unknown) => {
            const errorMessage =
                error instanceof Error ? error.message : String(error);
            logger.error('Rule execution failed', {
                ruleId: id,
                error: errorMessage,
            });
        });

        res.status(202).json({ message: 'Rule execution started' });
    } catch (error) {
        logger.error('Failed to execute rule', { error });
        res.status(500).json({ error: 'Failed to execute rule' });
    }
});

export default router;
