# API Reference

Welcome to the Spywatcher API documentation. This guide covers the REST API, WebSocket API, and SDK usage.

## Overview

The Spywatcher API provides programmatic access to all surveillance and analytics features. Build custom integrations, automation tools, or third-party applications.

## Base URL

```
Production: https://api.spywatcher.com/api
Development: http://localhost:3001/api
```

## Interactive Documentation

Spywatcher includes interactive API documentation:

- **Swagger UI**: [http://localhost:3001/api/docs](http://localhost:3001/api/docs)
- **ReDoc**: [http://localhost:3001/api/redoc](http://localhost:3001/api/redoc)

Both interfaces allow you to:
- Browse all endpoints
- Test API calls directly
- View request/response schemas
- Try authentication

## Authentication

All API requests require authentication using JWT Bearer tokens.

### Get API Token

1. Sign in to the Spywatcher dashboard
2. Navigate to **Settings** > **API Keys**
3. Click **"Create New API Key"**
4. Copy your key (starts with `spy_live_`)

### Using Your Token

Include the token in the `Authorization` header:

```bash
curl -H "Authorization: Bearer spy_live_your_api_key_here" \
  https://api.spywatcher.com/api/analytics
```

::: warning Security
Never commit API keys to version control or expose them in client-side code.
:::

## Rate Limiting

API requests are rate-limited based on your subscription tier:

| Tier | Rate Limit | Daily Quota |
|------|------------|-------------|
| **FREE** | 10 req/min | 1,000 req/day |
| **PRO** | 100 req/min | 100,000 req/day |
| **ENTERPRISE** | 1,000 req/min | Unlimited |

Rate limit information is included in response headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699027200
```

Learn more about [Rate Limiting](./rate-limiting).

## Response Format

All API responses follow a consistent JSON format:

### Success Response

```json
{
  "data": {
    // Response data
  },
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 50
  }
}
```

### Error Response

```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token",
  "statusCode": 401
}
```

Learn more about [Error Handling](./errors).

## Pagination

List endpoints support pagination:

```http
GET /api/users?page=2&limit=50
```

**Parameters:**
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 50, max: 100)

**Response includes:**
```json
{
  "data": [...],
  "meta": {
    "total": 250,
    "page": 2,
    "limit": 50,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": true
  }
}
```

Learn more about [Pagination](./pagination).

## Filtering and Sorting

### Filtering

Use query parameters to filter results:

```http
GET /api/users?status=online&role=member
```

### Sorting

Use `sort` parameter:

```http
GET /api/users?sort=createdAt:desc
```

Syntax: `field:direction` where direction is `asc` or `desc`.

## Date Ranges

Endpoints that support date filtering accept:

```http
GET /api/analytics?startDate=2024-01-01&endDate=2024-12-31
```

Format: ISO 8601 (`YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ss.sssZ`)

## API Endpoints

### Analytics

- **[GET /api/analytics](./analytics)** - Get server analytics
- **[GET /api/analytics/users](./analytics#user-analytics)** - User analytics
- **[GET /api/analytics/trends](./analytics#trends)** - Activity trends

### Users

- **[GET /api/users](./users)** - List users
- **[GET /api/users/:id](./users#get-user)** - Get user details
- **[GET /api/users/:id/timeline](./users#user-timeline)** - User timeline

### Ghost Detection

- **[GET /api/ghosts](./ghosts)** - Get ghost scores
- **[POST /api/ghosts/scan](./ghosts#run-scan)** - Run detection

### Lurker Detection

- **[GET /api/lurkers](./lurkers)** - Get lurker data
- **[POST /api/lurkers/scan](./lurkers#run-scan)** - Run detection

### Suspicion Scores

- **[GET /api/suspicion](./suspicion)** - Get suspicion scores
- **[GET /api/suspicion/:userId](./suspicion#user-score)** - User score

### Timeline

- **[GET /api/timeline](./timeline)** - Get activity timeline
- **[GET /api/timeline/:userId](./timeline#user-timeline)** - User timeline

### Bans

- **[GET /api/bans](./bans)** - List bans
- **[POST /api/bans](./bans#create-ban)** - Create ban
- **[DELETE /api/bans/:id](./bans#remove-ban)** - Remove ban

### Privacy

- **[GET /api/privacy/settings](./privacy)** - Get privacy settings
- **[PUT /api/privacy/settings](./privacy#update-settings)** - Update settings

## WebSocket API

Real-time updates via WebSocket:

```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Update:', data);
};
```

Learn more about [WebSocket Events](./websocket).

## SDKs

Official SDKs for easy integration:

### TypeScript/JavaScript

```bash
npm install @spywatcher/sdk
```

```typescript
import { SpywatcherClient } from '@spywatcher/sdk';

const client = new SpywatcherClient({
  apiKey: 'spy_live_your_api_key',
});

const analytics = await client.analytics.get();
```

Learn more: [TypeScript SDK Guide](./sdk-typescript)

### Python SDK (Coming Soon)

```python
from spywatcher import SpywatcherClient

client = SpywatcherClient(api_key='spy_live_your_api_key')
analytics = client.analytics.get()
```

Learn more: [Python SDK Guide](./sdk-python)

## Code Examples

All endpoints include code examples in multiple languages:

::: code-group

```typescript [TypeScript]
const response = await fetch('https://api.spywatcher.com/api/analytics', {
  headers: {
    'Authorization': `Bearer ${apiKey}`,
  },
});

const data = await response.json();
```

```python [Python]
import requests

response = requests.get(
    'https://api.spywatcher.com/api/analytics',
    headers={'Authorization': f'Bearer {api_key}'}
)

data = response.json()
```

```javascript [JavaScript]
fetch('https://api.spywatcher.com/api/analytics', {
  headers: {
    'Authorization': `Bearer ${apiKey}`,
  },
})
  .then(res => res.json())
  .then(data => console.log(data));
```

```bash [cURL]
curl -H "Authorization: Bearer spy_live_your_api_key" \
  https://api.spywatcher.com/api/analytics
```

:::

## Webhooks (Coming Soon)

Configure webhooks to receive event notifications:

- User banned
- High suspicion score detected
- Ghost user identified
- Unusual activity detected

## API Versions

Current version: **v1**

All endpoints are versioned: `/api/v1/...`

Version information is included in responses:

```json
{
  "apiVersion": "1.0.0",
  "data": {...}
}
```

## API Status

Check API status:
- **Status Page**: [https://status.spywatcher.com](https://status.spywatcher.com)
- **Health Endpoint**: [GET /health](./health)

## OpenAPI Specification

Download the OpenAPI spec:
- **JSON**: [/api/openapi.json](http://localhost:3001/api/openapi.json)
- **YAML**: [/api/openapi.yaml](http://localhost:3001/api/openapi.yaml)

Use with code generation tools like:
- [OpenAPI Generator](https://openapi-generator.tech/)
- [Swagger Codegen](https://swagger.io/tools/swagger-codegen/)

## Best Practices

### 1. Handle Rate Limits

```typescript
if (response.status === 429) {
  const retryAfter = response.headers.get('X-RateLimit-Reset');
  // Wait and retry
}
```

### 2. Implement Retry Logic

```typescript
async function apiCallWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetch(url, options);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(1000 * Math.pow(2, i)); // Exponential backoff
    }
  }
}
```

### 3. Cache Responses

```typescript
// Cache analytics data for 5 minutes
const cacheKey = 'analytics';
const cached = cache.get(cacheKey);
if (cached && Date.now() - cached.timestamp < 300000) {
  return cached.data;
}
```

### 4. Use Webhooks for Real-time Updates

Instead of polling, configure webhooks for event-driven updates.

### 5. Monitor Your Usage

Track your API usage to avoid hitting quotas:

```typescript
const usage = await client.quota.get();
console.log(`Used ${usage.used} of ${usage.limit} requests`);
```

## Support

Need help with the API?

- **[GitHub Issues](https://github.com/subculture-collective/discord-spywatcher/issues)** - Report bugs or issues
- **[Developer Guide](/developer/)** - Technical documentation
- **[Stack Overflow](https://stackoverflow.com/questions/tagged/spywatcher)** - Community Q&A

## What's Next?

- **[Authentication Guide](./authentication)** - Learn about authentication
- **[Analytics API](./analytics)** - Fetch analytics data
- **[Ghost Detection API](./ghosts)** - Access ghost detection
- **[TypeScript SDK](./sdk-typescript)** - Use the official SDK

---

::: tip Pro Tip
Use the interactive Swagger UI at `/api/docs` to explore and test the API without writing code!
:::
