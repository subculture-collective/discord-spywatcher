# Application Monitoring & Observability

This document describes the monitoring and observability features implemented in Discord SpyWatcher.

## Overview

The application includes comprehensive monitoring with:

- **Sentry** for error tracking and Application Performance Monitoring (APM)
- **Prometheus** for metrics collection
- **Winston** for structured logging
- **Health Check** endpoints for service status

## Features

### 1. Error Tracking with Sentry

Sentry provides automatic error capture, stack traces, and performance monitoring.

#### Configuration

Set the `SENTRY_DSN` environment variable:

```env
SENTRY_DSN=https://your-sentry-dsn@sentry.io/your-project-id
```

#### Features

- **Automatic Error Capture**: All uncaught errors are captured and sent to Sentry
- **Performance Tracing**: HTTP requests, database queries, and external API calls are traced
- **Data Sanitization**: Cookies and authorization headers are automatically filtered
- **Environment Tracking**: Errors are tagged with the current environment (development, production, etc.)

#### Sample Rate

- Development: 100% of transactions are traced
- Production: 10% of transactions are traced (configurable)

### 2. Prometheus Metrics

Prometheus metrics are exposed at the `/metrics` endpoint for scraping.

#### Available Metrics

**Default Metrics** (automatically collected):

- `process_cpu_*` - CPU usage metrics
- `process_resident_memory_bytes` - Memory usage
- `nodejs_*` - Node.js-specific metrics
- `nodejs_gc_*` - Garbage collection metrics

**Custom HTTP Metrics**:

- `http_request_duration_seconds` - HTTP request duration histogram
    - Labels: `method`, `route`, `status_code`
    - Buckets: 0.1s, 0.5s, 1s, 2s, 5s
- `http_requests_total` - Total HTTP requests counter
    - Labels: `method`, `route`, `status_code`
- `http_requests_errors` - Total HTTP errors counter
    - Labels: `method`, `route`, `status_code`

**WebSocket Metrics**:

- `websocket_active_connections` - Current number of active WebSocket connections

**Database Metrics**:

- `db_query_duration_seconds` - Database query duration histogram
    - Labels: `model`, `operation`
    - Buckets: 0.01s, 0.05s, 0.1s, 0.5s, 1s

#### Accessing Metrics

```bash
curl http://localhost:3001/metrics
```

#### Prometheus Configuration Example

```yaml
scrape_configs:
    - job_name: 'spywatcher'
      static_configs:
          - targets: ['localhost:3001']
      metrics_path: '/metrics'
      scrape_interval: 15s
```

### 3. Health Check Endpoints

Health check endpoints are available for orchestrators and monitoring systems.

#### Liveness Probe

Endpoint: `GET /health/live`

Checks if the service is running.

**Response (200 OK)**:

```json
{
    "status": "ok",
    "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Readiness Probe

Endpoint: `GET /health/ready`

Checks if the service is ready to handle requests by verifying:

- Database connectivity
- Redis connectivity (optional)
- Discord API connectivity

**Response (200 OK - all healthy)**:

```json
{
    "status": "healthy",
    "checks": {
        "database": true,
        "redis": true,
        "discord": true
    },
    "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Response (503 Service Unavailable - unhealthy)**:

```json
{
    "status": "unhealthy",
    "checks": {
        "database": false,
        "redis": true,
        "discord": true
    },
    "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Kubernetes Configuration Example

```yaml
livenessProbe:
    httpGet:
        path: /health/live
        port: 3001
    initialDelaySeconds: 30
    periodSeconds: 10

readinessProbe:
    httpGet:
        path: /health/ready
        port: 3001
    initialDelaySeconds: 10
    periodSeconds: 5
```

### 4. Structured Logging with Winston

Winston is configured for structured JSON logging with request correlation.

#### Log Levels

- `error` - Error events
- `warn` - Warning events
- `info` - Informational messages
- `debug` - Debug messages

Set via `LOG_LEVEL` environment variable (default: `info`).

#### Log Output

**Console Output**: Human-readable format with colorization

```
[2024-01-01T00:00:00.000Z] INFO: Server started on port 3001
```

**File Output**: JSON format for log aggregation

```json
{
    "level": "info",
    "message": "Server started on port 3001",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "service": "discord-spywatcher"
}
```

#### Log Files

- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- `logs/exceptions.log` - Uncaught exceptions

#### Request ID Correlation

Use the `logWithRequestId` helper to include request IDs in logs:

```typescript
import { logWithRequestId } from './middleware/winstonLogger';

logWithRequestId('info', 'Processing request', req.id, {
    userId: user.id,
    action: 'fetch_data',
});
```

## Monitoring Best Practices

### 1. Alerts Configuration

Set up alerts for critical metrics:

- Error rate > 5%
- Response time p95 > 2s
- Database query time > 1s
- WebSocket disconnection rate > 10%

### 2. Dashboard Creation

Create Grafana dashboards for:

- API performance (request rate, duration, errors)
- Database performance (query duration, connection pool)
- WebSocket connections
- System resources (CPU, memory, GC)

### 3. Log Aggregation

Configure a log aggregator to collect and analyze logs:

- ELK Stack (Elasticsearch, Logstash, Kibana)
- Grafana Loki
- Datadog Logs
- CloudWatch Logs

### 4. Performance Monitoring

Use Sentry's performance monitoring to:

- Identify slow API endpoints
- Track database query performance
- Monitor external API calls
- Analyze user experience

## Troubleshooting

### Sentry Not Working

1. Verify `SENTRY_DSN` is set correctly
2. Check Sentry project settings
3. Review console logs for Sentry initialization messages

### Metrics Not Showing

1. Verify Prometheus can access the `/metrics` endpoint
2. Check firewall rules
3. Verify the application is running and healthy

### Health Checks Failing

1. Check database connectivity
2. Verify Redis configuration (if enabled)
3. Check Discord API status
4. Review application logs for specific errors

## Integration Examples

### Docker Compose with Prometheus

```yaml
version: '3.8'
services:
    app:
        build: .
        ports:
            - '3001:3001'
        environment:
            - SENTRY_DSN=${SENTRY_DSN}

    prometheus:
        image: prom/prometheus
        ports:
            - '9090:9090'
        volumes:
            - ./prometheus.yml:/etc/prometheus/prometheus.yml
```

### Grafana Dashboard Import

Use the provided Prometheus metrics to create dashboards. Key panels:

- HTTP request rate (rate(http_requests_total[5m]))
- HTTP request duration (histogram_quantile(0.95, http_request_duration_seconds))
- Error rate (rate(http_requests_errors[5m]) / rate(http_requests_total[5m]))
- Active WebSocket connections (websocket_active_connections)

## Additional Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Winston Documentation](https://github.com/winstonjs/winston)
- [Grafana Documentation](https://grafana.com/docs/)
