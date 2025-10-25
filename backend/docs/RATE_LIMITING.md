# Rate Limiting & DDoS Protection

This document describes the comprehensive rate limiting and DDoS protection mechanisms implemented in the Discord SpyWatcher backend.

## Overview

The application implements a multi-layer defense strategy to prevent abuse and ensure service availability:

1. **Multi-Layer Rate Limiting** - Different limits for different endpoint types
2. **DDoS Protection** - Request validation, parameter limits, header validation
3. **IP Blocking** - Temporary and permanent IP blocks with automatic abuse detection
4. **Load Management** - System load monitoring and request shedding under high load

## Rate Limiting

### Global Rate Limiting

All API endpoints are protected by a global rate limiter:
- **Limit**: 100 requests per 15 minutes per IP
- **Storage**: Redis (distributed) or in-memory (single instance)
- **Whitelisted IPs**: localhost (127.0.0.1, ::1)

### Endpoint-Specific Rate Limits

Different endpoint types have specific rate limits:

| Endpoint Type | Limit | Window | Description |
|--------------|-------|--------|-------------|
| Authentication | 5 req | 15 min | Prevents brute force attacks |
| Analytics | 30 req | 1 min | Moderate limit for data queries |
| Admin | 100 req | 15 min | Higher limit for admin operations |
| Public | 60 req | 1 min | Standard public endpoint limit |
| Webhooks | 1000 req | 1 hour | High volume for webhook endpoints |
| Refresh Token | 10 req | 15 min | Prevents token refresh abuse |

### User-Based Rate Limiting

Authenticated users have dynamic rate limits based on their role:

| Role | Requests per Minute |
|------|-------------------|
| ADMIN | 200 |
| MODERATOR | 100 |
| USER | 60 |
| Unauthenticated | 30 |

**Key Features:**
- Uses user ID instead of IP for tracking authenticated users
- Fallback to IP-based tracking for unauthenticated requests
- Distributed tracking via Redis

## DDoS Protection

### Request Validation

Multiple layers of request validation protect against malformed and malicious requests:

1. **URL Length Validation**
   - Maximum URL length: 2048 characters
   - Rejects excessively long URLs that could cause processing issues

2. **User-Agent Validation**
   - Maximum length: 500 characters
   - Detects and blocks suspicious or malformed user agents

3. **Content-Type Validation**
   - POST/PUT/PATCH requests must use supported content types:
     - application/json
     - application/x-www-form-urlencoded
     - multipart/form-data

### Parameter Pollution Protection

- **Query Parameter Limit**: Maximum 30 query parameters per request
- Prevents parameter pollution attacks and excessive parsing overhead

### Header Validation

1. **Null Byte Detection**: Rejects headers containing null bytes (injection attempts)
2. **Header Count Limit**: Maximum 50 headers per request
3. Protects against header-based attacks

### Payload Size Limits

- **Maximum Payload**: 10MB
- Enforced at multiple levels:
  - Express JSON parser
  - Custom middleware validation
- Returns detailed error messages with received payload size

### Slowloris Protection

- **Progressive Delay**: Requests exceeding limits are progressively delayed
- **Configuration**:
  - Starts delaying after 50 requests
  - Adds 500ms delay per request
  - Maximum delay: 20 seconds
- Prevents slow request attacks while allowing legitimate traffic

### Request Timeout

- **Timeout**: 30 seconds per request
- Automatically rejects requests that take too long
- Protects against slowloris and similar attacks

## IP Blocking

### Temporary Blocks (Redis)

- Stored in Redis with automatic expiration
- Default duration: 1 hour (configurable)
- Use cases:
  - Automatic blocking after rate limit violations
  - Suspicious activity detection
  - Manual temporary blocks

### Permanent Blocks (Database)

- Stored in PostgreSQL database
- Persists across server restarts
- Includes reason field for documentation
- Manual management via admin APIs

### Automatic Abuse Detection

The system automatically blocks IPs that violate rate limits repeatedly:

- **Threshold**: 10 rate limit violations within 1 hour
- **Action**: Temporary IP block (1 hour)
- **Tracking**: Via Redis counters
- **Logging**: All blocks logged to audit log

### Whitelisting

Trusted IPs can be whitelisted to bypass rate limiting:
- Default: localhost (127.0.0.1, ::1, ::ffff:127.0.0.1)
- Configurable for additional trusted IPs

## Load Management

### Load Shedding

The system monitors CPU and memory usage and sheds non-critical load under stress:

**Thresholds:**
- CPU usage > 80%
- Memory usage > 90%

**Behavior:**
- Critical endpoints remain available (health checks)
- Admin users always have access
- Other requests receive 503 Service Unavailable
- Response includes retry-after suggestion (60 seconds)

### Circuit Breaker

Implements the circuit breaker pattern to prevent cascading failures:

**States:**
- **CLOSED**: Normal operation
- **OPEN**: Service degraded, fail fast (after 5 failures)
- **HALF-OPEN**: Testing recovery (after 1 minute)

**Benefits:**
- Prevents cascading failures
- Provides fast failure feedback
- Automatic recovery attempts

### Health Check with Metrics

Enhanced health check endpoint (`/api/health`) provides system metrics:

```json
{
  "status": "healthy|degraded",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": "3600s",
  "system": {
    "cpu": {
      "usage": "45.2%",
      "cores": 4,
      "load": [1.8, 1.5, 1.3]
    },
    "memory": {
      "usage": "62.5%",
      "free": "3072MB",
      "total": "8192MB"
    }
  }
}
```

## Redis Configuration

### Connection

Redis is required for distributed rate limiting and temporary IP blocks:

```bash
# Required environment variable
REDIS_URL=redis://localhost:6379

# Feature flags
ENABLE_REDIS_RATE_LIMITING=true  # Use Redis for rate limiting
ENABLE_RATE_LIMITING=true        # Enable rate limiting
ENABLE_IP_BLOCKING=true          # Enable IP blocking
ENABLE_LOAD_SHEDDING=true        # Enable load shedding
```

### Fallback Behavior

If Redis is unavailable:
- Rate limiting falls back to in-memory storage (not suitable for multi-instance deployments)
- Temporary IP blocks are unavailable (permanent blocks still work)
- System logs warnings about missing Redis

### Redis Key Prefixes

The system uses namespaced keys for organization:

| Prefix | Purpose |
|--------|---------|
| `rl:global:` | Global rate limiter |
| `rl:auth:` | Authentication rate limiter |
| `rl:analytics:` | Analytics rate limiter |
| `rl:admin:` | Admin rate limiter |
| `rl:user:` | User-based rate limiter |
| `blocked:` | Temporary IP blocks |
| `violations:` | Rate limit violation tracking |

## Response Headers

Rate-limited responses include standard headers:

```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1640995200
Retry-After: 900  (only on 429 responses)
```

## Error Responses

### Rate Limit Exceeded (429)

```json
{
  "error": "Too many requests",
  "message": "Too many authentication attempts. Please try again later.",
  "retryAfter": 900
}
```

### IP Blocked (403)

```json
{
  "error": "Access denied from this IP",
  "reason": "Temporary block due to suspicious activity",
  "retryAfter": 3600
}
```

### Service Unavailable (503)

```json
{
  "error": "Service temporarily unavailable",
  "message": "Server under high load, please try again later",
  "retryAfter": 60,
  "systemLoad": {
    "cpu": "85.3%",
    "memory": "91.2%"
  }
}
```

## Admin APIs

### Ban IP Address

Permanently ban an IP address:

```typescript
import { banIP } from './middleware/ipBlock';

await banIP('192.0.2.1', 'Malicious activity detected');
```

### Unban IP Address

Remove a permanent IP ban:

```typescript
import { unbanIP } from './middleware/ipBlock';

await unbanIP('192.0.2.1');
```

### Temporary Block

Create a temporary IP block:

```typescript
import { temporarilyBlockIP } from './middleware/ipBlock';

// Block for 2 hours
await temporarilyBlockIP('192.0.2.1', 7200, 'Suspicious behavior');
```

### Check IP Status

Check if an IP is blocked:

```typescript
import { isIPBlocked } from './middleware/ipBlock';

const blocked = await isIPBlocked('192.0.2.1');
```

## Best Practices

1. **Monitor Rate Limit Violations**: Track 429 responses to identify potential attacks or legitimate traffic patterns
2. **Adjust Limits as Needed**: Rate limits can be tuned based on actual usage patterns
3. **Use CDN**: Consider using Cloudflare or similar CDN for additional DDoS protection
4. **Database Indexing**: Ensure the `blockedIP.ip` column is indexed for fast lookups
5. **Redis Monitoring**: Monitor Redis memory usage and connection health
6. **Alert on High Load**: Set up alerts for CPU/memory thresholds
7. **Regular Cleanup**: Regularly review and clean up old IP blocks

## Testing

The rate limiting and DDoS protection features include comprehensive test coverage:

- Unit tests for each middleware component
- Integration tests for rate limiting behavior
- Load testing recommended before production deployment

Run tests:
```bash
npm test -- --testPathPatterns="ddosProtection|loadShedding|redis"
```

## Security Considerations

1. **IP Spoofing**: Use a trusted proxy (nginx, Cloudflare) and configure Express to trust proxy headers
2. **Distributed Systems**: Redis is required for multi-instance deployments
3. **Rate Limit Storage**: In-memory rate limiting doesn't work across multiple instances
4. **Database Performance**: IP blocking checks are optimized with indexes
5. **Redis Availability**: System degrades gracefully if Redis is unavailable

## Future Enhancements

- Geographic filtering (GeoIP-based blocking)
- CAPTCHA challenges for suspicious traffic
- Machine learning-based anomaly detection
- Per-user API keys with custom rate limits
- Rate limit exemptions for premium users
- Advanced analytics dashboard for rate limit metrics
