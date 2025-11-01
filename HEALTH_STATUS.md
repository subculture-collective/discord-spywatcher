# Health Checks & Status Page

This document describes the health check and status page features implemented in Discord SpyWatcher.

## Overview

The application includes comprehensive health monitoring with:

- **Health Check Endpoints** - Liveness and readiness probes for orchestrators
- **Status Check Service** - Periodic health checks with latency tracking
- **Historical Uptime Tracking** - Track and calculate uptime percentages
- **Incident Management** - Create and manage service incidents
- **Public Status Page** - Real-time status dashboard for transparency

## Features

### 1. Health Check Endpoints

#### Liveness Probe

**Endpoint**: `GET /health/live`

Checks if the service is running. Always returns 200 if the server is up.

**Response**:

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Readiness Probe

**Endpoint**: `GET /health/ready`

Checks if the service is ready to handle requests by verifying:

- Database connectivity
- Redis connectivity (optional)
- Discord API connectivity

**Response (Healthy)**:

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

**Response (Unhealthy)** - Returns 503:

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

### 2. Public Status Page API

#### Get Current Status

**Endpoint**: `GET /api/status`

Returns current system status, uptime statistics, and active incidents.

**Response**:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "database": {
      "status": "operational",
      "latency": 10
    },
    "redis": {
      "status": "operational",
      "latency": 5
    },
    "discord": {
      "status": "operational",
      "latency": 50
    }
  },
  "uptime": {
    "24h": 99.9,
    "7d": 99.5,
    "30d": 99.0
  },
  "incidents": {
    "active": 0,
    "critical": 0,
    "major": 0
  }
}
```

**Status Values**:

- `healthy` - All systems operational
- `degraded` - Some services experiencing issues
- `down` - Critical systems down

#### Get Historical Status

**Endpoint**: `GET /api/status/history`

Returns historical status data for uptime charts.

**Query Parameters**:

- `limit` (optional) - Number of records to return (1-1000, default: 100)
- `hours` (optional) - Hours to look back (1-720, default: 24)

**Response**:

```json
{
  "period": {
    "hours": 24,
    "since": "2024-01-01T00:00:00.000Z"
  },
  "uptime": 99.9,
  "checks": 288,
  "avgLatency": {
    "database": 12.5,
    "redis": 6.2,
    "discord": 52.1
  },
  "history": [
    {
      "timestamp": "2024-01-01T00:00:00.000Z",
      "status": "healthy",
      "overall": true,
      "database": true,
      "databaseLatency": 10,
      "redis": true,
      "redisLatency": 5,
      "discord": true,
      "discordLatency": 50
    }
  ]
}
```

#### Get Incidents

**Endpoint**: `GET /api/status/incidents`

Returns list of incidents.

**Query Parameters**:

- `limit` (optional) - Number of incidents to return (1-100, default: 10)
- `resolved` (optional) - Include resolved incidents (default: false)

**Response**:

```json
{
  "incidents": [
    {
      "id": "1",
      "title": "Database Latency Issues",
      "description": "Investigating high database latency",
      "status": "INVESTIGATING",
      "severity": "MAJOR",
      "startedAt": "2024-01-01T00:00:00.000Z",
      "resolvedAt": null,
      "affectedServices": ["database"],
      "updates": [
        {
          "id": "u1",
          "message": "We are investigating the issue",
          "status": "INVESTIGATING",
          "createdAt": "2024-01-01T00:05:00.000Z"
        }
      ]
    }
  ],
  "count": 1
}
```

**Incident Status Values**:

- `INVESTIGATING` - Team is investigating the issue
- `IDENTIFIED` - Issue has been identified
- `MONITORING` - Fix has been deployed, monitoring results
- `RESOLVED` - Issue has been resolved

**Severity Values**:

- `MINOR` - Minor impact, no service degradation
- `MAJOR` - Service degradation, some features affected
- `CRITICAL` - Service outage, critical features down

#### Get Incident Details

**Endpoint**: `GET /api/status/incidents/:id`

Returns details of a specific incident including all updates.

### 3. Admin Incident Management

All admin endpoints require authentication and admin role.

#### Create Incident

**Endpoint**: `POST /api/admin/incidents`

**Body**:

```json
{
  "title": "Database Outage",
  "description": "Database is experiencing connectivity issues",
  "severity": "CRITICAL",
  "status": "INVESTIGATING",
  "affectedServices": ["database"],
  "initialUpdate": "We are investigating the issue"
}
```

**Required Fields**:

- `title` - Incident title
- `description` - Detailed description

**Optional Fields**:

- `severity` - MINOR, MAJOR, or CRITICAL (default: MINOR)
- `status` - INVESTIGATING, IDENTIFIED, MONITORING, or RESOLVED (default: INVESTIGATING)
- `affectedServices` - Array of affected services
- `initialUpdate` - Initial update message

#### Update Incident

**Endpoint**: `PATCH /api/admin/incidents/:id`

**Body** (all fields optional):

```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "severity": "MAJOR",
  "status": "IDENTIFIED",
  "affectedServices": ["database", "api"],
  "updateMessage": "We have identified the root cause"
}
```

**Notes**:

- Setting `status` to `RESOLVED` automatically sets `resolvedAt`
- `updateMessage` creates a new update in the incident timeline

#### Add Incident Update

**Endpoint**: `POST /api/admin/incidents/:id/updates`

**Body**:

```json
{
  "message": "Issue has been resolved",
  "status": "RESOLVED"
}
```

#### Delete/Resolve Incident

**Endpoint**: `DELETE /api/admin/incidents/:id`

**Query Parameters**:

- `permanent` (optional) - Permanently delete incident (default: false)

By default, incidents are soft-deleted by marking as RESOLVED.

#### List Incidents

**Endpoint**: `GET /api/admin/incidents`

**Query Parameters**:

- `status` (optional) - Filter by status
- `severity` (optional) - Filter by severity
- `limit` (optional) - Number of incidents (1-100, default: 50)

### 4. Status Check Service

The status check service runs automatically in the background.

**Features**:

- Runs every 5 minutes (configurable)
- Checks database, Redis, and Discord API health
- Measures latency for each service
- Stores results in database for historical tracking
- Calculates uptime percentages

**Data Retention**:

- Status checks are retained for 90 days
- Automatic cleanup removes old records

### 5. Frontend Status Page

**URL**: `/status`

Public status page accessible without authentication.

**Features**:

- Real-time system status
- Service health indicators with latency
- Uptime statistics (24h, 7d, 30d)
- Active incident list with updates
- Auto-refresh every 60 seconds

## Database Models

### StatusCheck

Stores periodic health check results.

```prisma
model StatusCheck {
  id              String   @id @default(cuid())
  timestamp       DateTime @default(now())
  status          String   // healthy, degraded, down
  database        Boolean
  databaseLatency Int?
  redis           Boolean
  redisLatency    Int?
  discord         Boolean
  discordLatency  Int?
  overall         Boolean
  metadata        Json?
}
```

### Incident

Stores service incidents.

```prisma
model Incident {
  id               String           @id @default(cuid())
  title            String
  description      String
  status           IncidentStatus   @default(INVESTIGATING)
  severity         IncidentSeverity @default(MINOR)
  startedAt        DateTime         @default(now())
  resolvedAt       DateTime?
  updates          IncidentUpdate[]
  affectedServices String[]
  metadata         Json?
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
}
```

### IncidentUpdate

Stores updates to incidents.

```prisma
model IncidentUpdate {
  id         String          @id @default(cuid())
  incidentId String
  incident   Incident        @relation(fields: [incidentId], references: [id])
  message    String
  status     IncidentStatus?
  createdAt  DateTime        @default(now())
}
```

## Configuration

### Environment Variables

No additional environment variables required. The feature uses existing database and Redis connections.

### Kubernetes Health Checks

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
  failureThreshold: 3
```

### Docker Health Checks

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3001/health/live || exit 1
```

## Usage Examples

### Check System Status

```bash
curl http://localhost:3001/api/status
```

### Create an Incident

```bash
curl -X POST http://localhost:3001/api/admin/incidents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Database Latency",
    "description": "High database response times",
    "severity": "MAJOR",
    "affectedServices": ["database"]
  }'
```

### Update Incident Status

```bash
curl -X PATCH http://localhost:3001/api/admin/incidents/incident-id \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "RESOLVED",
    "updateMessage": "Issue has been resolved"
  }'
```

### View Historical Uptime

```bash
curl "http://localhost:3001/api/status/history?hours=168&limit=500"
```

## Monitoring & Alerting

### Prometheus Metrics

The existing `/metrics` endpoint includes system health metrics. You can add alerts based on:

- Uptime percentage dropping below threshold
- Service latency exceeding threshold
- Active critical incidents

### Alert Examples

```yaml
# Alert on low uptime
- alert: LowUptime24h
  expr: (healthy_checks / total_checks) < 0.95
  for: 5m
  annotations:
    summary: "Uptime below 95% in last 24 hours"

# Alert on high latency
- alert: HighDatabaseLatency
  expr: avg_database_latency_ms > 100
  for: 10m
  annotations:
    summary: "Database latency above 100ms"
```

## Best Practices

### Incident Management

1. **Create incidents proactively** - Don't wait for users to report issues
2. **Update frequently** - Keep users informed with regular updates
3. **Be transparent** - Provide honest assessments and ETAs
4. **Post-mortem** - Document resolved incidents for future reference

### Status Page

1. **Monitor regularly** - Check the status page daily
2. **Test scenarios** - Periodically test incident creation and updates
3. **Review metrics** - Analyze uptime trends and identify patterns
4. **Set up alerts** - Configure monitoring alerts for automatic incident detection

### Uptime Tracking

1. **Baseline performance** - Establish baseline latency values
2. **Trend analysis** - Monitor latency trends over time
3. **Capacity planning** - Use historical data for capacity planning
4. **Regular cleanup** - The system automatically cleans up old status checks

## Troubleshooting

### Status Page Not Loading

1. Check that backend API is running
2. Verify CORS configuration allows frontend origin
3. Check browser console for errors
4. Verify API endpoint in frontend environment variables

### Health Checks Failing

1. Check database connectivity
2. Verify Redis is running (if configured)
3. Test Discord API access
4. Review application logs for errors

### Incident Updates Not Appearing

1. Verify admin authentication
2. Check incident ID is correct
3. Review network requests in browser DevTools
4. Check backend logs for errors

## Testing

The feature includes comprehensive test coverage:

- **Unit Tests** - Status check service (14 tests)
- **Integration Tests** - Status endpoints (13 tests)
- **Integration Tests** - Incident management (18 tests)

Run tests:

```bash
cd backend
npm test -- __tests__/unit/services/statusCheck.test.ts
npm test -- __tests__/integration/routes/status.test.ts
npm test -- __tests__/integration/routes/incidents.test.ts
```

## Security Considerations

1. **Public Access** - Status page and status endpoints are publicly accessible
2. **Admin Only** - Incident management requires admin role
3. **Data Privacy** - No sensitive data is exposed in status responses
4. **Rate Limiting** - Status endpoints are subject to rate limiting
5. **CORS** - Ensure CORS is properly configured for frontend access

## Future Enhancements

Potential improvements for future versions:

- [ ] Scheduled maintenance windows
- [ ] Notification subscriptions (email, webhook)
- [ ] Historical incident archive
- [ ] Service-specific status pages
- [ ] Custom metrics and thresholds
- [ ] Integration with external status page services
- [ ] Multi-region status tracking
- [ ] Performance degradation detection
- [ ] Automated incident creation from metrics
