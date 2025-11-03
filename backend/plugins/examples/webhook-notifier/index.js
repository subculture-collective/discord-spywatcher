/**
 * Webhook Notifier Plugin
 * 
 * Sends notifications to external webhooks for important events.
 * Demonstrates network access and event monitoring.
 */

const https = require('https');
const http = require('http');
const url = require('url');

module.exports = {
  manifest: require('./manifest.json'),
  
  /**
   * Initialize the plugin
   */
  async init(context) {
    this.context = context;
    this.webhookUrl = process.env.WEBHOOK_NOTIFIER_URL;
    this.notificationCount = 0;
    this.eventThresholds = {
      multiClient: 1, // Notify on first occurrence
      typingSpeed: 100 // ms
    };
    
    if (!this.webhookUrl) {
      context.logger.warn('WEBHOOK_NOTIFIER_URL not set, notifications disabled');
    } else {
      context.logger.info('Webhook notifier initialized', { 
        webhookUrl: this.maskUrl(this.webhookUrl) 
      });
    }
  },
  
  /**
   * Start the plugin
   */
  async start() {
    this.context.logger.info('Webhook notifier started');
  },
  
  /**
   * Stop the plugin
   */
  async stop() {
    this.context.logger.info('Webhook notifier stopped', {
      totalNotifications: this.notificationCount
    });
  },
  
  /**
   * Register hooks for events
   */
  registerHooks(hooks) {
    // Monitor for multi-client logins
    hooks.register('discord:presenceUpdate', async (data, context) => {
      try {
        const { newPresence } = data || {};
        if (!newPresence) return;
        
        const platforms = Object.keys(newPresence.clientStatus || {});
        
        if (platforms.length > 1) {
          await this.sendNotification({
            event: 'multi-client',
            severity: 'warning',
            title: 'Multi-Client Login Detected',
            description: `User ${newPresence.user?.username || 'Unknown'} is online on multiple clients`,
            details: {
              userId: newPresence.userId,
              username: newPresence.user?.username,
              platforms: platforms.join(', '),
              timestamp: new Date().toISOString()
            }
          });
        }
      } catch (error) {
        context.logger.error('Error in presence update hook', { error: error.message });
      }
    });
    
    // Monitor for suspicious message patterns
    hooks.register('discord:messageCreate', async (message, context) => {
      try {
        if (message.author?.bot) return;
        
        // Check for very long messages (potential spam)
        if (message.content && message.content.length > 1000) {
          await this.sendNotification({
            event: 'suspicious-message',
            severity: 'info',
            title: 'Long Message Detected',
            description: `User sent a very long message (${message.content.length} characters)`,
            details: {
              userId: message.author.id,
              username: message.author.username,
              channelId: message.channelId,
              messageLength: message.content.length,
              timestamp: new Date().toISOString()
            }
          });
        }
      } catch (error) {
        context.logger.error('Error in message create hook', { error: error.message });
      }
    });
  },
  
  /**
   * Send notification to webhook
   */
  async sendNotification(data) {
    if (!this.webhookUrl) {
      return;
    }
    
    try {
      const payload = JSON.stringify({
        event: data.event,
        severity: data.severity,
        title: data.title,
        description: data.description,
        details: data.details,
        source: 'SpyWatcher',
        timestamp: new Date().toISOString()
      });
      
      await this.makeRequest(this.webhookUrl, payload);
      this.notificationCount++;
      
      this.context.logger.debug('Notification sent', { 
        event: data.event,
        count: this.notificationCount 
      });
    } catch (error) {
      this.context.logger.error('Failed to send notification', { 
        error: error.message,
        event: data.event 
      });
    }
  },
  
  /**
   * Make HTTP/HTTPS request
   */
  makeRequest(webhookUrl, payload) {
    return new Promise((resolve, reject) => {
      const parsedUrl = url.parse(webhookUrl);
      const protocol = parsedUrl.protocol === 'https:' ? https : http;
      
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };
      
      const req = protocol.request(options, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
      
      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  },
  
  /**
   * Mask URL for logging
   */
  maskUrl(urlString) {
    try {
      const parsed = url.parse(urlString);
      return `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`;
    } catch {
      return '[masked]';
    }
  },
  
  /**
   * Health check
   */
  async healthCheck() {
    const configured = !!this.webhookUrl;
    
    return {
      healthy: true,
      message: configured ? 'Webhook notifier is operational' : 'Webhook URL not configured',
      details: {
        configured,
        notificationsSent: this.notificationCount,
        webhookUrl: configured ? this.maskUrl(this.webhookUrl) : 'not set'
      }
    };
  }
};
