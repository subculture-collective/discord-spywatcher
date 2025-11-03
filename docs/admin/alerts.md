# Alert Handling

Guide to configuring, managing, and responding to system alerts in Spywatcher.

## Overview

Alert system provides:
- **Proactive Monitoring**: Detect issues before they become critical
- **Multi-Channel Notifications**: Email, Slack, SMS, webhooks
- **Severity Levels**: Critical, High, Medium, Low
- **Alert Routing**: Route alerts to appropriate teams
- **On-Call Integration**: PagerDuty, Opsgenie support

## Alert Types

### System Alerts

**Resource Alerts:**
- High CPU usage (>85%)
- High memory usage (>90%)
- Low disk space (<15%)
- High network traffic
- System load high

**Service Alerts:**
- Service down/unhealthy
- Database connection failure
- Redis connection failure
- API unresponsive
- Bot disconnected

### Application Alerts

**Performance Alerts:**
- High error rate (>5%)
- Slow response times (P95 > 1s)
- Database slow queries
- High request rate
- Rate limit exceeded

**Security Alerts:**
- Multiple failed logins
- Suspicious activity detected
- Unauthorized access attempts
- IP block triggered
- Admin privilege escalation

### Business Alerts

**Usage Alerts:**
- User quota exceeded
- API quota approaching limit
- Backup failed
- Deployment failed
- Integration failure

## Configuring Alerts

### Via Admin Panel

**Admin Panel** → **Settings** → **Alerts**

**Create Alert Rule:**
```yaml
Rule Name: High Error Rate
Description: Alert when error rate exceeds 5%

Condition:
  Metric: http_requests_errors
  Threshold: > 5%
  Duration: 5 minutes
  
Severity: HIGH

Notifications:
  - Email: admin-team@example.com
  - Slack: #alerts
  - PagerDuty: On-call engineer

Actions:
  - Enable debug logging
  - Capture additional metrics
  - Create incident ticket

Throttle: 1 hour (prevent duplicate alerts)
```

### Alert Configuration Examples

**Critical Alerts:**
```yaml
Database Down:
  Condition: database_status == "down"
  Severity: CRITICAL
  Notification: Email + SMS + PagerDuty
  Response Time: Immediate
  On-Call: Yes

Service Unavailable:
  Condition: health_check_failures > 3
  Severity: CRITICAL
  Notification: Email + SMS + Slack
  Response Time: < 5 minutes
  On-Call: Yes

Disk Full:
  Condition: disk_usage > 95%
  Severity: CRITICAL
  Notification: Email + SMS
  Response Time: < 15 minutes
```

**High Priority Alerts:**
```yaml
High Error Rate:
  Condition: error_rate > 5%
  Duration: 5 minutes
  Severity: HIGH
  Notification: Email + Slack
  Response Time: < 30 minutes
  
Slow Response Times:
  Condition: p95_response_time > 1000ms
  Duration: 10 minutes
  Severity: HIGH
  Notification: Email + Slack
  Response Time: < 1 hour

Backup Failed:
  Condition: backup_status == "failed"
  Severity: HIGH
  Notification: Email
  Response Time: < 4 hours
```

**Medium Priority Alerts:**
```yaml
High CPU Usage:
  Condition: cpu_usage > 85%
  Duration: 15 minutes
  Severity: MEDIUM
  Notification: Email
  Response Time: < 2 hours

Cache Miss Rate High:
  Condition: cache_miss_rate > 40%
  Duration: 30 minutes
  Severity: MEDIUM
  Notification: Email
  Response Time: Next business day
```

## Notification Channels

### Email Notifications

**Configuration:**
```yaml
Email:
  From: alerts@spywatcher.com
  To:
    - admin-team@example.com
    - ops-team@example.com
  
Template:
    Subject: [{{severity}}] {{alert_name}}
    Body: |
      Alert: {{alert_name}}
      Severity: {{severity}}
      Time: {{timestamp}}
      Condition: {{condition}}
      Value: {{current_value}}
      Threshold: {{threshold}}
      
      View in admin panel: {{alert_url}}
```

### Slack Notifications

**Configuration:**
```yaml
Slack:
  Webhook: https://hooks.slack.com/services/...
  Channel: #alerts
  Mention: @ops-team
  
Message Format:
  🚨 *CRITICAL*: Service Down
  ⚠️ *HIGH*: High Error Rate
  ℹ️ *MEDIUM*: High CPU Usage
  
Include:
  - Alert details
  - Current metrics
  - Link to dashboard
  - Runbook link
```

### SMS Notifications

**Configuration:**
```yaml
SMS:
  Provider: Twilio
  Numbers:
    - +1-555-0100 (Primary on-call)
    - +1-555-0101 (Backup on-call)
  
Send Only For:
  - CRITICAL alerts
  - After-hours HIGH alerts
  
Rate Limit: Max 10 SMS/hour
```

### Webhook Notifications

**Configuration:**
```yaml
Webhook:
  URL: https://api.example.com/alerts
  Method: POST
  Headers:
    Authorization: Bearer {{api_key}}
    Content-Type: application/json
  
Payload:
  {
    "alert": "{{alert_name}}",
    "severity": "{{severity}}",
    "timestamp": "{{timestamp}}",
    "value": "{{current_value}}",
    "threshold": "{{threshold}}",
    "dashboard_url": "{{alert_url}}"
  }
```

## Alert Response

### Response Workflow

**1. Alert Received:**
- Notification sent to channels
- Alert logged in admin panel
- Incident created (if critical)

**2. Acknowledge Alert:**
- Admin acknowledges alert
- Stops duplicate notifications
- Assigns to team member

**3. Investigate:**
- Review metrics and logs
- Check recent changes
- Identify root cause

**4. Remediate:**
- Apply fix or workaround
- Monitor for improvement
- Document actions taken

**5. Resolve:**
- Mark alert as resolved
- Document resolution
- Update runbooks if needed

**6. Post-Mortem:**
- Review incident (if critical)
- Identify improvements
- Update monitoring/alerts

### Response Times

**Target Response Times:**
```yaml
CRITICAL:
  Acknowledgment: < 5 minutes
  Initial Response: < 15 minutes
  Resolution Target: < 1 hour

HIGH:
  Acknowledgment: < 15 minutes
  Initial Response: < 30 minutes
  Resolution Target: < 4 hours

MEDIUM:
  Acknowledgment: < 1 hour
  Initial Response: < 2 hours
  Resolution Target: Next business day

LOW:
  Acknowledgment: < 4 hours
  Initial Response: Next business day
  Resolution Target: 1 week
```

## Common Alerts and Responses

### High Error Rate

**Alert:** Error rate > 5% for 5 minutes

**Response Steps:**
1. Check error logs for patterns
2. Identify affected endpoints
3. Check recent deployments
4. Review Sentry for stack traces
5. Rollback if needed or apply hotfix

**Runbook:** `/runbooks/high-error-rate.md`

### Database Connection Failure

**Alert:** Cannot connect to database

**Response Steps:**
1. Check database service status
2. Verify connection strings
3. Check network connectivity
4. Review database logs
5. Restart database if needed
6. Failover to replica if available

**Runbook:** `/runbooks/database-connection-failure.md`

### Service Down

**Alert:** Health check failures > 3

**Response Steps:**
1. Check service status
2. Review recent logs
3. Check system resources
4. Verify dependencies (DB, Redis)
5. Restart service
6. Escalate if persistent

**Runbook:** `/runbooks/service-down.md`

### High CPU Usage

**Alert:** CPU > 85% for 15 minutes

**Response Steps:**
1. Identify high-CPU processes
2. Check for runaway processes
3. Review application logs
4. Check for traffic spikes
5. Scale resources if needed
6. Investigate root cause

**Runbook:** `/runbooks/high-cpu-usage.md`

## Alert Management

### Viewing Active Alerts

**Admin Panel** → **Monitoring** → **Alerts**

**Alert Dashboard:**
```yaml
Active Alerts (3):
  🚨 CRITICAL - Database High Latency
     Since: 5 minutes ago
     Status: Investigating
     Assigned: john@example.com
  
  ⚠️ HIGH - High Error Rate on /api/users
     Since: 15 minutes ago
     Status: Acknowledged
     Assigned: jane@example.com
  
  ℹ️ MEDIUM - High Memory Usage
     Since: 2 hours ago
     Status: Monitoring
     Assigned: ops-team

Resolved Today (7):
  ✅ High CPU Usage - Resolved 2h ago
  ✅ Slow Queries - Resolved 4h ago
  ...
```

### Acknowledging Alerts

**Acknowledge Alert:**
1. Click alert in dashboard
2. Click "Acknowledge"
3. Add notes (optional)
4. Assign to team member

**Effects:**
- Stops repeat notifications
- Updates alert status
- Logs acknowledgment
- Notifies team

### Silencing Alerts

**Temporary Silence:**
```yaml
During Maintenance:
  - Silence all alerts
  - Duration: 2 hours
  - Reason: System maintenance
  - Auto-resume after window

For Specific Alert:
  - Silence: High CPU Usage alert
  - Duration: Until resolved
  - Reason: Known issue, scaling in progress
```

## Alert Tuning

### Reducing False Positives

**Adjust Thresholds:**
```yaml
Before:
  Condition: error_rate > 1%
  Result: Too many alerts

After:
  Condition: error_rate > 5%
  Duration: 5 minutes
  Result: Actionable alerts only
```

**Add Context:**
```yaml
Before:
  Alert: High CPU usage

After:
  Alert: High CPU usage during peak hours
  Condition: cpu > 85% AND hour IN (9-17)
  Excludes: Expected load during business hours
```

### Alert Fatigue Prevention

✅ **Do:**
- Set appropriate thresholds
- Use duration windows
- Throttle duplicate alerts
- Route by severity
- Regular alert review
- Remove stale alerts

❌ **Don't:**
- Alert on everything
- Use same threshold for all times
- Send all alerts to everyone
- Ignore false positives
- Over-alert on low priority items

## Best Practices

### Alert Configuration Best Practices

✅ **Do:**
- Alert on symptoms, not causes
- Make alerts actionable
- Include context in alerts
- Test alert rules
- Document response procedures
- Review alerts regularly
- Use appropriate severity levels

❌ **Don't:**
- Create alerts without runbooks
- Set overly sensitive thresholds
- Alert without clear action
- Send all alerts to same channel
- Forget to test notifications

## Troubleshooting

### Alerts Not Triggering

**Solutions:**
1. Verify alert rule enabled
2. Check threshold values
3. Verify condition logic
4. Check data source
5. Review alert logs

### Too Many Alerts

**Solutions:**
1. Adjust thresholds
2. Add duration windows
3. Enable throttling
4. Remove duplicate rules
5. Consolidate similar alerts

## Related Documentation

- [Monitoring](./monitoring) - System monitoring
- [Incident Response](./incident-response) - Incident handling
- [Maintenance](./maintenance) - Maintenance procedures

---

::: tip Need Help?
For additional support, check the [troubleshooting guide](/guide/troubleshooting) or open an issue on [GitHub](https://github.com/subculture-collective/discord-spywatcher/issues).
:::
