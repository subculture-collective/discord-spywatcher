/**
 * Message Logger Plugin
 * 
 * Logs all Discord messages to a file for later analysis.
 * Demonstrates basic plugin structure and Discord event hooks.
 */

const fs = require('fs');
const path = require('path');

module.exports = {
  manifest: require('./manifest.json'),
  
  /**
   * Initialize the plugin
   */
  async init(context) {
    this.context = context;
    this.logFile = path.join(context.dataDir, 'messages.log');
    this.messageCount = 0;
    
    // Create log file if it doesn't exist
    if (!fs.existsSync(this.logFile)) {
      fs.writeFileSync(this.logFile, '# Message Log\n# Started: ' + new Date().toISOString() + '\n\n');
    }
    
    context.logger.info('Message logger initialized', { logFile: this.logFile });
  },
  
  /**
   * Start the plugin
   */
  async start() {
    this.context.logger.info('Message logger started');
  },
  
  /**
   * Stop the plugin
   */
  async stop() {
    this.context.logger.info('Message logger stopped', { 
      totalMessages: this.messageCount 
    });
  },
  
  /**
   * Register hooks for Discord events
   */
  registerHooks(hooks) {
    // Hook into message creation events
    hooks.register('discord:messageCreate', async (message, context) => {
      try {
        // Skip bot messages
        if (message.author?.bot) {
          return;
        }
        
        // Format log entry
        const timestamp = new Date().toISOString();
        const author = message.author?.username || 'Unknown';
        const channel = message.channel?.name || message.channelId;
        const content = message.content || '[No content]';
        
        const logEntry = `[${timestamp}] ${author} in #${channel}: ${content}\n`;
        
        // Append to log file
        fs.appendFileSync(this.logFile, logEntry);
        this.messageCount++;
        
        // Log every 100 messages
        if (this.messageCount % 100 === 0) {
          context.logger.info('Logged messages', { count: this.messageCount });
        }
      } catch (error) {
        context.logger.error('Error logging message', { error: error.message });
      }
    });
  },
  
  /**
   * Health check
   */
  async healthCheck() {
    return {
      healthy: true,
      message: 'Message logger is operational',
      details: {
        messageCount: this.messageCount,
        logFile: this.logFile,
        logFileExists: fs.existsSync(this.logFile)
      }
    };
  }
};
