# Plugin System - Developer Documentation

## Overview

SpyWatcher provides a comprehensive plugin system that allows developers to extend functionality without modifying core code. Plugins can:

- Hook into Discord events (presence updates, messages, etc.)
- Register custom API routes
- Access database, cache, and WebSocket services
- Add custom analytics and monitoring

## Table of Contents

- [Getting Started](#getting-started)
- [Plugin Structure](#plugin-structure)
- [Plugin API](#plugin-api)
- [Permissions System](#permissions-system)
- [Hook System](#hook-system)
- [Example Plugins](#example-plugins)
- [Best Practices](#best-practices)
- [Security](#security)

## Getting Started

### Creating Your First Plugin

1. Create a new directory in `backend/plugins/` (e.g., `backend/plugins/my-plugin/`)
2. Create a `manifest.json` file with plugin metadata
3. Create an `index.js` (or `index.ts`) file with plugin implementation
4. Restart SpyWatcher to load the plugin

### Basic Plugin Structure

```
backend/plugins/my-plugin/
├── manifest.json      # Plugin metadata
├── index.js          # Plugin entry point
└── README.md         # Plugin documentation
```

## Plugin Structure

### manifest.json

The manifest file contains plugin metadata and configuration:

```json
{
    "id": "my-plugin",
    "name": "My Plugin",
    "version": "1.0.0",
    "author": "Your Name",
    "description": "A description of what your plugin does",
    "spywatcherVersion": ">=1.0.0",
    "dependencies": [],
    "permissions": ["discord:events", "api:routes"],
    "homepage": "https://github.com/yourname/my-plugin"
}
```

### index.js

The index file exports a plugin object implementing the `Plugin` interface:

```javascript
module.exports = {
    manifest: require('./manifest.json'),

    // Initialize the plugin
    async init(context) {
        context.logger.info('Plugin initialized');
    },

    // Start the plugin (optional)
    async start() {
        console.log('Plugin started');
    },

    // Stop the plugin (optional)
    async stop() {
        console.log('Plugin stopped');
    },

    // Clean up resources (optional)
    async destroy() {
        console.log('Plugin destroyed');
    },

    // Register hooks (optional)
    registerHooks(hooks) {
        hooks.register('discord:messageCreate', async (message, context) => {
            context.logger.info('Message received:', {
                content: message.content,
            });
        });
    },

    // Register API routes (optional)
    registerRoutes(router) {
        router.get('/hello', (req, res) => {
            res.json({ message: 'Hello from plugin!' });
        });
    },

    // Health check (optional)
    async healthCheck() {
        return {
            healthy: true,
            message: 'Plugin is running',
        };
    },
};
```

## Plugin API

### Plugin Interface

```typescript
interface Plugin {
    manifest: PluginManifest;
    init(context: PluginContext): Promise<void> | void;
    start?(): Promise<void> | void;
    stop?(): Promise<void> | void;
    destroy?(): Promise<void> | void;
    registerHooks?(hooks: PluginHookRegistry): void;
    registerRoutes?(router: Router): void;
    healthCheck?(): Promise<PluginHealthStatus> | PluginHealthStatus;
}
```

### Plugin Context

The plugin context provides access to services and utilities:

```typescript
interface PluginContext {
    // Discord bot client (requires DISCORD_CLIENT permission)
    discordClient?: Client;

    // Express app (requires API_ROUTES permission)
    app?: Express;

    // Plugin configuration
    config: Record<string, unknown>;

    // Plugin data directory (for storing plugin-specific files)
    dataDir: string;

    // Logger for plugin messages
    logger: {
        info(message: string, meta?: Record<string, unknown>): void;
        warn(message: string, meta?: Record<string, unknown>): void;
        error(message: string, meta?: Record<string, unknown>): void;
        debug(message: string, meta?: Record<string, unknown>): void;
    };

    // Event emitter for plugin events
    events: PluginEventEmitter;

    // Services (based on permissions)
    services: {
        database?: PrismaClient; // Requires DATABASE permission
        cache?: Redis; // Requires CACHE permission
        websocket?: WebSocketService; // Requires WEBSOCKET permission
    };
}
```

## Permissions System

Plugins must declare required permissions in their manifest. Available permissions:

### Discord Permissions

- `discord:client` - Access to Discord bot client
- `discord:events` - Listen to Discord events

### API Permissions

- `api:routes` - Register custom API routes
- `api:middleware` - Register Express middleware

### Service Permissions

- `database:access` - Access to Prisma database client
- `cache:access` - Access to Redis cache
- `websocket:access` - Access to WebSocket service
- `monitoring:access` - Access to monitoring and metrics

### System Permissions

- `fs:access` - Access to file system (restricted to plugin data directory)
- `network:access` - Make HTTP requests to external services

### Example Permissions

```json
{
    "permissions": [
        "discord:client",
        "discord:events",
        "api:routes",
        "database:access",
        "cache:access"
    ]
}
```

## Hook System

Plugins can register hooks to intercept and respond to events:

### Available Hooks

#### Discord Hooks

- `discord:ready` - Called when Discord bot is ready
- `discord:presenceUpdate` - Called on user presence update
- `discord:messageCreate` - Called when a message is created
- `discord:guildMemberAdd` - Called when a member joins
- `discord:guildMemberRemove` - Called when a member leaves

#### Analytics Hooks

- `analytics:beforeCalculate` - Called before analytics calculation
- `analytics:afterCalculate` - Called after analytics calculation

#### API Hooks

- `api:request` - Called on API request
- `api:response` - Called on API response

#### WebSocket Hooks

- `websocket:connect` - Called on WebSocket connection
- `websocket:disconnect` - Called on WebSocket disconnect

### Hook Example

```javascript
registerHooks(hooks) {
  // Listen for presence updates
  hooks.register('discord:presenceUpdate', async (data, context) => {
    const { oldPresence, newPresence } = data;

    context.logger.info('Presence updated', {
      userId: newPresence.userId,
      status: newPresence.status
    });

    // You can modify and return data to affect downstream processing
    return data;
  });

  // Listen for new messages
  hooks.register('discord:messageCreate', async (message, context) => {
    if (message.content.includes('!ping')) {
      await message.reply('Pong from plugin!');
    }
  });
}
```

## Example Plugins

### Example 1: Logger Plugin

A simple plugin that logs all Discord messages:

**manifest.json:**

```json
{
    "id": "message-logger",
    "name": "Message Logger",
    "version": "1.0.0",
    "author": "SpyWatcher Team",
    "description": "Logs all Discord messages to a file",
    "permissions": ["discord:events", "fs:access"]
}
```

**index.js:**

```javascript
const fs = require('fs');
const path = require('path');

module.exports = {
    manifest: require('./manifest.json'),

    async init(context) {
        this.context = context;
        this.logFile = path.join(context.dataDir, 'messages.log');
        context.logger.info('Message logger initialized');
    },

    registerHooks(hooks) {
        hooks.register('discord:messageCreate', async (message, context) => {
            const logEntry = `${new Date().toISOString()} - ${message.author.username}: ${message.content}\n`;
            fs.appendFileSync(this.logFile, logEntry);
        });
    },
};
```

### Example 2: Custom Analytics Plugin

A plugin that adds custom analytics endpoints:

**manifest.json:**

```json
{
    "id": "custom-analytics",
    "name": "Custom Analytics",
    "version": "1.0.0",
    "author": "SpyWatcher Team",
    "description": "Provides custom analytics endpoints",
    "permissions": ["api:routes", "database:access"]
}
```

**index.js:**

```javascript
module.exports = {
    manifest: require('./manifest.json'),

    async init(context) {
        this.context = context;
        this.db = context.services.database;
        context.logger.info('Custom analytics initialized');
    },

    registerRoutes(router) {
        // GET /api/plugins/custom-analytics/stats
        router.get('/stats', async (req, res) => {
            const messageCount = await this.db.messageEvent.count();
            const userCount = await this.db.user.count();

            res.json({
                messages: messageCount,
                users: userCount,
                timestamp: new Date(),
            });
        });

        // GET /api/plugins/custom-analytics/top-users
        router.get('/top-users', async (req, res) => {
            const topUsers = await this.db.messageEvent.groupBy({
                by: ['userId'],
                _count: { userId: true },
                orderBy: { _count: { userId: 'desc' } },
                take: 10,
            });

            res.json({ topUsers });
        });
    },
};
```

### Example 3: Notification Plugin

A plugin that sends notifications for specific events:

**manifest.json:**

```json
{
    "id": "notifications",
    "name": "Notification Plugin",
    "version": "1.0.0",
    "author": "SpyWatcher Team",
    "description": "Sends notifications via webhook",
    "permissions": ["discord:events", "network:access", "websocket:access"]
}
```

**index.js:**

```javascript
const axios = require('axios');

module.exports = {
    manifest: require('./manifest.json'),

    async init(context) {
        this.context = context;
        this.webhookUrl = process.env.NOTIFICATION_WEBHOOK_URL;
        context.logger.info('Notification plugin initialized');
    },

    registerHooks(hooks) {
        // Notify on multi-client detection
        hooks.register('discord:presenceUpdate', async (data, context) => {
            const { newPresence } = data;
            const platforms = Object.keys(newPresence.clientStatus || {});

            if (platforms.length > 1) {
                await this.sendNotification({
                    type: 'multi-client',
                    user: newPresence.user.username,
                    platforms: platforms.join(', '),
                });
            }

            return data;
        });
    },

    async sendNotification(data) {
        if (!this.webhookUrl) return;

        try {
            await axios.post(this.webhookUrl, {
                text: `🔔 ${data.type}: ${data.user} detected on ${data.platforms}`,
            });
        } catch (error) {
            this.context.logger.error('Failed to send notification', { error });
        }
    },
};
```

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```javascript
registerHooks(hooks) {
  hooks.register('discord:messageCreate', async (message, context) => {
    try {
      // Your plugin logic
    } catch (error) {
      context.logger.error('Error processing message', { error });
      // Don't throw - let other plugins continue
    }
  });
}
```

### 2. Resource Cleanup

Clean up resources in the `destroy` method:

```javascript
async destroy() {
  if (this.timer) {
    clearInterval(this.timer);
  }
  if (this.connection) {
    await this.connection.close();
  }
}
```

### 3. Configuration

Use environment variables for sensitive data:

```javascript
async init(context) {
  this.apiKey = process.env.PLUGIN_API_KEY;
  if (!this.apiKey) {
    throw new Error('PLUGIN_API_KEY environment variable required');
  }
}
```

### 4. Logging

Use the provided logger for consistency:

```javascript
async init(context) {
  context.logger.info('Plugin starting...');
  context.logger.debug('Configuration:', { config: context.config });
}
```

### 5. Data Storage

Use the plugin data directory for files:

```javascript
const dataPath = path.join(context.dataDir, 'data.json');
fs.writeFileSync(dataPath, JSON.stringify(data));
```

## Security

### Sandboxing

Plugins run with restricted permissions. Only granted permissions are available.

### Permission Requests

Request only the permissions you need:

```json
{
    "permissions": [
        "discord:events" // Only request what's necessary
    ]
}
```

### Data Validation

Always validate external data:

```javascript
registerRoutes(router) {
  router.post('/data', (req, res) => {
    const { value } = req.body;

    if (!value || typeof value !== 'string') {
      return res.status(400).json({ error: 'Invalid input' });
    }

    // Process validated data
  });
}
```

### Rate Limiting

Respect rate limits when making external requests:

```javascript
// Use a rate limiter
const rateLimit = require('express-rate-limit');

registerRoutes(router) {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
  });

  router.use(limiter);
}
```

## Plugin Lifecycle

```
UNINITIALIZED → INITIALIZING → INITIALIZED → STARTING → RUNNING
                                     ↓
                                  STOPPED ← STOPPING
                                     ↓
                                  DESTROYED
```

### Lifecycle Methods

1. **init()** - Initialize plugin, set up resources
2. **start()** - Begin plugin operation
3. **stop()** - Pause plugin operation
4. **destroy()** - Clean up and unload plugin

## Testing Plugins

### Unit Testing

```javascript
// test/plugin.test.js
const plugin = require('../index.js');

describe('My Plugin', () => {
    it('should initialize', async () => {
        const context = createMockContext();
        await plugin.init(context);
        expect(context.logger.info).toHaveBeenCalledWith('Plugin initialized');
    });
});
```

### Integration Testing

Test with SpyWatcher's test environment:

```bash
cd backend
npm test -- plugins/my-plugin
```

## Troubleshooting

### Plugin Not Loading

1. Check manifest.json is valid JSON
2. Verify index.js exists and exports a plugin object
3. Check logs for error messages
4. Ensure dependencies are loaded first

### Permission Denied

1. Check required permissions in manifest.json
2. Verify permission names are correct
3. Restart SpyWatcher after adding permissions

### Plugin Crashes

1. Check error logs in console
2. Add try-catch blocks around async operations
3. Verify resource cleanup in destroy()

## API Reference

For complete API reference, see:

- [Plugin Types](./backend/src/plugins/types.ts)
- [Plugin Loader](./backend/src/plugins/PluginLoader.ts)
- [Plugin Manager](./backend/src/plugins/PluginManager.ts)

## Support

For questions and support:

- GitHub Issues: [discord-spywatcher/issues](https://github.com/subculture-collective/discord-spywatcher/issues)
- Documentation: [README.md](./README.md)

## Contributing

To contribute a plugin:

1. Create your plugin following this guide
2. Test thoroughly
3. Document usage and configuration
4. Submit a pull request

## License

Plugins should specify their own license. SpyWatcher core is licensed under [LICENSE](./LICENSE).
