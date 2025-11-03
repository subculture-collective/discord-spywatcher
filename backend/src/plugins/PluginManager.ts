import { Client } from 'discord.js';
import { Express } from 'express';

import { PluginLoader } from './PluginLoader';
import { PluginHookType, PluginLoaderConfig } from './types';

/**
 * Plugin manager - singleton service for managing plugins
 */
export class PluginManager {
    private static instance: PluginManager;
    private loader?: PluginLoader;
    private initialized = false;

    private constructor() {}

    /**
     * Get singleton instance
     */
    static getInstance(): PluginManager {
        if (!PluginManager.instance) {
            PluginManager.instance = new PluginManager();
        }
        return PluginManager.instance;
    }

    /**
     * Initialize plugin system
     */
    async initialize(config: PluginLoaderConfig, discordClient?: Client, app?: Express): Promise<void> {
        if (this.initialized) {
            console.warn('Plugin system already initialized');
            return;
        }

        this.loader = new PluginLoader(config);

        if (discordClient) {
            this.loader.setDiscordClient(discordClient);
        }

        if (app) {
            this.loader.setExpressApp(app);
        }

        // Load all plugins
        await this.loader.loadAllPlugins();

        this.initialized = true;
        console.log('✅ Plugin system initialized');
    }

    /**
     * Check if plugin system is initialized
     */
    isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Get plugin loader
     */
    getLoader(): PluginLoader | undefined {
        return this.loader;
    }

    /**
     * Execute hooks for Discord events
     */
    async executeDiscordHook(hookType: PluginHookType, data: unknown): Promise<unknown> {
        if (!this.loader) {
            return data;
        }
        return await this.loader.executeHooks(hookType, data);
    }

    /**
     * Shutdown plugin system
     */
    async shutdown(): Promise<void> {
        if (!this.loader) {
            return;
        }

        await this.loader.stopAllPlugins();
        console.log('✅ Plugin system shutdown complete');
    }
}

// Export singleton instance
export const pluginManager = PluginManager.getInstance();
