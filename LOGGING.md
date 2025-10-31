# Centralized Log Aggregation & Analysis

This document describes the centralized logging infrastructure for Discord SpyWatcher using the Grafana Loki stack.

## Overview

Discord SpyWatcher implements a comprehensive log aggregation system that collects, stores, and analyzes logs from all services in a centralized location.

**Stack Components:**
- **Grafana Loki** - Log aggregation and storage system
- **Promtail** - Log collection and shipping agent
- **Grafana** - Visualization and search UI
- **Winston** - Structured JSON logging library

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Services                     │
├─────────────┬─────────────┬──────────┬────────┬────────────┤
│  Backend    │  Frontend   │ Postgres │ Redis  │  PgBouncer │
│  (Winston)  │  (Console)  │  (Logs)  │ (Logs) │   (Logs)   │
└──────┬──────┴──────┬──────┴────┬─────┴───┬────┴──────┬─────┘
       │             │           │         │           │
       └─────────────┴───────────┴─────────┴───────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   Promtail    │  ◄── Log Collection Agent
                    │ (Log Shipper) │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │     Loki      │  ◄── Log Aggregation & Storage
                    │  (Log Store)  │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │    Grafana    │  ◄── Visualization & Search UI
                    │  (Dashboard)  │
                    └───────────────┘
```

## Features

### ✅ Log Collection
- **Backend logs** - Application, security, and error logs in JSON format
- **Security logs** - Authentication, authorization, and security events
- **Database logs** - PostgreSQL query and connection logs
- **Redis logs** - Cache operations and connection logs
- **PgBouncer logs** - Connection pool metrics and activity
- **Nginx logs** - HTTP access and error logs (production)
- **Container logs** - Docker container stdout/stderr

### ✅ Structured Logging
- JSON format for easy parsing and filtering
- Request ID correlation for tracing
- Log levels: error, warn, info, debug
- Automatic metadata enrichment (service, job, level)

### ✅ Retention Policies
- **30-day retention** - Automatic deletion of logs older than 30 days
- **Compression** - Automatic log compression to save storage
- **Configurable** - Easy to adjust retention period based on requirements

### ✅ Search & Filtering
- **LogQL** - Powerful query language for log searching
- **Grafana UI** - User-friendly interface for log exploration
- **Filters** - Filter by service, level, time range, and custom fields
- **Live tail** - Real-time log streaming

## Quick Start

### Starting the Logging Stack

**Development:**
```bash
docker-compose -f docker-compose.dev.yml up -d loki promtail grafana
```

**Production:**
```bash
docker-compose -f docker-compose.prod.yml up -d loki promtail grafana
```

### Accessing Grafana

1. Open your browser to `http://localhost:3000`
2. Login with default credentials:
   - Username: `admin`
   - Password: `admin` (change on first login)
3. Navigate to **Explore** or **Dashboards** > **Spywatcher - Log Aggregation**

### Changing Admin Credentials

Set environment variables:
```bash
GRAFANA_ADMIN_USER=your_username
GRAFANA_ADMIN_PASSWORD=your_secure_password
```

## Configuration

### Loki Configuration

Location: `loki/loki-config.yml`

**Key settings:**
- `retention_period: 720h` - Keep logs for 30 days
- `ingestion_rate_mb: 15` - Max ingestion rate (15 MB/s)
- `max_entries_limit_per_query: 5000` - Max entries per query

### Promtail Configuration

Location: `promtail/promtail-config.yml`

**Log sources configured:**
- Backend application logs (`/logs/backend/*.log`)
- Security logs (`/logs/backend/security*.log`)
- PostgreSQL logs (`/var/log/postgresql/*.log`)
- Docker container logs (via Docker socket)

**Pipeline stages:**
- JSON parsing for structured logs
- Label extraction (level, service, action, etc.)
- Timestamp parsing
- Output formatting

### Grafana Configuration

Location: `grafana/provisioning/`

**Datasources:**
- Loki (default) - `http://loki:3100`
- Prometheus - `http://backend:3001/metrics`

**Dashboards:**
- `Spywatcher - Log Aggregation` - Main logging dashboard

## Usage

### Searching Logs

#### Basic Search
```logql
{job="backend"}
```

#### Filter by Level
```logql
{job="backend", level="error"}
```

#### Search in Message
```logql
{job="backend"} |= "error"
```

#### Security Logs
```logql
{job="security"} | json | action="LOGIN_ATTEMPT"
```

#### Time Range
Use Grafana's time picker to select a specific time range (e.g., last 1 hour, last 24 hours, custom range).

### Common Queries

**All errors in the last hour:**
```logql
{job=~"backend|security"} | json | level="error"
```

**Failed login attempts:**
```logql
{job="security"} | json | action="LOGIN_ATTEMPT" | result="FAILURE"
```

**Slow database queries:**
```logql
{job="backend"} | json | message=~".*query.*" | duration > 1000
```

**Rate limiting events:**
```logql
{job="security"} | json | action="RATE_LIMIT_VIOLATION"
```

**Request by request ID:**
```logql
{job="backend"} | json | requestId="abc123"
```

### Live Tailing

1. Go to **Explore** in Grafana
2. Select **Loki** datasource
3. Enter your LogQL query
4. Click **Live** button in the top right

This will stream logs in real-time as they arrive.

### Dashboard

The pre-configured dashboard includes:

1. **Log Volume by Level** - Time series chart showing log volume by level
2. **Log Counts by Level** - Statistics showing error, warn, and info counts
3. **Application Logs** - Main log viewer with filtering
4. **Security Logs** - Dedicated security event viewer
5. **Error Logs** - Quick view of all error logs

**Template Variables:**
- `$job` - Filter by job (backend, security, postgres, etc.)
- `$level` - Filter by log level (error, warn, info, debug)
- `$search` - Free-text search filter

## Structured Logging Best Practices

### Application Code

Use Winston logger with structured fields:

```typescript
import logger from './middleware/winstonLogger';

// Basic logging
logger.info('User logged in', { userId: user.id });

// With request ID
import { logWithRequestId } from './middleware/winstonLogger';

logWithRequestId('info', 'Processing request', req.id, {
  userId: user.id,
  action: 'fetch_data'
});

// Error logging
logger.error('Database connection failed', {
  error: err.message,
  stack: err.stack
});
```

### Log Levels

- **error** - Application errors, exceptions, failures
- **warn** - Warning conditions, degraded performance
- **info** - Important business events, state changes
- **debug** - Detailed diagnostic information

### Security Events

Use the security logger for security-related events:

```typescript
import { logSecurityEvent, SecurityActions } from './utils/securityLogger';

await logSecurityEvent({
  userId: user.discordId,
  action: SecurityActions.LOGIN_SUCCESS,
  result: 'SUCCESS',
  ipAddress: req.ip,
  userAgent: req.get('user-agent'),
  requestId: req.id
});
```

## Retention Policies

### Current Settings

- **Retention Period:** 30 days (720 hours)
- **Compaction Interval:** 10 minutes
- **Retention Delete Delay:** 2 hours
- **Reject Old Samples:** 7 days

### Adjusting Retention

Edit `loki/loki-config.yml`:

```yaml
limits_config:
  retention_period: 720h  # Change this value (e.g., 1440h for 60 days)

table_manager:
  retention_period: 720h  # Keep same as above

compactor:
  retention_enabled: true
```

Then restart Loki:
```bash
docker-compose restart loki
```

## Performance Tuning

### Ingestion Limits

Adjust in `loki/loki-config.yml`:

```yaml
limits_config:
  ingestion_rate_mb: 15              # MB/s per tenant
  ingestion_burst_size_mb: 20        # Burst size
  per_stream_rate_limit: 3MB         # Per stream rate
  per_stream_rate_limit_burst: 15MB # Per stream burst
```

### Query Performance

```yaml
limits_config:
  max_entries_limit_per_query: 5000  # Max entries returned
  max_streams_per_user: 10000        # Max streams per user
```

### Cache Configuration

```yaml
query_range:
  results_cache:
    cache:
      embedded_cache:
        enabled: true
        max_size_mb: 100  # Increase for better performance
```

## Alerting

### Setting up Alerts

1. Create alert rules in `loki/alert-rules.yml`:

```yaml
groups:
  - name: spywatcher-alerts
    interval: 1m
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate({job="backend", level="error"}[5m])) > 10
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors/sec"
```

2. Configure Alertmanager URL in `loki/loki-config.yml`:

```yaml
ruler:
  alertmanager_url: http://alertmanager:9093
```

## Troubleshooting

### Logs not appearing in Grafana

1. **Check Promtail is running:**
   ```bash
   docker ps | grep promtail
   docker logs spywatcher-promtail-dev
   ```

2. **Check Loki is accepting logs:**
   ```bash
   curl http://localhost:3100/ready
   ```

3. **Verify log files exist:**
   ```bash
   docker exec spywatcher-backend-dev ls -la /app/logs
   ```

4. **Check Promtail configuration:**
   ```bash
   docker exec spywatcher-promtail-dev cat /etc/promtail/config.yml
   ```

### Loki storage issues

**Check disk usage:**
```bash
du -sh /var/lib/docker/volumes/discord-spywatcher_loki-data/
```

**Force compaction:**
```bash
docker exec spywatcher-loki-dev wget -qO- http://localhost:3100/loki/api/v1/delete?query={job="backend"}&start=2024-01-01T00:00:00Z&end=2024-01-02T00:00:00Z
```

### Performance issues

1. **Reduce retention period** - Lower retention in `loki-config.yml`
2. **Increase resources** - Adjust memory limits in `docker-compose.prod.yml`
3. **Reduce log volume** - Increase LOG_LEVEL to 'warn' or 'error'
4. **Add sampling** - Implement log sampling in application code

## Monitoring the Logging Stack

### Loki Metrics

Available at: `http://localhost:3100/metrics`

**Key metrics:**
- `loki_ingester_chunks_created_total` - Chunks created
- `loki_ingester_bytes_received_total` - Bytes ingested
- `loki_request_duration_seconds` - Query performance

### Promtail Metrics

Available at: `http://localhost:9080/metrics`

**Key metrics:**
- `promtail_sent_entries_total` - Entries sent to Loki
- `promtail_dropped_entries_total` - Dropped entries
- `promtail_read_bytes_total` - Bytes read from logs

### Grafana Health

Available at: `http://localhost:3000/api/health`

## Integration with Other Tools

### Prometheus Integration

Loki integrates seamlessly with Prometheus for correlated metrics and logs:

1. Configure Prometheus datasource in Grafana
2. Use derived fields to link logs to traces
3. Create unified dashboards with both metrics and logs

### Sentry Integration

Logs can reference Sentry issues:

```typescript
logger.error('Unhandled exception', {
  sentryEventId: sentryEventId,
  error: err.message
});
```

Search in Loki:
```logql
{job="backend"} | json | sentryEventId="abc123"
```

## Security Considerations

### Access Control

1. **Change default Grafana password** - Set `GRAFANA_ADMIN_PASSWORD`
2. **Enable HTTPS** - Configure SSL/TLS for Grafana
3. **Network isolation** - Keep Loki/Promtail in private network
4. **Authentication** - Enable OAuth or LDAP authentication in Grafana

### Log Sanitization

Winston logger automatically sanitizes sensitive data:
- Passwords
- Tokens (access, refresh, API keys)
- OAuth scopes
- Email addresses

See: `backend/src/utils/securityLogger.ts`

### Compliance

- **GDPR** - Logs containing PII are automatically sanitized
- **Data Retention** - 30-day retention complies with most regulations
- **Audit Trail** - Security logs provide compliance audit trail

## Resources

### Documentation
- [Grafana Loki Documentation](https://grafana.com/docs/loki/latest/)
- [Promtail Documentation](https://grafana.com/docs/loki/latest/clients/promtail/)
- [LogQL Query Language](https://grafana.com/docs/loki/latest/logql/)
- [Grafana Documentation](https://grafana.com/docs/grafana/latest/)

### Example Queries
- [LogQL Examples](https://grafana.com/docs/loki/latest/logql/example-queries/)
- [Query Patterns](https://grafana.com/blog/2020/04/08/loki-log-queries/)

### Community
- [Loki GitHub Repository](https://github.com/grafana/loki)
- [Grafana Community Forums](https://community.grafana.com/)

## Comparison with ELK Stack

| Feature | Loki Stack | ELK Stack |
|---------|-----------|-----------|
| **Storage** | Index labels, not full text | Full text indexing |
| **Resource Usage** | Low (300-500MB) | High (2-4GB+) |
| **Query Language** | LogQL (Prometheus-like) | Lucene/KQL |
| **Setup Complexity** | Simple (3 containers) | Complex (5+ containers) |
| **Cost** | Free, open source | Free, but resource intensive |
| **Scalability** | Good for small-medium | Better for enterprise |
| **Integration** | Native Prometheus/Grafana | Elasticsearch ecosystem |
| **Best For** | Cloud-native, Kubernetes | Large enterprises, full-text search |

## Conclusion

The centralized logging system provides comprehensive log aggregation and analysis capabilities for Discord SpyWatcher. With proper configuration and usage, it enables:

- **Faster debugging** - Correlate logs across services
- **Better monitoring** - Real-time visibility into system behavior
- **Improved security** - Track security events and detect anomalies
- **Compliance** - Audit trail and data retention policies
- **Performance optimization** - Identify bottlenecks and slow queries

For questions or issues, refer to the troubleshooting section or consult the official documentation.
