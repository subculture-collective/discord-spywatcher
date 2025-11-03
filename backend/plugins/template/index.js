/**
 * Plugin Template
 * 
 * Use this template to create your own SpyWatcher plugin.
 * Replace this description with your plugin's purpose.
 */

module.exports = {
  // Required: Plugin manifest
  manifest: require('./manifest.json'),
  
  /**
   * Required: Initialize the plugin
   * Called once when the plugin is loaded
   * 
   * @param {PluginContext} context - Plugin context with services and configuration
   */
  async init(context) {
    // Store context for later use
    this.context = context;
    
    // Initialize your plugin here
    context.logger.info('Plugin initialized');
    
    // Access services based on permissions:
    // - context.discordClient (if discord:client permission)
    // - context.app (if api:routes permission)
    // - context.services.database (if database:access permission)
    // - context.services.cache (if cache:access permission)
    // - context.services.websocket (if websocket:access permission)
  },
  
  /**
   * Optional: Start the plugin
   * Called when the plugin should begin operation
   */
  async start() {
    this.context.logger.info('Plugin started');
    // Start any background tasks or services
  },
  
  /**
   * Optional: Stop the plugin
   * Called when the plugin should cease operation
   */
  async stop() {
    this.context.logger.info('Plugin stopped');
    // Stop any background tasks or services
  },
  
  /**
   * Optional: Destroy the plugin
   * Called when the plugin is being unloaded
   * Clean up all resources here
   */
  async destroy() {
    this.context.logger.info('Plugin destroyed');
    // Clean up resources (close connections, clear timers, etc.)
  },
  
  /**
   * Optional: Register hooks for events
   * Called during initialization if you want to listen to events
   * 
   * @param {PluginHookRegistry} hooks - Hook registry for registering event handlers
   */
  registerHooks(hooks) {
    // Discord event hooks
    hooks.register('discord:messageCreate', async (message, context) => {
      // Handle Discord message events
      context.logger.debug('Message received', { 
        author: message.author?.username,
        content: message.content 
      });
    });
    
    hooks.register('discord:presenceUpdate', async (data, context) => {
      // Handle Discord presence updates
      const { oldPresence, newPresence } = data || {};
      context.logger.debug('Presence updated', { 
        userId: newPresence?.userId 
      });
    });
    
    // Other available hooks:
    // - 'discord:ready'
    // - 'discord:guildMemberAdd'
    // - 'discord:guildMemberRemove'
    // - 'analytics:beforeCalculate'
    // - 'analytics:afterCalculate'
    // - 'api:request'
    // - 'api:response'
    // - 'websocket:connect'
    // - 'websocket:disconnect'
  },
  
  /**
   * Optional: Register API routes
   * Called during initialization if api:routes permission is granted
   * 
   * @param {Router} router - Express router for registering routes
   */
  registerRoutes(router) {
    // Routes are automatically prefixed with /api/plugins/{plugin-id}/
    
    // Example GET endpoint
    router.get('/hello', (req, res) => {
      res.json({ 
        message: 'Hello from plugin!',
        timestamp: new Date().toISOString()
      });
    });
    
    // Example POST endpoint
    router.post('/data', (req, res) => {
      const { data } = req.body;
      
      // Validate input
      if (!data) {
        return res.status(400).json({ error: 'Data required' });
      }
      
      // Process data
      this.context.logger.info('Data received', { data });
      
      res.json({ 
        success: true,
        received: data 
      });
    });
  },
  
  /**
   * Optional: Health check
   * Called periodically to check plugin status
   * 
   * @returns {PluginHealthStatus} Health status object
   */
  async healthCheck() {
    return {
      healthy: true,
      message: 'Plugin is operational',
      details: {
        // Add any relevant health information
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      }
    };
  }
};
