# Developer Guide - Spywatcher Public API

This guide will help you get started building applications with the Spywatcher Public API.

## Table of Contents

- [Getting Started](#getting-started)
- [Authentication Setup](#authentication-setup)
- [Quick Start Guide](#quick-start-guide)
- [SDK Installation](#sdk-installation)
- [Common Use Cases](#common-use-cases)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

- Node.js 16+ (for JavaScript/TypeScript SDK)
- A Spywatcher account with API access
- Basic knowledge of REST APIs

### Step 1: Create an Account

1. Sign up at the Spywatcher dashboard
2. Verify your Discord account
3. Navigate to the API section

### Step 2: Generate API Key

1. Go to **Settings** > **API Keys**
2. Click **Create New API Key**
3. Provide a descriptive name (e.g., "Production App", "Development")
4. Copy your API key - it starts with `spy_live_`
5. Store it securely (you won't see it again!)

⚠️ **Security Warning**: Never commit API keys to version control or expose them in client-side code.

## Authentication Setup

### Environment Variables

Store your API key in environment variables:

**`.env` file:**
```bash
SPYWATCHER_API_KEY=spy_live_your_api_key_here
SPYWATCHER_API_URL=https://api.spywatcher.com/api
```

**Node.js:**
```javascript
require('dotenv').config();

const apiKey = process.env.SPYWATCHER_API_KEY;
const apiUrl = process.env.SPYWATCHER_API_URL;
```

### Direct HTTP Requests

Include your API key in the `Authorization` header:

```bash
curl -H "Authorization: Bearer spy_live_your_api_key_here" \
  https://api.spywatcher.com/api/ghosts
```

## Quick Start Guide

### Using the TypeScript/JavaScript SDK (Recommended)

#### 1. Install the SDK

```bash
npm install @spywatcher/sdk
```

#### 2. Initialize the Client

```typescript
import { Spywatcher } from '@spywatcher/sdk';

const client = new Spywatcher({
  baseUrl: process.env.SPYWATCHER_API_URL || 'https://api.spywatcher.com/api',
  apiKey: process.env.SPYWATCHER_API_KEY!,
  debug: false, // Enable for development
});
```

#### 3. Make Your First Request

```typescript
async function main() {
  try {
    // Check API health
    const health = await client.healthCheck();
    console.log('API Status:', health.status);

    // Get ghost users
    const ghosts = await client.analytics.getGhosts();
    console.log(`Found ${ghosts.length} ghost users`);

    // Get lurkers
    const lurkers = await client.analytics.getLurkers();
    console.log(`Found ${lurkers.length} lurkers`);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
```

### Using Plain HTTP Requests

#### Node.js with Axios

```javascript
const axios = require('axios');

const client = axios.create({
  baseURL: 'https://api.spywatcher.com/api',
  headers: {
    'Authorization': `Bearer ${process.env.SPYWATCHER_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

async function getGhosts() {
  const response = await client.get('/ghosts');
  return response.data;
}
```

#### Python with Requests

```python
import os
import requests

API_KEY = os.getenv('SPYWATCHER_API_KEY')
BASE_URL = 'https://api.spywatcher.com/api'

headers = {
    'Authorization': f'Bearer {API_KEY}',
}

def get_ghosts():
    response = requests.get(f'{BASE_URL}/ghosts', headers=headers)
    response.raise_for_status()
    return response.json()
```

## SDK Installation

### TypeScript/JavaScript

```bash
npm install @spywatcher/sdk
```

**Features:**
- Full TypeScript support with type definitions
- Promise-based API
- Automatic error handling
- Built-in retry logic for rate limits (optional)
- Debug logging

## Common Use Cases

### 1. Monitor Inactive Users

Identify users who haven't been active recently:

```typescript
const ghosts = await client.analytics.getGhosts({
  startDate: '2024-01-01',
  endDate: '2024-12-31',
});

// Filter by inactivity period
const criticalGhosts = ghosts.filter(
  ghost => ghost.daysSinceLastSeen > 30
);

console.log(`${criticalGhosts.length} users inactive for 30+ days`);
```

### 2. Analyze User Activity Patterns

Get a heatmap of when users are most active:

```typescript
const heatmap = await client.analytics.getHeatmap();

// Find peak hour
const peakHour = heatmap.reduce((max, curr) => 
  curr.count > max.count ? curr : max
);

console.log(`Peak activity: ${peakHour.hour}:00 on day ${peakHour.dayOfWeek}`);
```

### 3. Detect Suspicious Behavior

Identify users with suspicious patterns:

```typescript
const suspicions = await client.getSuspicionData();

const highRisk = suspicions.filter(s => s.suspicionScore > 70);

highRisk.forEach(user => {
  console.log(`⚠️ ${user.username}: Score ${user.suspicionScore}`);
  console.log(`   Reasons: ${user.reasons.join(', ')}`);
});
```

### 4. Track Role Changes

Monitor changes in user roles:

```typescript
const roleChanges = await client.analytics.getRoleChanges({
  page: 1,
  perPage: 50,
});

roleChanges.data.forEach(change => {
  console.log(`${change.username}:`);
  console.log(`  Before: ${change.rolesBefore.join(', ')}`);
  console.log(`  After: ${change.rolesAfter.join(', ')}`);
});
```

### 5. Build a Dashboard

Create a comprehensive dashboard:

```typescript
async function buildDashboard() {
  const [ghosts, lurkers, suspicions, heatmap] = await Promise.all([
    client.analytics.getGhosts(),
    client.analytics.getLurkers(),
    client.getSuspicionData(),
    client.analytics.getHeatmap(),
  ]);

  return {
    summary: {
      totalGhosts: ghosts.length,
      totalLurkers: lurkers.length,
      highRiskUsers: suspicions.filter(s => s.suspicionScore > 70).length,
    },
    ghosts,
    lurkers,
    suspicions,
    heatmap,
  };
}
```

## Best Practices

### 1. Error Handling

Always implement comprehensive error handling:

```typescript
import {
  SpywatcherError,
  AuthenticationError,
  RateLimitError,
  ValidationError,
} from '@spywatcher/sdk';

try {
  const data = await client.analytics.getGhosts();
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API key');
  } else if (error instanceof RateLimitError) {
    console.error('Rate limit exceeded, waiting...');
    // Implement exponential backoff
  } else if (error instanceof ValidationError) {
    console.error('Invalid parameters:', error.message);
  } else if (error instanceof SpywatcherError) {
    console.error('API error:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### 2. Rate Limit Handling

Implement exponential backoff for rate limits:

```typescript
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof RateLimitError && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        console.log(`Rate limited, waiting ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

// Usage
const ghosts = await fetchWithRetry(() => client.analytics.getGhosts());
```

### 3. Pagination

Handle paginated responses properly:

```typescript
async function getAllRoleChanges() {
  let page = 1;
  let allChanges = [];
  let hasMore = true;

  while (hasMore) {
    const response = await client.analytics.getRoleChanges({
      page,
      perPage: 100,
    });

    allChanges = allChanges.concat(response.data);

    hasMore = page < response.pagination.totalPages;
    page++;
  }

  return allChanges;
}
```

### 4. Caching

Implement caching to reduce API calls:

```typescript
class CachedSpywatcher {
  private cache = new Map<string, { data: any; expires: number }>();

  constructor(private client: Spywatcher) {}

  async getGhosts(ttl = 60000) { // 1 minute cache
    const key = 'ghosts';
    const cached = this.cache.get(key);

    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    const data = await this.client.analytics.getGhosts();
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl,
    });

    return data;
  }
}
```

### 5. Security

- **Never** expose API keys in client-side code
- Store API keys in environment variables
- Use separate API keys for development and production
- Rotate API keys regularly
- Monitor API key usage for suspicious activity

### 6. Logging

Implement proper logging:

```typescript
const client = new Spywatcher({
  baseUrl: process.env.SPYWATCHER_API_URL!,
  apiKey: process.env.SPYWATCHER_API_KEY!,
  debug: process.env.NODE_ENV === 'development',
});

// Custom logging
function logRequest(endpoint: string, params?: any) {
  console.log(`[${new Date().toISOString()}] Request: ${endpoint}`, params);
}

function logResponse(endpoint: string, data: any) {
  console.log(`[${new Date().toISOString()}] Response: ${endpoint}`, {
    count: Array.isArray(data) ? data.length : 'N/A',
  });
}
```

## Troubleshooting

### Common Issues

#### 1. Authentication Errors (401)

**Problem**: API returns 401 Unauthorized

**Solutions**:
- Verify your API key is correct
- Check that the API key hasn't been revoked
- Ensure you're including the `Bearer` prefix: `Bearer spy_live_...`
- Check for extra spaces or newlines in the API key

#### 2. Rate Limit Errors (429)

**Problem**: API returns 429 Too Many Requests

**Solutions**:
- Implement exponential backoff
- Reduce request frequency
- Use caching to minimize API calls
- Consider upgrading your rate limit tier

#### 3. Invalid Parameters (400)

**Problem**: API returns 400 Bad Request

**Solutions**:
- Check parameter types and formats
- Verify date strings are ISO 8601 format
- Ensure pagination parameters are positive integers
- Review the API documentation for required fields

#### 4. Connection Timeout

**Problem**: Requests timeout

**Solutions**:
- Increase timeout value in SDK configuration
- Check your network connection
- Verify the API URL is correct
- Check API status page for outages

### Getting Help

- **Documentation**: https://github.com/subculture-collective/discord-spywatcher
- **API Reference**: [PUBLIC_API.md](./PUBLIC_API.md)
- **SDK Documentation**: [SDK README](../sdk/README.md)
- **Issues**: https://github.com/subculture-collective/discord-spywatcher/issues

## Next Steps

1. Review the [API Documentation](./PUBLIC_API.md)
2. Explore the [SDK Examples](../sdk/examples/)
3. Build your first integration
4. Share your feedback and contribute!

## License

MIT
