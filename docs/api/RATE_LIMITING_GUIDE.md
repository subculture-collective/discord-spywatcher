# Rate Limiting Guide

This guide explains the rate limiting system in the Spywatcher API and how to handle rate limits effectively.

## Overview

The Spywatcher API implements multiple tiers of rate limiting to ensure system stability and fair resource allocation. Rate limits are enforced using a combination of in-memory and Redis-based storage for distributed deployments.

## Rate Limit Tiers

### Global API Rate Limit

Applied to all `/api/*` routes as a baseline protection:

```
Limit: 100 requests per 15 minutes
Window: 15 minutes (900 seconds)
Scope: Per IP address or authenticated user
```

**Applies to:**
- All authenticated API endpoints
- User-specific operations
- General API requests

### Analytics Rate Limit

Stricter limits for resource-intensive analytics operations:

```
Limit: 30 requests per minute
Window: 1 minute (60 seconds)
Scope: Per authenticated user
```

**Applies to:**
- `GET /api/ghosts` - Ghost user analysis
- `GET /api/heatmap` - Channel activity heatmap
- `GET /api/lurkers` - Lurker detection
- `GET /api/roles` - Role drift analysis
- `GET /api/clients` - Client usage patterns
- `GET /api/shifts` - Behavior shift detection

### Authentication Rate Limit

Special limits for authentication endpoints to prevent brute force:

```
Limit: 5 attempts per 15 minutes
Window: 15 minutes (900 seconds)
Scope: Per IP address
```

**Applies to:**
- `GET /api/auth/discord` - OAuth callback
- `POST /api/auth/refresh` - Token refresh (10 per 15 min)

### Public API Rate Limit

For public, unauthenticated endpoints:

```
Limit: 60 requests per minute
Window: 1 minute (60 seconds)
Scope: Per IP address
```

**Applies to:**
- `GET /api/public/docs` - Public API documentation
- `GET /api/status` - System status

### Admin Rate Limit

For administrative operations:

```
Limit: 100 requests per 15 minutes
Window: 15 minutes (900 seconds)
Scope: Per admin user
```

**Applies to:**
- All `/api/admin/*` routes
- Admin privacy controls
- System monitoring endpoints
- Plugin management

## Rate Limit Headers

Every API response includes rate limit information in the headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699999999
```

### Header Descriptions

| Header | Description | Example |
|--------|-------------|---------|
| `X-RateLimit-Limit` | Maximum requests allowed in the current window | `100` |
| `X-RateLimit-Remaining` | Requests remaining in the current window | `95` |
| `X-RateLimit-Reset` | Unix timestamp when the limit resets | `1699999999` |

## Rate Limit Response

When you exceed a rate limit, the API returns a `429 Too Many Requests` response:

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later."
}
```

**Response Headers:**
```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 60
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1699999999
```

The `Retry-After` header indicates how many seconds to wait before retrying.

## Handling Rate Limits

### 1. Monitor Rate Limit Headers

Always check rate limit headers in your application:

```typescript
interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

function getRateLimitInfo(response: Response): RateLimitInfo {
  return {
    limit: parseInt(response.headers.get('X-RateLimit-Limit') || '0'),
    remaining: parseInt(response.headers.get('X-RateLimit-Remaining') || '0'),
    reset: parseInt(response.headers.get('X-RateLimit-Reset') || '0')
  };
}

// Usage
const response = await fetch('http://localhost:3001/api/ghosts');
const rateLimitInfo = getRateLimitInfo(response);

console.log(`Remaining requests: ${rateLimitInfo.remaining}/${rateLimitInfo.limit}`);

if (rateLimitInfo.remaining < 10) {
  console.warn('Rate limit almost reached!');
}
```

### 2. Implement Exponential Backoff

When you receive a 429 response, implement exponential backoff:

```typescript
async function makeRequestWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5
): Promise<T> {
  let retries = 0;
  
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.response?.status === 429) {
        if (retries >= maxRetries) {
          throw new Error('Max retries exceeded');
        }
        
        // Get retry delay from header or calculate exponential backoff
        const retryAfter = error.response.headers.get('Retry-After');
        const delayMs = retryAfter 
          ? parseInt(retryAfter) * 1000
          : Math.min(1000 * Math.pow(2, retries), 32000);
        
        console.log(`Rate limited. Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        
        retries++;
      } else {
        throw error;
      }
    }
  }
}

// Usage
const data = await makeRequestWithBackoff(async () => {
  const response = await fetch('http://localhost:3001/api/ghosts', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const error: any = new Error('Request failed');
    error.response = response;
    throw error;
  }
  
  return response.json();
});
```

### 3. Respect Retry-After Header

Always respect the `Retry-After` header:

```typescript
async function handleRateLimitedRequest(response: Response) {
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    
    if (retryAfter) {
      const delaySeconds = parseInt(retryAfter);
      console.log(`Rate limited. Waiting ${delaySeconds} seconds...`);
      
      await new Promise(resolve => 
        setTimeout(resolve, delaySeconds * 1000)
      );
      
      // Retry the request
      return makeRequest();
    }
  }
  
  return response;
}
```

### 4. Use Request Queuing

Implement a request queue to automatically throttle requests:

```typescript
class RateLimitedQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private requestsPerSecond: number;
  
  constructor(requestsPerSecond: number = 10) {
    this.requestsPerSecond = requestsPerSecond;
  }
  
  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.process();
    });
  }
  
  private async process() {
    if (this.processing || this.queue.length === 0) {
      return;
    }
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const request = this.queue.shift();
      if (request) {
        await request();
        await this.delay(1000 / this.requestsPerSecond);
      }
    }
    
    this.processing = false;
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage
const queue = new RateLimitedQueue(2); // 2 requests per second

// All requests are automatically queued and throttled
const data1 = await queue.enqueue(() => fetch('/api/ghosts'));
const data2 = await queue.enqueue(() => fetch('/api/heatmap'));
const data3 = await queue.enqueue(() => fetch('/api/lurkers'));
```

### 5. Cache Responses

Reduce API calls by caching responses:

```typescript
class CachedApiClient {
  private cache = new Map<string, { data: any; expires: number }>();
  
  async get<T>(
    url: string,
    ttlSeconds: number = 300
  ): Promise<T> {
    const cached = this.cache.get(url);
    
    if (cached && Date.now() < cached.expires) {
      console.log(`Cache hit for ${url}`);
      return cached.data;
    }
    
    console.log(`Cache miss for ${url}`);
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    
    const data = await response.json();
    
    this.cache.set(url, {
      data,
      expires: Date.now() + (ttlSeconds * 1000)
    });
    
    return data;
  }
  
  invalidate(url?: string) {
    if (url) {
      this.cache.delete(url);
    } else {
      this.cache.clear();
    }
  }
}

// Usage
const client = new CachedApiClient();

// First call - fetches from API
const data1 = await client.get('/api/ghosts'); 

// Second call within 5 minutes - returns cached data
const data2 = await client.get('/api/ghosts');

// Invalidate cache when needed
client.invalidate('/api/ghosts');
```

## Best Practices

### 1. Batch Requests When Possible

Instead of:
```typescript
// ❌ Multiple individual requests
for (const userId of userIds) {
  await fetch(`/api/timeline/${userId}`);
}
```

Consider:
```typescript
// ✅ Batch request (if endpoint supports it)
const results = await fetch('/api/timelines', {
  method: 'POST',
  body: JSON.stringify({ userIds })
});
```

### 2. Use Webhooks Instead of Polling

Instead of polling for updates:
```typescript
// ❌ Polling every 5 seconds
setInterval(async () => {
  const status = await fetch('/api/status');
}, 5000);
```

Use WebSocket for real-time updates:
```typescript
// ✅ WebSocket connection
const ws = new WebSocket('ws://localhost:3001');
ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  // Handle update
};
```

### 3. Aggregate Similar Requests

```typescript
// ❌ Multiple similar requests
const ghosts = await fetch('/api/ghosts?guildId=123');
const lurkers = await fetch('/api/lurkers?guildId=123');
const heatmap = await fetch('/api/heatmap?guildId=123');
```

Better approach:
```typescript
// ✅ Use a summary endpoint if available
const summary = await fetch('/api/analytics/summary?guildId=123');
```

### 4. Implement Request Deduplication

Prevent duplicate requests for the same resource:

```typescript
class RequestDeduplicator {
  private pending = new Map<string, Promise<any>>();
  
  async request<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.pending.has(key)) {
      console.log(`Deduplicating request: ${key}`);
      return this.pending.get(key)!;
    }
    
    const promise = fn().finally(() => {
      this.pending.delete(key);
    });
    
    this.pending.set(key, promise);
    return promise;
  }
}

const deduplicator = new RequestDeduplicator();

// Both calls share the same request
const data1 = deduplicator.request('ghosts-123', () => 
  fetch('/api/ghosts?guildId=123')
);
const data2 = deduplicator.request('ghosts-123', () => 
  fetch('/api/ghosts?guildId=123')
);
```

### 5. Monitor and Alert

Set up monitoring for rate limit issues:

```typescript
function monitorRateLimits(response: Response) {
  const remaining = parseInt(
    response.headers.get('X-RateLimit-Remaining') || '0'
  );
  const limit = parseInt(
    response.headers.get('X-RateLimit-Limit') || '0'
  );
  
  const percentageRemaining = (remaining / limit) * 100;
  
  if (percentageRemaining < 10) {
    console.warn(
      `Rate limit warning: Only ${remaining}/${limit} requests remaining`
    );
    
    // Send alert to monitoring service
    sendAlert('rate-limit-warning', {
      remaining,
      limit,
      endpoint: response.url
    });
  }
}
```

## Subscription Tiers

Different subscription tiers have different rate limits:

### FREE Tier

| Category | Limit | Window |
|----------|-------|--------|
| Global API | 100 requests | 15 minutes |
| Analytics | 10 requests | 1 minute |
| Daily Quota | 1,000 requests | 24 hours |

### PRO Tier

| Category | Limit | Window |
|----------|-------|--------|
| Global API | 300 requests | 15 minutes |
| Analytics | 30 requests | 1 minute |
| Daily Quota | 10,000 requests | 24 hours |

### ENTERPRISE Tier

| Category | Limit | Window |
|----------|-------|--------|
| Global API | 1,000 requests | 15 minutes |
| Analytics | 100 requests | 1 minute |
| Daily Quota | Unlimited | N/A |

Check your current tier and usage:
```
GET /api/quota/usage
```

## Rate Limit Bypass (Enterprise)

Enterprise customers can request rate limit increases by contacting support@spywatcher.dev. Include:
- Use case description
- Expected request volume
- Peak traffic patterns
- Current subscription tier

## Testing Rate Limits

### Simulate Rate Limiting

```typescript
// Send multiple requests rapidly to trigger rate limit
async function testRateLimit() {
  const promises = [];
  
  for (let i = 0; i < 150; i++) {
    promises.push(
      fetch('http://localhost:3001/api/ghosts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    );
  }
  
  const results = await Promise.allSettled(promises);
  
  const rateLimited = results.filter(r => 
    r.status === 'fulfilled' && r.value.status === 429
  );
  
  console.log(`Rate limited: ${rateLimited.length}/${results.length}`);
}
```

### Monitor Rate Limit Responses

```bash
# Send requests and watch headers
for i in {1..10}; do
  echo "Request $i:"
  curl -i -X GET "http://localhost:3001/api/ghosts" \
    -H "Authorization: Bearer YOUR_TOKEN" \
    | grep -E "X-RateLimit|HTTP"
  sleep 1
done
```

## Common Issues

### Issue: Unexpected 429 Responses

**Possible Causes:**
1. Sharing IP address with many users (shared hosting, VPN)
2. Multiple clients using same credentials
3. Aggressive polling or refresh rates
4. Not respecting Retry-After header

**Solutions:**
1. Implement exponential backoff
2. Use WebSocket for real-time updates
3. Increase request intervals
4. Cache responses appropriately

### Issue: Rate Limit Not Resetting

**Possible Causes:**
1. Clock skew between client and server
2. Redis connection issues (distributed setup)
3. Cached rate limit state

**Solutions:**
1. Check system time synchronization
2. Verify Redis connectivity
3. Wait for the full window period
4. Contact support if persistent

## FAQ

### Q: Do rate limits apply per user or per IP?

A: Most rate limits are per authenticated user. Authentication endpoints are per IP to prevent abuse.

### Q: What happens if I exceed the daily quota?

A: You'll receive 429 responses until the quota resets at midnight UTC.

### Q: Can I check my rate limit without making a real request?

A: No, but you can check quota usage at `GET /api/quota/usage`.

### Q: Do failed requests count against rate limits?

A: Yes, all requests count, including those that return errors.

### Q: Are WebSocket connections rate limited?

A: WebSocket connections have separate connection limits but not message rate limits.

## Additional Resources

- [Quota Management API](/api/quota/usage)
- [Subscription Tiers](/docs/SUBSCRIPTION_TIERS.md)
- [API Best Practices](/docs/API_BEST_PRACTICES.md)
- [WebSocket API Guide](/docs/WEBSOCKET_API.md)

## Support

For rate limit issues or questions:
- Check your quota: `GET /api/quota/usage`
- Review server logs for detailed rate limit information
- Contact support: support@spywatcher.dev
- Open an issue: [GitHub Issues](https://github.com/subculture-collective/discord-spywatcher/issues)
