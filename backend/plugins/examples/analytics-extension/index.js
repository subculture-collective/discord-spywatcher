/**
 * Analytics Extension Plugin
 * 
 * Adds custom analytics endpoints for advanced data analysis.
 * Demonstrates API route registration and database access.
 */

module.exports = {
  manifest: require('./manifest.json'),
  
  /**
   * Initialize the plugin
   */
  async init(context) {
    this.context = context;
    this.db = context.services.database;
    this.cache = context.services.cache;
    
    context.logger.info('Analytics extension initialized');
  },
  
  /**
   * Register API routes
   */
  registerRoutes(router) {
    // GET /api/plugins/analytics-extension/stats
    router.get('/stats', async (req, res) => {
      try {
        const cacheKey = 'plugin:analytics:stats';
        
        // Check cache first
        if (this.cache) {
          const cached = await this.cache.get(cacheKey);
          if (cached) {
            return res.json(JSON.parse(cached));
          }
        }
        
        // Calculate stats
        const [messageCount, presenceCount, userCount] = await Promise.all([
          this.db.messageEvent.count(),
          this.db.presenceEvent.count(),
          this.db.user.count()
        ]);
        
        const stats = {
          messages: messageCount,
          presenceEvents: presenceCount,
          users: userCount,
          timestamp: new Date().toISOString()
        };
        
        // Cache for 5 minutes
        if (this.cache) {
          await this.cache.setex(cacheKey, 300, JSON.stringify(stats));
        }
        
        res.json(stats);
      } catch (error) {
        this.context.logger.error('Error fetching stats', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch stats' });
      }
    });
    
    // GET /api/plugins/analytics-extension/top-users
    router.get('/top-users', async (req, res) => {
      try {
        const limit = parseInt(req.query.limit) || 10;
        
        // Get top message senders
        const topUsers = await this.db.messageEvent.groupBy({
          by: ['userId', 'username'],
          _count: { userId: true },
          orderBy: { _count: { userId: 'desc' } },
          take: limit
        });
        
        res.json({
          topUsers: topUsers.map(u => ({
            userId: u.userId,
            username: u.username,
            messageCount: u._count.userId
          }))
        });
      } catch (error) {
        this.context.logger.error('Error fetching top users', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch top users' });
      }
    });
    
    // GET /api/plugins/analytics-extension/activity-timeline
    router.get('/activity-timeline', async (req, res) => {
      try {
        const hours = parseInt(req.query.hours) || 24;
        const since = new Date(Date.now() - hours * 60 * 60 * 1000);
        
        const messageActivity = await this.db.messageEvent.findMany({
          where: {
            createdAt: { gte: since }
          },
          select: {
            createdAt: true,
            channelId: true
          },
          orderBy: { createdAt: 'asc' }
        });
        
        // Group by hour
        const hourlyActivity = {};
        messageActivity.forEach(msg => {
          const hour = new Date(msg.createdAt).toISOString().slice(0, 13) + ':00:00';
          hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
        });
        
        res.json({
          hours,
          timeline: Object.entries(hourlyActivity).map(([hour, count]) => ({
            hour,
            count
          }))
        });
      } catch (error) {
        this.context.logger.error('Error fetching activity timeline', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch activity timeline' });
      }
    });
    
    // GET /api/plugins/analytics-extension/multi-client-summary
    router.get('/multi-client-summary', async (req, res) => {
      try {
        const multiClientEvents = await this.db.presenceEvent.findMany({
          where: {
            clients: { isEmpty: false }
          },
          select: {
            userId: true,
            username: true,
            clients: true,
            timestamp: true
          },
          orderBy: { timestamp: 'desc' },
          take: 100
        });
        
        // Count by user
        const userCounts = {};
        multiClientEvents.forEach(event => {
          if (event.clients.length > 1) {
            userCounts[event.userId] = (userCounts[event.userId] || 0) + 1;
          }
        });
        
        res.json({
          total: multiClientEvents.filter(e => e.clients.length > 1).length,
          topUsers: Object.entries(userCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([userId, count]) => ({ userId, count })),
          recent: multiClientEvents.slice(0, 10).map(e => ({
            userId: e.userId,
            username: e.username,
            clients: e.clients,
            timestamp: e.timestamp
          }))
        });
      } catch (error) {
        this.context.logger.error('Error fetching multi-client summary', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch multi-client summary' });
      }
    });
  },
  
  /**
   * Health check
   */
  async healthCheck() {
    const dbHealthy = !!this.db;
    const cacheHealthy = !!this.cache;
    
    return {
      healthy: dbHealthy,
      message: dbHealthy ? 'Analytics extension is operational' : 'Database not available',
      details: {
        database: dbHealthy ? 'connected' : 'disconnected',
        cache: cacheHealthy ? 'connected' : 'disconnected'
      }
    };
  }
};
