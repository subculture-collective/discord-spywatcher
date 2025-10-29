# Database Migration Guide: SQLite to PostgreSQL

This guide explains how to migrate your Discord Spywatcher database from SQLite to PostgreSQL when switching to Docker.

## Overview

The application now uses PostgreSQL as the primary database for production deployments. This provides:

### Standard Benefits
- Better concurrency handling
- Improved data integrity
- Enhanced scalability
- Production-ready features

### PostgreSQL-Specific Enhancements
- **JSONB Fields**: Flexible metadata storage with efficient querying
- **Array Types**: Native array support for multi-value fields (clients, roles)
- **UUID Primary Keys**: Better distribution and security for event models
- **Timezone-Aware Timestamps**: Proper timezone handling with TIMESTAMPTZ
- **Full-Text Search**: Native text search with GIN indexes on message content
- **Optimized Indexes**: Strategic indexes for common query patterns
- **Connection Pooling**: Configurable connection management
- **Advanced Features**: Support for CTEs, window functions, materialized views

### What Changed in the Schema

1. **Event Models** (PresenceEvent, TypingEvent, MessageEvent, etc.):
   - IDs changed from `Int` to `String` (UUID)
   - Added `metadata Json? @db.JsonB` field
   - Timestamps now use `@db.Timestamptz`
   - Comma-separated strings converted to arrays

2. **All Models**:
   - All timestamps upgraded to timezone-aware
   - Added strategic indexes for performance
   - JSONB for all JSON fields

For complete PostgreSQL feature documentation, see [POSTGRESQL.md](./POSTGRESQL.md).

## For New Installations

If you're starting fresh with Docker, no migration is needed. Simply:

1. Start the Docker environment:
   ```bash
   docker-compose -f docker-compose.dev.yml up
   ```

2. The PostgreSQL database will be initialized automatically with all migrations.

## For Existing Installations (SQLite → PostgreSQL)

If you have existing data in SQLite and want to migrate to PostgreSQL:

### Option 1: Automated Migration (Recommended)

Use the provided TypeScript migration script for a seamless transition:

#### Step 1: Prepare PostgreSQL Database

```bash
# Start PostgreSQL with Docker
docker-compose -f docker-compose.dev.yml up postgres -d

# Wait for PostgreSQL to be ready
docker-compose -f docker-compose.dev.yml exec postgres pg_isready -U spywatcher
```

#### Step 2: Run Migrations

```bash
cd backend

# Apply schema migrations to PostgreSQL
DATABASE_URL="postgresql://spywatcher:password@localhost:5432/spywatcher" \
  npx prisma migrate deploy
```

#### Step 3: Migrate Data (Dry Run First)

```bash
# Test migration without writing data
DRY_RUN=true \
  SQLITE_DATABASE_URL="file:./prisma/dev.db" \
  DATABASE_URL="postgresql://spywatcher:password@localhost:5432/spywatcher" \
  npm run db:migrate:dry
```

Review the output to see what will be migrated.

#### Step 4: Perform Actual Migration

```bash
# Migrate data from SQLite to PostgreSQL
SQLITE_DATABASE_URL="file:./prisma/dev.db" \
  DATABASE_URL="postgresql://spywatcher:password@localhost:5432/spywatcher" \
  npm run db:migrate
```

The migration script will:
- Convert integer IDs to UUIDs
- Transform comma-separated strings to arrays
- Batch process large datasets (1000 records at a time)
- Provide progress updates
- Generate a summary report

#### Step 5: Setup Full-Text Search (Optional)

```bash
# Enable full-text search on message content
DB_PASSWORD=password npm run db:fulltext
```

#### Step 6: Verify Migration

```bash
# Check row counts
DATABASE_URL="postgresql://spywatcher:password@localhost:5432/spywatcher" \
  npx prisma studio
```

Compare counts with your original SQLite database to ensure all data was migrated.

### Option 2: Start Fresh (For Development/Testing)

If your existing data is test data or not critical:

If your existing data is test data or not critical:

1. Backup your existing data (optional):
   ```bash
   cp backend/prisma/dev.db backend/prisma/dev.db.backup
   ```

2. Start with Docker:
   ```bash
   docker-compose -f docker-compose.dev.yml up
   ```

3. Your data will be in the new PostgreSQL database (empty initially).

### Option 3: Manual Migration (Advanced Users)

If you need more control over the migration process:

#### Step 1: Export SQLite Data

```bash
cd backend

# Export data to SQL format
sqlite3 prisma/dev.db .dump > sqlite_export.sql

# Or use Prisma Studio to export data manually
npx prisma studio
```

#### Step 2: Transform and Import to PostgreSQL

1. Start PostgreSQL with Docker:
   ```bash
   docker-compose -f docker-compose.dev.yml up postgres -d
   ```

2. Run migrations on PostgreSQL:
   ```bash
   docker-compose -f docker-compose.dev.yml exec postgres psql -U spywatcher -d spywatcher
   ```

3. Transform SQLite SQL to PostgreSQL format:
   
   SQLite and PostgreSQL have syntax differences. You'll need to:
   - Remove SQLite-specific syntax
   - Adjust data types
   - Handle AUTOINCREMENT → SERIAL/BIGSERIAL conversions
   - Fix boolean values (0/1 → false/true)

4. Import the transformed data:
   ```bash
   docker-compose -f docker-compose.dev.yml exec -T postgres psql -U spywatcher -d spywatcher < postgres_import.sql
   ```

#### Step 3: Verify Data

```bash
# Connect to PostgreSQL
docker-compose -f docker-compose.dev.yml exec postgres psql -U spywatcher -d spywatcher

# Check tables
\dt

# Verify data
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "PresenceEvent";
# ... check other tables
```

### Option 4: Using pgloader (Alternative Automated Tool)

For automated migration, you can use tools like:

#### pgloader (Recommended)

```bash
# Install pgloader (if not using Docker)
# Ubuntu/Debian: apt-get install pgloader
# macOS: brew install pgloader

# Create migration config
cat > migrate.load <<EOF
LOAD DATABASE
     FROM sqlite://backend/prisma/dev.db
     INTO postgresql://spywatcher:password@localhost:5432/spywatcher

WITH include drop, create tables, create indexes, reset sequences

SET work_mem to '16MB', maintenance_work_mem to '512 MB';
EOF

# Run migration
pgloader migrate.load
```

## Schema Changes

The schema has been significantly enhanced for PostgreSQL:

### Event Models (Breaking Changes)
All event models have been updated with PostgreSQL-specific features:

#### ID Fields
- **Before**: `id Int @id @default(autoincrement())`
- **After**: `id String @id @default(uuid())`
- **Impact**: IDs are now UUIDs instead of sequential integers

#### Array Fields
- **PresenceEvent.clients**: 
  - Before: `String` (comma-separated: "desktop,web")
  - After: `String[]` (array: ["desktop", "web"])
- **RoleChangeEvent.addedRoles**:
  - Before: `String` (comma-separated role IDs)
  - After: `String[]` (array of role IDs)

#### Metadata Fields
All event models now include:
```prisma
metadata Json? @db.JsonB
```

#### Timestamp Fields
- **Before**: `createdAt DateTime @default(now())`
- **After**: `createdAt DateTime @default(now()) @db.Timestamptz`
- **Impact**: Timezone-aware timestamps

### Guild Model
- **SQLite**: `permissions Int`
- **PostgreSQL**: `permissions BigInt`
- **Reason**: Discord permission values can exceed 32-bit integer limits

### User and Security Models
- All timestamps upgraded to `@db.Timestamptz`
- All JSON fields upgraded to `@db.JsonB`
- Additional indexes added for performance

### Full-Text Search
MessageEvent now supports full-text search via:
- Generated `content_search` tsvector column
- GIN index for efficient searches
- Setup via `npm run db:fulltext`

## Post-Migration Steps

After migrating from SQLite to PostgreSQL:

### 1. Update Application Code

If your code directly accesses ID fields as integers, update to handle UUIDs:

```typescript
// Before
const event = await db.presenceEvent.findUnique({
  where: { id: 123 }
});

// After
const event = await db.presenceEvent.findUnique({
  where: { id: "550e8400-e29b-41d4-a716-446655440000" }
});
```

### 2. Update Array Field Handling

```typescript
// Before (comma-separated string)
const clients = event.clients.split(',');

// After (native array)
const clients = event.clients; // Already an array
```

### 3. Update Metadata Usage

```typescript
// Store flexible data in metadata
await db.presenceEvent.create({
  data: {
    userId: "123",
    username: "user",
    clients: ["desktop", "mobile"],
    metadata: {
      status: "online",
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

### 4. Setup Full-Text Search

If you want to search message content:

```bash
DB_PASSWORD=yourpassword npm run db:fulltext
```

### 5. Optimize Connection Pooling

Update your DATABASE_URL to include pooling parameters:

```bash
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=20"
```

### 6. Setup Automated Backups

Configure automated backups with cron:

```bash
# Daily backups at 2 AM
0 2 * * * DB_PASSWORD=yourpassword /path/to/scripts/backup.sh >> /var/log/spywatcher-backup.log 2>&1
```

### 7. Schedule Maintenance

Run routine maintenance weekly:

```bash
# Weekly maintenance on Sundays at 3 AM
0 3 * * 0 DB_PASSWORD=yourpassword /path/to/scripts/maintenance.sh >> /var/log/spywatcher-maintenance.log 2>&1
```

## Switching Between SQLite and PostgreSQL

> **Note**: Due to significant schema differences (UUIDs vs integers, arrays vs strings), switching back to SQLite after migrating to PostgreSQL is not recommended. The schemas are no longer compatible.

### For New Development: Use PostgreSQL

Always use PostgreSQL for new development to match production:

```bash
# Start PostgreSQL with Docker
docker-compose -f docker-compose.dev.yml up

# Your DATABASE_URL should be:
DATABASE_URL="postgresql://spywatcher:password@localhost:5432/spywatcher"
```

The current schema is already configured for PostgreSQL and includes all the enhancements.

## Production Deployment

For production deployment with PostgreSQL:

### 1. Set up PostgreSQL Database

Use a managed PostgreSQL service:
- AWS RDS
- Google Cloud SQL
- Azure Database for PostgreSQL
- DigitalOcean Managed Databases
- Heroku Postgres

Or self-host with proper backup and replication.

### 2. Configure Environment Variables

```env
# Production DATABASE_URL with SSL and connection pooling
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require&connection_limit=50&pool_timeout=20&connect_timeout=10"

# Other required variables
DB_PASSWORD=your_secure_password
NODE_ENV=production
```

### 3. Deploy and Run Migrations

```bash
# Using Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Migrations run automatically via the migrate service
# Or run manually:
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### 4. Setup Full-Text Search

```bash
docker-compose -f docker-compose.prod.yml exec backend sh -c "DB_PASSWORD=$DB_PASSWORD npm run db:fulltext"
```

### 5. Setup Automated Backups

Configure automated backups:

```bash
# Add to crontab on backup server
0 2 * * * DB_PASSWORD=$DB_PASSWORD DB_HOST=prod-db.example.com S3_BUCKET=my-backups /path/to/scripts/backup.sh
```

### 6. Monitor and Maintain

```bash
# Check database health
docker-compose -f docker-compose.prod.yml exec backend sh -c "DB_PASSWORD=$DB_PASSWORD npm run db:maintenance"
```

### 7. Verify Deployment

```bash
# Check tables exist
docker-compose -f docker-compose.prod.yml exec postgres psql -U spywatcher -d spywatcher -c "\dt"

# Check sample data
docker-compose -f docker-compose.prod.yml exec backend npx prisma studio
```

## Troubleshooting

### Connection Issues

**Problem**: Cannot connect to PostgreSQL
```
Error: P1001: Can't reach database server at `postgres:5432`
```

**Solution**: 
- Ensure PostgreSQL container is running: `docker-compose -f docker-compose.dev.yml ps`
- Check network connectivity between containers
- Verify DATABASE_URL is correct

### Migration Failures

**Problem**: Migration fails with schema mismatch
```
Error: P3009: migrate found failed migrations
```

**Solution**:
```bash
# Reset migrations (WARNING: This will delete all data)
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate reset

# Or mark migrations as applied
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate resolve --applied "migration_name"
```

### Permission Errors

**Problem**: Permission denied for PostgreSQL
```
Error: FATAL: password authentication failed for user "spywatcher"
```

**Solution**:
- Check DB_PASSWORD in `.env` matches PostgreSQL configuration
- Recreate PostgreSQL container with correct credentials:
  ```bash
  docker-compose -f docker-compose.dev.yml down -v
  docker-compose -f docker-compose.dev.yml up postgres -d
  ```

### Data Type Issues

**Problem**: UUID type errors
```
Type 'number' is not assignable to type 'string'
```

**Solution**:
Update code to handle UUID strings instead of integers:
```typescript
// Use UUID strings
const id = "550e8400-e29b-41d4-a716-446655440000";

// Generate new UUIDs
import { randomUUID } from 'crypto';
const newId = randomUUID();
```

**Problem**: Array field errors
```
Cannot read property 'split' of undefined
```

**Solution**:
Update code to handle native arrays:
```typescript
// Before
const clients = event.clients.split(',');

// After
const clients = event.clients; // Already an array
```

**Problem**: BigInt serialization errors in JavaScript
```
Do not know how to serialize a BigInt
```

**Solution**:
Add BigInt serialization support in your code:
```javascript
BigInt.prototype.toJSON = function() {
  return this.toString();
};
```

## Best Practices

1. **Always backup before migration**: Create backups of your SQLite database before attempting migration
2. **Test migrations**: Test the migration process in a development environment first (use DRY_RUN=true)
3. **Verify data integrity**: After migration, verify row counts and sample data in all tables
4. **Use connection pooling**: Configure appropriate connection limits in DATABASE_URL
5. **Enable full-text search**: Run `npm run db:fulltext` for message search capabilities
6. **Setup automated backups**: Configure daily backups with the provided scripts
7. **Schedule maintenance**: Run weekly VACUUM and ANALYZE operations
8. **Monitor performance**: Use the maintenance script to track slow queries and index usage
9. **Update application code**: Handle UUIDs, arrays, and timezone-aware timestamps properly
10. **Use SSL in production**: Always enable SSL/TLS for production databases

## Available Scripts and Tools

### Migration and Setup
- `npm run db:migrate` - Migrate data from SQLite to PostgreSQL
- `npm run db:migrate:dry` - Test migration without writing data
- `npm run db:fulltext` - Setup full-text search on messages

### Backup and Recovery
- `npm run db:backup` - Create compressed database backup
- `npm run db:restore <file>` - Restore from backup file

### Maintenance
- `npm run db:maintenance` - Run routine maintenance tasks
- `npx prisma studio` - Open visual database browser
- `npx prisma migrate deploy` - Apply pending migrations

## Additional Resources

- **PostgreSQL Features**: See [POSTGRESQL.md](./POSTGRESQL.md) for complete PostgreSQL documentation
- **Script Documentation**: See [scripts/README.md](./scripts/README.md) for detailed script usage
- **Docker Guide**: See [DOCKER.md](./DOCKER.md) for Docker-specific setup
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **Prisma PostgreSQL Guide**: https://www.prisma.io/docs/concepts/database-connectors/postgresql
- **PostgreSQL Performance Tuning**: https://wiki.postgresql.org/wiki/Performance_Optimization
5. **Update application code**: Ensure your application properly handles BigInt types for Discord permissions

## Support

For issues or questions about database migration:
- Check this guide and [POSTGRESQL.md](./POSTGRESQL.md)
- Review script documentation in [scripts/README.md](./scripts/README.md)
- Check [DOCKER.md](./DOCKER.md) for Docker-specific troubleshooting
- Review [Prisma Migration Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- Open an issue on GitHub with:
  - Migration script output
  - Error messages
  - Database versions (SQLite and PostgreSQL)
  - Row counts before and after migration

## Migration Checklist

Use this checklist to ensure a successful migration:

- [ ] Backup existing SQLite database
- [ ] Start PostgreSQL container
- [ ] Apply schema migrations (`npx prisma migrate deploy`)
- [ ] Run dry-run migration (`npm run db:migrate:dry`)
- [ ] Review dry-run output
- [ ] Run actual migration (`npm run db:migrate`)
- [ ] Verify row counts match
- [ ] Setup full-text search (`npm run db:fulltext`)
- [ ] Update application code for new data types
- [ ] Test application thoroughly
- [ ] Configure connection pooling
- [ ] Setup automated backups
- [ ] Schedule maintenance tasks
- [ ] Monitor database performance
- [ ] Document any issues or customizations
- [ ] Backup PostgreSQL database
