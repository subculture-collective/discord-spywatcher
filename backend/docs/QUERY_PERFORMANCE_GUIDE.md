# Query Performance Optimization Guide

This guide provides best practices and patterns for writing high-performance database queries in the Discord Spywatcher application.

## Table of Contents

- [Performance Goals](#performance-goals)
- [Query Optimization Principles](#query-optimization-principles)
- [Common Patterns](#common-patterns)
- [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
- [Monitoring and Testing](#monitoring-and-testing)
- [Troubleshooting](#troubleshooting)

## Performance Goals

All queries should meet these targets:

- **Primary Goal**: P95 execution time < 100ms
- **Stretch Goal**: P95 execution time < 50ms
- **Critical Queries**: P95 < 25ms (user-facing, real-time)
- **No N+1 Patterns**: Use JOINs and aggregations instead of loops
- **Proper Pagination**: All list endpoints must have pagination

## Query Optimization Principles

### 1. Use Database-Level Aggregation

❌ **Bad** - Fetching all records and aggregating in application:

```typescript
const events = await db.messageEvent.findMany({
    where: { guildId, createdAt: { gte: since } }
});

const userCounts = new Map();
for (const event of events) {
    const count = userCounts.get(event.userId) || 0;
    userCounts.set(event.userId, count + 1);
}
```

✅ **Good** - Using database aggregation:

```typescript
const userCounts = await db.messageEvent.groupBy({
    by: ['userId'],
    where: { guildId, createdAt: { gte: since } },
    _count: { userId: true },
    orderBy: { _count: { userId: 'desc' } },
    take: 100
});
```

✅ **Better** - Using raw SQL for complex aggregations:

```typescript
const result = await db.$queryRaw<Array<{userId: string; count: bigint}>>`
    SELECT "userId", COUNT(*) as count
    FROM "MessageEvent"
    WHERE "guildId" = ${guildId}
      AND "createdAt" >= ${since}
    GROUP BY "userId"
    ORDER BY count DESC
    LIMIT 100
`;
```

### 2. Always Use LIMIT Clauses

❌ **Bad** - Unbounded query:

```typescript
const messages = await db.messageEvent.findMany({
    where: { guildId }
});
```

✅ **Good** - With explicit limit:

```typescript
const messages = await db.messageEvent.findMany({
    where: { guildId },
    take: 100,
    orderBy: { createdAt: 'desc' }
});
```

### 3. Avoid N+1 Query Patterns

❌ **Bad** - Separate query for each user:

```typescript
const users = await db.user.findMany();
for (const user of users) {
    const messageCount = await db.messageEvent.count({
        where: { userId: user.id }
    });
    user.messageCount = messageCount;
}
```

✅ **Good** - Single query with JOIN:

```typescript
const userStats = await db.$queryRaw`
    SELECT u.id, u.username, COUNT(m.id) as message_count
    FROM "User" u
    LEFT JOIN "MessageEvent" m ON u.id = m."userId"
    GROUP BY u.id, u.username
`;
```

### 4. Use Indexes Effectively

Always ensure queries use indexes by:

1. Filtering on indexed columns (`userId`, `guildId`, `createdAt`)
2. Using composite indexes for multi-column filters
3. Running EXPLAIN ANALYZE to verify index usage

✅ **Good** - Uses composite index `(guildId, createdAt)`:

```typescript
const messages = await db.messageEvent.findMany({
    where: {
        guildId,
        createdAt: { gte: since }
    },
    orderBy: { createdAt: 'desc' },
    take: 50
});
```

### 5. Implement Proper Pagination

#### Cursor-Based Pagination (Recommended for Time-Series Data)

```typescript
export async function getEvents(cursor?: string, limit = 50) {
    const cursorDate = cursor ? new Date(cursor) : new Date();
    
    const events = await db.messageEvent.findMany({
        where: {
            guildId,
            createdAt: { lt: cursorDate }
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1 // Fetch one extra to check for more
    });

    const hasMore = events.length > limit;
    const results = hasMore ? events.slice(0, limit) : events;
    const nextCursor = hasMore ? results[limit - 1].createdAt.toISOString() : null;

    return { events: results, nextCursor, hasMore };
}
```

#### Offset-Based Pagination (For Small Datasets)

```typescript
export async function getUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
        db.user.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        }),
        db.user.count()
    ]);

    return {
        users,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}
```

### 6. Use Caching for Expensive Queries

```typescript
import { cache } from '../services/cache';

export async function getAnalytics(guildId: string) {
    const cacheKey = `analytics:${guildId}`;
    
    return cache.remember(
        cacheKey,
        300, // 5 minutes TTL
        async () => {
            return expensiveAnalyticsQuery(guildId);
        },
        {
            tags: [`guild:${guildId}`, 'analytics']
        }
    );
}
```

## Common Patterns

### Pattern: Multiple Table Aggregation

When you need to aggregate data from multiple tables:

```typescript
const result = await db.$queryRaw`
    WITH typing_counts AS (
        SELECT "userId", COUNT(*) as typing_count
        FROM "TypingEvent"
        WHERE "guildId" = ${guildId}
        GROUP BY "userId"
    ),
    message_counts AS (
        SELECT "userId", COUNT(*) as message_count
        FROM "MessageEvent"
        WHERE "guildId" = ${guildId}
        GROUP BY "userId"
    )
    SELECT 
        COALESCE(t."userId", m."userId") as user_id,
        COALESCE(t.typing_count, 0) as typing_count,
        COALESCE(m.message_count, 0) as message_count
    FROM typing_counts t
    FULL OUTER JOIN message_counts m ON t."userId" = m."userId"
    LIMIT 100
`;
```

### Pattern: Time-Window Queries

For queries comparing different time periods:

```typescript
const result = await db.$queryRaw`
    SELECT 
        "userId",
        COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '7 days') as recent_count,
        COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '14 days' 
                         AND "createdAt" < NOW() - INTERVAL '7 days') as previous_count
    FROM "MessageEvent"
    WHERE "guildId" = ${guildId}
      AND "createdAt" >= NOW() - INTERVAL '14 days'
    GROUP BY "userId"
    HAVING COUNT(*) > 10
`;
```

### Pattern: Efficient Filtering

Use database functions for filtering instead of fetching and filtering in code:

```typescript
// Using PostgreSQL array functions
const multiClientUsers = await db.$queryRaw`
    SELECT "userId", MAX("username") as username, COUNT(*) as count
    FROM "PresenceEvent"
    WHERE "createdAt" >= ${since}
      AND array_length(clients, 1) >= 2
    GROUP BY "userId"
    ORDER BY count DESC
    LIMIT 100
`;
```

## Anti-Patterns to Avoid

### ❌ Fetching All Records Without LIMIT

```typescript
// This can return millions of rows
const allMessages = await db.messageEvent.findMany();
```

### ❌ Multiple Sequential Queries (N+1)

```typescript
const users = await db.user.findMany();
for (const user of users) {
    user.messages = await db.messageEvent.findMany({
        where: { userId: user.id }
    });
}
```

### ❌ In-Memory Sorting of Large Datasets

```typescript
const events = await db.messageEvent.findMany();
events.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
```

Use `orderBy` in the query instead.

### ❌ Counting Without Filters

```typescript
// Expensive on large tables
const total = await db.messageEvent.count();
```

Add filters or use approximate counts:

```typescript
// Better
const total = await db.messageEvent.count({
    where: { createdAt: { gte: recentDate } }
});
```

## Monitoring and Testing

### Using the Benchmark Script

Run the benchmark script to validate query performance:

```bash
cd backend
ts-node scripts/benchmark-queries.ts
```

The script will:
- Run each analytics query multiple times
- Calculate p50, p95, p99 percentiles
- Report PASS/WARN/FAIL status
- Highlight queries exceeding thresholds

### Using EXPLAIN ANALYZE

Analyze specific queries:

```bash
curl -X POST http://localhost:3000/api/admin/monitoring/database/explain \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT * FROM \"MessageEvent\" WHERE \"guildId\" = $1 LIMIT 100",
    "params": ["guild123"]
  }'
```

### Query Performance Checklist

Before deploying a new query:

- [ ] Query has explicit LIMIT clause
- [ ] Uses indexed columns in WHERE/JOIN clauses
- [ ] EXPLAIN ANALYZE shows index usage (no Seq Scan on large tables)
- [ ] Execution time < 100ms with realistic data volume
- [ ] Results are cached if query is expensive
- [ ] Pagination is implemented for list endpoints
- [ ] No N+1 query patterns

## Troubleshooting

### Query is Slow (> 100ms)

1. **Check EXPLAIN ANALYZE output**
   ```sql
   EXPLAIN ANALYZE SELECT * FROM "MessageEvent" WHERE "guildId" = 'xxx';
   ```

2. **Look for Sequential Scans**
   - If you see "Seq Scan", add an index
   - Use composite indexes for multi-column filters

3. **Check Data Volume**
   - How many rows match the WHERE clause?
   - Consider adding date filters to reduce scope

4. **Consider Caching**
   - Add Redis caching for queries run frequently
   - Use appropriate TTL based on data freshness needs

### Query Not Using Index

1. **Verify index exists**
   ```sql
   \d "MessageEvent"
   ```

2. **Check query pattern matches index**
   - Index: `(guildId, createdAt DESC)`
   - Query must filter on guildId first

3. **Run ANALYZE**
   ```sql
   ANALYZE "MessageEvent";
   ```

4. **Check statistics**
   ```sql
   SELECT * FROM pg_stats WHERE tablename = 'MessageEvent';
   ```

### High Memory Usage

1. **Reduce result set size** - Add LIMIT clauses
2. **Use streaming for large results** - Process in batches
3. **Avoid loading entire result into memory** - Use cursor-based iteration

## Best Practices Summary

1. ✅ Use database aggregation over application-level processing
2. ✅ Always include LIMIT clauses
3. ✅ Use JOINs instead of multiple queries
4. ✅ Implement pagination (cursor-based preferred)
5. ✅ Cache expensive queries
6. ✅ Monitor query performance regularly
7. ✅ Use EXPLAIN ANALYZE to validate optimizations
8. ✅ Keep queries simple and focused
9. ✅ Test with realistic data volumes
10. ✅ Document complex queries

## Additional Resources

- [PostgreSQL Performance Tips](https://www.postgresql.org/docs/current/performance-tips.html)
- [Prisma Performance Guide](https://www.prisma.io/docs/guides/performance-and-optimization)
- [DATABASE_OPTIMIZATION.md](../../../DATABASE_OPTIMIZATION.md)
- [QUERY_OPTIMIZATIONS.md](../../../QUERY_OPTIMIZATIONS.md)
