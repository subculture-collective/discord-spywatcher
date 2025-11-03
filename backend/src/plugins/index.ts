/**
 * Plugin System for SpyWatcher
 *
 * This module provides a comprehensive plugin system for extending SpyWatcher functionality.
 * Plugins can hook into Discord events, register API routes, and access various services.
 */

export * from './types';
export { PluginLoader } from './PluginLoader';
export { PluginManager, pluginManager } from './PluginManager';
