# Admin Panel

The admin panel is your central hub for managing and monitoring your Spywatcher instance. This guide covers all features and functionality available in the administration interface.

## Accessing the Admin Panel

### Prerequisites

To access the admin panel, you must have admin privileges configured in your environment:

```bash
# Set admin Discord IDs in .env
ADMIN_DISCORD_IDS=123456789012345678,987654321098765432
```

### Login Process

1. Navigate to your Spywatcher instance (e.g., `https://app.spywatcher.com`)
2. Click **"Login with Discord"**
3. Authorize the application
4. Once authenticated, the admin panel will be accessible if you have admin privileges

::: tip Admin Access
If you don't see admin options after logging in, verify that your Discord ID is included in the `ADMIN_DISCORD_IDS` environment variable and restart the application.
:::

## Dashboard Overview

### System Health Card

The main dashboard displays real-time system metrics:

**Current Status**
- **Active Users**: Number of currently authenticated users
- **API Requests/min**: Real-time request rate
- **Error Rate**: Percentage of failed requests
- **System Uptime**: Time since last restart

**Resource Utilization**
- **CPU Usage**: Current CPU utilization percentage
- **Memory Usage**: RAM consumption (used/total)
- **Database Connections**: Active database connections
- **Redis Connections**: Active cache connections

### Recent Activity

View the most recent administrative and system events:

- User logins and logouts
- Configuration changes
- Ban actions
- Security alerts
- System errors

### Quick Actions

Frequently used administrative functions:

- **Create User** - Add a new user account
- **View Bans** - Review active bans
- **Export Logs** - Download audit logs
- **System Maintenance** - Enable maintenance mode
- **Clear Cache** - Flush Redis cache

## User Management

Access via **Admin Panel** → **Users**

### User List

View all registered users with:
- Discord username and discriminator
- User ID and Discord ID
- Registration date
- Last login timestamp
- Current role (USER, ADMIN, MODERATOR, BANNED)
- Account status (active/inactive)

### User Actions

For each user, you can:

**View Details**
- Full user profile
- Login history
- Activity logs
- API usage statistics

**Edit User**
- Change role
- Update permissions
- Modify quotas
- Set subscription tier

**Ban User**
- Temporary or permanent ban
- Add ban reason
- Set expiration date
- Notify user (optional)

**Delete User**
- Permanently remove account
- Delete all associated data
- Confirm deletion (irreversible)

### Bulk Operations

Select multiple users to:
- Export user data
- Bulk role changes
- Mass notifications
- Batch deletions

## Server Management

### Server Information

View details about monitored Discord servers:

- Guild ID and name
- Member count
- Bot join date
- Monitoring status
- Last sync timestamp

### Server Settings

Configure per-server options:

**Monitoring Options**
- Enable/disable ghost detection
- Enable/disable lurker tracking
- Enable/disable suspicion scoring
- Set tracking intervals

**Privacy Settings**
- Data retention period
- Anonymous analytics
- User data protection level

**Notification Settings**
- Alert thresholds
- Webhook URLs
- Email notifications

## Ban Management

Access via **Admin Panel** → **Bans**

### Active Bans

View all currently active bans:

**User Bans**
- Discord ID and username
- Ban reason
- Banned by (admin)
- Ban date and expiration
- Ban type (temporary/permanent)

**IP Bans**
- Blocked IP address
- Associated user accounts
- Block reason
- Auto-ban trigger (if applicable)
- Expiration date

### Ban Actions

**Create Ban**
1. Enter Discord ID or IP address
2. Select ban type (user or IP)
3. Set duration (temporary/permanent)
4. Add detailed reason
5. Confirm ban

**Modify Ban**
- Change expiration date
- Update ban reason
- Convert temporary to permanent
- Add notes

**Remove Ban**
- Select ban to remove
- Add unban reason
- Confirm removal
- Optionally notify user

### Ban History

Review historical ban data:
- All past bans (including expired)
- Ban duration statistics
- Most common ban reasons
- Admin ban activity

## Analytics Dashboard

Access via **Admin Panel** → **Analytics**

### System Metrics

**API Usage**
- Requests per endpoint
- Response time distribution
- Error rate by endpoint
- Top consumers

**Database Performance**
- Query execution time
- Slow query log
- Connection pool usage
- Cache hit rates

**User Activity**
- Daily active users (DAU)
- Monthly active users (MAU)
- Peak usage times
- Retention metrics

### Export Options

Export analytics data:
- **CSV**: Spreadsheet-friendly format
- **JSON**: Machine-readable format
- **PDF**: Formatted reports
- **Custom**: Select specific metrics and date ranges

## Configuration

Access via **Admin Panel** → **Settings**

### General Settings

**Application Settings**
- Application name and description
- Default language
- Timezone settings
- Date/time formats

**Feature Toggles**
- Enable/disable features globally
- Beta feature access
- Maintenance mode
- Debug mode

### Security Settings

**Authentication**
- Session timeout duration
- Require 2FA for admins
- Password policies
- Token expiration settings

**API Security**
- Rate limit configurations
- CORS allowed origins
- API key management
- Webhook verification

### Integration Settings

**Discord Integration**
- Bot token (masked)
- Client ID and secret (masked)
- Permitted guilds
- Bot permissions

**External Services**
- Sentry error tracking
- Analytics platforms
- Email service (SMTP)
- Cloud storage (S3)

## System Operations

### Maintenance Mode

Enable maintenance mode during updates or issues:

1. Go to **Admin Panel** → **System** → **Maintenance**
2. Toggle **Enable Maintenance Mode**
3. Set custom maintenance message
4. Optionally allow admin access during maintenance
5. Save changes

When enabled:
- All non-admin users see maintenance page
- API returns 503 Service Unavailable
- Background jobs continue running
- Admin access remains available

### Cache Management

**Clear Cache**
- Clear all Redis cache
- Clear specific cache keys
- View cache statistics
- Set cache TTL defaults

**Preload Cache**
- Warm up frequently accessed data
- Schedule cache preloading
- Monitor cache performance

### Database Operations

::: warning Dangerous Operations
Database operations can affect system stability. Always backup before performing maintenance.
:::

**Database Backup**
- Trigger manual backup
- View backup history
- Download backup files
- Restore from backup

**Database Maintenance**
- Vacuum database
- Reindex tables
- Analyze query performance
- View table statistics

### Log Management

**View Logs**
- Application logs
- Error logs
- Access logs
- Audit logs

**Log Filters**
- Filter by level (ERROR, WARN, INFO, DEBUG)
- Filter by date range
- Filter by user/IP
- Search log content

**Log Export**
- Export logs to file
- Send to external logging service
- Archive old logs
- Set log retention policies

## Audit Trail

Access via **Admin Panel** → **Audit Logs**

### What Gets Logged

All administrative actions are logged:

**User Management**
- User creation/deletion
- Role changes
- Permission updates
- Password resets

**Security Events**
- Failed login attempts
- Privilege escalations
- Configuration changes
- API key generation

**System Events**
- Service starts/stops
- Maintenance mode toggles
- Database operations
- Cache flushes

### Viewing Audit Logs

**Log Entries Include**
- Timestamp (UTC)
- Action performed
- User who performed action
- Target resource/user
- Old and new values
- IP address
- User agent

**Filters**
- Date range
- Action type
- Performing user
- Target user
- Resource type

### Export Audit Logs

Export logs for compliance or investigation:

```bash
# Via admin panel
Admin Panel → Audit Logs → Export

# Choose format: CSV, JSON, or PDF
# Select date range
# Apply filters (optional)
# Download
```

## Notifications and Alerts

### Alert Configuration

Set up alerts for critical events:

**Security Alerts**
- Multiple failed login attempts
- Privilege escalation attempts
- Unusual API usage patterns
- Suspicious user behavior

**System Alerts**
- High error rates
- Resource exhaustion
- Service unavailability
- Database connection failures

**Performance Alerts**
- Slow query detection
- High response times
- Memory leaks
- Cache misses

### Notification Channels

Configure where alerts are sent:

**Email Notifications**
- Admin email addresses
- Alert severity filtering
- Email frequency limits

**Webhook Notifications**
- Slack integration
- Discord webhooks
- Custom HTTP endpoints
- Payload customization

**In-App Notifications**
- Banner notifications
- Dashboard alerts
- Toast messages
- Badge counters

## API Key Management

Access via **Admin Panel** → **API Keys**

### Managing API Keys

**Create API Key**
1. Click **Generate New API Key**
2. Enter description/label
3. Select tier (FREE, PRO, ENTERPRISE)
4. Set quotas and rate limits
5. Optionally set expiration date
6. Save and copy key (shown once)

**View Keys**
- List all active API keys
- View usage statistics
- Check quota consumption
- See rate limit status

**Revoke Keys**
- Select key to revoke
- Confirm revocation
- Key immediately invalidated
- Cannot be restored

### API Key Details

For each key, view:
- Creation date
- Last used timestamp
- Total requests made
- Current quota usage
- Rate limit hits
- Associated user/application

## Plugin Management

Access via **Admin Panel** → **Plugins**

### Installed Plugins

View all installed plugins:

**Plugin Information**
- Name and description
- Version number
- Author information
- Installation date
- Status (active/inactive)
- Permissions granted

### Plugin Actions

**Enable/Disable Plugin**
- Toggle plugin status
- Restart required for changes
- View impact on system

**Configure Plugin**
- Plugin-specific settings
- Permission adjustments
- Feature toggles

**Update Plugin**
- Check for updates
- View changelog
- Install updates
- Rollback if needed

**Uninstall Plugin**
- Remove plugin completely
- Clean up plugin data
- Confirm deletion

### Plugin Logs

Monitor plugin activity:
- Plugin initialization logs
- Runtime errors
- Performance metrics
- API calls made

## Best Practices

### Daily Tasks

✅ **Do these every day:**
- Review dashboard metrics
- Check for security alerts
- Monitor error rates
- Review recent user activity

### Weekly Tasks

✅ **Do these every week:**
- Review audit logs
- Check backup integrity
- Analyze API usage patterns
- Update security rules
- Review ban list

### Monthly Tasks

✅ **Do these every month:**
- Full system audit
- Review user accounts for inactive users
- Analyze performance trends
- Plan capacity upgrades
- Update documentation

### Security Best Practices

🔒 **Security recommendations:**

1. **Use strong authentication**
   - Enable 2FA for all admins
   - Use unique, complex passwords
   - Rotate secrets regularly

2. **Monitor actively**
   - Set up alerts for suspicious activity
   - Review audit logs regularly
   - Monitor failed login attempts

3. **Keep updated**
   - Apply security patches promptly
   - Update dependencies regularly
   - Review security advisories

4. **Backup regularly**
   - Automate daily backups
   - Test restore procedures
   - Store backups securely off-site

5. **Limit access**
   - Use principle of least privilege
   - Regularly review admin list
   - Remove unused accounts

## Troubleshooting

### Can't Access Admin Panel

**Symptom:** No admin options visible after login

**Solutions:**
1. Verify your Discord ID is in `ADMIN_DISCORD_IDS`
2. Check environment variable is loaded: `echo $ADMIN_DISCORD_IDS`
3. Restart the application
4. Clear browser cache and cookies
5. Check browser console for errors

### Slow Dashboard Performance

**Symptom:** Admin panel loads slowly

**Solutions:**
1. Clear Redis cache: **System** → **Cache** → **Clear All**
2. Check database performance: **System** → **Database** → **Statistics**
3. Review active queries for long-running operations
4. Increase connection pool size if needed
5. Consider adding database indexes

### Missing Data in Reports

**Symptom:** Analytics showing incomplete data

**Solutions:**
1. Check bot connection status
2. Verify data collection is enabled
3. Review scheduled task logs
4. Check database for recent updates
5. Verify user has proper permissions

### Unable to Ban User

**Symptom:** Ban action fails or doesn't apply

**Solutions:**
1. Verify user exists in database
2. Check for conflicting permissions
3. Review ban system logs
4. Ensure proper admin privileges
5. Check for existing ban

## Getting Help

If you encounter issues not covered here:

1. **Check Logs**: Review application and error logs for details
2. **Search Documentation**: Use search function to find relevant guides
3. **GitHub Issues**: Check for known issues or report new ones
4. **Troubleshooting Guide**: See [Troubleshooting](/guide/troubleshooting)

## Related Documentation

- [User Management](./user-management) - Detailed user administration
- [Ban Management](./ban-management) - Complete ban system guide
- [Security Settings](./security) - Security configuration
- [Monitoring](./monitoring) - System monitoring setup
- [Backup Procedures](./backup) - Data backup and recovery

---

::: tip Need Help?
For additional support, check the [troubleshooting guide](/guide/troubleshooting) or open an issue on [GitHub](https://github.com/subculture-collective/discord-spywatcher/issues).
:::
