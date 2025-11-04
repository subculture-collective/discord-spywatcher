import { Router } from 'express';

import { pluginManager } from '../plugins';
import { requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * @openapi
 * /plugins:
 *   get:
 *     tags:
 *       - Plugins
 *     summary: Get all loaded plugins
 *     description: Retrieve a list of all loaded plugins with their status and metadata
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of plugins
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   description: Number of loaded plugins
 *                 plugins:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Plugin'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       503:
 *         description: Plugin system not initialized
 */
router.get('/', requireAdmin, (req, res) => {
    try {
        const loader = pluginManager.getLoader();
        if (!loader) {
            res.status(503).json({ error: 'Plugin system not initialized' });
            return;
        }

        const plugins = loader.getLoadedPlugins();
        res.json({
            count: plugins.length,
            plugins: plugins.map((p) => ({
                id: p.plugin.manifest.id,
                name: p.plugin.manifest.name,
                version: p.plugin.manifest.version,
                author: p.plugin.manifest.author,
                description: p.plugin.manifest.description,
                state: p.state,
                loadedAt: p.loadedAt,
                error: p.error?.message,
            })),
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get plugins',
            message: error instanceof Error ? error.message : String(error),
        });
    }
});

/**
 * @openapi
 * /plugins/{id}:
 *   get:
 *     tags:
 *       - Plugins
 *     summary: Get plugin details by ID
 *     description: Retrieve detailed information about a specific plugin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Plugin ID
 *     responses:
 *       200:
 *         description: Plugin details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Plugin'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       503:
 *         description: Plugin system not initialized
 */
router.get('/:id', requireAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const loader = pluginManager.getLoader();

        if (!loader) {
            res.status(503).json({ error: 'Plugin system not initialized' });
            return;
        }

        const plugin = loader.getPlugin(id);
        if (!plugin) {
            res.status(404).json({ error: 'Plugin not found' });
            return;
        }

        res.json({
            id: plugin.plugin.manifest.id,
            name: plugin.plugin.manifest.name,
            version: plugin.plugin.manifest.version,
            author: plugin.plugin.manifest.author,
            description: plugin.plugin.manifest.description,
            homepage: plugin.plugin.manifest.homepage,
            permissions: plugin.plugin.manifest.permissions,
            dependencies: plugin.plugin.manifest.dependencies,
            state: plugin.state,
            loadedAt: plugin.loadedAt,
            error: plugin.error?.message,
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get plugin',
            message: error instanceof Error ? error.message : String(error),
        });
    }
});

/**
 * @openapi
 * /plugins/{id}/health:
 *   get:
 *     tags:
 *       - Plugins
 *     summary: Get plugin health status
 *     description: Check the health status of a specific plugin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Plugin ID
 *     responses:
 *       200:
 *         description: Plugin health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 healthy:
 *                   type: boolean
 *                 lastCheck:
 *                   type: string
 *                   format: date-time
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       503:
 *         description: Plugin system not initialized
 */
router.get('/:id/health', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const loader = pluginManager.getLoader();

        if (!loader) {
            res.status(503).json({ error: 'Plugin system not initialized' });
            return;
        }

        const health = await loader.getPluginHealth(id);
        res.json(health);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get plugin health',
            message: error instanceof Error ? error.message : String(error),
        });
    }
});

/**
 * @openapi
 * /plugins/{id}/start:
 *   post:
 *     tags:
 *       - Plugins
 *     summary: Start a plugin
 *     description: Start a stopped or paused plugin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Plugin ID
 *     responses:
 *       200:
 *         description: Plugin started successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       503:
 *         description: Plugin system not initialized
 */
router.post('/:id/start', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const loader = pluginManager.getLoader();

        if (!loader) {
            res.status(503).json({ error: 'Plugin system not initialized' });
            return;
        }

        await loader.startPlugin(id);
        res.json({ message: 'Plugin started successfully', id });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to start plugin',
            message: error instanceof Error ? error.message : String(error),
        });
    }
});

/**
 * @openapi
 * /plugins/{id}/stop:
 *   post:
 *     tags:
 *       - Plugins
 *     summary: Stop a plugin
 *     description: Stop a running plugin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Plugin ID
 *     responses:
 *       200:
 *         description: Plugin stopped successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       503:
 *         description: Plugin system not initialized
 */
router.post('/:id/stop', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const loader = pluginManager.getLoader();

        if (!loader) {
            res.status(503).json({ error: 'Plugin system not initialized' });
            return;
        }

        await loader.stopPlugin(id);
        res.json({ message: 'Plugin stopped successfully', id });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to stop plugin',
            message: error instanceof Error ? error.message : String(error),
        });
    }
});

/**
 * @openapi
 * /plugins/{id}:
 *   delete:
 *     tags:
 *       - Plugins
 *     summary: Unload a plugin
 *     description: Unload and remove a plugin from the system
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Plugin ID
 *     responses:
 *       200:
 *         description: Plugin unloaded successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       503:
 *         description: Plugin system not initialized
 */
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const loader = pluginManager.getLoader();

        if (!loader) {
            res.status(503).json({ error: 'Plugin system not initialized' });
            return;
        }

        await loader.unloadPlugin(id);
        res.json({ message: 'Plugin unloaded successfully', id });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to unload plugin',
            message: error instanceof Error ? error.message : String(error),
        });
    }
});

export default router;
