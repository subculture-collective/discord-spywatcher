# Audit Logs

Comprehensive guide to audit logging, monitoring administrative actions, and compliance tracking in Spywatcher.

## Overview

Audit logs provide a complete record of:

- **Administrative Actions**: User management, configuration changes
- **Security Events**: Authentication, authorization, security incidents
- **System Operations**: Backups, maintenance, deployments
- **Data Access**: Who accessed what data and when
- **Compliance**: Meet regulatory requirements (GDPR, SOC 2, etc.)

## What Gets Logged

### User Management Events

**Account Operations:**
```yaml
USER_CREATED
  - New user registration
  - Admin-created accounts
  - OAuth registrations

USER_UPDATED
  - Profile changes
  - Role assignments
  - Permission changes
  - Quota modifications

USER_DELETED
  - Account deletions
  - Soft deletes
  - Hard deletes

USER_SUSPENDED
  - Account suspensions
  - Temporary restrictions

USER_REACTIVATED
  - Suspension removals
  - Account reactivations
```

**Authentication Events:**
```yaml
LOGIN_SUCCESS
  - Successful authentications
  - OAuth completions

LOGIN_FAILED
  - Failed login attempts
  - Invalid credentials
  - Account locked

LOGOUT
  - User logouts
  - Session terminations

TOKEN_ISSUED
  - Access token generation
  - Refresh token generation

TOKEN_REVOKED
  - Token revocations
  - Token expiration
```

### Permission Changes

**Role Operations:**
```yaml
ROLE_ASSIGNED
  - Role grants to users

ROLE_REVOKED
  - Role removals

PERMISSION_GRANTED
  - Individual permission grants

PERMISSION_REVOKED
  - Permission removals
```

### Moderation Actions

**Ban Operations:**
```yaml
BAN_CREATED
  - User bans
  - IP bans
  - Temporary bans

BAN_UPDATED
  - Ban duration changes
  - Ban reason updates

BAN_REMOVED
  - Unbans
  - Ban expirations

APPEAL_SUBMITTED
  - Ban appeal submissions

APPEAL_REVIEWED
  - Appeal approvals/denials
```

### System Configuration

**Configuration Changes:**
```yaml
CONFIG_UPDATED
  - Environment variable changes
  - Feature flag toggles
  - System settings modifications

FEATURE_ENABLED
  - Feature activations

FEATURE_DISABLED
  - Feature deactivations

INTEGRATION_CONFIGURED
  - Third-party integrations
  - API configurations
```

### Data Operations

**Data Access:**
```yaml
DATA_EXPORTED
  - User data exports
  - Analytics exports
  - Backup exports

DATA_IMPORTED
  - Data imports
  - Bulk operations

DATA_DELETED
  - Data purges
  - Retention policy applications
```

### Security Events

**Security Incidents:**
```yaml
SECURITY_ALERT
  - Suspicious activity detected
  - Unusual patterns
  - Policy violations

IP_BLOCKED
  - IP ban creations
  - Auto-ban triggers

RATE_LIMIT_EXCEEDED
  - Rate limit violations
  - Quota exceeded

UNAUTHORIZED_ACCESS
  - Access denied events
  - Permission violations
```

## Viewing Audit Logs

### Accessing Audit Logs

**Via Admin Panel:**

**Admin Panel** → **Audit Logs**

**Available Views:**
- All Events
- By Category
- By User
- By Admin
- Security Events
- Recent Activity

### Log Entry Structure

Each log entry contains:

**Core Information:**
```yaml
Entry ID: 1234567890
Timestamp: 2024-11-03 14:30:00 UTC
Event Type: USER_UPDATED
Severity: INFO

Actor:
  User ID: 987654321098765432
  Username: admin_user
  Role: ADMIN
  IP Address: 203.0.113.42
  User Agent: Mozilla/5.0...

Target:
  User ID: 123456789012345678
  Username: john_doe
  Resource Type: USER
  Resource ID: user_123

Action:
  Operation: UPDATE
  Category: USER_MANAGEMENT
  Description: Updated user role from USER to MODERATOR

Changes:
  Field: role
  Previous Value: USER
  New Value: MODERATOR

Metadata:
  Reason: Promoted for good contributions
  Session ID: sess_abc123
  Request ID: req_xyz789
  Geographic Location: San Francisco, CA, US
```

### Filtering Logs

**Filter Options:**

**By Time Period:**
```
Last Hour
Last 24 Hours
Last 7 Days
Last 30 Days
Custom Date Range
```

**By Event Type:**
```
All Events
User Management
Authentication
Permissions
Moderation
Configuration
Security
System Operations
```

**By Severity:**
```
DEBUG - Development information
INFO - Normal operations
WARNING - Potential issues
ERROR - Errors occurred
CRITICAL - System-critical events
```

**By Actor:**
```
Specific Admin
Specific User
System Actions
Automated Actions
```

**By Resource:**
```
User Accounts
Guilds
API Keys
Configuration
Bans
```

### Searching Logs

**Search Capabilities:**

**Text Search:**
```
Search in:
  - Event descriptions
  - Usernames
  - IP addresses
  - Reasons/notes
  - Resource IDs
```

**Advanced Search:**
```yaml
Query Examples:
  - "role:ADMIN AND action:DELETE"
  - "ip:203.0.113.* AND severity:CRITICAL"
  - "user:john_doe AND type:LOGIN_FAILED"
  - "resource:guild_123 AND timestamp:2024-11-01..2024-11-03"
```

**Search Operators:**
- AND, OR, NOT
- Wildcards (*, ?)
- Date ranges (..)
- Field-specific (field:value)

## Analyzing Audit Logs

### Log Dashboard

**Overview Metrics:**

**Activity Summary:**
- Total events (last 24h)
- Events by type
- Most active admins
- Most common actions
- Security events count

**Charts and Graphs:**
- Events over time (line chart)
- Event type distribution (pie chart)
- Admin activity (bar chart)
- Security events trend (line chart)

### Security Analysis

**Security Dashboard:**

**Anomaly Detection:**
```yaml
Unusual Patterns:
  - Multiple failed logins from same IP
  - After-hours admin activity
  - Bulk user deletions
  - Rapid permission changes
  - Geographic anomalies

Alerts Generated: 3
Critical: 0
High: 1
Medium: 2
```

**Risk Indicators:**
```yaml
High Risk Events:
  ⚠️ 5 failed admin logins from 198.51.100.42
  ⚠️ 20 users deleted in 5 minutes
  ⚠️ Super admin access from new location

Medium Risk:
  ⚠️ After-hours configuration change
  ⚠️ Multiple permission grants to single user
```

### Compliance Reports

**Generate Compliance Reports:**

**Admin Panel** → **Audit Logs** → **Reports** → **Compliance**

**Report Types:**

**GDPR Compliance Report:**
```yaml
Period: 2024-10-01 to 2024-10-31

User Data Access:
  - Total data exports: 47
  - User data requests: 23
  - Data deletion requests: 5
  - Consent changes: 12

Findings: Compliant
Issues: None
```

**SOC 2 Audit Report:**
```yaml
Period: Q4 2024

Controls Verified:
  ✅ Access Control: All changes logged
  ✅ Data Protection: Encryption verified
  ✅ Monitoring: Continuous logging
  ✅ Incident Response: All incidents documented

Status: Pass
Recommendations: 2 minor improvements
```

**Access Control Report:**
```yaml
Period: Last 30 days

Role Changes: 15
  - Promotions: 8
  - Demotions: 3
  - Removed: 4

Permission Changes: 47
  - Granted: 35
  - Revoked: 12

Findings:
  ✅ All changes documented
  ✅ Proper authorization
  ⚠️ 2 permission grants lack detailed reason
```

## Exporting Audit Logs

### Export Formats

**CSV Export:**
```csv
timestamp,event_type,actor,target,action,details
2024-11-03T14:30:00Z,USER_UPDATED,admin_user,john_doe,UPDATE,Role changed from USER to MODERATOR
```

**JSON Export:**
```json
{
  "entries": [
    {
      "id": "1234567890",
      "timestamp": "2024-11-03T14:30:00Z",
      "eventType": "USER_UPDATED",
      "actor": {
        "userId": "987654321098765432",
        "username": "admin_user"
      },
      "target": {
        "userId": "123456789012345678",
        "username": "john_doe"
      },
      "changes": {
        "role": {
          "from": "USER",
          "to": "MODERATOR"
        }
      }
    }
  ]
}
```

**PDF Report:**
- Formatted for printing
- Executive summary
- Detailed entries
- Charts and graphs
- Compliance statements

### Export Process

1. **Admin Panel** → **Audit Logs** → **Export**

2. Select export options:
   ```yaml
   Format: CSV / JSON / PDF
   Date Range: Last 30 days
   Event Types: All
   Include Metadata: Yes
   Include IP Addresses: Yes
   Encrypt Export: Yes (recommended)
   ```

3. Apply filters (optional)

4. Click **Generate Export**

5. Download file

::: warning Sensitive Data
Exported audit logs contain sensitive information. Protect export files appropriately.
:::

## Log Retention

### Retention Policies

Configure how long logs are kept:

**Admin Panel** → **Settings** → **Audit Log Retention**

**Default Retention:**
```yaml
Security Events: 2 years
User Management: 1 year
Authentication: 90 days
Configuration: 1 year
System Operations: 180 days
Debug Logs: 30 days
```

**Custom Retention:**
```yaml
Event Type: USER_DELETED
Retention: 7 years (compliance requirement)
Archive: Yes
Immutable: Yes
```

**Retention Tiers:**
```yaml
Hot Storage (Fast Access):
  - Last 30 days
  - Full search capability
  - Instant access

Warm Storage (Archived):
  - 31-365 days
  - Limited search
  - Quick retrieval

Cold Storage (Compliance):
  - 1+ years
  - Archive only
  - Restoration required
```

### Archiving

**Automatic Archiving:**
- Older logs automatically archived
- Compressed for storage
- Indexed for retrieval
- Encrypted at rest

**Manual Archive:**
1. **Admin Panel** → **Audit Logs** → **Archive**
2. Select date range
3. Choose archive location
4. Confirm archival

**Restore from Archive:**
1. **Admin Panel** → **Audit Logs** → **Restore**
2. Select archive
3. Choose restoration period
4. Wait for restoration
5. Access restored logs

## Alerting

### Alert Configuration

Set up alerts for critical events:

**Admin Panel** → **Settings** → **Audit Alerts**

**Alert Rules:**

**Failed Login Alert:**
```yaml
Rule: Multiple Failed Logins
Condition: 5+ failed logins in 15 minutes
Severity: HIGH
Notification:
  - Email: security@example.com
  - Webhook: Slack security channel
Throttle: 1 hour
```

**Privilege Escalation Alert:**
```yaml
Rule: Role Change to Admin
Condition: User promoted to ADMIN or SUPER_ADMIN
Severity: CRITICAL
Notification:
  - Email: All admins
  - SMS: On-call admin
  - Webhook: Security team
Throttle: Immediate (no throttle)
```

**Bulk Operation Alert:**
```yaml
Rule: Mass User Deletion
Condition: 10+ users deleted in 10 minutes
Severity: CRITICAL
Notification:
  - Email: All admins
  - Webhook: Security team
Action: Alert + Pause operations
```

### Alert Channels

**Email Notifications:**
```yaml
Recipients:
  - admin@example.com
  - security@example.com
Template: Security Alert
Include: Full event details
```

**Webhook Notifications:**
```yaml
Slack Webhook:
  URL: https://hooks.slack.com/...
  Channel: #security-alerts
  Mention: @security-team
  
Discord Webhook:
  URL: https://discord.com/api/webhooks/...
  Mention: @admins
```

**SMS Notifications:**
```yaml
Service: Twilio
Phone Numbers:
  - +1-555-0100 (Primary admin)
  - +1-555-0101 (Secondary admin)
Conditions: CRITICAL events only
```

## Monitoring Integration

### SIEM Integration

Integrate with Security Information and Event Management systems:

**Supported SIEM:**
- Splunk
- Elastic Security
- IBM QRadar
- LogRhythm
- Microsoft Sentinel

**Configuration:**
```yaml
SIEM: Splunk
Endpoint: https://splunk.example.com:8088
Token: HEC-TOKEN-HERE
Index: spywatcher_audit
Source Type: json
Batch Size: 1000 events
Send Interval: 60 seconds
```

### Log Forwarding

Forward logs to external systems:

**Syslog Forwarding:**
```yaml
Protocol: TCP / UDP
Host: syslog.example.com
Port: 514
Format: RFC5424
TLS: Enabled
Certificate: /path/to/cert.pem
```

**Cloud Logging:**
```yaml
Provider: AWS CloudWatch / Google Cloud Logging / Azure Monitor

AWS CloudWatch:
  Log Group: /spywatcher/audit
  Stream: production
  Region: us-east-1
  Credentials: IAM Role

Google Cloud:
  Project ID: spywatcher-prod
  Log Name: audit-logs
  Credentials: Service Account
```

## Log Analysis Tools

### Built-in Analytics

**Admin Panel** → **Audit Logs** → **Analytics**

**Available Analysis:**

**Timeline View:**
- Visualize events over time
- Identify patterns
- Spot anomalies

**Correlation Analysis:**
- Find related events
- Track user journeys
- Identify attack patterns

**Statistical Analysis:**
- Event frequency
- Distribution patterns
- Trend analysis
- Predictive insights

### Query Language

**Audit Query Language (AQL):**

```sql
-- Find all failed logins in last 24 hours
SELECT * FROM audit_logs
WHERE event_type = 'LOGIN_FAILED'
AND timestamp > NOW() - INTERVAL '24 hours'

-- Find admin actions on specific user
SELECT * FROM audit_logs
WHERE actor.role = 'ADMIN'
AND target.user_id = '123456789012345678'
ORDER BY timestamp DESC

-- Find security events by IP
SELECT * FROM audit_logs
WHERE actor.ip_address = '203.0.113.42'
AND event_type IN ('SECURITY_ALERT', 'UNAUTHORIZED_ACCESS')
```

## Best Practices

### Audit Logging Best Practices

✅ **Do:**
- Log all administrative actions
- Include sufficient context
- Protect log integrity
- Regular log reviews
- Set up critical alerts
- Maintain proper retention
- Export logs regularly
- Test log restoration
- Monitor log storage
- Document compliance needs

❌ **Don't:**
- Log sensitive data (passwords, tokens)
- Allow log tampering
- Ignore security alerts
- Skip log reviews
- Delete logs prematurely
- Disable logging
- Expose logs publicly
- Forget backup logs
- Ignore compliance requirements

### Security Guidelines

🔒 **Security best practices:**

1. **Log Integrity**
   - Prevent log tampering
   - Use append-only storage
   - Cryptographic signatures
   - Regular integrity checks

2. **Access Control**
   - Restrict log access
   - Audit log access
   - Role-based viewing
   - Separate admin logs

3. **Data Protection**
   - Encrypt logs at rest
   - Encrypt logs in transit
   - Secure log exports
   - Protect backups

4. **Monitoring**
   - Real-time alerting
   - Anomaly detection
   - Regular reviews
   - Incident response

5. **Compliance**
   - Meet regulatory requirements
   - Document retention policies
   - Regular compliance audits
   - Maintain audit trail

## Troubleshooting

### Logs Not Appearing

**Symptoms:**
- Recent events not logged
- Missing log entries
- Incomplete logs

**Solutions:**
1. Check logging is enabled
2. Verify log level settings
3. Check disk space
4. Review log collection service
5. Check database connection
6. Verify permissions
7. Check log buffer/queue

### Can't Export Logs

**Symptoms:**
- Export fails
- Timeout errors
- Empty export file

**Solutions:**
1. Check export permissions
2. Reduce date range
3. Check disk space
4. Verify format support
5. Check network connectivity
6. Review export logs
7. Try different format

### Alert Not Triggering

**Symptoms:**
- No notifications received
- Alert conditions met but silent
- Delayed alerts

**Solutions:**
1. Verify alert is enabled
2. Check alert conditions
3. Review notification settings
4. Check email/webhook configuration
5. Verify throttling settings
6. Check alert logs
7. Test notification channels

## Related Documentation

- [Admin Panel](./panel) - Admin panel overview
- [User Management](./user-management) - User administration
- [Security Settings](./security) - Security configuration
- [Monitoring](./monitoring) - System monitoring
- [Incident Response](./incident-response) - Security incidents

---

::: tip Need Help?
For additional support, check the [troubleshooting guide](/guide/troubleshooting) or open an issue on [GitHub](https://github.com/subculture-collective/discord-spywatcher/issues).
:::
