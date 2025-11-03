# Monitoring

Guide to setting up and managing monitoring, observability, and system health tracking for Spywatcher.

## Overview

Spywatcher monitoring includes:

- **Error Tracking**: Sentry for error capture and APM
- **Metrics Collection**: Prometheus for system metrics
- **Log Aggregation**: Loki for centralized logging
- **Dashboards**: Grafana for visualization
- **Health Checks**: Service availability monitoring
- **Alerts**: Proactive issue detection

See [MONITORING.md](/MONITORING.md) for complete technical documentation.

## Monitoring Components

### Sentry Error Tracking

**Configuration:**
```yaml
Sentry:
  DSN: https://[key]@[org].ingest.sentry.io/[project]
  Environment: production
  Trace Sample Rate: 0.1 (10%)
  
Features:
  ✅ Error capture
  ✅ Performance monitoring
  ✅ Stack traces
  ✅ User context
  ✅ Release tracking
```

**Environment Setup:**
```bash
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
SENTRY_ENVIRONMENT=production
SENTRY_TRACE_SAMPLE_RATE=0.1
```

**Admin Panel:** Settings → Integrations → Sentry

See [SENTRY.md](/SENTRY.md) for detailed Sentry configuration.

### Prometheus Metrics

**Metrics Endpoint:** `http://localhost:3001/metrics`

**Key Metrics:**
```yaml
Application Metrics:
  - http_request_duration_seconds
  - http_requests_total
  - http_requests_errors
  - websocket_active_connections
  
Database Metrics:
  - db_query_duration_seconds
  - db_connections_active
  - db_queries_total
  
System Metrics:
  - process_cpu_user_seconds_total
  - process_resident_memory_bytes
  - nodejs_heap_size_total_bytes
  - nodejs_gc_duration_seconds
```

**Configuration:**
```bash
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9090
PROMETHEUS_PATH=/metrics
```

See [MONITORING.md](/MONITORING.md) for metrics details.

### Grafana Dashboards

**Access:** `https://grafana.spywatcher.com`

**Available Dashboards:**

**System Overview:**
- CPU and memory usage
- Network I/O
- Disk usage
- System load

**Application Performance:**
- Request rate and latency
- Error rates
- Response time percentiles (P50, P95, P99)
- Active connections

**Database Performance:**
- Query latency
- Connection pool usage
- Slow queries
- Cache hit rates

**User Activity:**
- Active users
- API usage
- Feature usage
- Geographic distribution

**Configuration:**
```bash
GRAFANA_URL=https://grafana.spywatcher.com
GRAFANA_API_KEY=your_api_key
```

### Loki Log Aggregation

**Configuration:**
```yaml
Loki:
  URL: http://loki:3100
  Retention: 30 days
  
Log Sources:
  - Application logs
  - Error logs
  - Access logs
  - Audit logs
  - System logs
```

**Query Logs:**
```logql
{app="spywatcher"} |= "error"
{app="spywatcher", level="ERROR"} | json
{app="spywatcher"} | pattern <timestamp> <level> <message>
```

See [LOGGING.md](/LOGGING.md) for centralized logging.

## Health Checks

### Service Health Endpoints

**Available Endpoints:**

**/health** - Basic health check
```bash
GET /health

Response:
{
  "status": "healthy",
  "timestamp": "2024-11-03T14:30:00Z",
  "uptime": 86400
}
```

**/health/detailed** - Detailed health check
```bash
GET /health/detailed

Response:
{
  "status": "healthy",
  "timestamp": "2024-11-03T14:30:00Z",
  "components": {
    "database": { "status": "healthy", "responseTime": 5 },
    "redis": { "status": "healthy", "responseTime": 2 },
    "discord": { "status": "healthy", "connected": true }
  }
}
```

**/health/readiness** - Kubernetes readiness probe
```bash
GET /health/readiness
Status: 200 OK (ready) or 503 Service Unavailable (not ready)
```

**/health/liveness** - Kubernetes liveness probe
```bash
GET /health/liveness
Status: 200 OK (alive) or 503 Service Unavailable (dead)
```

### Monitoring Health Checks

**Admin Panel** → **Monitoring** → **Health**

**Component Status:**
```yaml
Components:
  Database:
    Status: ✅ Healthy
    Response Time: 5ms
    Connections: 8/20
    
  Redis:
    Status: ✅ Healthy
    Response Time: 2ms
    Memory: 45MB
    
  Discord Bot:
    Status: ✅ Connected
    Guilds: 127
    Latency: 32ms
    
  API Server:
    Status: ✅ Running
    Requests/min: 145
    Errors: 0
```

## Monitoring Dashboard

### System Metrics

**Admin Panel** → **Monitoring** → **System**

**Real-Time Metrics:**
```yaml
CPU:
  Usage: 45%
  Load Average: 2.1, 1.8, 1.5
  Cores: 4
  
Memory:
  Used: 2.8 GB / 8 GB (35%)
  Available: 5.2 GB
  Swap: 0 MB used
  
Disk:
  Root: 45 GB / 100 GB (45%)
  Backup: 15 GB / 50 GB (30%)
  I/O: 2.3 MB/s read, 1.1 MB/s write
  
Network:
  Inbound: 5.2 MB/s
  Outbound: 3.1 MB/s
  Connections: 247 active
```

### Application Metrics

**Performance:**
```yaml
HTTP Requests:
  Total: 2,456,789
  Rate: 145 req/min
  Errors: 12 (0.005%)
  
Response Times:
  Average: 142ms
  P50: 95ms
  P95: 320ms
  P99: 650ms
  
WebSockets:
  Active Connections: 234
  Messages/sec: 45
  Errors: 0
```

### Database Metrics

**Database Performance:**
```yaml
Connections:
  Active: 8 / 20
  Idle: 12
  Waiting: 0
  
Queries:
  Total: 45,678
  Rate: 156 queries/min
  Slow Queries: 3 (> 1s)
  
Cache:
  Hit Rate: 87%
  Misses: 1,234
  Size: 245 MB
```

## Setting Up Monitoring

### Initial Setup

**1. Configure Sentry:**
```bash
# Set Sentry DSN
export SENTRY_DSN="https://your-sentry-dsn@sentry.io/project"

# Restart application
npm run dev:api
```

**2. Configure Prometheus:**
```bash
# Create prometheus.yml
cat > prometheus.yml << 'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'spywatcher'
    static_configs:
      - targets: ['localhost:3001']
EOF

# Start Prometheus
docker run -d \
  -p 9090:9090 \
  -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

**3. Configure Grafana:**
```bash
# Start Grafana
docker run -d \
  -p 3000:3000 \
  grafana/grafana

# Access: http://localhost:3000
# Default credentials: admin/admin

# Add Prometheus data source
# Add Loki data source
# Import dashboards
```

**4. Configure Loki:**
```bash
# Start Loki and Promtail
docker-compose up -d loki promtail

# Access logs: http://localhost:3000 (via Grafana)
```

### Kubernetes Setup

**Deploy monitoring stack:**
```bash
# Using Helm
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace

# Verify
kubectl -n monitoring get pods
```

See [INFRASTRUCTURE.md](/INFRASTRUCTURE.md) for Kubernetes monitoring.

## Alert Configuration

### Setting Up Alerts

**Admin Panel** → **Monitoring** → **Alerts**

**Alert Rules:**

**High Error Rate:**
```yaml
Alert: High Error Rate
Condition: Error rate > 5% for 5 minutes
Severity: HIGH
Notification: Email + Slack
Actions:
  - Alert admin team
  - Enable debug logging
  - Monitor closely
```

**Low Disk Space:**
```yaml
Alert: Low Disk Space
Condition: Disk usage > 85%
Severity: WARNING
Notification: Email
Actions:
  - Alert admin team
  - Clean up logs
  - Plan storage expansion
```

**Database Slow Queries:**
```yaml
Alert: Slow Database Queries
Condition: Query time > 1s (10+ queries)
Severity: MEDIUM
Notification: Email
Actions:
  - Review slow query log
  - Analyze query plans
  - Add indexes if needed
```

See [Alerts](./alerts) for complete alert configuration.

## Best Practices

### Monitoring Best Practices

✅ **Do:**
- Monitor all critical components
- Set up proactive alerts
- Review metrics regularly
- Establish baselines
- Document incidents
- Test alert notifications
- Keep dashboards updated
- Monitor user experience
- Track key business metrics

❌ **Don't:**
- Ignore warning signs
- Set overly sensitive alerts
- Skip baseline establishment
- Monitor too much (alert fatigue)
- Forget to update thresholds
- Ignore false positives
- Skip metric correlation

### Performance Optimization

**Monitor These Metrics:**
```yaml
Critical:
  - Error rates
  - Response times
  - Database performance
  - Disk space
  - Memory usage
  
Important:
  - CPU usage
  - Network traffic
  - Cache hit rates
  - Active users
  - API usage
```

## Troubleshooting

### Metrics Not Appearing

**Symptoms:**
- No data in Prometheus
- Empty Grafana dashboards
- Metrics endpoint returns nothing

**Solutions:**
1. Verify PROMETHEUS_ENABLED=true
2. Check metrics endpoint: curl /metrics
3. Verify Prometheus configuration
4. Check network connectivity
5. Review application logs
6. Restart Prometheus
7. Verify scrape configuration

### Sentry Not Capturing Errors

**Symptoms:**
- Errors not appearing in Sentry
- No transactions recorded
- Missing context

**Solutions:**
1. Verify SENTRY_DSN is set
2. Check sample rate configuration
3. Verify network connectivity to Sentry
4. Check Sentry project settings
5. Review application logs
6. Test with manual error
7. Check Sentry quotas

## Related Documentation

- [MONITORING.md](/MONITORING.md) - Technical monitoring details
- [LOGGING.md](/LOGGING.md) - Centralized logging
- [SENTRY.md](/SENTRY.md) - Sentry configuration
- [Alerts](./alerts) - Alert configuration
- [Maintenance](./maintenance) - System maintenance
- [INFRASTRUCTURE.md](/INFRASTRUCTURE.md) - Infrastructure monitoring

---

::: tip Need Help?
For additional support, check the [troubleshooting guide](/guide/troubleshooting) or open an issue on [GitHub](https://github.com/subculture-collective/discord-spywatcher/issues).
:::
