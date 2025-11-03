import { Client } from 'discord.js';
import { Express, Router } from 'express';

/**
 * Plugin metadata and configuration
 */
export interface PluginManifest {
    /** Unique identifier for the plugin */
    id: string;
    /** Display name of the plugin */
    name: string;
    /** Plugin version (semver) */
    version: string;
    /** Author information */
    author: string;
    /** Plugin description */
    description: string;
    /** Required SpyWatcher version (semver range) */
    spywatcherVersion?: string;
    /** Plugin dependencies (other plugin IDs) */
    dependencies?: string[];
    /** Required permissions */
    permissions?: PluginPermission[];
    /** Plugin configuration schema */
    configSchema?: Record<string, unknown>;
    /** Homepage or repository URL */
    homepage?: string;
}

/**
 * Plugin permissions for security control
 */
export enum PluginPermission {
    /** Access to Discord bot client */
    DISCORD_CLIENT = 'discord:client',
    /** Listen to Discord events */
    DISCORD_EVENTS = 'discord:events',
    /** Register API routes */
    API_ROUTES = 'api:routes',
    /** Register middleware */
    API_MIDDLEWARE = 'api:middleware',
    /** Access to database */
    DATABASE = 'database:access',
    /** Access to Redis cache */
    CACHE = 'cache:access',
    /** Access to WebSocket service */
    WEBSOCKET = 'websocket:access',
    /** Access to monitoring/metrics */
    MONITORING = 'monitoring:access',
    /** Access to file system */
    FILE_SYSTEM = 'fs:access',
    /** Access to network (HTTP requests) */
    NETWORK = 'network:access',
}

/**
 * Plugin context provided to plugins
 */
export interface PluginContext {
    /** Discord bot client (if DISCORD_CLIENT permission granted) */
    discordClient?: Client;
    /** Express app instance (if API_ROUTES permission granted) */
    app?: Express;
    /** Plugin configuration */
    config: Record<string, unknown>;
    /** Plugin data directory path */
    dataDir: string;
    /** Logger instance */
    logger: {
        info: (message: string, meta?: Record<string, unknown>) => void;
        warn: (message: string, meta?: Record<string, unknown>) => void;
        error: (message: string, meta?: Record<string, unknown>) => void;
        debug: (message: string, meta?: Record<string, unknown>) => void;
    };
    /** Event emitter for plugin events */
    events: PluginEventEmitter;
    /** Services (based on permissions) */
    services: {
        database?: unknown; // Prisma client
        cache?: unknown; // Redis client
        websocket?: unknown; // WebSocket service
    };
}

/**
 * Plugin event emitter interface
 */
export interface PluginEventEmitter {
    /** Emit an event */
    emit(event: string, ...args: unknown[]): void;
    /** Listen to an event */
    on(event: string, listener: (...args: unknown[]) => void): void;
    /** Listen to an event once */
    once(event: string, listener: (...args: unknown[]) => void): void;
    /** Remove event listener */
    off(event: string, listener: (...args: unknown[]) => void): void;
}

/**
 * Plugin hook types for extending functionality
 */
export enum PluginHookType {
    /** Called when Discord bot is ready */
    DISCORD_READY = 'discord:ready',
    /** Called on presence update */
    DISCORD_PRESENCE_UPDATE = 'discord:presenceUpdate',
    /** Called on message create */
    DISCORD_MESSAGE_CREATE = 'discord:messageCreate',
    /** Called on guild member add */
    DISCORD_GUILD_MEMBER_ADD = 'discord:guildMemberAdd',
    /** Called on guild member remove */
    DISCORD_GUILD_MEMBER_REMOVE = 'discord:guildMemberRemove',
    /** Called before analytics calculation */
    ANALYTICS_BEFORE_CALCULATE = 'analytics:beforeCalculate',
    /** Called after analytics calculation */
    ANALYTICS_AFTER_CALCULATE = 'analytics:afterCalculate',
    /** Called on API request */
    API_REQUEST = 'api:request',
    /** Called on API response */
    API_RESPONSE = 'api:response',
    /** Called on WebSocket connection */
    WEBSOCKET_CONNECT = 'websocket:connect',
    /** Called on WebSocket disconnect */
    WEBSOCKET_DISCONNECT = 'websocket:disconnect',
}

/**
 * Plugin hook handler
 */
export type PluginHookHandler<T = unknown> = (
    data: T,
    context: PluginContext
) => Promise<T | void> | T | void;

/**
 * Plugin lifecycle states
 */
export enum PluginState {
    UNINITIALIZED = 'uninitialized',
    INITIALIZING = 'initializing',
    INITIALIZED = 'initialized',
    STARTING = 'starting',
    RUNNING = 'running',
    STOPPING = 'stopping',
    STOPPED = 'stopped',
    ERROR = 'error',
}

/**
 * Plugin interface that all plugins must implement
 */
export interface Plugin {
    /** Plugin manifest */
    manifest: PluginManifest;

    /**
     * Initialize the plugin
     * Called once when plugin is loaded
     */
    init(context: PluginContext): Promise<void> | void;

    /**
     * Start the plugin
     * Called when plugin should begin operation
     */
    start?(): Promise<void> | void;

    /**
     * Stop the plugin
     * Called when plugin should cease operation
     */
    stop?(): Promise<void> | void;

    /**
     * Destroy the plugin
     * Called when plugin is being unloaded
     * Should clean up all resources
     */
    destroy?(): Promise<void> | void;

    /**
     * Register hooks for events
     * Called during initialization
     */
    registerHooks?(hooks: PluginHookRegistry): void;

    /**
     * Register API routes
     * Called during initialization if API_ROUTES permission granted
     */
    registerRoutes?(router: Router): void;

    /**
     * Health check for the plugin
     * Called periodically to check plugin status
     */
    healthCheck?(): Promise<PluginHealthStatus> | PluginHealthStatus;
}

/**
 * Plugin health status
 */
export interface PluginHealthStatus {
    healthy: boolean;
    message?: string;
    details?: Record<string, unknown>;
}

/**
 * Plugin hook registry for registering hooks
 */
export interface PluginHookRegistry {
    register(hook: PluginHookType, handler: PluginHookHandler): void;
    unregister(hook: PluginHookType, handler: PluginHookHandler): void;
}

/**
 * Plugin loader configuration
 */
export interface PluginLoaderConfig {
    /** Directory to load plugins from */
    pluginDir: string;
    /** Data directory for plugins */
    dataDir: string;
    /** Enable plugin sandboxing */
    enableSandbox?: boolean;
    /** Maximum memory per plugin (MB) */
    maxMemoryPerPlugin?: number;
    /** Auto-start plugins on load */
    autoStart?: boolean;
}

/**
 * Plugin instance with state tracking
 */
export interface PluginInstance {
    /** Plugin implementation */
    plugin: Plugin;
    /** Current state */
    state: PluginState;
    /** Plugin context */
    context: PluginContext;
    /** Load timestamp */
    loadedAt: Date;
    /** Error if in ERROR state */
    error?: Error;
}
