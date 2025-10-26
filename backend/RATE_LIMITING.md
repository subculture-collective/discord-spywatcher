# Rate Limiting & DDoS Protection

This document describes the comprehensive rate limiting and DDoS protection mechanisms implemented in Discord SpyWatcher.

## Overview

The application implements a multi-layer defense strategy against abuse, DDoS attacks, and service overload:

1. **Global Rate Limiting** - Applies to all API endpoints
2. **Endpoint-Specific Rate Limiting** - Different limits for different endpoint types
3. **User-Based Rate Limiting** - Dynamic limits based on authentication and role
4. **IP Blocking** - Temporary and permanent IP blocks with whitelist support
5. **Request Validation** - Layer 7 DDoS protection
6. **Abuse Detection** - Automatic blocking of abusive IPs
7. **Load Shedding** - Graceful degradation under high load
8. **Caching Strategy** - Redis caching with ETag support

## Rate Limit Configuration

### Global Rate Limiting

Applied to all `/api/*` endpoints:
- **Limit**: 100 requests per 15 minutes per IP
- **Storage**: Redis (if available) or in-memory
- **Headers**: Includes `RateLimit-*` headers in responses
- **Whitelist**: Localhost IPs (`127.0.0.1`, `::1`) are exempted

### Endpoint-Specific Limits

#### Authentication Endpoints (`/api/auth/*`)
- **Limit**: 5 requests per 15 minutes
- **Purpose**: Prevent brute force attacks
- **Special**: Successful logins don't count toward limit

#### Analytics Endpoints (`/api/analytics/*`, `/ghosts`, `/heatmap`, etc.)
- **Limit**: 30 requests per 1 minute
- **Caching**: 60 second Redis cache with ETag support
- **Headers**: `Cache-Control`, `ETag`, `X-Cache` (HIT/MISS)

#### Admin Endpoints (`/api/admin/*`)
- **Limit**: 100 requests per 15 minutes
- **Purpose**: Higher limits for administrative operations

#### Public Endpoints
- **Limit**: 60 requests per 1 minute
- **Purpose**: Standard rate for general API access

#### Webhook Endpoints
- **Limit**: 1000 requests per 1 hour
- **Purpose**: High volume support for webhook integrations

#### Refresh Token Endpoint
- **Limit**: 10 requests per 15 minutes
- **Purpose**: Prevent token refresh abuse

### User-Based Rate Limiting

Dynamic limits based on user authentication and role:

| User Type | Limit | Window |
|-----------|-------|--------|
| Unauthenticated | 30 req | 1 minute |
| Regular User | 60 req | 1 minute |
| Moderator | 100 req | 1 minute |
| Admin | 200 req | 1 minute |

**Key Generator**: Uses user ID if authenticated, otherwise falls back to IP address.

## IP Blocking

### Whitelist Management

Whitelisted IPs bypass all rate limiting and blocking checks.

**Admin Endpoints**:
- `GET /api/whitelisted` - List all whitelisted IPs
- `POST /api/whitelist` - Add IP to whitelist
  ```json
  {
    "ip": "192.168.1.100",
    "description": "Company VPN gateway"
  }
  ```
- `DELETE /api/whitelist` - Remove IP from whitelist
  ```json
  {
    "ip": "192.168.1.100"
  }
  ```

### Temporary Blocks

Stored in Redis with TTL:
- **Default Duration**: 1 hour (3600 seconds)
- **Trigger**: 10+ rate limit violations within 1 hour
- **Auto-Applied**: By abuse detection middleware

**API Functions**:
```typescript
temporarilyBlockIP(ip: string, duration: number, reason?: string)
removeTemporaryBlock(ip: string)
```

### Permanent Blocks

Stored in database:
- **Duration**: Indefinite until manually removed
- **Admin Required**: Manual intervention to add/remove

**Admin Endpoints**:
- `GET /api/banned` - List all permanently blocked IPs
- `POST /api/ban` - Permanently ban IP
  ```json
  {
    "ip": "203.0.113.42",
    "reason": "Repeated DDoS attempts"
  }
  ```
- `POST /api/unban` - Remove permanent ban
  ```json
  {
    "ip": "203.0.113.42"
  }
  ```

## DDoS Protection (Layer 7)

### Request Validation

Multiple validation layers applied before request processing:

1. **Header Validation**
   - Maximum 50 headers per request
   - No null bytes in headers (injection protection)
   - User-Agent limited to 500 characters

2. **URL Validation**
   - Maximum URL length: 2048 characters

3. **Query Parameters**
   - Maximum 30 parameters per request
   - Prevents parameter pollution attacks

4. **Payload Size**
   - Maximum request body: 10MB (configurable)
   - Enforced at middleware and express parser levels

5. **Content-Type Validation**
   - Only accepts: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`

### Slowloris Protection

Progressive delay mechanism:
- Starts delaying after 50 requests in 15 minutes
- Adds 500ms delay per request after threshold
- Maximum delay: 20 seconds
- Prevents slow request attacks

### Abuse Detection

Automatic monitoring and response:
- Tracks rate limit violations per IP
- Logs violations to audit log with details:
  - IP address
  - Request path and method
  - User agent
  - Violation count
- **Auto-Block Threshold**: 10 violations in 1 hour
- **Block Duration**: 1 hour (temporary block)
- Audit logs created for both violations and blocks

## Load Management

### Load Shedding

Monitors system resources and rejects non-critical requests under high load:

**Thresholds**:
- CPU Usage: 80%
- Memory Usage: 90%

**Exemptions**:
- Health check endpoints (`/api/health`)
- Admin users (role: ADMIN)

**Response**: HTTP 503 with retry-after suggestion

### Circuit Breaker

Prevents cascading failures:
- **Threshold**: 5 consecutive failures
- **States**: CLOSED → OPEN → HALF_OPEN → CLOSED
- **Timeout**: 1 minute (transitions to HALF_OPEN)
- **Response**: HTTP 503 when circuit is OPEN

### Priority Queue

Requests prioritized by authentication status and role:
1. **Admin** - Highest priority
2. **Moderator** - Medium-high priority
3. **Authenticated User** - Medium priority
4. **Unauthenticated** - Lowest priority

## Caching Strategy

### Redis Caching

Analytics endpoints use Redis caching for performance:

**Features**:
- TTL: 60 seconds (configurable)
- Key format: `cache:{path}:{query}:{guildId}`
- Headers: `X-Cache: HIT|MISS`
- Automatic cache invalidation available

**Cache Functions**:
```typescript
invalidateCache(pattern: string) // Invalidate specific pattern
clearAllCache() // Clear all cached entries
```

### ETag Support

Conditional request support for bandwidth optimization:

**Implementation**:
- MD5 hash of response body as ETag
- Client sends `If-None-Match` header
- Server responds with 304 Not Modified if unchanged
- Reduces bandwidth for unchanged data

**Headers**:
```
ETag: "5d41402abc4b2a76b9719d911017c592"
Cache-Control: private, max-age=60, stale-while-revalidate=120
```

## Monitoring & Logging

### Audit Logs

All security events logged to `AuditLog` table:

**Event Types**:
- `RATE_LIMIT_VIOLATION` - Rate limit exceeded
- `AUTO_IP_BLOCK` - Automatic IP block triggered
- `TEMP_IP_BLOCK` - Manual temporary block
- `IP_WHITELIST_ADD` - IP added to whitelist
- `IP_WHITELIST_REMOVE` - IP removed from whitelist

**Log Details**:
- IP address
- Timestamp
- Action details (JSON)
- User agent
- Request metadata (for violations)

### Health Monitoring

Health check endpoint with system metrics:

**Endpoint**: `GET /api/health`

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-26T02:34:01.146Z",
  "uptime": "3600s",
  "system": {
    "cpu": {
      "usage": "45.2%",
      "cores": 4,
      "load": [1.2, 1.5, 1.3]
    },
    "memory": {
      "usage": "62.3%",
      "free": "2048MB",
      "total": "8192MB"
    }
  }
}
```

## Environment Configuration

Required environment variables:

```env
# Feature Flags
ENABLE_RATE_LIMITING=true          # Enable global rate limiting
ENABLE_IP_BLOCKING=true            # Enable IP block middleware
ENABLE_REDIS_RATE_LIMITING=true   # Use Redis for distributed limiting
ENABLE_LOAD_SHEDDING=true         # Enable load shedding under stress

# Redis (optional but recommended)
REDIS_URL=redis://localhost:6379

# Security
MAX_REQUEST_SIZE_MB=10             # Maximum request body size
LOG_LEVEL=info                     # Logging level
```

## Best Practices

### For API Clients

1. **Respect Rate Limits**: Check `RateLimit-*` headers
2. **Handle 429 Responses**: Implement exponential backoff
3. **Use ETags**: Send `If-None-Match` for repeated requests
4. **Cache Locally**: Respect `Cache-Control` headers
5. **Identify Requests**: Include descriptive User-Agent

### For Administrators

1. **Monitor Audit Logs**: Regular review of security events
2. **Whitelist Known IPs**: Add trusted networks to whitelist
3. **Review Blocks**: Periodically review blocked IPs
4. **Configure Alerts**: Set up monitoring for auto-blocks
5. **Scale Redis**: Use Redis cluster for production

## API Rate Limit Headers

All rate-limited responses include standard headers:

```
RateLimit-Limit: 100
RateLimit-Remaining: 45
RateLimit-Reset: 1635350400
Retry-After: 900
```

## Error Responses

### Rate Limit Exceeded (429)

```json
{
  "error": "Too many requests",
  "message": "Too many requests. Please try again later.",
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
    "cpu": "85.2%",
    "memory": "92.1%"
  }
}
```

## Troubleshooting

### Rate Limits Too Strict

Adjust limits in `backend/src/middleware/rateLimiter.ts`:
```typescript
export const globalRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 200, // Increase from 100
    // ...
});
```

### Redis Connection Issues

The system gracefully falls back to in-memory rate limiting if Redis is unavailable. Check logs for Redis connection errors.

### High Memory Usage

If in-memory rate limiting causes memory issues:
1. Enable Redis (`ENABLE_REDIS_RATE_LIMITING=true`)
2. Reduce rate limit windows
3. Clear old rate limit data regularly

## Security Considerations

1. **IP Spoofing**: Trust `X-Forwarded-For` only behind trusted proxy
2. **Distributed Attacks**: Use Redis for distributed rate limiting
3. **Legitimate Bursts**: Whitelist known good actors
4. **False Positives**: Monitor auto-blocks for legitimate users
5. **DDoS Scale**: Consider Cloudflare/AWS Shield for network-layer DDoS

## Future Enhancements

Potential improvements for consideration:
- [ ] GeoIP-based filtering (optional)
- [ ] CAPTCHA challenge for suspicious traffic
- [ ] Machine learning-based anomaly detection
- [ ] GraphQL query complexity limiting
- [ ] WebSocket rate limiting
- [ ] Premium tier with higher limits
- [ ] Real-time dashboard for rate limit metrics
