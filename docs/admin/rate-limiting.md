# Rate Limiting Configuration

Administrative guide to configuring and managing rate limiting, quotas, and API access control in Spywatcher.

## Overview

Rate limiting protects your Spywatcher instance from:

- **API Abuse**: Prevent excessive API usage
- **DDoS Attacks**: Mitigate denial-of-service attempts
- **Resource Exhaustion**: Protect server resources
- **Fair Usage**: Ensure equitable access for all users

See [RATE_LIMITING.md](/RATE_LIMITING.md) in the root directory for complete technical documentation.

## Rate Limiting Layers

### Global Rate Limits

System-wide request limits:

**Configuration:**

**Admin Panel** → **Settings** → **Rate Limiting** → **Global**

```yaml
Global Limits:
  All Requests: 1000 requests / 15 minutes
  Burst Allowance: 50 requests
  
  Authentication Endpoints: 5 requests / 15 minutes
  Refresh Token: 10 requests / 15 minutes
  Admin Endpoints: 30 requests / 15 minutes
  
Block Duration: 15 minutes
```

### Per-Endpoint Rate Limits

Specific limits for individual endpoints:

**Endpoint Configuration:**

```yaml
/api/analytics/ghosts:
  Limit: 60 requests / minute
  Burst: 10 requests
  Tier Multipliers:
    FREE: 1x
    PRO: 5x
    ENTERPRISE: 20x

/api/admin/users:
  Limit: 30 requests / minute
  Burst: 5 requests
  Required Role: ADMIN
  
/api/public/webhooks:
  Limit: 10 requests / minute
  Burst: 2 requests
  Tier Multipliers:
    PRO: 5x
    ENTERPRISE: 10x
```

### Per-User Rate Limits

User-specific limits based on roles and tiers:

**USER Role:**
```yaml
API Requests: 100 / 15 minutes
Burst: 20 requests
Daily Quota: 1,000 requests
```

**MODERATOR Role:**
```yaml
API Requests: 500 / 15 minutes
Burst: 50 requests
Daily Quota: 10,000 requests
```

**ADMIN Role:**
```yaml
API Requests: 1000 / 15 minutes
Burst: 100 requests
Daily Quota: 100,000 requests
```

**SUPER_ADMIN Role:**
```yaml
API Requests: Unlimited
Burst: Unlimited
Daily Quota: Unlimited
```

### Per-IP Rate Limits

Network-level rate limiting:

**IP-Based Limits:**
```yaml
Unauthenticated Requests:
  Limit: 100 requests / 15 minutes
  Burst: 20 requests

Authenticated Requests:
  Limit: 1000 requests / 15 minutes
  Burst: 50 requests

Failed Authentication:
  Limit: 5 attempts / 15 minutes
  Block Duration: 1 hour (escalating)
```

## Quota Management

### Subscription Tiers

Configure quota limits by subscription tier:

**Admin Panel** → **Settings** → **Quotas** → **Tiers**

**FREE Tier:**
```yaml
Daily Limits:
  Analytics: 100 requests
  API: 1,000 requests
  Public: 500 requests
  Admin: No access
  Total: 1,000 requests/day

Rate Limits:
  Requests per minute: 10
  Burst: 5
  
Features:
  - Basic analytics
  - Limited API access
  - No webhooks
```

**PRO Tier:**
```yaml
Daily Limits:
  Analytics: 1,000 requests
  API: 10,000 requests
  Public: 5,000 requests
  Admin: No access
  Total: 10,000 requests/day

Rate Limits:
  Requests per minute: 100
  Burst: 25
  
Features:
  - Full analytics
  - Enhanced API access
  - Webhook support
  - Priority support
```

**ENTERPRISE Tier:**
```yaml
Daily Limits:
  Analytics: 10,000 requests
  API: 100,000 requests
  Public: 50,000 requests
  Admin: 50,000 requests
  Total: 100,000 requests/day

Rate Limits:
  Requests per minute: 1000
  Burst: 200
  Custom limits available
  
Features:
  - Unlimited analytics
  - Full API access
  - Advanced features
  - Custom integrations
  - Dedicated support
  - SLA guarantees
```

### Custom Quotas

Override default quotas for specific users:

**Admin Panel** → **Users** → Select user → **Quotas**

**Set Custom Quota:**
```yaml
User: john_doe
Current Tier: PRO
Custom Limits: Enabled

Daily Quotas:
  Analytics: 5,000 (default: 1,000)
  API: 25,000 (default: 10,000)
  Reason: Heavy analytics usage for research
  Expires: 2024-12-31

Rate Limits:
  Per minute: 200 (default: 100)
  Burst: 50 (default: 25)
```

### Viewing Quota Usage

**Monitor User Quotas:**

**Admin Panel** → **Analytics** → **Quota Usage**

**Quota Dashboard:**
```yaml
Top Users by Quota Consumption:
  1. user_123: 95% of daily quota
  2. user_456: 87% of daily quota
  3. user_789: 82% of daily quota

Quota Exceeded (Last 24h): 15 users
  - Actions Taken: Rate limited, email sent

Near Quota Limit (>80%): 42 users
  - Actions: Warning notification sent

Average Quota Usage: 34%
```

**Per-User Quota Stats:**
```yaml
User: john_doe (PRO tier)
Period: Last 30 days

Daily Quota (10,000 requests):
  Average Usage: 6,847 (68%)
  Peak Usage: 9,945 (99%)
  Exceeded: 0 days
  
By Category:
  Analytics: 45%
  API: 40%
  Public: 15%

Trend: ⬆️ Increasing (consider upgrade)
```

## Configuration Options

### Environment Variables

Configure rate limiting via environment:

```bash
# Enable rate limiting
ENABLE_RATE_LIMITING=true
ENABLE_REDIS_RATE_LIMITING=true

# Global limits
RATE_LIMIT_WINDOW=900000  # 15 minutes in ms
RATE_LIMIT_MAX=1000
RATE_LIMIT_BURST=50

# Authentication limits
AUTH_RATE_LIMIT=5
AUTH_RATE_WINDOW=900000

# IP blocking
ENABLE_IP_BLOCKING=true
FAILED_LOGIN_THRESHOLD=5
IP_BLOCK_DURATION=3600000  # 1 hour

# Load management
ENABLE_LOAD_SHEDDING=true
LOAD_SHEDDING_THRESHOLD=85  # CPU %
```

### Admin Panel Configuration

**Admin Panel** → **Settings** → **Rate Limiting**

**Rate Limit Settings:**

**Basic Configuration:**
```yaml
Enable Rate Limiting: ✅ Yes
Storage Backend: Redis (recommended)

Global Window: 15 minutes
Skip Successful Requests: No
Trust Proxy Headers: Yes (if behind proxy)
```

**Advanced Configuration:**
```yaml
Dynamic Rate Limiting: ✅ Enabled
  - Adjust limits based on load
  - Reduce limits during attacks
  - Reward good behavior

Whitelisting:
  - Admin IPs bypass limits
  - CI/CD systems exempt
  - Monitoring services exempt

Custom Response Headers: ✅ Enabled
  - X-RateLimit-Limit
  - X-RateLimit-Remaining
  - X-RateLimit-Reset
```

## Rate Limit Strategies

### Standard Rate Limiting

Fixed window rate limiting:

```yaml
Strategy: Fixed Window
Window: 15 minutes
Limit: 1000 requests

Example:
  14:00-14:15 → 1000 requests allowed
  14:15-14:30 → New window, 1000 requests allowed
  
Pros: Simple, predictable
Cons: Burst at window edges
```

### Sliding Window

More accurate rate limiting:

```yaml
Strategy: Sliding Window
Window: 15 minutes
Limit: 1000 requests

Example:
  At 14:10 → Count requests from 13:55-14:10
  At 14:11 → Count requests from 13:56-14:11
  
Pros: Smooth, accurate
Cons: More complex, higher overhead
```

### Token Bucket

Burst-friendly rate limiting:

```yaml
Strategy: Token Bucket
Capacity: 1000 tokens
Refill Rate: 100 tokens/minute
Burst: 200 tokens

Example:
  Bucket starts full (1000 tokens)
  Each request consumes 1 token
  Tokens refill continuously
  Can burst up to 200 above capacity
  
Pros: Allows controlled bursts
Cons: Complex configuration
```

## Monitoring and Alerts

### Rate Limit Monitoring

**Admin Panel** → **Monitoring** → **Rate Limits**

**Real-Time Metrics:**
```yaml
Current Status:
  Requests/second: 45
  Rate Limited: 3 requests/minute
  Top Limited Users: 5
  
Last Hour:
  Total Requests: 162,450
  Rate Limited: 1,247 (0.76%)
  Blocked IPs: 12
  
Response Times:
  Average: 145ms
  P95: 320ms
  P99: 580ms
```

**Rate Limit Violations:**
```yaml
Recent Violations (Last 24h):
  
User Violations:
  - user_456: 15 violations
  - user_789: 8 violations
  - user_123: 5 violations

IP Violations:
  - 203.0.113.42: 47 violations (blocked)
  - 198.51.100.10: 23 violations (monitored)
  - 192.0.2.55: 12 violations (warned)
```

### Alert Configuration

**Admin Panel** → **Settings** → **Alerts** → **Rate Limiting**

**Alert Rules:**

**High Rate Limit Violations:**
```yaml
Alert: High Rate Limit Violations
Condition: > 100 violations in 1 hour
Severity: WARNING
Action:
  - Email admin team
  - Log event
  - Monitor closely
```

**Potential Attack:**
```yaml
Alert: Possible DDoS Attack
Condition: 
  - > 1000 violations in 5 minutes
  - OR: > 50 IPs hitting limits
Severity: CRITICAL
Action:
  - Email admin team (urgent)
  - Enable aggressive rate limiting
  - Auto-block attacking IPs
  - Notify security team
```

**User Quota Exceeded:**
```yaml
Alert: User Quota Exceeded
Condition: User exceeds daily quota
Severity: INFO
Action:
  - Email user (upgrade suggestion)
  - Log event
  - Track for analytics
```

## Load Management

### Load Shedding

Automatically reduce load during high traffic:

**Configuration:**

```yaml
Enable Load Shedding: Yes

Thresholds:
  CPU > 85%: Reduce limits by 50%
  CPU > 90%: Reduce limits by 75%
  CPU > 95%: Accept only critical requests
  
Protected Endpoints:
  - /health
  - /api/admin/*
  - Authentication endpoints

Response:
  Status: 503 Service Unavailable
  Retry-After: 60 seconds
  Message: "System under high load. Please try again later."
```

### Circuit Breakers

Prevent cascading failures:

```yaml
Circuit Breaker: API Endpoints

Failure Threshold: 50% error rate
Minimum Requests: 20
Timeout: 30 seconds

States:
  Closed: Normal operation
  Open: Reject all requests (return 503)
  Half-Open: Allow limited requests (test recovery)

Auto-Recovery:
  - Wait 60 seconds
  - Try 5 test requests
  - If success rate > 80%, close circuit
  - If failure continues, reopen circuit
```

## Best Practices

### Rate Limiting Best Practices

✅ **Do:**
- Use Redis for distributed rate limiting
- Set reasonable default limits
- Provide clear error messages
- Include retry-after headers
- Monitor rate limit violations
- Adjust limits based on usage
- Whitelist trusted IPs
- Use appropriate strategies (sliding window)
- Test rate limits regularly
- Document rate limits publicly

❌ **Don't:**
- Set limits too restrictive
- Ignore rate limit violations
- Block without warning
- Use memory-based rate limiting in production
- Forget to monitor performance impact
- Apply same limits to all users
- Ignore burst patterns
- Skip load testing
- Forget to whitelist monitoring services

### Performance Optimization

**Redis Configuration:**
```yaml
Redis Rate Limiting:
  Connection Pool: 20 connections
  Timeout: 5 seconds
  Retry: 3 attempts
  
Performance:
  Key Expiration: Automatic
  Memory Optimization: LRU eviction
  Persistence: AOF for reliability
```

**Cache Strategy:**
```yaml
Rate Limit Cache:
  TTL: Window duration
  Invalidation: Automatic
  Preload: Common user limits
  
Quota Cache:
  TTL: 1 hour
  Refresh: On quota reset
  Invalidation: On quota change
```

## Troubleshooting

### Users Being Rate Limited Incorrectly

**Symptoms:**
- Legitimate users hitting limits
- Complaints about "Too many requests"
- Normal usage blocked

**Solutions:**
1. Review rate limit thresholds
2. Check user tier and quotas
3. Verify Redis is working
4. Check for IP conflicts
5. Review recent limit changes
6. Add user to whitelist if needed
7. Increase limits for affected tier

### Rate Limiting Not Working

**Symptoms:**
- No rate limiting applied
- Users exceeding limits
- No rate limit headers

**Solutions:**
1. Verify ENABLE_RATE_LIMITING=true
2. Check Redis connection
3. Review middleware configuration
4. Check environment variables
5. Verify rate limit storage
6. Check application logs
7. Restart application

### High Rate Limit Overhead

**Symptoms:**
- Slow response times
- High Redis CPU usage
- Rate limit checks timing out

**Solutions:**
1. Optimize Redis configuration
2. Increase connection pool
3. Use faster rate limit strategy
4. Cache frequent checks
5. Scale Redis instance
6. Consider rate limit service
7. Review key patterns

## Related Documentation

- [IP Blocking](./ip-blocking) - Network-level access control
- [Security Settings](./security) - Security configuration
- [Monitoring](./monitoring) - System monitoring
- [Performance](./maintenance) - Performance optimization
- [RATE_LIMITING.md](/RATE_LIMITING.md) - Technical documentation

---

::: tip Need Help?
For additional support, check the [troubleshooting guide](/guide/troubleshooting) or open an issue on [GitHub](https://github.com/subculture-collective/discord-spywatcher/issues).
:::
