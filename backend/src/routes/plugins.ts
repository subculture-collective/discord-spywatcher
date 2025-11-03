import { Router } from 'express';

import { pluginManager } from '../plugins';
import { requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * Get all loaded plugins
 * GET /api/plugins
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
 * Get plugin details by ID
 * GET /api/plugins/:id
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
 * Get plugin health status
 * GET /api/plugins/:id/health
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
 * Start a plugin
 * POST /api/plugins/:id/start
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
 * Stop a plugin
 * POST /api/plugins/:id/stop
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
 * Unload a plugin
 * DELETE /api/plugins/:id
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
