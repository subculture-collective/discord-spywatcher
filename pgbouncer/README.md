# PgBouncer Configuration

This directory contains the PgBouncer connection pooler configuration for the Discord Spywatcher application.

## Files

- **pgbouncer.ini** - Main PgBouncer configuration file
- **userlist.txt.template** - Template for user authentication (actual file generated at runtime)
- **entrypoint.sh** - Startup script that generates credentials and starts PgBouncer
- **Dockerfile** - Container image definition
- **.gitignore** - Prevents committing generated credentials

## Configuration

### Pool Settings

The default configuration uses transaction-mode pooling with the following limits:

- **Pool Mode**: `transaction` (optimal for Prisma)
- **Default Pool Size**: 25 connections per database
- **Min Pool Size**: 5 connections minimum
- **Reserve Pool**: 5 additional connections for spikes
- **Max Client Connections**: 100 simultaneous clients

### Connection Lifecycle

- **Server Lifetime**: 3600 seconds (1 hour)
- **Idle Timeout**: 600 seconds (10 minutes)
- **Query Wait Timeout**: 120 seconds

### Security

- **Authentication**: MD5 hashed passwords
- **Admin Access**: Separate admin user for monitoring
- **Network**: Internal Docker network only (no external exposure in production)

## Usage

### Environment Variables

Required:
- `DB_USER` - Database username (e.g., "spywatcher")
- `DB_PASSWORD` - Database password

Optional:
- `PGBOUNCER_ADMIN_USER` - Admin username (default: "pgbouncer_admin")
- `PGBOUNCER_ADMIN_PASSWORD` - Admin password (recommended for production)

### Starting PgBouncer

The entrypoint script automatically:
1. Generates MD5 hashed passwords
2. Creates `userlist.txt` from environment variables
3. Sets appropriate file permissions
4. Starts PgBouncer

### Connecting

#### Application Connection (through PgBouncer)
```bash
postgresql://user:password@pgbouncer:6432/spywatcher?pgbouncer=true
```

#### Admin Console
```bash
psql -h pgbouncer -p 6432 -U pgbouncer_admin pgbouncer
```

## Monitoring

### PgBouncer Admin Commands

```sql
SHOW POOLS;        -- Pool statistics
SHOW DATABASES;    -- Database connections
SHOW CLIENTS;      -- Client connections
SHOW SERVERS;      -- Server connections
SHOW CONFIG;       -- Current configuration
SHOW STATS;        -- Performance statistics
RELOAD;            -- Reload configuration
```

### Health Check

The Docker container includes a health check that runs:
```bash
psql -h 127.0.0.1 -p 6432 -U $DB_USER -d pgbouncer -c "SHOW POOLS;"
```

## Customization

To modify PgBouncer settings:

1. Edit `pgbouncer.ini`
2. Rebuild the Docker image or restart the container
3. Verify changes with `SHOW CONFIG;` in admin console

### Common Adjustments

**Increase pool size for high load:**
```ini
default_pool_size = 50
max_client_conn = 200
```

**Adjust timeouts:**
```ini
server_idle_timeout = 300  # Reduce to 5 minutes
query_wait_timeout = 60     # Reduce to 1 minute
```

**Enable verbose logging:**
```ini
log_connections = 1
log_disconnections = 1
log_pooler_errors = 1
verbose = 1
```

## Troubleshooting

### Issue: "No such user"
Check that credentials are set correctly:
```bash
docker exec container_name cat /etc/pgbouncer/userlist.txt
```

### Issue: Connection refused
Ensure PostgreSQL is running and healthy:
```bash
docker-compose ps postgres
docker logs container_name
```

### Issue: Pool saturation
Check pool utilization:
```sql
SHOW POOLS;
-- If cl_waiting > 0, increase pool size
```

## Security Notes

- **Never commit `userlist.txt`** - it contains credentials (already in `.gitignore`)
- **Use strong passwords** - especially for production
- **Rotate credentials** - regularly change passwords
- **Limit network access** - PgBouncer should only be accessible within Docker network

## Resources

- [PgBouncer Documentation](https://www.pgbouncer.org/)
- [Full Setup Guide](../docs/PGBOUNCER_SETUP.md)
- [Connection Pooling Guide](../CONNECTION_POOLING.md)
- [PostgreSQL Guide](../POSTGRESQL.md)
