# Quick Reference

Fast reference guide for common tasks, commands, and shortcuts in Spywatcher.

::: tip Print This Page
This reference guide is designed to be printer-friendly. Use your browser's print function to create a handy desk reference.
:::

## Keyboard Shortcuts

### Global Shortcuts

| Shortcut           | Action                    |
| ------------------ | ------------------------- |
| `Ctrl+K` / `Cmd+K` | Open search               |
| `?`                | Show help overlay         |
| `Esc`              | Close dialogs/modals      |
| `Ctrl+/` / `Cmd+/` | Focus search/filter       |
| `Ctrl+Shift+T`     | Toggle theme (light/dark) |

### Navigation Shortcuts

| Shortcut     | Action                 |
| ------------ | ---------------------- |
| `G` then `D` | Go to Dashboard        |
| `G` then `A` | Go to Analytics        |
| `G` then `G` | Go to Ghost Detection  |
| `G` then `S` | Go to Suspicion Scores |
| `G` then `B` | Go to Bans             |
| `G` then `T` | Go to Settings         |

### Dashboard Shortcuts

| Shortcut | Action                  |
| -------- | ----------------------- |
| `R`      | Refresh data            |
| `E`      | Export current view     |
| `F`      | Open filter panel       |
| `1-4`    | Quick metric navigation |

### Data View Shortcuts

| Shortcut  | Action                       |
| --------- | ---------------------------- |
| `←` / `→` | Previous/Next page           |
| `Ctrl+A`  | Select all                   |
| `Ctrl+C`  | Copy selected                |
| `Del`     | Delete selected (if allowed) |

## Common CLI Commands

### Docker Operations

```bash
# Start services
docker-compose -f docker-compose.dev.yml up

# Start in background
docker-compose -f docker-compose.dev.yml up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f backend

# Restart a service
docker-compose restart backend

# Rebuild containers
docker-compose build --no-cache
```

### Database Operations

```bash
# Run migrations
cd backend && npx prisma migrate deploy

# Reset database (CAUTION: deletes data)
cd backend && npx prisma migrate reset

# Generate Prisma client
cd backend && npx prisma generate

# Open Prisma Studio
cd backend && npx prisma studio

# Backup database
cd backend && npm run db:backup

# Restore database
cd backend && npm run db:restore
```

### Development Commands

```bash
# Start backend
cd backend && npm run dev

# Start API server only
cd backend && npm run dev:api

# Start frontend
cd frontend && npm run dev

# Run tests
cd backend && npm test
cd frontend && npm test

# Lint code
npm run lint

# Format code
npm run format
```

### Diagnostic Commands

```bash
# Check application health
curl http://localhost:3001/api/health

# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check Redis
docker-compose exec redis redis-cli ping

# View bot status
docker-compose logs backend | grep "Bot ready"

# Check disk space
df -h

# Check memory
free -h

# Check running processes
docker-compose ps
```

## API Quick Reference

### Base URLs

```
Development: http://localhost:3001/api
Production: https://your-domain.com/api
```

### Authentication

```bash
# Get access token (OAuth)
POST /api/auth/discord

# Refresh token
POST /api/auth/refresh
Body: { "refreshToken": "your_refresh_token" }

# Logout
POST /api/auth/logout

# Get current user
GET /api/auth/me
Headers: { "Authorization": "Bearer your_token" }
```

### Analytics Endpoints

```bash
# Get ghost users
GET /api/ghosts
Query: ?limit=100&page=1&sort=score

# Get suspicion data
GET /api/suspicion
Query: ?threshold=70&sort=desc

# Get lurkers
GET /api/lurkers

# Get heatmap data
GET /api/heatmap
Query: ?range=30d

# Get activity timeline
GET /api/shifts
Query: ?userId=123456789

# Get client distribution
GET /api/clients

# Get role analytics
GET /api/roles
```

### User Management

```bash
# Get user details
GET /api/users/:userId

# Get user timeline
GET /api/users/:userId/timeline

# Export user data
GET /api/users/:userId/export
```

### Ban Management

```bash
# List banned users
GET /api/bans

# Ban a user
POST /api/bans
Body: { "userId": "123456789", "reason": "Spam bot" }

# Unban a user
DELETE /api/bans/:userId

# Get user bans
GET /api/userbans/:userId
```

### Rate Limit Headers

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640000000
```

## Filter Syntax Quick Reference

### Basic Filters

```
# Username search
username:john

# Exact match
username:"John Doe"

# Role filter
role:moderator

# Multiple roles
role:admin OR role:moderator

# Suspicion score
suspicion:>70
suspicion:50..80

# Message count
messages:>100
messages:<10

# Ghost status
is:ghost
NOT is:ghost

# Join date
joined:>2024-01-01
joined:2024-01-01..2024-12-31

# Last seen
seen:<7d
seen:>30d
```

### Advanced Filters

```
# Combined filters (AND)
role:member AND messages:<10

# Either condition (OR)
suspicion:>80 OR is:ghost

# Negation
NOT banned:true

# Complex query
(role:member AND messages:<10) OR suspicion:>70

# Range queries
presence:50..100
messages:10..50

# Time-based
active:today
active:yesterday
active:last_week
active:last_month
```

## Suspicion Score Reference

### Score Ranges

| Score  | Level    | Color       | Action             |
| ------ | -------- | ----------- | ------------------ |
| 0-20   | Low      | 🟢 Green    | No action          |
| 21-40  | Moderate | 🟡 Yellow   | Monitor            |
| 41-60  | Elevated | 🟠 Orange   | Investigate        |
| 61-80  | High     | 🔴 Red      | Review immediately |
| 81-100 | Critical | 🚨 Dark Red | Take action        |

### Score Components

| Component           | Weight | What It Measures          |
| ------------------- | ------ | ------------------------- |
| Activity Anomalies  | 25%    | Unusual behavior patterns |
| Client Behavior     | 20%    | Device/platform usage     |
| Presence Patterns   | 20%    | Online/offline cycles     |
| Interaction Metrics | 20%    | Engagement level          |
| Historical Changes  | 15%    | Behavior shifts           |

## Ghost Detection Reference

### Detection Criteria

| Metric        | Threshold                    | Weight |
| ------------- | ---------------------------- | ------ |
| Presence Time | High (>50% online)           | 30%    |
| Message Count | Low (<10 messages)           | 25%    |
| Engagement    | None (no reactions/mentions) | 20%    |
| Client Type   | Suspicious patterns          | 15%    |
| Time Pattern  | Unusual hours                | 10%    |

### Ghost Types

- **Silent Observer**: High presence, zero messages
- **Lurker**: Occasional presence, minimal participation
- **Bot Account**: Consistent patterns, automated behavior
- **Inactive Ghost**: Was active, now only present

## Environment Variables Cheat Sheet

### Required Backend Variables

```bash
DISCORD_BOT_TOKEN=        # 50+ characters
DISCORD_CLIENT_ID=        # OAuth2 client ID
DISCORD_CLIENT_SECRET=    # OAuth2 client secret
DISCORD_REDIRECT_URI=     # OAuth callback URL
JWT_SECRET=               # 32+ characters
JWT_REFRESH_SECRET=       # 32+ characters
```

### Optional Backend Variables

```bash
NODE_ENV=development      # development|production|test
PORT=3001                 # Server port
DATABASE_URL=             # PostgreSQL connection
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info            # error|warn|info|debug
CORS_ORIGINS=http://localhost:5173
```

### Frontend Variables

```bash
VITE_API_URL=http://localhost:3001/api
VITE_DISCORD_CLIENT_ID=   # Must match backend
VITE_ENVIRONMENT=development
```

### Generate Secure Secrets

```bash
# JWT secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using OpenSSL
openssl rand -hex 32
```

## Data Export Formats

### CSV Format

```csv
user_id,username,presence_time,message_count,ghost_score
123456789,User1,150.5,0,95
234567890,User2,75.2,5,45
```

### JSON Format

```json
{
    "users": [
        {
            "id": "123456789",
            "username": "User1",
            "presenceTime": 150.5,
            "messageCount": 0,
            "ghostScore": 95
        }
    ],
    "metadata": {
        "exportDate": "2024-01-15",
        "totalResults": 1
    }
}
```

## Common Issues Quick Fix

| Problem         | Quick Fix                            |
| --------------- | ------------------------------------ |
| Bot offline     | Check token, restart backend         |
| Can't log in    | Clear cookies, check OAuth settings  |
| No data showing | Wait 24h, check bot permissions      |
| Slow dashboard  | Enable caching, reduce date range    |
| Database error  | Run `npx prisma migrate deploy`      |
| Port in use     | `lsof -i :3001` then `kill -9 <PID>` |
| Build fails     | `rm -rf node_modules && npm install` |

## Performance Tips

### Quick Wins

1. **Enable Redis Caching**

    ```bash
    REDIS_URL=redis://localhost:6379
    ENABLE_CACHING=true
    ```

2. **Optimize Date Ranges**
    - Use last 7-30 days for daily monitoring
    - Avoid "all time" for routine use

3. **Use Filters**
    - Filter before exporting large datasets
    - Save common filters as presets

4. **Enable Pagination**
    - View 50-100 items per page
    - Use pagination for large lists

### Database Maintenance

```bash
# Weekly
npm run db:vacuum

# Monthly
npm run archive:old-data
npm run db:reindex

# Quarterly
npm run db:optimize
npm run db:cleanup
```

## Security Checklist

- [ ] Strong JWT secrets (32+ characters)
- [ ] CORS configured for your domains only
- [ ] HTTPS enabled in production
- [ ] Firewall rules configured
- [ ] Regular backups enabled
- [ ] Admin 2FA enabled
- [ ] Audit logs monitored
- [ ] Security updates applied
- [ ] Privileged intents justified
- [ ] Data retention policies configured

## Maintenance Schedule

### Daily

- Check bot status
- Review suspicion alerts
- Monitor system resources

### Weekly

- Export analytics report
- Review unusual patterns
- Clean up old exports

### Monthly

- Archive old data (>90 days)
- Review permissions
- Check for updates
- Database maintenance

### Quarterly

- Security audit
- Policy review
- Full backup verification
- Performance optimization

## Help Resources

### Documentation

- **User Guide**: /guide/
- **Admin Guide**: /admin/
- **Developer Guide**: /developer/
- **API Docs**: /api/

### Support

- **GitHub Issues**: [Report bugs](https://github.com/subculture-collective/discord-spywatcher/issues)
- **Discussions**: [Ask questions](https://github.com/subculture-collective/discord-spywatcher/discussions)
- **Search Docs**: Press `Ctrl+K` / `Cmd+K`

### Quick Links

- [Installation Guide](./installation)
- [Troubleshooting](./troubleshooting)
- [FAQ](./faq)
- [Best Practices](./best-practices)

---

::: tip Bookmark This Page
Press `Ctrl+D` / `Cmd+D` to bookmark this reference for quick access!
:::

_Last updated: November 2024_
