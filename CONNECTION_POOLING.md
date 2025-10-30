# Connection Pooling & Resource Management

This document describes the connection pooling and database resource management implementation for Discord Spywatcher.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [PgBouncer Configuration](#pgbouncer-configuration)
- [Prisma Connection Pool](#prisma-connection-pool)
- [Connection Lifecycle](#connection-lifecycle)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## 🎯 Overview

The application implements a multi-layered connection pooling strategy:

1. **PgBouncer** - External connection pooler for PostgreSQL
2. **Prisma Client** - Application-level connection management
3. **Redis** - Connection pooling for cache/rate limiting

### Key Features

- ✅ Transaction-mode connection pooling via PgBouncer
- ✅ Optimized Prisma connection pool settings
- ✅ Graceful shutdown with proper cleanup
- ✅ Connection pool monitoring and metrics
- ✅ Health checks for database and Redis
- ✅ Automatic connection leak prevention

## 🏗️ Architecture

```
Application Layer (Multiple Instances)
         ↓
    Prisma Client (1-5 connections each)
         ↓
    PgBouncer (Connection Pooler)
      - Pool Size: 25 connections
      - Mode: Transaction
      - Max Clients: 100
         ↓
    PostgreSQL Database
      - Max Connections: 100
```

### Why This Architecture?

- **PgBouncer** manages a pool of persistent connections to PostgreSQL
- **Transaction mode** allows multiple clients to share connections between transactions
- **Prisma** uses fewer connections since PgBouncer handles pooling
- **Scalable** - can run multiple application instances without exhausting connections

## 🔧 PgBouncer Configuration

### Configuration File

Location: `pgbouncer/pgbouncer.ini`

#### Key Settings

```ini
# Pooling mode - transaction is optimal for Prisma
pool_mode = transaction

# Connection limits
default_pool_size = 25      # Connections per database
min_pool_size = 5           # Minimum connections to maintain
reserve_pool_size = 5       # Additional connections for spikes
max_client_conn = 100       # Maximum client connections

# Timeouts
server_lifetime = 3600      # Connection lifetime (1 hour)
server_idle_timeout = 600   # Idle timeout (10 minutes)
query_wait_timeout = 120    # Query wait timeout (2 minutes)

# Reset query to clean connection state
server_reset_query = DISCARD ALL
```

### Pool Modes Explained

| Mode | Description | Use Case |
|------|-------------|----------|
| **session** | One server connection per client | Long-running sessions, advisory locks |
| **transaction** | One server connection per transaction | Most applications (recommended for Prisma) |
| **statement** | One server connection per statement | Stateless applications only |

**We use `transaction` mode** because:
- Compatible with Prisma's transaction handling
- Efficient connection reuse
- Balances performance and compatibility

### Docker Setup

#### Development

```yaml
pgbouncer:
  build:
    context: ./pgbouncer
  environment:
    DB_USER: spywatcher
    DB_PASSWORD: ${DB_PASSWORD}
  ports:
    - "6432:6432"
```

#### Production

```yaml
pgbouncer:
  build:
    context: ./pgbouncer
  environment:
    DB_USER: spywatcher
    DB_PASSWORD: ${DB_PASSWORD}
  restart: unless-stopped
  # Note: No external port exposure in production
```

### Environment Variables

```bash
# Application connects through PgBouncer
DATABASE_URL=postgresql://user:password@pgbouncer:6432/spywatcher?pgbouncer=true

# Migrations connect directly to PostgreSQL
DATABASE_URL_DIRECT=postgresql://user:password@postgres:5432/spywatcher

# PgBouncer admin credentials (optional)
PGBOUNCER_ADMIN_PASSWORD=secure_password
```

## 💎 Prisma Connection Pool

### Configuration

When using PgBouncer, Prisma needs fewer connections:

```typescript
const db = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
```

### Connection URL Parameters

#### With PgBouncer (Production)
```
postgresql://user:password@pgbouncer:6432/dbname?pgbouncer=true
```
- Keep connection pool small (Prisma default: 5)
- PgBouncer handles the actual pooling

#### Direct Connection (Development/Migrations)
```
postgresql://user:password@postgres:5432/dbname?connection_limit=20&pool_timeout=20
```
- `connection_limit`: 10-50 depending on load
- `pool_timeout`: 20 seconds
- `connect_timeout`: 10 seconds

### Why Fewer Connections with PgBouncer?

Without PgBouncer:
```
Application → PostgreSQL (need many connections)
```

With PgBouncer:
```
Application → PgBouncer → PostgreSQL (PgBouncer reuses connections)
```

Example with 10 application instances:
- **Without PgBouncer**: 10 × 20 = 200 PostgreSQL connections needed
- **With PgBouncer**: 10 × 5 = 50 client connections → 25 PostgreSQL connections

## 🔄 Connection Lifecycle

### Application Startup

1. **Database Connection**
   ```typescript
   // db.ts initializes Prisma Client
   export const db = new PrismaClient({ ... });
   ```

2. **Redis Connection** (if enabled)
   ```typescript
   // redis.ts initializes Redis client
   const redisClient = new Redis(url, { ... });
   ```

3. **Health Checks**
   - Database connectivity verification
   - Connection pool metrics collection

### During Operation

- **Connection Reuse**: PgBouncer reuses connections between transactions
- **Pool Monitoring**: Metrics collected every 60 seconds
- **Auto-reconnect**: Redis automatically reconnects on connection loss

### Graceful Shutdown

```typescript
// Signal handlers in db.ts and redis.ts
process.on('SIGTERM', async () => {
  // 1. Stop accepting new connections
  // 2. Wait for in-flight requests
  // 3. Close Prisma connections
  await db.$disconnect();
  // 4. Close Redis connections
  await closeRedisConnection();
  // 5. Exit process
  process.exit(0);
});
```

#### Shutdown Sequence

1. **Receive SIGTERM/SIGINT**
2. **Set shutdown flag** - prevents new operations
3. **Disconnect Prisma** - closes all connections gracefully
4. **Disconnect Redis** - uses QUIT command
5. **Exit process**

### Connection Leak Prevention

- **Singleton pattern** for database client
- **Proper error handling** ensures connections are released
- **Transaction timeouts** prevent hung connections
- **Monitoring alerts** for connection pool saturation

## 📊 Monitoring

### Health Check Endpoints

#### System Health
```bash
GET /api/admin/monitoring/connections/health
```

Returns:
```json
{
  "healthy": true,
  "timestamp": "2025-01-15T10:30:00Z",
  "database": {
    "healthy": true,
    "responseTime": 12,
    "connectionPool": {
      "active": 3,
      "idle": 2,
      "total": 5,
      "max": 100,
      "utilizationPercent": "5.00",
      "isPgBouncer": true,
      "isShuttingDown": false
    }
  },
  "redis": {
    "available": true,
    "connected": true,
    "status": "ready"
  }
}
```

#### Connection Pool Stats
```bash
GET /api/admin/monitoring/connections/pool
```

Returns:
```json
{
  "database": {
    "utilizationPercent": 5.0,
    "activeConnections": 3,
    "maxConnections": 100,
    "isHealthy": true
  },
  "redis": {
    "available": true,
    "connected": true
  }
}
```

#### Connection Alerts
```bash
GET /api/admin/monitoring/connections/alerts
```

Returns:
```json
{
  "alerts": [
    "WARNING: Database connection pool at 85% utilization"
  ],
  "count": 1,
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### PgBouncer Statistics

Connect to PgBouncer admin interface:

```bash
psql -h localhost -p 6432 -U pgbouncer_admin pgbouncer
```

Useful commands:

```sql
-- Show pool statistics
SHOW POOLS;

-- Show database statistics
SHOW DATABASES;

-- Show client connections
SHOW CLIENTS;

-- Show server connections
SHOW SERVERS;

-- Show configuration
SHOW CONFIG;

-- Show statistics
SHOW STATS;
```

### Automated Monitoring

The application logs connection pool metrics every 60 seconds:

```
=== Connection Pool Metrics ===
Timestamp: 2025-01-15T10:30:00Z
Overall Health: ✅ HEALTHY

--- Database ---
Health: ✅
Response Time: 12ms
Connection Pool:
  Active: 3
  Idle: 2
  Total: 5
  Max: 100
  Utilization: 5.00%
  PgBouncer: Yes

--- Redis ---
Available: ✅
Connected: ✅
Status: ready
Metrics:
  Total Connections: 125
  Total Commands: 45678
  Ops/sec: 23
  Memory Used: 2.5MB
==============================
```

## 🔍 Troubleshooting

### Issue: Too many connections

**Symptoms:**
```
Error: remaining connection slots are reserved for non-replication superuser connections
```

**Solutions:**

1. **Check PgBouncer pool size:**
   ```bash
   # In pgbouncer.ini
   default_pool_size = 25  # Increase if needed
   max_db_connections = 50
   ```

2. **Check PostgreSQL max_connections:**
   ```sql
   SHOW max_connections;  -- Should be > PgBouncer pool size
   ```

3. **Monitor connection usage:**
   ```bash
   curl http://localhost:3001/api/admin/monitoring/connections/pool
   ```

### Issue: Connection timeouts

**Symptoms:**
```
Error: Connection timeout
```

**Solutions:**

1. **Check PgBouncer is running:**
   ```bash
   docker ps | grep pgbouncer
   ```

2. **Check connection string:**
   ```bash
   # Ensure using correct host and port
   DATABASE_URL=postgresql://user:pass@pgbouncer:6432/db?pgbouncer=true
   ```

3. **Increase timeouts:**
   ```ini
   # In pgbouncer.ini
   query_wait_timeout = 120
   server_connect_timeout = 15
   ```

### Issue: Slow queries with PgBouncer

**Symptoms:**
- Queries slower than without PgBouncer

**Solutions:**

1. **Ensure using transaction mode:**
   ```ini
   pool_mode = transaction  # Not session mode
   ```

2. **Check for connection reuse:**
   ```sql
   -- In PgBouncer admin
   SHOW POOLS;
   -- Check cl_active, cl_waiting, sv_active, sv_idle
   ```

3. **Monitor query wait time:**
   ```bash
   curl http://localhost:3001/api/admin/monitoring/database/slow-queries
   ```

### Issue: Migrations fail with PgBouncer

**Symptoms:**
```
Error: prepared statement already exists
```

**Solution:**

Always run migrations with direct PostgreSQL connection:
```bash
# Use DATABASE_URL_DIRECT for migrations
DATABASE_URL=$DATABASE_URL_DIRECT npx prisma migrate deploy
```

Or configure in docker-compose.yml:
```yaml
migrate:
  environment:
    DATABASE_URL: postgresql://user:pass@postgres:5432/db  # Direct connection
```

### Issue: Connection pool exhaustion

**Symptoms:**
- "Pool is full" errors
- High connection utilization

**Solutions:**

1. **Scale PgBouncer pool:**
   ```ini
   default_pool_size = 50  # Increase from 25
   reserve_pool_size = 10  # Increase reserve
   ```

2. **Add connection cleanup:**
   ```typescript
   // Ensure proper $disconnect() on errors
   try {
     await db.query();
   } finally {
     // Connections released automatically
   }
   ```

3. **Reduce connection limit per instance:**
   ```
   # Fewer connections per app instance
   DATABASE_URL=...?connection_limit=3
   ```

## ✅ Best Practices

### Production Deployment

1. **Always use PgBouncer in production**
   - Better connection management
   - Prevents connection exhaustion
   - Enables horizontal scaling

2. **Configure appropriate pool sizes**
   ```
   PgBouncer pool: 25-50 connections
   Prisma per instance: 3-5 connections
   PostgreSQL max: 100+ connections
   ```

3. **Use separate connections for migrations**
   - Migrations need direct PostgreSQL access
   - Bypass PgBouncer for schema changes

4. **Monitor connection metrics**
   - Set up alerts for >80% utilization
   - Track connection pool trends
   - Monitor slow query counts

### Development Practices

1. **Test with and without PgBouncer**
   - Dev: direct connection (easier debugging)
   - Staging/Prod: through PgBouncer

2. **Use environment-specific configs**
   ```bash
   # .env.development
   DATABASE_URL=postgresql://...@postgres:5432/db
   
   # .env.production
   DATABASE_URL=postgresql://...@pgbouncer:6432/db?pgbouncer=true
   ```

3. **Implement proper error handling**
   ```typescript
   try {
     await db.query();
   } catch (error) {
     // Log error
     // Connection automatically released
     throw error;
   }
   ```

4. **Use connection pooling metrics**
   - Monitor during load tests
   - Adjust pool sizes based on metrics
   - Set up automated alerts

### Security Considerations

1. **Secure PgBouncer credentials**
   - Use strong passwords
   - Rotate credentials regularly
   - Use environment variables

2. **Limit PgBouncer access**
   - Don't expose port externally
   - Use internal Docker network
   - Configure firewall rules

3. **Monitor for connection abuse**
   - Track connection patterns
   - Alert on unusual spikes
   - Implement rate limiting

## 📚 Additional Resources

- [PgBouncer Documentation](https://www.pgbouncer.org/)
- [Prisma Connection Pool](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/connection-pool)
- [PostgreSQL Connection Pooling](https://www.postgresql.org/docs/current/runtime-config-connection.html)
- [DATABASE_OPTIMIZATION.md](./DATABASE_OPTIMIZATION.md)
- [POSTGRESQL.md](./POSTGRESQL.md)

## 🆘 Support

For issues or questions:
- Check monitoring endpoints first
- Review logs for error messages
- Consult troubleshooting section
- Check PgBouncer statistics
- Open GitHub issue with details
