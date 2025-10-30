# Quota Management Usage Guide

This guide explains how to use the new API quota management system.

## Overview

The API implements a tiered quota system that limits daily API usage based on subscription tiers. Quotas are tracked per endpoint category and reset daily at midnight UTC.

## Subscription Tiers

### FREE Tier (Default)
- **Total**: 1,000 requests/day
- **Analytics**: 100 requests/day
- **API**: 1,000 requests/day
- **Public**: 500 requests/day
- **Admin**: No access
- **Rate Limit**: 30 requests/minute

### PRO Tier
- **Total**: 10,000 requests/day
- **Analytics**: 1,000 requests/day
- **API**: 10,000 requests/day
- **Public**: 5,000 requests/day
- **Admin**: No access
- **Rate Limit**: 100 requests/minute

### ENTERPRISE Tier
- **Total**: 100,000 requests/day
- **Analytics**: 10,000 requests/day
- **API**: 100,000 requests/day
- **Public**: 50,000 requests/day
- **Admin**: 50,000 requests/day
- **Rate Limit**: 300 requests/minute

## Monitoring Quota Usage

### Check Your Current Quota

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://api.spywatcher.com/api/quota/usage
```

**Response:**
```json
{
  "tier": "FREE",
  "usage": {
    "analytics": {
      "used": 50,
      "limit": 100,
      "remaining": 50
    },
    "api": {
      "used": 200,
      "limit": 1000,
      "remaining": 800
    },
    "total": {
      "used": 250,
      "limit": 1000,
      "remaining": 750
    }
  },
  "limits": { ... },
  "rateLimits": { ... }
}
```

### View Available Tiers

```bash
curl https://api.spywatcher.com/api/quota/limits
```

### Check Response Headers

Every API response includes quota information in headers:

```
X-Quota-Limit: 100
X-Quota-Remaining: 50
X-Quota-Reset: 43200
X-Quota-Category: analytics
```

## Handling Quota Limits

### When Quota Is Exceeded

You'll receive a `429 Too Many Requests` response:

```json
{
  "error": "Quota exceeded",
  "message": "You have exceeded your analytics quota for the day. Please upgrade your subscription or try again tomorrow.",
  "quota": {
    "limit": 100,
    "remaining": 0,
    "reset": 43200,
    "category": "analytics"
  }
}
```

### Best Practices

1. **Monitor Usage**: Check `X-Quota-Remaining` header regularly
2. **Cache Responses**: Use caching to reduce API calls
3. **Implement Retry Logic**: Wait for quota reset when limit reached
4. **Track by Category**: Different categories have different limits
5. **Upgrade When Needed**: Monitor usage patterns and upgrade tier if necessary

## For Developers

### Example: Checking Quota Before Making Request

```typescript
async function makeApiRequest(endpoint: string) {
  // Check quota usage first
  const quotaInfo = await fetch('https://api.spywatcher.com/api/quota/usage', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const quota = await quotaInfo.json();
  
  // Determine category based on endpoint
  const category = getCategory(endpoint);
  
  // Check if we have quota remaining
  if (quota.usage[category].remaining === 0) {
    const resetTime = quota.usage[category].reset;
    throw new Error(`Quota exceeded. Resets in ${resetTime} seconds`);
  }
  
  // Make the actual request
  const response = await fetch(endpoint, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return response;
}
```

### Example: Handling Quota Headers

```typescript
async function apiCall(url: string) {
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  // Read quota headers
  const quotaLimit = response.headers.get('X-Quota-Limit');
  const quotaRemaining = response.headers.get('X-Quota-Remaining');
  const quotaReset = response.headers.get('X-Quota-Reset');
  
  console.log(`Quota: ${quotaRemaining}/${quotaLimit} (resets in ${quotaReset}s)`);
  
  // Check if approaching limit
  if (parseInt(quotaRemaining) < 10) {
    console.warn('Approaching quota limit!');
  }
  
  return response.json();
}
```

## For Administrators

### View User Quota

```bash
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  https://api.spywatcher.com/api/quota/users/USER_ID
```

### Update User Tier

```bash
curl -X PUT \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tier": "PRO"}' \
  https://api.spywatcher.com/api/quota/users/USER_ID/tier
```

### Reset User Quota

Reset all quotas:
```bash
curl -X DELETE \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  https://api.spywatcher.com/api/quota/users/USER_ID/reset
```

Reset specific category:
```bash
curl -X DELETE \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  https://api.spywatcher.com/api/quota/users/USER_ID/reset?category=analytics
```

## Endpoint Categories

Quotas are tracked by endpoint category:

- **Analytics**: `/api/analytics/*` - Data and statistics
- **Admin**: `/api/admin/*` - Administrative functions
- **Public**: `/api/public/*` - Public API endpoints
- **API**: All other `/api/*` endpoints

## Quota Reset Schedule

- Quotas reset daily at **00:00 UTC**
- Redis automatically expires counters
- Both category and total quotas are enforced
- Only successful requests (status < 400) count against quota

## Troubleshooting

### Why was I quota limited?

Check your usage:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.spywatcher.com/api/quota/usage
```

Look for categories where `remaining` is 0.

### How do I upgrade my tier?

Contact an administrator who can update your tier using:
```bash
PUT /api/quota/users/:userId/tier
```

### What happens if Redis is down?

The system uses a fail-open design. If Redis is unavailable:
- Requests are allowed to proceed
- Quota headers may not be accurate
- Service remains available

### Are failed requests counted?

No. Only successful requests (HTTP status < 400) count against your quota.

## Migration from Old System

If you're upgrading from a system without quotas:

1. All existing users start with FREE tier
2. Existing rate limits remain unchanged
3. Quota headers are added to all responses
4. No breaking changes to existing API behavior

## Related Documentation

- [Rate Limiting Documentation](../RATE_LIMITING.md) - Complete rate limiting and quota reference
- [Public API Reference](./PUBLIC_API.md) - API endpoint documentation
- [Developer Guide](./DEVELOPER_GUIDE.md) - Integration guide
