# Database Migration Guide: SQLite to PostgreSQL

This guide explains how to migrate your Discord Spywatcher database from SQLite to PostgreSQL when switching to Docker.

## Overview

The application now supports PostgreSQL as the primary database for production deployments. This provides better:
- Concurrency handling
- Data integrity
- Scalability
- Production-ready features

## For New Installations

If you're starting fresh with Docker, no migration is needed. Simply:

1. Start the Docker environment:
   ```bash
   docker-compose -f docker-compose.dev.yml up
   ```

2. The PostgreSQL database will be initialized automatically with all migrations.

## For Existing Installations (SQLite → PostgreSQL)

If you have existing data in SQLite and want to migrate to PostgreSQL:

### Option 1: Start Fresh (Recommended for Development)

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

### Option 2: Manual Migration (For Production Data)

If you need to preserve existing SQLite data:

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

### Option 3: Using Migration Tools

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

The main schema change from SQLite to PostgreSQL:

### Guild Model
- **SQLite**: `permissions Int`
- **PostgreSQL**: `permissions BigInt`

This change is necessary because Discord permission values can exceed the maximum value of a 32-bit integer.

### Other Models
All other models remain compatible between SQLite and PostgreSQL.

## Switching Between SQLite and PostgreSQL

### Use SQLite (Local Development Without Docker)

1. Update `backend/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   
   model Guild {
     // ... other fields
     permissions Int  // Use Int for SQLite
     // ... other fields
   }
   ```

2. Update `.env`:
   ```env
   DATABASE_URL="file:./prisma/dev.db"
   ```

3. Generate Prisma Client and migrate:
   ```bash
   cd backend
   npx prisma generate
   npx prisma migrate dev
   ```

### Use PostgreSQL (Docker or Production)

1. Update `backend/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   
   model Guild {
     // ... other fields
     permissions BigInt  // Use BigInt for PostgreSQL
     // ... other fields
   }
   ```

2. Update `.env`:
   ```env
   DATABASE_URL="postgresql://spywatcher:password@localhost:5432/spywatcher"
   ```

3. Generate Prisma Client and migrate:
   ```bash
   cd backend
   npx prisma generate
   npx prisma migrate deploy
   ```

## Production Deployment

For production deployment with PostgreSQL:

1. Set up PostgreSQL database (RDS, Cloud SQL, etc.)

2. Configure environment variables:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
   ```

3. Run migrations:
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
   ```

4. Verify deployment:
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend npx prisma db seed
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
2. **Test migrations**: Test the migration process in a development environment first
3. **Use transactions**: When manually importing data, use transactions to ensure data consistency
4. **Verify data integrity**: After migration, verify row counts and sample data in all tables
5. **Update application code**: Ensure your application properly handles BigInt types for Discord permissions

## Support

For issues or questions about database migration:
- Check the [DOCKER.md](./DOCKER.md) for Docker-specific troubleshooting
- Review [Prisma Migration Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- Open an issue on GitHub with details about your migration problem
