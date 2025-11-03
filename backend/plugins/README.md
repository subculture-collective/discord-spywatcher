# SpyWatcher Plugins

This directory contains plugins for extending SpyWatcher functionality.

## Directory Structure

```
plugins/
├── examples/          # Example plugins demonstrating features
│   ├── message-logger/
│   ├── analytics-extension/
│   └── webhook-notifier/
├── template/          # Template for creating new plugins
└── README.md          # This file
```

## Getting Started

### Quick Start

1. **Use the template** to create a new plugin:
   ```bash
   cp -r template my-plugin
   cd my-plugin
   ```

2. **Edit manifest.json**:
   - Change the `id`, `name`, `author`, and `description`
   - Add required `permissions`

3. **Implement your plugin** in `index.js`:
   - Implement the `init()` method (required)
   - Add hooks with `registerHooks()` (optional)
   - Register API routes with `registerRoutes()` (optional)

4. **Restart SpyWatcher** to load your plugin

### Example Plugins

We provide three example plugins to help you get started:

#### 1. Message Logger
- **Path**: `examples/message-logger/`
- **Purpose**: Logs all Discord messages to a file
- **Features**: Basic plugin structure, Discord event hooks, file I/O

#### 2. Analytics Extension
- **Path**: `examples/analytics-extension/`
- **Purpose**: Adds custom analytics endpoints
- **Features**: API routes, database access, Redis caching

#### 3. Webhook Notifier
- **Path**: `examples/webhook-notifier/`
- **Purpose**: Sends notifications to external webhooks
- **Features**: Discord event monitoring, HTTP requests, configuration

## Plugin Development

### Plugin Structure

Each plugin must have:
- `manifest.json` - Plugin metadata and configuration
- `index.js` - Plugin implementation
- `README.md` - Plugin documentation (recommended)

### Manifest Format

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "What your plugin does",
  "permissions": ["discord:events", "api:routes"]
}
```

### Plugin Interface

```javascript
module.exports = {
  manifest: require('./manifest.json'),
  
  // Required
  async init(context) {
    // Initialize plugin
  },
  
  // Optional
  async start() {},
  async stop() {},
  async destroy() {},
  registerHooks(hooks) {},
  registerRoutes(router) {},
  async healthCheck() {}
};
```

## Permissions

Plugins must declare required permissions:

- `discord:client` - Access Discord bot client
- `discord:events` - Listen to Discord events
- `api:routes` - Register API routes
- `api:middleware` - Register Express middleware
- `database:access` - Access database
- `cache:access` - Access Redis cache
- `websocket:access` - Access WebSocket service
- `monitoring:access` - Access monitoring/metrics
- `fs:access` - File system access (restricted)
- `network:access` - Make HTTP requests

## Plugin API

### Context Object

The plugin context provides access to services:

```javascript
context.discordClient  // Discord bot client
context.app            // Express app
context.config         // Plugin configuration
context.dataDir        // Plugin data directory
context.logger         // Logger instance
context.events         // Event emitter
context.services       // Services (database, cache, websocket)
```

### Event Hooks

Available hooks:
- `discord:ready`
- `discord:presenceUpdate`
- `discord:messageCreate`
- `discord:guildMemberAdd`
- `discord:guildMemberRemove`
- `analytics:beforeCalculate`
- `analytics:afterCalculate`
- `api:request`
- `api:response`
- `websocket:connect`
- `websocket:disconnect`

### API Routes

Plugins can register custom routes:

```javascript
registerRoutes(router) {
  // Routes are prefixed with /api/plugins/{plugin-id}/
  router.get('/hello', (req, res) => {
    res.json({ message: 'Hello!' });
  });
}
```

## Testing Plugins

### Manual Testing

1. Place plugin in `plugins/` directory
2. Restart SpyWatcher
3. Check logs for initialization messages
4. Test API endpoints (if any)
5. Verify functionality

### API Testing

```bash
# Get all plugins
curl http://localhost:3001/api/plugins

# Get plugin details
curl http://localhost:3001/api/plugins/my-plugin

# Get plugin health
curl http://localhost:3001/api/plugins/my-plugin/health

# Start plugin
curl -X POST http://localhost:3001/api/plugins/my-plugin/start

# Stop plugin
curl -X POST http://localhost:3001/api/plugins/my-plugin/stop
```

## Best Practices

1. **Error Handling**: Always catch and log errors
2. **Resource Cleanup**: Clean up resources in `destroy()`
3. **Logging**: Use the provided logger
4. **Configuration**: Use environment variables for secrets
5. **Documentation**: Document your plugin's purpose and usage
6. **Testing**: Test your plugin thoroughly
7. **Permissions**: Request only needed permissions
8. **Versioning**: Follow semantic versioning

## Security

- Plugins run with restricted permissions
- Only granted permissions are available
- File system access is limited to plugin data directory
- Network access can be restricted
- Validate all external input

## Troubleshooting

### Plugin Not Loading

- Check `manifest.json` is valid JSON
- Verify `index.js` exists and exports correctly
- Check console logs for errors
- Ensure dependencies are loaded first

### Permission Denied

- Add required permissions to `manifest.json`
- Restart SpyWatcher after changes

### Plugin Crashes

- Add error handling in your code
- Check error logs
- Verify resource cleanup

## Documentation

For complete documentation, see:
- [Plugin System Documentation](../../PLUGIN_SYSTEM.md)
- [Plugin API Reference](../../backend/src/plugins/)
- [Contributing Guide](../../CONTRIBUTING.md)

## Support

For questions and support:
- GitHub Issues: [discord-spywatcher/issues](https://github.com/subculture-collective/discord-spywatcher/issues)
- Documentation: [PLUGIN_SYSTEM.md](../../PLUGIN_SYSTEM.md)

## Contributing

To contribute a plugin:
1. Create your plugin following this guide
2. Test thoroughly
3. Document usage and configuration
4. Submit a pull request

## License

Plugins should specify their own license. SpyWatcher core is licensed under [LICENSE](../../LICENSE).
