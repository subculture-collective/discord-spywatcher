# Integration Settings

Guide to configuring third-party integrations and external services in Spywatcher.

## Overview

Spywatcher supports integrations with:

- **Monitoring & Observability**: Sentry, Prometheus, Grafana
- **Logging**: Loki, Elasticsearch
- **Communication**: Slack, Discord webhooks
- **Storage**: S3-compatible storage
- **Email**: SMTP services
- **Analytics**: Custom analytics platforms

## Monitoring Integrations

### Sentry Error Tracking

Configure Sentry for error tracking and APM:

**Admin Panel** → **Settings** → **Integrations** → **Sentry**

**Configuration:**
```yaml
Sentry:
  Enabled: Yes
  DSN: https://[key]@[org].ingest.sentry.io/[project]
  Environment: production
  Release: v1.2.3
  
Tracing:
  Sample Rate: 0.1 (10%)
  Traces Sample Rate: 0.01 (1%)
  
Options:
  ✅ Capture console errors
  ✅ Breadcrumbs enabled
  ✅ User context
  ✅ Performance monitoring
```

**Environment Variables:**
```bash
# Sentry Configuration
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
SENTRY_ENVIRONMENT=production
SENTRY_TRACE_SAMPLE_RATE=0.1
```

See [SENTRY.md](/SENTRY.md) for complete Sentry configuration.

### Prometheus Metrics

Configure Prometheus for metrics collection:

**Configuration:**
```yaml
Prometheus:
  Enabled: Yes
  Port: 9090
  Path: /metrics
  
Metrics Collected:
  - HTTP request duration
  - Request count by endpoint
  - Database query time
  - Redis operations
  - System resources
```

**Environment:**
```bash
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9090
PROMETHEUS_PATH=/metrics
```

See [MONITORING.md](/MONITORING.md) for monitoring setup.

### Grafana Dashboards

Configure Grafana for visualization:

**Configuration:**
```yaml
Grafana:
  URL: https://grafana.spywatcher.com
  API Key: [CONFIGURED]
  
Dashboards:
  - System Overview
  - API Performance
  - Database Metrics
  - User Activity
  - Security Events
```

## Logging Integrations

### Grafana Loki

Configure centralized logging:

**Configuration:**
```yaml
Loki:
  Enabled: Yes
  URL: http://loki:3100
  
Log Forwarding:
  - Application logs
  - Error logs
  - Access logs
  - Audit logs
  
Retention: 30 days
Compression: Enabled
```

See [LOGGING.md](/LOGGING.md) for logging configuration.

### External Log Services

**Supported Services:**
- Elasticsearch
- Splunk
- Datadog
- AWS CloudWatch
- Google Cloud Logging

**Configuration Example (Elasticsearch):**
```yaml
Elasticsearch:
  Enabled: No
  Host: elasticsearch.example.com
  Port: 9200
  Index: spywatcher-logs
  Authentication: Basic
  Username: elastic
  Password: [HIDDEN]
```

## Communication Integrations

### Slack Webhooks

Configure Slack notifications:

**Admin Panel** → **Settings** → **Integrations** → **Slack**

**Configuration:**
```yaml
Slack:
  Enabled: Yes
  
Webhooks:
  - Name: Alerts Channel
    URL: https://hooks.slack.com/services/T00/B00/XXX
    Channel: #alerts
    Events:
      - Security alerts
      - System errors
      - Critical events
  
  - Name: Admin Channel
    URL: https://hooks.slack.com/services/T00/B00/YYY
    Channel: #admin-notifications
    Events:
      - User management
      - Configuration changes
      - Audit events
```

**Environment:**
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_ALERTS_ENABLED=true
```

### Discord Webhooks

Configure Discord notifications:

**Configuration:**
```yaml
Discord Webhooks:
  Enabled: Yes
  
Webhooks:
  - Name: Security Alerts
    URL: https://discord.com/api/webhooks/[id]/[token]
    Events:
      - Failed logins (>5)
      - IP blocks
      - Admin actions
  
  - Name: System Status
    URL: https://discord.com/api/webhooks/[id]/[token]
    Events:
      - Service restarts
      - Maintenance mode
      - Deployment notifications
```

## Storage Integrations

### S3-Compatible Storage

Configure backup storage:

**Configuration:**
```yaml
S3 Storage:
  Enabled: Yes
  Provider: AWS S3 / MinIO / DigitalOcean Spaces
  
Primary Bucket:
  Name: spywatcher-backups
  Region: us-east-1
  Access Key: [CONFIGURED]
  Secret Key: [HIDDEN]
  
Secondary Bucket (Redundancy):
  Name: spywatcher-backups-replica
  Region: us-west-2
  
Options:
  ✅ Encryption at rest
  ✅ Versioning enabled
  ✅ Lifecycle policies
```

**Environment:**
```bash
# S3 Configuration
S3_ENABLED=true
S3_BUCKET=spywatcher-backups
S3_REGION=us-east-1
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key
S3_BUCKET_SECONDARY=spywatcher-backups-replica
```

See [BACKUP.md](/BACKUP.md) and [DISASTER_RECOVERY.md](/DISASTER_RECOVERY.md) for backup configuration.

## Email Integration

### SMTP Configuration

Configure email service:

**Admin Panel** → **Settings** → **Integrations** → **Email**

**Configuration:**
```yaml
Email:
  Enabled: Yes (optional)
  Provider: SMTP
  
SMTP Settings:
  Host: smtp.example.com
  Port: 587
  Security: STARTTLS
  Authentication: Yes
  Username: noreply@spywatcher.com
  Password: [HIDDEN]
  
From Address: Spywatcher <noreply@spywatcher.com>

Email Types:
  - Welcome emails
  - Password resets
  - Security alerts
  - Ban notifications
  - Quota warnings
```

**Environment:**
```bash
# Email Configuration
SMTP_ENABLED=true
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@spywatcher.com
SMTP_PASSWORD=your_smtp_password
SMTP_FROM=Spywatcher <noreply@spywatcher.com>
SMTP_SECURE=true
```

**Supported Providers:**
- SendGrid
- Mailgun
- Amazon SES
- Postmark
- Any SMTP server

## Database Integrations

### PgBouncer Connection Pooling

Configure PgBouncer:

**Configuration:**
```yaml
PgBouncer:
  Enabled: Yes (recommended)
  Host: localhost
  Port: 6432
  
Pool Settings:
  Pool Mode: Transaction
  Max Client Connections: 100
  Default Pool Size: 20
  
Performance:
  Server Lifetime: 3600s
  Server Idle Timeout: 600s
```

See [CONNECTION_POOLING.md](/CONNECTION_POOLING.md) and [PGBOUNCER_SETUP.md](/docs/PGBOUNCER_SETUP.md).

### Redis Caching

Configure Redis:

**Configuration:**
```yaml
Redis:
  Enabled: Yes
  URL: redis://localhost:6379
  Database: 0
  Key Prefix: spywatcher:
  
Usage:
  - Session storage
  - Rate limiting
  - Cache layer
  - Queue management
  
Connection Pool:
  Min: 2
  Max: 10
```

**Environment:**
```bash
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0
REDIS_KEY_PREFIX=spywatcher:
```

See [REDIS_CACHING.md](/REDIS_CACHING.md) for Redis configuration.

## Analytics Integrations

### Custom Analytics

Configure custom analytics platforms:

**Configuration:**
```yaml
Analytics:
  Enabled: No (default)
  
Providers:
  - Name: Google Analytics
    Tracking ID: UA-XXXXX-Y
    Enabled: No
  
  - Name: Plausible
    Domain: spywatcher.com
    Enabled: No
  
  - Name: Custom
    Endpoint: https://analytics.example.com/collect
    Enabled: No
```

**Privacy-First Analytics:**
```yaml
Privacy Analytics:
  Enabled: Yes
  
Settings:
  ✅ No cookies
  ✅ No personal data
  ✅ Aggregated only
  ✅ GDPR compliant
```

See [PRIVACY_ANALYTICS.md](/PRIVACY_ANALYTICS.md).

## Webhook System

### Outgoing Webhooks

Configure webhooks for external systems:

**Admin Panel** → **Settings** → **Integrations** → **Webhooks**

**Webhook Configuration:**
```yaml
Webhook: User Events
URL: https://api.example.com/webhooks/users
Method: POST
Headers:
  Authorization: Bearer your_api_key
  Content-Type: application/json

Events:
  ✅ user.created
  ✅ user.updated
  ✅ user.deleted
  ⬜ user.banned
  
Retry Policy:
  Max Retries: 3
  Backoff: Exponential
  Timeout: 10 seconds

Security:
  ✅ HMAC signature
  Secret: [CONFIGURED]
```

**Webhook Payload Example:**
```json
{
  "event": "user.created",
  "timestamp": "2024-11-03T14:30:00Z",
  "data": {
    "userId": "123456789012345678",
    "username": "john_doe",
    "role": "USER",
    "tier": "FREE"
  },
  "signature": "sha256=..."
}
```

## Testing Integrations

### Test Configuration

Test integrations before enabling:

**Admin Panel** → **Settings** → **Integrations** → Select integration → **Test**

**Test Scenarios:**

**Sentry Test:**
```
Action: Send test error to Sentry
Expected: Error appears in Sentry dashboard
Verify: Error captured, user context included
```

**Slack Test:**
```
Action: Send test message to Slack
Expected: Message appears in configured channel
Verify: Formatting correct, mentions work
```

**Email Test:**
```
Action: Send test email
Expected: Email received at test address
Verify: From address correct, links work
```

**S3 Test:**
```
Action: Upload test file
Expected: File uploaded successfully
Verify: File accessible, encryption enabled
```

## Integration Monitoring

### Monitor Integration Health

**Admin Panel** → **Monitoring** → **Integrations**

**Integration Status:**
```yaml
Sentry:
  Status: ✅ Healthy
  Last Event: 2 minutes ago
  Events/hour: 45
  Errors: 0

Slack:
  Status: ✅ Healthy
  Last Message: 15 minutes ago
  Messages/day: 127
  Failed: 0

Email:
  Status: ⚠️ Warning
  Last Email: 3 hours ago
  Emails/day: 23
  Failed: 2 (retry queue)

S3:
  Status: ✅ Healthy
  Last Upload: 1 hour ago
  Storage Used: 15.3 GB
  Failed Uploads: 0
```

## Best Practices

### Integration Best Practices

✅ **Do:**
- Test integrations before enabling
- Monitor integration health
- Set up alerts for failures
- Use separate keys per environment
- Rotate API keys regularly
- Document integration purpose
- Have fallback options
- Rate limit webhook calls
- Verify webhook signatures
- Keep dependencies updated

❌ **Don't:**
- Share API keys between environments
- Skip testing integrations
- Ignore integration failures
- Store keys in code
- Enable all integrations by default
- Forget to monitor usage
- Skip security validation
- Expose webhook URLs
- Ignore rate limits

## Troubleshooting

### Integration Not Working

**Symptoms:**
- Integration appears enabled but not functioning
- No data being sent
- No errors in logs

**Solutions:**
1. Verify API key/credentials are correct
2. Check network connectivity
3. Review firewall rules
4. Test with integration's test tool
5. Check rate limits
6. Review integration logs
7. Verify correct endpoint URL
8. Check SSL/TLS certificate validity

### Webhook Failures

**Symptoms:**
- Webhooks not being delivered
- Timeout errors
- Retry exhaustion

**Solutions:**
1. Verify webhook URL is accessible
2. Check receiving endpoint is working
3. Review timeout settings
4. Check signature validation
5. Review retry policy
6. Check webhook logs
7. Test with webhook testing tool
8. Verify payload format

## Related Documentation

- [Admin Panel](./panel) - Admin panel overview
- [Security Settings](./security) - Security configuration
- [Monitoring](./monitoring) - Monitoring setup
- [SENTRY.md](/SENTRY.md) - Sentry configuration
- [LOGGING.md](/LOGGING.md) - Logging setup
- [MONITORING.md](/MONITORING.md) - Monitoring details

---

::: tip Need Help?
For additional support, check the [troubleshooting guide](/guide/troubleshooting) or open an issue on [GitHub](https://github.com/subculture-collective/discord-spywatcher/issues).
:::
