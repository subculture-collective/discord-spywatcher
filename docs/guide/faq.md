# Frequently Asked Questions

Your complete guide to common questions about Spywatcher. Use `Ctrl+F` or `Cmd+F` to search for specific topics.

::: tip Quick Navigation
Jump to: [General](#general) | [Setup](#setup-and-configuration) | [Features](#features) | [Privacy](#privacy-and-security) | [Technical](#technical) | [Troubleshooting](#troubleshooting) | [Performance](#performance-and-limits) | [Best Practices](#best-practices)
:::

## General

### What is Spywatcher?

Spywatcher is a comprehensive Discord surveillance and analytics platform that monitors user presence, activity patterns, and behavior to provide actionable insights about your server. It combines:
- **Real-time monitoring**: Track user presence and activity as it happens
- **Advanced analytics**: Deep insights into community behavior
- **Automated detection**: Identify ghosts, lurkers, and suspicious accounts
- **Visualization tools**: Charts, heatmaps, and timelines
- **Security features**: Suspicion scoring and behavior analysis

### Is Spywatcher free?

Spywatcher has multiple tiers to suit different needs:

| Tier | Price | Features | Best For |
|------|-------|----------|----------|
| **FREE** | $0 | Basic features, 1,000 API calls/day | Small servers, testing |
| **PRO** | Custom | Advanced features, 100,000 calls/day | Growing communities |
| **ENTERPRISE** | Custom | Full features, unlimited access | Large servers, organizations |

See our [pricing page](https://spywatcher.com/pricing) for detailed feature comparisons.

### Is Spywatcher open source?

Yes! Spywatcher is fully open source under the MIT License. You can:
- View the source code on [GitHub](https://github.com/subculture-collective/discord-spywatcher)
- Self-host your own instance
- Contribute improvements
- Create custom plugins
- Fork and modify as needed

### What makes Spywatcher different from other Discord bots?

Spywatcher stands out because it:
- **Focuses on analytics**: Deep insights beyond basic stats
- **Detects patterns**: Advanced algorithms for ghost/lurker detection
- **Provides visualization**: Interactive charts and heatmaps
- **Offers a full dashboard**: Web interface, not just bot commands
- **Includes API access**: Integrate with external tools
- **Supports plugins**: Extend functionality
- **Prioritizes privacy**: Configurable data collection and retention

### Is my data secure?

Absolutely. Spywatcher implements enterprise-grade security:
- ✅ **Discord OAuth2**: Industry-standard authentication
- ✅ **Encrypted storage**: Database encryption at rest
- ✅ **Secure transmission**: HTTPS/TLS for all connections
- ✅ **Access controls**: Role-based permissions
- ✅ **Privacy controls**: Configurable data retention
- ✅ **Regular audits**: Security scanning and updates
- ✅ **Compliance**: GDPR considerations built-in

### Can I try Spywatcher without installing?

Currently, Spywatcher requires installation. However:
- **Docker installation** takes just 5 minutes
- **Free tier** lets you try all basic features
- **Local hosting** means your data stays private
- **Demo videos** available in our [tutorials](./tutorials)

We're working on a hosted demo instance. Join our newsletter for updates!

## Setup and Configuration

### How do I install Spywatcher?

The easiest method is using Docker. You have several options:

**1. Docker (Recommended)** - 5 minutes
```bash
git clone https://github.com/subculture-collective/discord-spywatcher.git
cd discord-spywatcher
cp .env.example .env
# Edit .env with your Discord credentials
docker-compose -f docker-compose.dev.yml up
```

**2. Manual Installation** - 15 minutes
- Install Node.js 18+, PostgreSQL 14+, Redis 6+
- Clone repository and configure
- Run backend and frontend separately

**3. Kubernetes** - For production deployments
- Use provided Helm charts or manifests
- See [Deployment Guide](/developer/deployment)

For complete instructions, see the [Installation Guide](./installation).

### What are the system requirements?

**Minimum Requirements:**
- **CPU**: 2 cores
- **RAM**: 4 GB
- **Storage**: 20 GB
- **Network**: Stable internet connection

**Recommended for Production:**
- **CPU**: 4+ cores
- **RAM**: 8+ GB
- **Storage**: 100+ GB SSD
- **Network**: High-speed connection, static IP

**Software Dependencies:**
- Node.js 18 or higher
- PostgreSQL 14 or higher
- Redis 6 or higher
- Docker 20+ (if using Docker)

### What permissions does the bot need?

**Required Discord Permissions:**

| Permission | Purpose | Required |
|------------|---------|----------|
| **View Channels** | See server structure | ✅ Yes |
| **Read Message History** | Track message activity | ✅ Yes |
| **View Server Insights** | Access member data | ✅ Yes |

**Privileged Gateway Intents** (must be enabled in Discord Developer Portal):

| Intent | Purpose | Required |
|--------|---------|----------|
| **Presence Intent** | Track online/offline status | ✅ Yes |
| **Server Members Intent** | Access member information | ✅ Yes |
| **Message Content Intent** | Read message text (optional feature) | ⚠️ Optional |

::: warning Important
Privileged intents must be enabled in the [Discord Developer Portal](https://discord.com/developers/applications) under your bot's settings.
:::

### How do I create a Discord bot?

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Give it a name (e.g., "Spywatcher")
4. Navigate to the "Bot" section
5. Click "Add Bot"
6. Under "Privileged Gateway Intents", enable:
   - Presence Intent
   - Server Members Intent
   - Message Content Intent (optional)
7. Copy the bot token for your `.env` file
8. Navigate to "OAuth2" → "URL Generator"
9. Select scopes: `bot`, `applications.commands`
10. Select permissions: see list above
11. Copy the generated URL and open it in your browser
12. Select your server and authorize the bot

See our [Discord OAuth Setup Guide](./oauth-setup) for detailed instructions with screenshots.

### Can I monitor multiple servers?

Yes! Spywatcher supports monitoring multiple Discord servers simultaneously. 

**How it works:**
- Add the bot to multiple servers using the same OAuth URL
- Each server's data is kept separate
- Switch between servers using the server selector in the navigation bar
- Configure different settings for each server
- View cross-server analytics (if enabled)

**Requirements:**
- Bot must be present in each server
- You need appropriate permissions in each server
- Sufficient system resources for the number of servers

**Limitations:**
- Free tier: Up to 3 servers
- Pro tier: Up to 10 servers
- Enterprise tier: Unlimited servers

### How do I configure environment variables?

Environment variables are configured in `.env` files:

**Backend** (`backend/.env`):
```bash
# Required
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_REDIRECT_URI=http://localhost:5173/auth/callback
JWT_SECRET=your_32_char_secret
JWT_REFRESH_SECRET=your_32_char_refresh_secret

# Optional
DATABASE_URL=postgresql://user:pass@localhost:5432/spywatcher
REDIS_URL=redis://localhost:6379
PORT=3001
NODE_ENV=development
```

**Frontend** (`frontend/.env`):
```bash
VITE_API_URL=http://localhost:3001/api
VITE_DISCORD_CLIENT_ID=your_client_id
VITE_ENVIRONMENT=development
```

**Generate secure secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

See the [Environment Variables Guide](/admin/environment) for all available options.

### What if I'm behind a firewall?

If you're running Spywatcher behind a firewall:

**Required Ports:**
- **3001**: Backend API (configurable)
- **5173**: Frontend (configurable)
- **5432**: PostgreSQL database
- **6379**: Redis cache

**Outbound Connections Required:**
- Discord API: `discord.com`, `discordapp.com`
- CDN: `cdn.discordapp.com`

**Firewall Configuration:**
1. Allow outbound HTTPS (443) to Discord domains
2. If exposing publicly, configure port forwarding
3. Use reverse proxy (nginx) for production
4. Consider VPN if connecting to cloud database

### How do I update Spywatcher?

**Docker Installation:**
```bash
# Pull latest code
git pull origin main

# Rebuild containers
docker-compose down
docker-compose -f docker-compose.dev.yml build
docker-compose -f docker-compose.dev.yml up

# Run database migrations
docker-compose exec backend npm run db:migrate
```

**Manual Installation:**
```bash
# Pull latest code
git pull origin main

# Update dependencies
cd backend && npm install
cd frontend && npm install

# Run migrations
cd backend && npx prisma migrate deploy

# Restart services
npm run dev
```

**Important:** Always backup your database before updating!

### Can I use a different database?

Spywatcher officially supports PostgreSQL. However:

- **PostgreSQL** (recommended): Full feature support
- **SQLite**: Supported for development only
- **MySQL/MariaDB**: Not officially supported
- **MongoDB**: Not supported (relational data model required)

For production, we strongly recommend PostgreSQL for:
- Better performance at scale
- Advanced indexing capabilities
- Robust transaction support
- Better concurrent access handling

## Features

### What is ghost detection?

Ghost detection is an algorithm that identifies users who are frequently online but rarely participate in the community. 

**Detection criteria:**
- High presence time (online often)
- Low message count (rarely talks)
- Minimal engagement (no reactions, mentions)
- Suspicious patterns (unusual hours, client types)

**Why it matters:**
- Identify potential bot accounts
- Find inactive members
- Detect surveillance accounts
- Optimize community engagement

**How to use it:**
1. Navigate to Analytics → Ghost Detection
2. Review the list of detected ghosts
3. Click on a user for detailed analysis
4. Take appropriate action (monitor, contact, or ban)

See the complete [Ghost Detection Guide](./ghost-detection) for advanced usage.

### How are suspicion scores calculated?

Suspicion scores (0-100) are calculated using a weighted algorithm that considers:

**Score Components:**
- **Activity Anomalies** (25%): Unusual patterns compared to baseline
- **Client Behavior** (20%): Suspicious device/client combinations
- **Presence Patterns** (20%): Irregular online/offline cycles
- **Interaction Metrics** (20%): Message and engagement patterns
- **Historical Changes** (15%): Sudden behavioral shifts

**Score Interpretation:**
- 0-20: Normal behavior (green)
- 21-40: Minor anomalies (yellow)
- 41-60: Moderate concern (orange)
- 61-80: High suspicion (red)
- 81-100: Critical risk (dark red)

**What influences scores:**
- ✅ Multi-client logins
- ✅ Unusual activity times
- ✅ Rapid presence changes
- ✅ Message pattern changes
- ✅ Role privilege escalation

See [Suspicion Scores Guide](./suspicion-scores) for detailed methodology.

### Can I export data?

Yes! Spywatcher supports multiple export formats:

**Export Formats:**
- **CSV**: Spreadsheet-compatible, great for analysis
- **JSON**: Programmatic access, API integration
- **PDF**: Professional reports with charts
- **Excel**: Advanced spreadsheet format (Pro tier)

**What you can export:**
- User lists with analytics
- Activity reports
- Ghost detection results
- Suspicion score reports
- Timeline data
- Heatmap visualizations
- Custom filtered data

**How to export:**
1. Navigate to any data view (Analytics, Ghosts, etc.)
2. Apply desired filters
3. Click "Export" button (top-right)
4. Select format
5. Choose data range and options
6. Download file

::: tip Automated Reports
Pro and Enterprise tiers can schedule automated report generation and delivery via email or webhook.
:::

### Does Spywatcher work with voice channels?

Yes, but with limitations:

**What Spywatcher tracks:**
- ✅ Voice channel join/leave events
- ✅ Time spent in voice channels
- ✅ Voice channel presence
- ✅ Mute/deafen status changes

**What Spywatcher does NOT track:**
- ❌ Voice call content/audio
- ❌ Screen sharing content
- ❌ Video feeds
- ❌ Private voice conversations

**Use cases:**
- Identify voice-only users
- Track voice activity patterns
- Correlate voice with text activity
- Monitor voice channel usage

### Can I customize the dashboard?

Yes! The dashboard is highly customizable:

**Layout Options:**
- Rearrange cards via drag-and-drop
- Show/hide specific metrics
- Adjust card sizes
- Create multiple dashboard views
- Save custom layouts per server

**Theme Customization:**
- Light, dark, or auto mode
- Custom color schemes (Pro tier)
- Font size adjustments
- Compact or comfortable view
- High contrast mode for accessibility

**Widget Options:**
- Choose which analytics to display
- Set default date ranges
- Configure auto-refresh intervals
- Pin favorite views
- Create custom metric cards

**How to customize:**
1. Click Settings → Dashboard
2. Toggle "Edit Mode"
3. Drag cards to rearrange
4. Click (x) to hide cards
5. Click "Add Widget" for new cards
6. Save your layout

### What analytics are available?

Spywatcher provides comprehensive analytics across multiple categories:

**User Analytics:**
- Total user count over time
- Active vs inactive users
- New member trends
- Member retention rates
- User activity levels
- Role distribution

**Activity Analytics:**
- Message volume trends
- Peak activity times
- Channel usage statistics
- Engagement metrics
- Response time analysis

**Behavior Analytics:**
- Ghost detection
- Lurker identification
- Suspicion scoring
- Behavior pattern analysis
- Anomaly detection

**Presence Analytics:**
- Online/offline patterns
- Client type distribution
- Multi-client detection
- Presence duration
- Activity heatmaps

**Role Analytics:**
- Role distribution
- Role changes over time
- Permission drift tracking
- Role hierarchy analysis

See [Analytics Guide](./analytics) for detailed information on each type.

### How does the heatmap work?

The heatmap visualizes activity patterns across time dimensions:

**What it shows:**
- **X-axis**: Time of day (24 hours)
- **Y-axis**: Day of week (Monday-Sunday)
- **Color intensity**: Activity level (darker = more active)
- **Hover details**: Specific counts and percentages

**Use cases:**
- **Identify peak times**: Schedule events when most users are active
- **Optimize moderation**: Staff coverage during busy periods
- **Detect patterns**: Unusual activity spikes
- **Compare periods**: Week-over-week changes

**Customization:**
- Filter by date range
- Filter by specific users or roles
- Toggle between message/presence activity
- Adjust color scheme
- Export as image

See [Heatmap Guide](./heatmap) for detailed usage.

### Can I set up alerts and notifications?

Yes! Spywatcher supports comprehensive alerting:

**Alert Types:**
- **Ghost Detection**: New ghosts identified
- **High Suspicion**: Users exceeding threshold
- **Ban Events**: User banned/unbanned
- **System Alerts**: Application issues
- **Custom Rules**: User-defined triggers

**Notification Channels:**
- **In-App**: Dashboard notifications
- **Email**: Sent to your email address
- **Discord**: DM or channel webhook
- **Webhook**: External integrations
- **SMS**: Critical alerts (Enterprise tier)

**Configuration:**
1. Settings → Notifications
2. Enable desired alert types
3. Set thresholds and conditions
4. Choose notification channels
5. Configure quiet hours
6. Test notifications

**Alert Rules:**
```javascript
// Example: Alert on suspicion score > 70
{
  "trigger": "suspicion_score",
  "condition": ">",
  "value": 70,
  "channels": ["email", "discord"]
}
```

### Does Spywatcher have mobile support?

Yes! The Spywatcher dashboard is mobile-responsive:

**Mobile Features:**
- ✅ Fully responsive design
- ✅ Touch-optimized interface
- ✅ Mobile-friendly charts
- ✅ Swipe gestures for navigation
- ✅ Mobile notifications
- ✅ Offline mode (limited)

**Best Experience:**
- Modern mobile browsers (Chrome, Safari, Firefox)
- Tablet-optimized layouts
- Portrait and landscape modes
- Install as PWA (Progressive Web App)

**Limitations on Mobile:**
- Some advanced features require desktop
- Large data exports better on desktop
- Complex timeline views optimized for desktop
- Plugin management requires desktop

**Install as App:**
1. Open Spywatcher in mobile browser
2. Tap browser menu
3. Select "Add to Home Screen"
4. Launch like a native app

### What integrations are available?

Spywatcher integrates with various services:

**Built-in Integrations:**
- **Discord**: Native OAuth and bot integration
- **Webhooks**: Send data to external services
- **API**: RESTful API for custom integrations
- **WebSocket**: Real-time event streaming

**Third-Party Tools:**
- **Monitoring**: Prometheus, Grafana
- **Logging**: Loki, ELK Stack
- **Error Tracking**: Sentry
- **Analytics**: Google Analytics (optional)

**Available via Plugins:**
- Message archival services
- Backup solutions
- External databases
- Custom analytics platforms
- Ticketing systems

**Coming Soon:**
- Slack integration
- Teams integration
- Google Sheets export
- Zapier/Make.com connectors

See [Integration Guide](/admin/integrations) for setup instructions.

## Privacy and Security

### What data does Spywatcher collect?

Spywatcher collects:
- User presence events
- Message counts (not content by default)
- User roles and permissions
- Timestamp data

### Can users opt out?

Yes, users can request data deletion and opt out of tracking through privacy settings.

### Is message content stored?

By default, only message counts are stored, not content. Message content tracking can be enabled but requires explicit consent.

### Who can see the analytics?

Only server administrators and users with appropriate permissions can access analytics for their servers.

## Technical

### What tech stack is used?

- Backend: Node.js, Express, TypeScript, Prisma
- Frontend: React, Vite, Tailwind CSS
- Database: PostgreSQL
- Cache: Redis
- Bot: discord.js

### Can I self-host Spywatcher?

Yes! Spywatcher is open-source. See the [Installation Guide](./installation) and [Deployment Guide](/developer/deployment).

### Is there an API?

Yes! Spywatcher provides a comprehensive REST API. See [API Documentation](/api/).

### How do I contribute?

See the [Contributing Guide](/developer/contributing) for information on contributing to Spywatcher.

## Troubleshooting

### Bot is offline

Check:
1. Bot token is correct
2. Privileged intents are enabled
3. Bot has been invited to server
4. Backend service is running

### No data showing

Ensure:
1. Bot has been running for some time
2. Bot has proper permissions
3. Users are active in the server
4. Date range filters are appropriate

### Authentication fails

Try:
1. Clearing browser cache
2. Using different browser
3. Checking OAuth2 configuration
4. Re-inviting the bot

For more issues, see [Troubleshooting](./troubleshooting).

## Support

### How do I get help?

- Read the documentation
- Check [GitHub Issues](https://github.com/subculture-collective/discord-spywatcher/issues)
- Join the community Discord (coming soon)

### How do I report bugs?

Open an issue on [GitHub](https://github.com/subculture-collective/discord-spywatcher/issues) with:
- Description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Logs and error messages

### How do I request features?

Open a feature request on [GitHub Issues](https://github.com/subculture-collective/discord-spywatcher/issues) with:
- Description of the feature
- Use case
- Why it would be valuable

## Performance and Limits

### How many users can Spywatcher handle?

Spywatcher scales based on your infrastructure:

**Small Deployments** (< 5,000 users):
- Minimum system requirements sufficient
- Single-server setup works well
- Low resource usage

**Medium Deployments** (5,000-50,000 users):
- Recommended system requirements
- Consider Redis caching
- Monitor database performance

**Large Deployments** (50,000-500,000 users):
- High-end hardware required
- Multi-server architecture recommended
- Database optimization essential
- Load balancing advised

**Enterprise Scale** (500,000+ users):
- Kubernetes cluster deployment
- Horizontal scaling
- Database sharding
- CDN for static assets
- See [Scaling Guide](/developer/scaling)

### What are the API rate limits?

API rate limits vary by tier:

| Tier | Requests/Minute | Daily Quota | Burst Limit |
|------|-----------------|-------------|-------------|
| **Free** | 60 | 1,000 | 100 |
| **Pro** | 600 | 100,000 | 1,000 |
| **Enterprise** | Custom | Unlimited | Custom |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640000000
```

**Handling Rate Limits:**
- Implement exponential backoff
- Cache responses when possible
- Batch requests efficiently
- Monitor usage in dashboard

See [API Rate Limiting](/api/rate-limiting) for details.

### How much disk space do I need?

Storage requirements depend on:

**Base Installation:** ~2 GB
- Application code
- Dependencies
- System files

**Database Growth:** Varies by activity
- Low activity (< 100 messages/day): ~10 MB/month
- Medium activity (100-1,000 messages/day): ~100 MB/month
- High activity (1,000+ messages/day): ~1 GB/month

**Recommended Storage:**
- **Small servers**: 20 GB
- **Medium servers**: 100 GB
- **Large servers**: 500 GB+

**Storage Optimization:**
- Configure data retention policies
- Enable database compression
- Archive old data
- Use external object storage for exports

### How does data retention work?

Data retention is configurable:

**Default Retention:**
- **User data**: Indefinite (until deleted)
- **Activity logs**: 90 days
- **Presence events**: 30 days
- **System logs**: 14 days
- **Exports**: 7 days

**Customization:**
1. Settings → Data Retention
2. Set retention periods per data type
3. Enable automatic cleanup
4. Configure archive policies

**Manual Cleanup:**
```bash
# Delete old presence data
npm run cleanup:presence --older-than=30d

# Archive historical data
npm run archive --before=2024-01-01

# Clear old exports
npm run cleanup:exports
```

**GDPR Compliance:**
- User data deletion on request
- Export user data
- Right to be forgotten
- Data processing agreements

### Can Spywatcher run on shared hosting?

Generally no, but with caveats:

**Requirements for Hosting:**
- ✅ Node.js 18+ support
- ✅ PostgreSQL database access
- ✅ Redis instance
- ✅ Persistent processes
- ✅ WebSocket support
- ✅ Sufficient resources

**Recommended Hosting:**
- **VPS**: DigitalOcean, Linode, Vultr
- **Cloud**: AWS, Google Cloud, Azure
- **Container**: Kubernetes, Docker Swarm
- **PaaS**: Heroku, Railway (with limitations)

**Not Recommended:**
- ❌ Shared web hosting (cPanel, etc.)
- ❌ Free hosting services
- ❌ Extremely resource-limited hosts

## Best Practices

### What are the security best practices?

Follow these security recommendations:

**1. Environment Variables**
```bash
# Use strong secrets
JWT_SECRET=$(openssl rand -hex 32)

# Restrict CORS
CORS_ORIGINS=https://yourdomain.com

# Limit admin access
ADMIN_DISCORD_IDS=your_discord_id_only
```

**2. Bot Permissions**
- Grant only required permissions
- Regularly audit bot access
- Use role-based access control
- Monitor bot activity logs

**3. Database Security**
- Use strong passwords
- Enable SSL/TLS connections
- Restrict network access
- Regular backups
- Encrypt sensitive data

**4. Network Security**
- Use HTTPS/TLS everywhere
- Configure firewall rules
- Use reverse proxy (nginx)
- Enable rate limiting
- Implement DDoS protection

**5. Access Control**
- Enforce 2FA for admins
- Regular permission audits
- Principle of least privilege
- Monitor access logs
- Rotate credentials regularly

See [Security Guide](/admin/security) for comprehensive recommendations.

### How should I optimize performance?

**Database Optimization:**
```sql
-- Add indexes for common queries
CREATE INDEX idx_user_presence ON presence(user_id, timestamp);
CREATE INDEX idx_messages_user ON messages(author_id, created_at);

-- Enable query planner
ANALYZE;

-- Regular maintenance
VACUUM ANALYZE;
```

**Caching Strategy:**
- Enable Redis for session storage
- Cache analytics results (5-15 minutes)
- Use CDN for static assets
- Implement query result caching
- Enable browser caching

**Code Optimization:**
- Use pagination for large datasets
- Implement lazy loading
- Optimize database queries
- Minimize API calls
- Use WebSocket for real-time updates

**Infrastructure:**
- Use SSD storage
- Allocate sufficient RAM
- Multiple CPU cores
- Fast network connection
- Load balancer for scaling

See [Performance Optimization](/admin/performance) guide.

### What data should I backup?

**Critical Data (backup daily):**
- ✅ PostgreSQL database
- ✅ Environment configuration files
- ✅ Custom plugin code
- ✅ SSL certificates

**Important Data (backup weekly):**
- ✅ Redis cache snapshots (optional)
- ✅ Application logs
- ✅ Custom configurations

**Backup Strategy:**
```bash
# Automated daily backups
0 2 * * * /path/to/backup-script.sh

# Backup script
#!/bin/bash
DATE=$(date +%Y-%m-%d)
pg_dump spywatcher > backup-$DATE.sql
tar -czf backup-$DATE.tar.gz backup-$DATE.sql .env
aws s3 cp backup-$DATE.tar.gz s3://backups/
```

**Backup Testing:**
- Test restores monthly
- Verify backup integrity
- Practice disaster recovery
- Document restore procedures

See [Backup Guide](/admin/backup) for detailed procedures.

### How do I monitor Spywatcher health?

**Health Check Endpoints:**
```bash
# Application health
curl http://localhost:3001/api/health

# Database health
curl http://localhost:3001/api/health/db

# Redis health
curl http://localhost:3001/api/health/redis

# Bot status
curl http://localhost:3001/api/health/bot
```

**Metrics to Monitor:**
- CPU and memory usage
- Database connections
- Response times
- Error rates
- Bot uptime
- Queue sizes

**Monitoring Tools:**
- **Prometheus**: Metrics collection
- **Grafana**: Visualization dashboards
- **Sentry**: Error tracking
- **Uptime Robot**: External monitoring
- **CloudWatch**: AWS monitoring

**Alert Setup:**
- CPU > 80%: Warning
- Memory > 90%: Critical
- Error rate > 5%: Warning
- Bot offline > 5min: Critical
- Database connection failures: Critical

See [Monitoring Guide](/admin/monitoring) for setup instructions.

## More Questions?

### Still need help?

If your question isn't answered here:

1. **Search Documentation**
   - Use search (Ctrl/Cmd + K)
   - Check relevant guide sections
   - Read related tutorials

2. **Community Resources**
   - [GitHub Discussions](https://github.com/subculture-collective/discord-spywatcher/discussions)
   - [GitHub Issues](https://github.com/subculture-collective/discord-spywatcher/issues)
   - Community Discord (coming soon)

3. **Report Issues**
   - [Bug Reports](https://github.com/subculture-collective/discord-spywatcher/issues/new?template=bug_report.md)
   - [Feature Requests](https://github.com/subculture-collective/discord-spywatcher/issues/new?template=feature_request.md)

4. **Professional Support**
   - Enterprise support available
   - Priority issue handling
   - Custom development
   - Training and consultation

### How can I contribute?

We welcome contributions!

**Ways to Contribute:**
- 📝 Improve documentation
- 🐛 Report bugs
- 💡 Suggest features
- 💻 Submit pull requests
- 🧪 Write tests
- 🌍 Translate content
- 📹 Create tutorials

See [Contributing Guide](/developer/contributing) to get started.

### Where can I find more resources?

**Documentation:**
- [User Guide](/guide/) - Feature documentation
- [Admin Guide](/admin/) - Administration
- [Developer Guide](/developer/) - Development
- [API Reference](/api/) - API documentation

**Video Resources:**
- [Tutorial Series](./tutorials) - Step-by-step videos
- [YouTube Channel](https://youtube.com/@spywatcher) - Official videos

**External Resources:**
- [GitHub Repository](https://github.com/subculture-collective/discord-spywatcher)
- [Discord.js Documentation](https://discord.js.org/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

::: tip Quick Search
Use the documentation search (Ctrl/Cmd + K) to find answers quickly across all documentation!
:::

---

*Last updated: November 2024*  
*Have a question not covered here? [Open an issue](https://github.com/subculture-collective/discord-spywatcher/issues) to help us improve this FAQ!*
