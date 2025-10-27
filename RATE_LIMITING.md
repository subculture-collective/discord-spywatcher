# Rate Limiting & DDoS Protection API Documentation

## Overview

This document describes the rate limiting, DDoS protection, and IP management features of the Discord SpyWatcher API.

## Rate Limiting

### Rate Limit Headers

All API responses include the following rate limit headers:

- `X-RateLimit-Limit`: Maximum number of requests allowed in the time window
- `X-RateLimit-Remaining`: Number of requests remaining in the current window
- `X-RateLimit-Reset`: Timestamp when the rate limit window resets
- `Retry-After`: (when rate limited) Seconds until the client can retry

### Rate Limit Policies

| Endpoint Category | Limit | Window | Description |
|------------------|-------|--------|-------------|
| Global | 100 requests | 15 minutes | Applied to all API endpoints |
| Authentication | 5 requests | 15 minutes | Login and authentication endpoints |
| Analytics | 30 requests | 1 minute | Analytics data endpoints |
| Admin | 100 requests | 15 minutes | Admin-only endpoints |
| Public | 60 requests | 1 minute | Public data endpoints |
| Webhooks | 1000 requests | 1 hour | Webhook endpoints |
| Refresh Token | 10 requests | 15 minutes | Token refresh endpoint |

### User-Based Rate Limiting

Authenticated users have different rate limits based on their role:

- **Admin**: 200 requests/minute
- **Moderator**: 100 requests/minute
- **Regular User**: 60 requests/minute
- **Unauthenticated**: 30 requests/minute

### Rate Limit Response

When rate limited, the API returns a `429 Too Many Requests` response:

```json
{
  "error": "Too many requests",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 600
}
```

## IP Management

### Prerequisites

All IP management endpoints require:
- Authentication (valid JWT token)
- Admin role

Base URL: `/api/admin/ip-management`

### List Blocked IPs

Get all permanently blocked IP addresses.

**Endpoint**: `GET /blocked`

**Response**:
```json
{
  "blocked": [
    {
      "ip": "192.168.1.1",
      "reason": "Malicious activity",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### List Whitelisted IPs

Get all whitelisted IP addresses.

**Endpoint**: `GET /whitelisted`

**Response**:
```json
{
  "whitelisted": [
    {
      "ip": "192.168.1.100",
      "reason": "Office IP",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Check IP Status

Check the blocking/whitelisting status of a specific IP.

**Endpoint**: `GET /check/:ip`

**Parameters**:
- `ip` (path): IP address to check (IPv4 or IPv6)

**Response**:
```json
{
  "ip": "192.168.1.1",
  "blocked": false,
  "whitelisted": false,
  "violations": 5,
  "status": "normal"
}
```

**Status Values**:
- `normal`: IP is neither blocked nor whitelisted
- `blocked`: IP is permanently blocked
- `whitelisted`: IP is whitelisted

### Block IP Permanently

Permanently block an IP address.

**Endpoint**: `POST /block`

**Request Body**:
```json
{
  "ip": "192.168.1.1",
  "reason": "Malicious activity detected"
}
```

**Response**:
```json
{
  "message": "IP permanently blocked",
  "ip": "192.168.1.1",
  "reason": "Malicious activity detected"
}
```

### Block IP Temporarily

Temporarily block an IP address for a specified duration.

**Endpoint**: `POST /temp-block`

**Request Body**:
```json
{
  "ip": "192.168.1.1",
  "duration": 3600,
  "reason": "Rate limit abuse"
}
```

**Parameters**:
- `ip`: IP address to block
- `duration`: Block duration in seconds (60-86400)
- `reason`: (optional) Reason for blocking

**Response**:
```json
{
  "message": "IP temporarily blocked",
  "ip": "192.168.1.1",
  "duration": 3600,
  "reason": "Rate limit abuse"
}
```

### Unblock IP

Remove a permanent IP block.

**Endpoint**: `DELETE /unblock/:ip`

**Parameters**:
- `ip` (path): IP address to unblock

**Response**:
```json
{
  "message": "IP unblocked successfully",
  "ip": "192.168.1.1"
}
```

### Remove Temporary Block

Remove a temporary IP block.

**Endpoint**: `DELETE /temp-unblock/:ip`

**Parameters**:
- `ip` (path): IP address to unblock

**Response**:
```json
{
  "message": "Temporary block removed successfully",
  "ip": "192.168.1.1"
}
```

### Add IP to Whitelist

Add an IP to the whitelist, bypassing all rate limits and blocks.

**Endpoint**: `POST /whitelist`

**Request Body**:
```json
{
  "ip": "192.168.1.100",
  "reason": "Office IP address"
}
```

**Response**:
```json
{
  "message": "IP added to whitelist",
  "ip": "192.168.1.100",
  "reason": "Office IP address"
}
```

### Remove IP from Whitelist

Remove an IP from the whitelist.

**Endpoint**: `DELETE /whitelist/:ip`

**Parameters**:
- `ip` (path): IP address to remove from whitelist

**Response**:
```json
{
  "message": "IP removed from whitelist",
  "ip": "192.168.1.100"
}
```

## Monitoring

### Prerequisites

All monitoring endpoints require:
- Authentication (valid JWT token)
- Admin role

Base URL: `/api/admin/monitoring`

### Rate Limit Statistics

Get overall rate limit statistics and violations.

**Endpoint**: `GET /rate-limits`

**Response**:
```json
{
  "violations": [
    {
      "ip": "192.168.1.1",
      "count": 15,
      "ttl": 3456
    }
  ],
  "tempBlocked": [
    {
      "ip": "192.168.1.2",
      "ttl": 1800
    }
  ],
  "rateLimitStats": {
    "global": 45,
    "auth": 12,
    "analytics": 8
  },
  "summary": {
    "totalViolations": 27,
    "uniqueIPsWithViolations": 5,
    "tempBlockedCount": 2,
    "activeRateLimiters": 3
  }
}
```

### IP Rate Limit Details

Get detailed rate limit information for a specific IP.

**Endpoint**: `GET /rate-limits/:ip`

**Parameters**:
- `ip` (path): IP address to check

**Response**:
```json
{
  "ip": "192.168.1.1",
  "violations": 15,
  "violationTTL": 3456,
  "isTemporarilyBlocked": false,
  "blockTTL": null,
  "rateLimitInfo": {
    "rl:global:192.168.1.1": {
      "value": "45",
      "ttl": 854
    }
  }
}
```

### Clear Rate Limit Data

Clear rate limit violations and data for a specific IP.

**Endpoint**: `DELETE /rate-limits/:ip`

**Parameters**:
- `ip` (path): IP address to clear data for

**Response**:
```json
{
  "message": "Rate limit data cleared successfully",
  "ip": "192.168.1.1",
  "clearedKeys": 3
}
```

### System Health

Get system health and performance metrics.

**Endpoint**: `GET /system`

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": "86400s",
  "system": {
    "cpu": {
      "usage": "45.2%",
      "cores": 4,
      "load": [0.8, 0.7, 0.6]
    },
    "memory": {
      "usage": "62.3%",
      "free": "2048MB",
      "total": "8192MB"
    },
    "process": {
      "memory": {
        "rss": 125829120,
        "heapTotal": 67584000,
        "heapUsed": 45678912,
        "external": 1234567
      },
      "pid": 12345
    }
  },
  "redis": {
    "available": true
  }
}
```

## DDoS Protection

### Automatic Protection Features

The API automatically protects against various DDoS attack vectors:

#### Layer 7 Protection

- **Request Validation**: Malformed requests are rejected
- **Payload Size Limits**: Maximum 10MB per request
- **Query Parameter Limits**: Maximum 30 parameters per request
- **Header Validation**: Excessive or malicious headers are rejected
- **Slow Request Detection**: Requests taking >30s are terminated

#### Intelligent Blocking

- **Automatic IP Blocking**: IPs with 10+ rate limit violations are auto-blocked for 1 hour
- **Progressive Delays**: Requests beyond limits incur increasing delays (up to 20s)
- **Abuse Detection**: Suspicious patterns trigger automatic countermeasures

#### Load Management

- **Circuit Breaker**: Fails fast after 5 consecutive errors, recovers after 1 minute
- **Load Shedding**: Under heavy load (CPU >80% or Memory >90%), non-critical requests are rejected
- **Priority Queuing**: Admin requests are prioritized during high load

### Cache Headers

The API uses cache headers to reduce load:

- **Analytics**: `Cache-Control: private, max-age=60`
- **GET Requests**: `Cache-Control: private, max-age=30`
- **Health Checks**: `Cache-Control: no-cache, no-store`
- **Mutations**: `Cache-Control: no-cache, no-store`

### ETags

The API supports ETags for conditional requests. Include `If-None-Match` header with the ETag value to receive a `304 Not Modified` response when content hasn't changed.

## Error Responses

### 400 Bad Request

Invalid request format or parameters.

```json
{
  "error": "Invalid IP address format"
}
```

### 403 Forbidden

IP address is blocked.

```json
{
  "error": "Access denied from this IP",
  "reason": "IP address permanently blocked"
}
```

### 413 Payload Too Large

Request exceeds size limit.

```json
{
  "error": "Request entity too large",
  "maxSize": "10MB",
  "received": "15.2MB"
}
```

### 429 Too Many Requests

Rate limit exceeded.

```json
{
  "error": "Too many requests",
  "message": "Too many authentication attempts. Please try again later.",
  "retryAfter": 600
}
```

### 503 Service Unavailable

Service temporarily unavailable due to high load or maintenance.

```json
{
  "error": "Service temporarily unavailable",
  "message": "Server under high load, please try again later",
  "retryAfter": 60
}
```

## Best Practices

### For API Consumers

1. **Respect Rate Limits**: Monitor rate limit headers and adjust request frequency
2. **Implement Exponential Backoff**: When rate limited, wait before retrying
3. **Use Caching**: Leverage ETags and Cache-Control headers
4. **Handle 429 Gracefully**: Don't retry immediately when rate limited
5. **Monitor Your IP**: Check `/api/admin/monitoring/rate-limits/:ip` periodically

### For Administrators

1. **Monitor Violations**: Regularly check `/api/admin/monitoring/rate-limits`
2. **Whitelist Trusted IPs**: Add office/server IPs to whitelist
3. **Review Blocked IPs**: Periodically review and clean up blocks
4. **Set Up Alerts**: Monitor system health via `/api/admin/monitoring/system`
5. **Document Blocks**: Always provide a reason when blocking IPs

## Configuration

Rate limiting and DDoS protection can be configured via environment variables:

```bash
# Enable/disable rate limiting
ENABLE_RATE_LIMITING=true

# Enable/disable IP blocking
ENABLE_IP_BLOCKING=true

# Enable/disable Redis-backed rate limiting
ENABLE_REDIS_RATE_LIMITING=true

# Enable/disable load shedding
ENABLE_LOAD_SHEDDING=true

# Redis connection URL (optional)
REDIS_URL=redis://localhost:6379

# Maximum request size in MB
MAX_REQUEST_SIZE_MB=10
```

## Database Schema

### BlockedIP Model

```prisma
model BlockedIP {
  id        Int      @id @default(autoincrement())
  ip        String   @unique
  reason    String?
  createdAt DateTime @default(now())
}
```

### WhitelistedIP Model

```prisma
model WhitelistedIP {
  id        Int      @id @default(autoincrement())
  ip        String   @unique
  reason    String?
  createdAt DateTime @default(now())
}
```

## Support

For issues or questions about rate limiting and DDoS protection, please refer to:
- [SECURITY.md](../SECURITY.md) - Security policies
- [GitHub Issues](https://github.com/subculture-collective/discord-spywatcher/issues) - Report issues
- [Contributing Guide](../CONTRIBUTING.md) - Contribution guidelines
