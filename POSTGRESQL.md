# PostgreSQL Setup and Management Guide

This guide covers the PostgreSQL configuration, features, and management for Discord SpyWatcher.

## Table of Contents
- [Overview](#overview)
- [PostgreSQL-Specific Features](#postgresql-specific-features)
- [Connection Configuration](#connection-configuration)
- [Database Management](#database-management)
- [Performance Optimization](#performance-optimization)
- [Backup and Recovery](#backup-and-recovery)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Overview

Discord SpyWatcher uses PostgreSQL 15+ as its production database, providing:
- Advanced data types (JSONB, arrays, UUIDs, timestamps with timezone)
- Full-text search capabilities
- Better concurrency and performance
- Production-ready reliability
- Advanced indexing strategies

## PostgreSQL-Specific Features

### Advanced Data Types

#### JSONB Fields
All event models include a `metadata` field using JSONB for flexible, queryable JSON storage:

```typescript
// Store flexible metadata
await db.presenceEvent.create({
  data: {
    userId: "123",
    username: "user",
    clients: ["desktop", "mobile"],
    metadata: {
      status: "online",
      activities: ["gaming"],
      customField: "value"
    }
  }
});

// Query JSONB data
const events = await db.presenceEvent.findMany({
  where: {
    metadata: {
      path: ['status'],
      equals: 'online'
    }
  }
});
```

#### Array Fields
Comma-separated strings have been converted to native PostgreSQL arrays:

```typescript
// PresenceEvent.clients - array of client types
clients: ["desktop", "web", "mobile"]

// RoleChangeEvent.addedRoles - array of role IDs
addedRoles: ["123456789", "987654321"]
```

#### UUID Primary Keys
Event models use UUIDs for better distribution and security:

```typescript
// Auto-generated UUID
id: "550e8400-e29b-41d4-a716-446655440000"
```

#### Timezone-Aware Timestamps
All timestamp fields use `TIMESTAMPTZ` for proper timezone handling:

```typescript
createdAt: DateTime @default(now()) @db.Timestamptz
```

### Full-Text Search

The `MessageEvent` model includes full-text search on the `content` field:

```typescript
// Search messages with full-text
const messages = await db.messageEvent.findMany({
  where: {
    content: {
      search: 'search terms'
    }
  }
});

// Using Prisma's preview feature
const results = await db.$queryRaw`
  SELECT *, ts_rank(to_tsvector('english', content), plainto_tsquery('english', ${query})) AS rank
  FROM "MessageEvent"
  WHERE to_tsvector('english', content) @@ plainto_tsquery('english', ${query})
  ORDER BY rank DESC
  LIMIT 20;
`;
```

### Performance Features

#### Optimized Indexes
The schema includes strategic indexes for common queries:

```prisma
// Event models have indexes on:
- userId (for user-specific queries)
- guildId (for guild-specific queries)
- channelId (for channel-specific queries)
- createdAt (for time-based queries)

// User model has indexes on:
- discordId (for Discord integration)
- email (for user lookup)

// Security models have indexes on:
- ipAddress (for IP-based queries)
- action (for action-based queries)
- timestamp/createdAt (for time-based queries)
```

#### Composite Indexes
Some models use composite indexes for complex queries:

```prisma
@@index([userId, createdAt]) // User activity over time
@@index([guildId, createdAt]) // Guild activity over time
```

## Connection Configuration

### Connection String Format

```bash
DATABASE_URL="postgresql://username:password@host:port/database?schema=public&connection_limit=10&pool_timeout=20&connect_timeout=10"
```

### Connection Pooling Parameters

| Parameter | Recommended Value | Description |
|-----------|-------------------|-------------|
| `connection_limit` | 10-50 | Maximum number of connections in the pool |
| `pool_timeout` | 20 | Seconds to wait for an available connection |
| `connect_timeout` | 10 | Seconds to wait for initial connection |
| `sslmode` | require (prod) | SSL/TLS encryption mode |

### Example Configurations

#### Development
```bash
DATABASE_URL="postgresql://spywatcher:password@localhost:5432/spywatcher?connection_limit=10&pool_timeout=20"
```

#### Production
```bash
DATABASE_URL="postgresql://spywatcher:securepassword@db.example.com:5432/spywatcher?sslmode=require&connection_limit=50&pool_timeout=20&connect_timeout=10"
```

#### Docker
```bash
DATABASE_URL="postgresql://spywatcher:${DB_PASSWORD}@postgres:5432/spywatcher?connection_limit=20&pool_timeout=20"
```

## Database Management

### Migrations

#### Create a Migration
```bash
cd backend
npx prisma migrate dev --name add_new_feature
```

#### Apply Migrations (Production)
```bash
npx prisma migrate deploy
```

#### Reset Database (Development Only)
```bash
npx prisma migrate reset
```

### Data Migration from SQLite

Use the provided migration script:

```bash
# Dry run first
cd backend
DRY_RUN=true \
  SQLITE_DATABASE_URL="file:./prisma/dev.db" \
  DATABASE_URL="postgresql://spywatcher:password@localhost:5432/spywatcher" \
  npm run db:migrate:dry

# Actual migration
SQLITE_DATABASE_URL="file:./prisma/dev.db" \
  DATABASE_URL="postgresql://spywatcher:password@localhost:5432/spywatcher" \
  npm run db:migrate
```

### Seeding Data

```bash
cd backend
npm run prisma:seed
```

## Performance Optimization

### PostgreSQL Configuration

The Docker Compose configuration includes optimized PostgreSQL settings:

```yaml
command:
  - "postgres"
  - "-c" "max_connections=100"
  - "-c" "shared_buffers=256MB"
  - "-c" "effective_cache_size=1GB"
  - "-c" "maintenance_work_mem=64MB"
  - "-c" "checkpoint_completion_target=0.9"
  - "-c" "wal_buffers=16MB"
  - "-c" "default_statistics_target=100"
  - "-c" "random_page_cost=1.1"
  - "-c" "effective_io_concurrency=200"
  - "-c" "work_mem=4MB"
  - "-c" "min_wal_size=1GB"
  - "-c" "max_wal_size=4GB"
```

### Query Optimization

#### Use Indexes Effectively
```typescript
// Good - uses index
const events = await db.presenceEvent.findMany({
  where: { userId: "123" },
  orderBy: { createdAt: 'desc' }
});

// Bad - no index on username alone
const events = await db.presenceEvent.findMany({
  where: { username: "john" }
});
```

#### Batch Operations
```typescript
// Use createMany for bulk inserts
await db.presenceEvent.createMany({
  data: events,
  skipDuplicates: true
});
```

#### Pagination
```typescript
// Efficient pagination with cursor
const events = await db.presenceEvent.findMany({
  take: 20,
  skip: 1,
  cursor: { id: lastId },
  orderBy: { createdAt: 'desc' }
});
```

### Monitoring Queries

Enable query logging in development:

```typescript
const db = new PrismaClient({
  log: ['query', 'error', 'warn'],
});
```

## Backup and Recovery

### Automated Backups

Use the provided backup script:

```bash
# Manual backup
DB_PASSWORD=yourpassword npm run db:backup

# Scheduled backup (cron)
0 2 * * * DB_PASSWORD=yourpassword /path/to/scripts/backup.sh
```

### Backup Features
- Compressed backups (gzip)
- 30-day retention by default
- Optional S3 upload
- Automatic cleanup

### Restore from Backup

```bash
DB_PASSWORD=yourpassword npm run db:restore /path/to/backup.sql.gz
```

### Point-in-Time Recovery

For production, enable WAL archiving:

```sql
-- Enable continuous archiving
ALTER SYSTEM SET wal_level = 'replica';
ALTER SYSTEM SET archive_mode = ON;
ALTER SYSTEM SET archive_command = 'cp %p /path/to/archive/%f';
```

## Monitoring

### Database Metrics

#### Connection Count
```sql
SELECT count(*), state
FROM pg_stat_activity
WHERE datname = 'spywatcher'
GROUP BY state;
```

#### Database Size
```sql
SELECT pg_size_pretty(pg_database_size('spywatcher'));
```

#### Table Sizes
```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

#### Index Usage
```sql
SELECT
  schemaname || '.' || tablename AS table,
  indexname,
  idx_scan AS scans,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

#### Slow Queries
```sql
SELECT
  pid,
  now() - query_start AS duration,
  state,
  query
FROM pg_stat_activity
WHERE state != 'idle'
  AND datname = 'spywatcher'
  AND now() - query_start > interval '1 second'
ORDER BY duration DESC;
```

### Maintenance Script

Run regular maintenance:

```bash
DB_PASSWORD=yourpassword npm run db:maintenance
```

This performs:
- VACUUM ANALYZE (cleanup and optimization)
- Statistics updates
- Bloat detection
- Unused index detection
- Connection monitoring
- Long-running query detection

### Performance Monitoring Tools

#### pg_stat_statements
Enable query statistics:

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- View top queries by total time
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

## Troubleshooting

### Connection Issues

#### Problem: Cannot connect to database
```
Error: P1001: Can't reach database server at `postgres:5432`
```

**Solutions:**
- Check if PostgreSQL is running: `docker-compose ps`
- Verify DATABASE_URL is correct
- Check network connectivity
- Ensure PostgreSQL container is healthy

#### Problem: Too many connections
```
Error: FATAL: remaining connection slots are reserved
```

**Solutions:**
- Increase `max_connections` in PostgreSQL configuration
- Reduce `connection_limit` in DATABASE_URL
- Check for connection leaks in application code
- Use connection pooling (PgBouncer)

### Performance Issues

#### Problem: Slow queries

**Solutions:**
- Enable query logging to identify slow queries
- Add indexes for commonly queried fields
- Use EXPLAIN ANALYZE to understand query plans
- Consider materialized views for complex queries
- Optimize WHERE clauses to use indexes

#### Problem: High memory usage

**Solutions:**
- Reduce `shared_buffers` if too high
- Adjust `work_mem` for complex queries
- Run VACUUM to reclaim space
- Check for table bloat

### Migration Issues

#### Problem: Migration fails with schema mismatch

**Solutions:**
```bash
# Check migration status
npx prisma migrate status

# Mark specific migration as applied
npx prisma migrate resolve --applied "migration_name"

# Reset and reapply (development only)
npx prisma migrate reset
```

#### Problem: Type errors after migration

**Solutions:**
```bash
# Regenerate Prisma Client
npx prisma generate

# Rebuild application
npm run build
```

### Data Issues

#### Problem: UUID vs Integer ID conflicts

**Solution:** Use the migration script to handle ID conversion:
```bash
npm run db:migrate
```

#### Problem: Array field errors

**Solution:** Ensure comma-separated strings are converted to arrays:
```typescript
// Old: clients: "desktop,mobile"
// New: clients: ["desktop", "mobile"]
```

## Best Practices

1. **Connection Management**
   - Always use connection pooling
   - Close connections when done
   - Set appropriate pool limits

2. **Indexing**
   - Index foreign keys
   - Index frequently queried fields
   - Monitor index usage
   - Remove unused indexes

3. **Query Optimization**
   - Use prepared statements
   - Avoid N+1 queries
   - Use batch operations
   - Implement pagination

4. **Security**
   - Use SSL/TLS in production
   - Rotate credentials regularly
   - Limit user permissions
   - Enable audit logging

5. **Backup and Recovery**
   - Automate backups
   - Test restore procedures
   - Store backups securely
   - Document recovery process

6. **Monitoring**
   - Track query performance
   - Monitor connection usage
   - Watch for slow queries
   - Set up alerts

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma PostgreSQL Guide](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [PostgreSQL High Availability](https://www.postgresql.org/docs/current/high-availability.html)

## Support

For issues or questions:
- Check the [main README](../README.md)
- Review [MIGRATION.md](../MIGRATION.md)
- Review [scripts/README.md](../scripts/README.md)
- Open an issue on GitHub
