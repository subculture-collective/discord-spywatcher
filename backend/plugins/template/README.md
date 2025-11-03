# Plugin Template

This is a template for creating SpyWatcher plugins.

## Quick Start

1. Copy this template directory to a new plugin directory:
   ```bash
   cp -r backend/plugins/template backend/plugins/my-plugin
   ```

2. Edit `manifest.json`:
   - Change `id` to your plugin's unique identifier
   - Update `name`, `author`, and `description`
   - Add required `permissions`

3. Edit `index.js`:
   - Implement your plugin logic
   - Add hooks for events you want to monitor
   - Register API routes if needed

4. Test your plugin:
   ```bash
   # Restart SpyWatcher to load the plugin
   npm run dev:api
   ```

## Plugin Structure

```
my-plugin/
├── manifest.json      # Plugin metadata and permissions
├── index.js          # Plugin implementation
├── README.md         # Plugin documentation
└── package.json      # Optional: if you need npm dependencies
```

## Available Permissions

Choose the permissions your plugin needs:

- `discord:client` - Access Discord bot client
- `discord:events` - Listen to Discord events
- `api:routes` - Register API routes
- `api:middleware` - Register Express middleware
- `database:access` - Access Prisma database
- `cache:access` - Access Redis cache
- `websocket:access` - Access WebSocket service
- `monitoring:access` - Access monitoring/metrics
- `fs:access` - File system access (restricted to plugin data dir)
- `network:access` - Make HTTP requests

## Plugin Lifecycle

1. **init()** - Plugin is loaded and initialized
2. **start()** - Plugin begins operation (optional)
3. **running** - Plugin is active and processing events
4. **stop()** - Plugin stops operation (optional)
5. **destroy()** - Plugin is unloaded and cleaned up

## Hooks

Available event hooks:

### Discord Hooks
- `discord:ready` - Bot is ready
- `discord:presenceUpdate` - User presence changed
- `discord:messageCreate` - New message
- `discord:guildMemberAdd` - Member joined
- `discord:guildMemberRemove` - Member left

### Analytics Hooks
- `analytics:beforeCalculate` - Before analytics calculation
- `analytics:afterCalculate` - After analytics calculation

### API Hooks
- `api:request` - API request received
- `api:response` - API response sent

### WebSocket Hooks
- `websocket:connect` - Client connected
- `websocket:disconnect` - Client disconnected

## Testing

Create tests for your plugin:

```javascript
// test/plugin.test.js
const plugin = require('../index.js');

describe('My Plugin', () => {
  it('should initialize', async () => {
    const context = createMockContext();
    await plugin.init(context);
    expect(context.logger.info).toHaveBeenCalled();
  });
});
```

## Documentation

Document your plugin:
- What it does
- How to install it
- Configuration options
- API endpoints (if any)
- Example usage

## Publishing

To share your plugin:
1. Publish to npm or GitHub
2. Include installation instructions
3. Add examples and documentation
4. Test with different SpyWatcher versions

## Support

For questions:
- [Plugin System Documentation](../../PLUGIN_SYSTEM.md)
- [GitHub Issues](https://github.com/subculture-collective/discord-spywatcher/issues)
