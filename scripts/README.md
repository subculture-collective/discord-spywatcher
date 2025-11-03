# Scripts Directory

This directory contains management scripts for Discord SpyWatcher, including database operations, deployment automation, and auto-scaling validation.

## Scripts Overview

### Auto-scaling & Deployment Scripts

#### `validate-autoscaling.sh`

Validates auto-scaling and load balancing configuration in Kubernetes.

**Features:**

- Checks HPA configuration and status
- Verifies metrics-server availability
- Validates deployment configurations
- Checks service endpoints and health
- Verifies Pod Disruption Budgets
- Tests pod metrics availability
- Comprehensive validation report

**Usage:**

```bash
# Run validation
./scripts/validate-autoscaling.sh

# With custom namespace
NAMESPACE=spywatcher-prod ./scripts/validate-autoscaling.sh

# Verbose output
VERBOSE=true ./scripts/validate-autoscaling.sh
```

**Environment Variables:**

- `NAMESPACE` - Kubernetes namespace (default: spywatcher)
- `VERBOSE` - Show detailed output (default: false)

**See:** [AUTO_SCALING.md](../AUTO_SCALING.md) for detailed documentation.

#### `load-test.sh`

Generates load to test auto-scaling behavior and simulate traffic spikes.

**Features:**

- Multiple load testing tools support (ab, wrk, hey)
- Configurable duration and concurrency
- Traffic spike simulation mode
- Real-time HPA monitoring
- Scaling event tracking
- Comprehensive results reporting

**Usage:**

```bash
# Basic load test (5 minutes, 50 concurrent)
./scripts/load-test.sh

# Custom configuration
./scripts/load-test.sh --duration 600 --concurrent 100 --rps 200

# Simulate traffic spike pattern
./scripts/load-test.sh --spike

# Monitor HPA only (no load generation)
./scripts/load-test.sh --monitor

# Custom target URL
./scripts/load-test.sh --url https://api.example.com/health
```

**Options:**

- `-u, --url URL` - Target URL (auto-detected if not specified)
- `-d, --duration SECONDS` - Test duration (default: 300)
- `-c, --concurrent NUM` - Concurrent requests (default: 50)
- `-r, --rps NUM` - Requests per second (default: 100)
- `-s, --spike` - Simulate traffic spike pattern
- `-m, --monitor` - Monitor HPA only
- `-h, --help` - Show help

**See:** [docs/AUTO_SCALING_EXAMPLES.md](../docs/AUTO_SCALING_EXAMPLES.md) for examples.

### PostgreSQL Management Scripts

#### 1. `postgres-init.sql`

Initialization script that runs when the PostgreSQL container starts for the first time.

**Features:**

- Enables required PostgreSQL extensions (uuid-ossp, pg_trgm)
- Sets timezone to UTC
- Logs successful initialization

**Usage:**
Automatically executed by Docker when the database container is first created.

#### 2. `backup.sh`

Creates compressed backups of the PostgreSQL database.

**Features:**

- Creates gzip-compressed backups
- Automatic backup retention (30 days by default)
- Optional S3 upload support
- Colored output for easy monitoring

**Usage:**

```bash
# Basic backup
DB_PASSWORD=your_password ./scripts/backup.sh

# Custom backup directory and retention
BACKUP_DIR=/custom/path RETENTION_DAYS=60 DB_PASSWORD=your_password ./scripts/backup.sh

# With S3 upload
S3_BUCKET=my-bucket DB_PASSWORD=your_password ./scripts/backup.sh
```

**Environment Variables:**

- `BACKUP_DIR` - Backup directory (default: /var/backups/spywatcher)
- `DB_NAME` - Database name (default: spywatcher)
- `DB_USER` - Database user (default: spywatcher)
- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 5432)
- `DB_PASSWORD` - Database password (required)
- `RETENTION_DAYS` - Days to keep backups (default: 30)
- `S3_BUCKET` - S3 bucket for cloud backup (optional)

#### 3. `restore.sh`

Restores the database from a backup file.

**Features:**

- Interactive confirmation before restore
- Terminates existing connections
- Verifies restore success
- Colored output for status messages

**Usage:**

```bash
# Restore from backup
DB_PASSWORD=your_password ./scripts/restore.sh /path/to/backup.sql.gz

# List available backups
DB_PASSWORD=your_password ./scripts/restore.sh
```

**Environment Variables:**

- `DB_NAME` - Database name (default: spywatcher)
- `DB_USER` - Database user (default: spywatcher)
- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 5432)
- `DB_PASSWORD` - Database password (required)

**Warning:** This operation will REPLACE all current data!

#### 4. `maintenance.sh`

Performs routine database maintenance tasks.

**Features:**

- VACUUM ANALYZE for cleanup and optimization
- Updates table statistics
- Checks for table bloat
- Reports unused indexes
- Shows database size
- Lists active connections
- Detects long-running queries

**Usage:**

```bash
# Run maintenance
DB_PASSWORD=your_password ./scripts/maintenance.sh

# Schedule with cron (daily at 2 AM)
0 2 * * * DB_PASSWORD=your_password /path/to/scripts/maintenance.sh >> /var/log/spywatcher-maintenance.log 2>&1
```

**Environment Variables:**

- `DB_NAME` - Database name (default: spywatcher)
- `DB_USER` - Database user (default: spywatcher)
- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 5432)
- `DB_PASSWORD` - Database password (required)

#### 5. `migrate-to-postgres.ts`

Migrates data from SQLite to PostgreSQL.

**Features:**

- Batch processing for large datasets
- Data transformation (IDs to UUIDs, strings to arrays)
- Progress tracking with colored output
- Dry-run mode for testing
- Detailed migration statistics

**Usage:**

```bash
cd backend

# Dry run (test without writing data)
DRY_RUN=true SQLITE_DATABASE_URL="file:./prisma/dev.db" DATABASE_URL="postgresql://spywatcher:password@localhost:5432/spywatcher" npx ts-node ../scripts/migrate-to-postgres.ts

# Actual migration
SQLITE_DATABASE_URL="file:./prisma/dev.db" DATABASE_URL="postgresql://spywatcher:password@localhost:5432/spywatcher" npx ts-node ../scripts/migrate-to-postgres.ts

# Custom batch size
BATCH_SIZE=500 SQLITE_DATABASE_URL="file:./prisma/dev.db" DATABASE_URL="postgresql://spywatcher:password@localhost:5432/spywatcher" npx ts-node ../scripts/migrate-to-postgres.ts
```

**Environment Variables:**

- `SQLITE_DATABASE_URL` - SQLite connection string (default: file:./backend/prisma/dev.db)
- `DATABASE_URL` - PostgreSQL connection string (required)
- `BATCH_SIZE` - Records per batch (default: 1000)
- `DRY_RUN` - Test mode without writing (default: false)

**Migrated Models:**

- PresenceEvent (with array clients)
- TypingEvent
- MessageEvent (with full-text search support)
- JoinEvent
- RoleChangeEvent (with array addedRoles)

#### 6. `setup-fulltext-search.sh`

Sets up full-text search capabilities for the MessageEvent table.

**Features:**

- Adds tsvector column for efficient text search
- Creates GIN index for performance
- Verifies index creation
- Colored output

**Usage:**

```bash
# Setup full-text search
DB_PASSWORD=your_password ./scripts/setup-fulltext-search.sh

# From backend directory
DB_PASSWORD=your_password npm run db:fulltext
```

**Environment Variables:**

- `DB_NAME` - Database name (default: spywatcher)
- `DB_USER` - Database user (default: spywatcher)
- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 5432)
- `DB_PASSWORD` - Database password (required)

**Note:** This should be run after the database schema is created and before searching messages.

## Automation

### Scheduled Backups

Add to crontab for daily backups at 2 AM:

```bash
0 2 * * * DB_PASSWORD=your_password /path/to/scripts/backup.sh >> /var/log/spywatcher-backup.log 2>&1
```

### Scheduled Maintenance

Add to crontab for weekly maintenance on Sundays at 3 AM:

```bash
0 3 * * 0 DB_PASSWORD=your_password /path/to/scripts/maintenance.sh >> /var/log/spywatcher-maintenance.log 2>&1
```

## Docker Usage

### Backup from Docker Container

```bash
docker-compose -f docker-compose.prod.yml exec postgres sh -c "DB_PASSWORD=$DB_PASSWORD /app/scripts/backup.sh"
```

### Restore in Docker Container

```bash
docker-compose -f docker-compose.prod.yml exec postgres sh -c "DB_PASSWORD=$DB_PASSWORD /app/scripts/restore.sh /backups/spywatcher_20250101_020000.sql.gz"
```

### Maintenance in Docker Container

```bash
docker-compose -f docker-compose.prod.yml exec postgres sh -c "DB_PASSWORD=$DB_PASSWORD /app/scripts/maintenance.sh"
```

## Best Practices

1. **Always test restore procedures** - Regularly verify that backups can be restored
2. **Monitor backup sizes** - Ensure backups are completing successfully
3. **Secure backup storage** - Store backups in a different location than the database
4. **Document your schedule** - Keep track of when maintenance and backups run
5. **Review maintenance reports** - Check for bloat, unused indexes, and long queries
6. **Test migrations** - Always run with DRY_RUN=true first

## Troubleshooting

### Permission Denied

If you get permission errors, make sure scripts are executable:

```bash
chmod +x scripts/*.sh
```

### Connection Issues

Verify database credentials and connectivity:

```bash
PGPASSWORD=your_password psql -h localhost -p 5432 -U spywatcher -d spywatcher -c "SELECT version();"
```

### Large Database Performance

For databases over 1GB, consider:

- Increasing BATCH_SIZE for migrations
- Running maintenance during off-peak hours
- Using parallel processing for backups

## Security Notes

- Never commit passwords to version control
- Use environment variables for sensitive data
- Restrict script file permissions: `chmod 700 scripts/*.sh`
- Store backups in secure, encrypted locations
- Regularly rotate database credentials
- Use connection pooling in production

## Support

For issues or questions:

- Check the main [README.md](../README.md)
- Review [MIGRATION.md](../MIGRATION.md) for database migration guidance
- Review [DOCKER.md](../DOCKER.md) for Docker-specific issues
- Open an issue on GitHub with script output and error messages
