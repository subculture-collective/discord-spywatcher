# Redis Caching Layer Documentation

## Overview

The Discord SpyWatcher application implements a comprehensive Redis caching layer to reduce database load, improve response times, and enable real-time features. This document describes the caching architecture, strategies, and usage.

## Architecture

### Core Components

#### 1. CacheService (`backend/src/services/cache.ts`)

The `CacheService` provides a high-level API for caching with the following features:

- **Cache-Aside Pattern**: Load data from cache first, fetch from database on miss
- **Tag-Based Invalidation**: Group related cache entries and invalidate by tag
- **TTL Management**: Automatic expiration based on data type
- **Remember Pattern**: Convenient cache-or-fetch helper
- **Cache Statistics**: Monitor hit rates, memory usage, and performance

**Key Methods:**

```typescript
// Get value from cache
const value = await cache.get<T>(key);

// Set value with TTL and tags
await cache.set(key, value, {
    ttl: 300, // 5 minutes
    tags: ['guild:123', 'analytics:ghosts'],
});

// Remember pattern - cache or execute callback
const result = await cache.remember(
    key,
    300,
    async () => {
        return await expensiveOperation();
    },
    { tags: ['my-tag'] }
);

// Invalidate by tag
await cache.invalidateByTag('guild:123');

// Get cache statistics
const stats = await cache.getStats();
```

#### 2. PubSubService (`backend/src/services/pubsub.ts`)

The `PubSubService` enables real-time updates using Redis Pub/Sub:

```typescript
// Publish update
await pubsub.publish('channel-name', { data: 'value' });

// Subscribe to channel
await pubsub.subscribe('channel-name', (message) => {
    console.log('Received:', message);
});

// Specialized helpers
await pubsub.publishAnalyticsUpdate(guildId, 'ghosts', data);
await pubsub.publishNotification(userId, notification);
```

#### 3. CacheInvalidationService (`backend/src/services/cacheInvalidation.ts`)

Handles automatic cache invalidation on data changes:

```typescript
// Called automatically when events occur
await cacheInvalidation.onMessageCreated(guildId);
await cacheInvalidation.onTypingEvent(guildId);
await cacheInvalidation.onPresenceUpdate(userId);
await cacheInvalidation.onRoleChanged(guildId);
```

## Caching Strategies

### Analytics Caching

All analytics endpoints use the cache-aside pattern with appropriate TTLs:

| Endpoint        | Function                | TTL    | Cache Key Pattern                     | Tags                                   |
| --------------- | ----------------------- | ------ | ------------------------------------- | -------------------------------------- |
| Ghost Scores    | `getGhostScores`        | 5 min  | `analytics:ghosts:{guildId}:{since}`  | `guild:{guildId}`, `analytics:ghosts`  |
| Lurker Flags    | `getLurkerFlags`        | 5 min  | `analytics:lurkers:{guildId}:{since}` | `guild:{guildId}`, `analytics:lurkers` |
| Heatmap         | `getChannelHeatmap`     | 15 min | `analytics:heatmap:{guildId}:{since}` | `guild:{guildId}`, `analytics:heatmap` |
| Role Drift      | `getRoleDriftFlags`     | 10 min | `analytics:roles:{guildId}:{since}`   | `guild:{guildId}`, `analytics:roles`   |
| Client Drift    | `getClientDriftFlags`   | 2 min  | `analytics:clients:{guildId}:{since}` | `guild:{guildId}`, `analytics:clients` |
| Behavior Shifts | `getBehaviorShiftFlags` | 5 min  | `analytics:shifts:{guildId}:{since}`  | `guild:{guildId}`, `analytics:shifts`  |

**Rationale:**

- **Ghost/Lurker/Shifts**: 5 minutes - Moderate volatility, balance freshness with DB load
- **Heatmap**: 15 minutes - Slower-changing aggregate data
- **Roles**: 10 minutes - Role changes are infrequent
- **Clients**: 2 minutes - Rapid client switching requires fresher data

### Cache Invalidation Strategies

#### Event-Based Invalidation

Cache entries are automatically invalidated when relevant events occur:

```typescript
// Message created -> Invalidate analytics
client.on('messageCreate', async (message) => {
  await db.messageEvent.create({ ... });
  await cacheInvalidation.onMessageCreated(message.guild.id);
});

// Role change -> Invalidate role analytics
client.on('guildMemberUpdate', async (oldMember, newMember) => {
  await db.roleChangeEvent.create({ ... });
  await cacheInvalidation.onRoleChanged(newMember.guild.id);
});
```

#### Tag-Based Invalidation

Tags allow invalidating related cache entries efficiently:

```typescript
// Invalidate all analytics for a guild
await cache.invalidateByTag('guild:123456789');

// Invalidate specific analytics type
await cache.invalidateByTag('analytics:ghosts');

// Invalidate multiple tags
await cache.invalidateByTags(['guild:123', 'analytics:ghosts']);
```

#### Manual Invalidation

Admin endpoints for manual cache management:

- `DELETE /api/admin/monitoring/cache/clear` - Clear all cache entries
- `DELETE /api/admin/monitoring/cache/invalidate/:tag` - Invalidate by tag

## Configuration

### Environment Variables

```bash
# Redis connection
REDIS_URL=redis://localhost:6379

# Enable Redis for rate limiting and caching
ENABLE_REDIS_RATE_LIMITING=true
```

### Redis Setup

#### Development (Single Instance)

```bash
# Start Redis
docker run -d -p 6379:6379 redis:7-alpine
```

#### Production (Cluster)

For high availability in production, use Redis Cluster:

```typescript
// backend/src/utils/redis.ts
const redisCluster = new Redis.Cluster(
    [
        { host: 'redis-node-1', port: 6379 },
        { host: 'redis-node-2', port: 6379 },
        { host: 'redis-node-3', port: 6379 },
    ],
    {
        redisOptions: {
            password: process.env.REDIS_PASSWORD,
            tls: process.env.NODE_ENV === 'production' ? {} : undefined,
        },
    }
);
```

### Memory Management

Redis eviction policy should be configured:

```conf
# redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
```

## Monitoring

### Cache Statistics Endpoint

`GET /api/admin/monitoring/cache/stats`

Returns:

```json
{
    "stats": {
        "hits": 1000,
        "misses": 200,
        "hitRate": 83.33,
        "memoryUsed": "2.5M",
        "evictedKeys": 5,
        "keyCount": 150
    },
    "status": "healthy",
    "timestamp": "2025-10-29T19:00:00.000Z"
}
```

### Key Metrics

- **Hit Rate**: Should be > 80% for analytics endpoints
- **Memory Usage**: Should stay < 2GB (configurable)
- **Evicted Keys**: Should be minimal, indicating proper TTLs
- **Key Count**: Monitor growth over time

### Logging

Cache operations are logged for debugging:

```typescript
console.log(`Invalidated ${count} cache entries for tag: ${tag}`);
console.log(`Cache get error for key ${key}:`, error);
```

## Best Practices

### 1. Use Appropriate TTLs

Choose TTLs based on:

- Data volatility
- Query cost
- Freshness requirements

### 2. Tag Everything

Always include tags for efficient invalidation:

```typescript
await cache.set(key, value, {
    ttl: 300,
    tags: [`guild:${guildId}`, `analytics:${type}`],
});
```

### 3. Handle Cache Misses

The cache service gracefully handles Redis unavailability:

```typescript
// If Redis is down, falls back to direct DB queries
const result = await cache.remember(key, ttl, async () => {
  return await db.query(...);  // Still works if cache fails
});
```

### 4. Monitor Performance

Regularly check cache statistics:

```bash
curl http://localhost:3001/api/admin/monitoring/cache/stats
```

### 5. Use Remember Pattern

Prefer the remember pattern over manual get/set:

```typescript
// Good ✅
const data = await cache.remember(key, ttl, () => fetchData());

// Verbose ❌
let data = await cache.get(key);
if (!data) {
    data = await fetchData();
    await cache.set(key, data, { ttl });
}
```

## Real-Time Updates

### WebSocket Integration (Future)

The PubSub service is ready for WebSocket integration:

```typescript
// Subscribe to analytics updates
pubsub.subscribe(`analytics:ghosts:${guildId}`, (data) => {
    // Broadcast to WebSocket clients
    io.to(guildId).emit('analytics:update', data);
});

// Publish updates when cache is invalidated
await pubsub.publishAnalyticsUpdate(guildId, 'ghosts', freshData);
```

## Troubleshooting

### Cache Not Working

1. **Check Redis Connection**

    ```bash
    redis-cli ping  # Should return PONG
    ```

2. **Verify Environment Variables**

    ```bash
    echo $REDIS_URL
    echo $ENABLE_REDIS_RATE_LIMITING
    ```

3. **Check Logs**
    - Look for "Redis connected successfully"
    - Look for "Redis connection error"

### Low Hit Rate

1. **Check TTLs** - May be too short
2. **Check Invalidation** - May be too aggressive
3. **Monitor Key Patterns** - Ensure consistent key generation

### High Memory Usage

1. **Review TTLs** - May be too long
2. **Check for Key Leaks** - Unused keys not expiring
3. **Adjust eviction policy** - Use `allkeys-lru`

## Testing

### Unit Tests

```bash
npm test -- __tests__/unit/services/cache.test.ts
```

### Integration Tests

```bash
# Start Redis
docker run -d -p 6379:6379 redis:7-alpine

# Run tests
npm test -- __tests__/integration/
```

### Manual Testing

```bash
# Set a test value
curl -X POST http://localhost:3001/api/analytics/ghosts?guildId=123

# Check cache stats
curl http://localhost:3001/api/admin/monitoring/cache/stats

# Invalidate cache
curl -X DELETE http://localhost:3001/api/admin/monitoring/cache/invalidate/guild:123

# Check stats again
curl http://localhost:3001/api/admin/monitoring/cache/stats
```

## Performance Metrics

### Expected Improvements

With proper caching implementation:

- **Response Time**: 50-90% faster for cached endpoints
- **Database Load**: 60-80% reduction in query load
- **API Throughput**: 2-5x increase in requests per second
- **Cache Hit Rate**: 80-95% for stable workloads

### Benchmarking

```typescript
// Before caching
const start = Date.now();
const data = await db.query(...);
console.log(`Query time: ${Date.now() - start}ms`);

// After caching
const start = Date.now();
const data = await cache.remember(key, ttl, () => db.query(...));
console.log(`Cache time: ${Date.now() - start}ms`);
```

## Cache Warming

The cache service includes a warming utility to pre-populate cache on startup:

```typescript
import { cache } from './services/cache';

// Warm cache with initial data
await cache.warm([
    {
        key: 'analytics:ghosts:123:all',
        value: await fetchGhostData('123'),
        options: { ttl: 300, tags: ['guild:123'] },
    },
    // ... more entries
]);
```

## Future Enhancements

1. **Distributed Caching** - Multi-region cache synchronization
2. **Cache Compression** - Reduce memory usage for large values
3. **Smart Invalidation** - ML-based invalidation strategies
4. **Cache Analytics** - Detailed usage patterns and optimization suggestions

## References

- [Redis Documentation](https://redis.io/docs/)
- [ioredis Library](https://github.com/luin/ioredis)
- [Caching Best Practices](https://aws.amazon.com/caching/best-practices/)
- [Cache Invalidation Strategies](https://www.prisma.io/dataguide/managing-databases/introduction-database-caching)
