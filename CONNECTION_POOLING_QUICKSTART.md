# Connection Pooling Quick Reference

This guide provides quick commands and tips for working with connection pooling in Discord Spywatcher.

## 🚀 Quick Start

### Development Setup

```bash
# 1. Copy environment variables
cp .env.example .env

# 2. Configure database with connection pooling
# Edit .env and set:
DATABASE_URL=postgresql://spywatcher:password@pgbouncer:6432/spywatcher?pgbouncer=true&connection_limit=5&pool_timeout=20

# 3. Start services with Docker Compose
docker-compose -f docker-compose.dev.yml up -d

# 4. Check connection pool health
curl http://localhost:3001/api/admin/monitoring/connections/health
```

### Production Setup

```bash
# 1. Set environment variables
export DATABASE_URL="postgresql://user:pass@pgbouncer:6432/db?pgbouncer=true&connection_limit=5&pool_timeout=20"
export DATABASE_URL_DIRECT="postgresql://user:pass@postgres:5432/db"

# 2. Deploy with docker-compose
docker-compose -f docker-compose.prod.yml up -d

# 3. Monitor pool metrics
curl http://localhost:3001/api/admin/monitoring/connections/pool
```

## 📊 Monitoring Commands

### Check Connection Pool Health

```bash
# Overall system health
curl -X GET http://localhost:3001/api/admin/monitoring/connections/health | jq

# Connection pool statistics
curl -X GET http://localhost:3001/api/admin/monitoring/connections/pool | jq

# Active alerts
curl -X GET http://localhost:3001/api/admin/monitoring/connections/alerts | jq
```

### PgBouncer Admin Console

```bash
# Connect to PgBouncer admin
docker exec -it spywatcher-pgbouncer-dev psql -h 127.0.0.1 -p 6432 -U pgbouncer_admin pgbouncer

# Show pool statistics
SHOW POOLS;

# Show database connections
SHOW DATABASES;

# Show client connections
SHOW CLIENTS;

# Show server connections
SHOW SERVERS;
```

### View Application Logs

```bash
# Watch connection pool monitoring logs
docker logs -f spywatcher-backend-dev | grep "Connection Pool"

# Check startup configuration
docker logs spywatcher-backend-dev | grep "Database Connection Pool Configuration"
```

## ⚙️ Configuration Parameters

### Connection Pool Settings

| Parameter | With PgBouncer | Without PgBouncer | Description |
|-----------|---------------|-------------------|-------------|
| `connection_limit` | 3-5 | 10-50 | Max connections per Prisma instance |
| `pool_timeout` | 20s | 20s | Time to wait for available connection |
| `connect_timeout` | 10s | 10s | Initial connection timeout |

### PgBouncer Settings (pgbouncer/pgbouncer.ini)

```ini
# Pooling mode - use transaction for best Prisma compatibility
pool_mode = transaction

# Connection limits
default_pool_size = 25      # Connections per database
min_pool_size = 5           # Minimum to maintain
reserve_pool_size = 5       # Emergency reserve
max_client_conn = 100       # Maximum client connections

# Timeouts
server_lifetime = 3600      # 1 hour
server_idle_timeout = 600   # 10 minutes
query_wait_timeout = 120    # 2 minutes
```

## 🔧 Troubleshooting

### Too Many Connections

```bash
# Check current utilization
curl http://localhost:3001/api/admin/monitoring/connections/pool | jq '.database.utilizationPercent'

# If over 80%, check PgBouncer pool size
docker exec spywatcher-pgbouncer-dev cat /etc/pgbouncer/pgbouncer.ini | grep pool_size

# Increase pool size by editing pgbouncer.ini and restarting
docker restart spywatcher-pgbouncer-dev
```

### Connection Timeouts

```bash
# Check if PgBouncer is running
docker ps | grep pgbouncer

# Test direct PostgreSQL connection
docker exec spywatcher-postgres-dev psql -U spywatcher -d spywatcher -c "SELECT 1"

# Test PgBouncer connection
docker exec spywatcher-backend-dev psql "$DATABASE_URL" -c "SELECT 1"
```

### Slow Queries

```bash
# Check slow queries from application
curl -X GET http://localhost:3001/api/admin/monitoring/database/slow-queries | jq

# Check PgBouncer statistics
docker exec spywatcher-pgbouncer-dev psql -h 127.0.0.1 -p 6432 -U pgbouncer_admin pgbouncer -c "SHOW STATS"
```

### Connection Leaks

```bash
# Monitor connection count over time
while true; do
  echo "$(date): $(curl -s http://localhost:3001/api/admin/monitoring/connections/pool | jq '.database.activeConnections')"
  sleep 5
done

# Check for hung connections in PostgreSQL
docker exec spywatcher-postgres-dev psql -U spywatcher -d spywatcher -c "
  SELECT pid, usename, application_name, client_addr, state, query_start, state_change
  FROM pg_stat_activity
  WHERE state != 'idle'
  ORDER BY query_start;
"
```

## 📈 Performance Tuning

### Optimize for High Load

```ini
# PgBouncer (pgbouncer/pgbouncer.ini)
default_pool_size = 50      # Increase from 25
max_client_conn = 200       # Increase from 100
```

```bash
# DATABASE_URL
connection_limit=3          # Reduce per-instance limit
pool_timeout=30            # Increase timeout
```

### Optimize for Low Latency

```ini
# PgBouncer
default_pool_size = 15      # Lower overhead
min_pool_size = 10          # Keep connections warm
```

```bash
# DATABASE_URL
connection_limit=5          # Standard setting
pool_timeout=10            # Faster timeout
```

## 🚨 Alert Thresholds

The system automatically generates alerts at these thresholds:

- **WARNING** (80-89% utilization): Pool is getting full
- **CRITICAL** (90%+ utilization): Pool nearly exhausted
- **WARNING**: Redis configured but unavailable

## 📚 Additional Resources

- [Full Documentation](./CONNECTION_POOLING.md)
- [Database Optimization Guide](./DATABASE_OPTIMIZATION.md)
- [PostgreSQL Setup](./POSTGRESQL.md)
- [PgBouncer Documentation](https://www.pgbouncer.org/)
- [Prisma Connection Pool](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/connection-pool)

## 🆘 Need Help?

1. Check the logs: `docker logs spywatcher-backend-dev`
2. Review monitoring endpoints
3. Verify PgBouncer is running: `docker ps`
4. Check PostgreSQL is accessible
5. Review connection pool metrics in real-time
6. Open a GitHub issue with relevant logs
