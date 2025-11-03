# Database Migration Safety Guide

This guide establishes safe database migration procedures for production deployments, ensuring zero downtime and data integrity.

## 🎯 Overview

This document covers:

- Migration testing procedures
- Rollback strategies
- Zero-downtime migration techniques
- Data validation checks
- CI/CD integration

## 📋 Migration Testing Procedures

### Pre-Migration Testing

Before applying any migration to production:

#### 1. Test in Isolated Environment

```bash
# Run comprehensive migration tests
DB_PASSWORD=your_password ./scripts/test-migration.sh
```

This script:

- Creates an isolated test database
- Applies pending migrations
- Validates schema integrity
- Tests data consistency
- Verifies rollback procedures
- Cleans up test environment

#### 2. Dry Run Validation

```bash
# Validate migration without applying
cd backend
DATABASE_URL="postgresql://user:pass@host:5432/db" \
  npx prisma migrate deploy --dry-run
```

#### 3. Schema Validation

```bash
# Validate Prisma schema
cd backend
npx prisma validate

# Generate Prisma client
npx prisma generate
```

### Post-Migration Validation

After applying migrations:

```bash
# Run comprehensive validation checks
DB_PASSWORD=your_password ./scripts/validate-migration.sh
```

This validates:

- All required tables exist
- Indexes are properly created
- Foreign key constraints are valid
- Primary keys are in place
- Data types are correct
- No foreign key violations
- Prisma migrations completed successfully

## 🔄 Rollback Strategies

### Automatic Backup Before Migration

Always create a backup before migration:

```bash
# Create backup
DB_PASSWORD=your_password ./scripts/backup.sh

# Backup will be saved to /var/backups/spywatcher/
```

### Rollback Options

#### Option 1: Rollback to Specific Migration

```bash
# List available migrations
DB_PASSWORD=your_password ./scripts/rollback-migration.sh --list

# Rollback to specific migration
DB_PASSWORD=your_password ./scripts/rollback-migration.sh \
  --migration 20250524175155_init
```

This will:

- Create a pre-rollback backup
- Mark subsequent migrations as rolled back
- Provide instructions for schema restoration

#### Option 2: Restore from Backup

```bash
# List available backups
DB_PASSWORD=your_password ./scripts/rollback-migration.sh --list

# Restore from backup
DB_PASSWORD=your_password ./scripts/rollback-migration.sh \
  --backup /var/backups/spywatcher/spywatcher_20250101_020000.sql.gz
```

This will:

- confirm the operation
- terminate active connections
- drop and recreate database
- restore data from backup
- verify restoration

### Rollback Best Practices

1. **Always backup before migration** - Automated in production workflow
2. **Test rollback procedure** - Include in migration testing
3. **Document rollback steps** - For each major migration
4. **Monitor after rollback** - Ensure system stability
5. **Keep recent backups** - Maintain 30 days of backups

## 🚀 Zero-Downtime Migration Techniques

### Strategy 1: Backwards-Compatible Migrations

#### Adding New Columns

```sql
-- ✅ Safe: Add nullable column
ALTER TABLE "User" ADD COLUMN "newField" TEXT;

-- ✅ Safe: Add column with default
ALTER TABLE "User" ADD COLUMN "status" TEXT DEFAULT 'active';
```

#### Making Columns Optional

```sql
-- Phase 1: Make column nullable
ALTER TABLE "User" ALTER COLUMN "oldField" DROP NOT NULL;

-- Phase 2 (after deployment): Remove column
-- ALTER TABLE "User" DROP COLUMN "oldField";
```

### Strategy 2: Multi-Phase Migrations

For breaking changes, use multiple deployments:

#### Phase 1: Add New Schema

```prisma
model User {
  id        String @id
  email     String  // Old field
  emailNew  String? // New field (nullable)
}
```

Deploy with dual writes:

```typescript
// Write to both fields
await prisma.user.create({
    data: {
        email: userEmail,
        emailNew: userEmail,
    },
});
```

#### Phase 2: Migrate Data

```sql
-- Copy data to new field
UPDATE "User" SET "emailNew" = "email" WHERE "emailNew" IS NULL;
```

#### Phase 3: Switch to New Field

```prisma
model User {
  id       String @id
  email    String? // Old field (now nullable)
  emailNew String  // New field (now required)
}
```

Update application to use `emailNew`.

#### Phase 4: Remove Old Field

```prisma
model User {
  id       String @id
  emailNew String @map("email")

  @@map("User")
}
```

### Strategy 3: Blue-Green Deployment

For major schema changes:

1. **Deploy Green Environment** with new schema
2. **Sync Data** from Blue to Green
3. **Test Green Environment** thoroughly
4. **Switch Traffic** to Green
5. **Keep Blue** as fallback for 24-48 hours
6. **Decommission Blue** after validation

### Strategy 4: Shadow Database Testing

Prisma automatically uses shadow databases for testing:

```bash
# Set shadow database URL
export SHADOW_DATABASE_URL="postgresql://user:pass@host:5432/shadow_db"

# Migrations are tested on shadow DB first
npx prisma migrate dev
```

## ✅ Data Validation Checks

### Pre-Migration Validation

```bash
# Validate current schema
DB_PASSWORD=your_password ./scripts/validate-migration.sh
```

### Post-Migration Validation

Automatic checks include:

#### 1. Schema Integrity

- All tables exist
- Correct column types
- Proper indexes
- Valid constraints

#### 2. Data Integrity

- No orphaned foreign keys
- No NULL violations
- No duplicate primary keys
- Consistent data types

#### 3. Migration Status

- All migrations completed
- No failed migrations
- No pending migrations

### Custom Validation Queries

Add to validation script as needed:

```sql
-- Check for data consistency
SELECT COUNT(*) FROM "User" WHERE "discordId" IS NULL;

-- Verify foreign key relationships
SELECT COUNT(*) FROM "Guild" g
LEFT JOIN "User" u ON g."userId" = u.id
WHERE u.id IS NULL;

-- Check for duplicate values
SELECT "discordId", COUNT(*)
FROM "User"
GROUP BY "discordId"
HAVING COUNT(*) > 1;
```

## 🔧 CI/CD Integration

### GitHub Actions Workflow

The migration workflow is integrated into `.github/workflows/backend-ci.yml`:

```yaml
migration-test:
    name: Test Migrations
    runs-on: ubuntu-latest
    services:
        postgres:
            image: postgres:15
            env:
                POSTGRES_PASSWORD: postgres
                POSTGRES_DB: spywatcher_test
            options: >-
                --health-cmd pg_isready
                --health-interval 10s
                --health-timeout 5s
                --health-retries 5

    steps:
        - name: Checkout code
          uses: actions/checkout@v5

        - name: Setup Node.js
          uses: actions/setup-node@v6
          with:
              node-version: '20'
              cache: 'npm'
              cache-dependency-path: backend/package-lock.json

        - name: Install dependencies
          working-directory: backend
          run: npm ci

        - name: Test migrations
          env:
              DB_PASSWORD: postgres
              TEST_DB_NAME: spywatcher_test
          run: ./scripts/test-migration.sh

        - name: Validate schema
          env:
              DATABASE_URL: postgresql://spywatcher:postgres@localhost:5432/spywatcher_test
          working-directory: backend
          run: npx prisma validate
```

### Pre-Deployment Checks

Add to deployment workflow:

```yaml
pre-deploy:
    name: Pre-Deployment Validation
    steps:
        - name: Create backup
          run: |
              DB_PASSWORD=${{ secrets.DB_PASSWORD }} \
              DB_HOST=${{ secrets.DB_HOST }} \
              ./scripts/backup.sh

        - name: Test migration
          run: |
              DB_PASSWORD=${{ secrets.DB_PASSWORD }} \
              ./scripts/test-migration.sh

        - name: Upload backup artifact
          uses: actions/upload-artifact@v4
          with:
              name: pre-migration-backup
              path: /var/backups/spywatcher/
              retention-days: 7
```

### Post-Deployment Checks

```yaml
post-deploy:
    name: Post-Deployment Validation
    needs: deploy
    steps:
        - name: Validate migration
          run: |
              DB_PASSWORD=${{ secrets.DB_PASSWORD }} \
              DB_HOST=${{ secrets.DB_HOST }} \
              ./scripts/validate-migration.sh

        - name: Health check
          run: |
              curl -f https://api.yourdomain.com/health || exit 1

        - name: Rollback on failure
          if: failure()
          run: |
              echo "Migration validation failed, initiating rollback"
              # Restore from backup created in pre-deploy
              DB_PASSWORD=${{ secrets.DB_PASSWORD }} \
              ./scripts/rollback-migration.sh --backup $BACKUP_FILE
```

## 📝 Migration Checklist

Use this checklist for every production migration:

### Pre-Migration

- [ ] Review migration SQL/schema changes
- [ ] Test migration in staging environment
- [ ] Run `./scripts/test-migration.sh`
- [ ] Create production backup
- [ ] Verify backup integrity
- [ ] Document rollback procedure
- [ ] Schedule maintenance window (if needed)
- [ ] Notify team of migration

### During Migration

- [ ] Enable maintenance mode (if needed)
- [ ] Apply migrations: `npx prisma migrate deploy`
- [ ] Monitor application logs
- [ ] Monitor database metrics
- [ ] Watch for errors or warnings

### Post-Migration

- [ ] Run `./scripts/validate-migration.sh`
- [ ] Verify application functionality
- [ ] Check critical user flows
- [ ] Monitor error rates
- [ ] Monitor performance metrics
- [ ] Disable maintenance mode
- [ ] Document any issues
- [ ] Keep backup for 7+ days

### Rollback (if needed)

- [ ] Identify issue quickly
- [ ] Execute rollback procedure
- [ ] Restore from backup
- [ ] Validate rollback
- [ ] Notify team
- [ ] Document lessons learned
- [ ] Plan fix for next attempt

## 🛠️ Available Scripts

### Testing

```bash
# Comprehensive migration testing
DB_PASSWORD=pass ./scripts/test-migration.sh

# Verbose output
VERBOSE=true DB_PASSWORD=pass ./scripts/test-migration.sh
```

### Validation

```bash
# Validate current database state
DB_PASSWORD=pass ./scripts/validate-migration.sh

# Verbose validation
VERBOSE=true DB_PASSWORD=pass ./scripts/validate-migration.sh
```

### Rollback

```bash
# List migrations and backups
DB_PASSWORD=pass ./scripts/rollback-migration.sh --list

# Rollback to specific migration
DB_PASSWORD=pass ./scripts/rollback-migration.sh \
  --migration MIGRATION_NAME

# Restore from backup
DB_PASSWORD=pass ./scripts/rollback-migration.sh \
  --backup /path/to/backup.sql.gz
```

### Backup

```bash
# Create backup
DB_PASSWORD=pass ./scripts/backup.sh

# Create backup and upload to S3
S3_BUCKET=my-bucket DB_PASSWORD=pass ./scripts/backup.sh
```

### Maintenance

```bash
# Run database maintenance
DB_PASSWORD=pass ./scripts/maintenance.sh
```

## 🔒 Security Considerations

1. **Never commit passwords** - Use environment variables
2. **Restrict script permissions** - `chmod 700 scripts/*.sh`
3. **Encrypt backups** - Use encrypted storage
4. **Audit migration access** - Log who runs migrations
5. **Use SSL/TLS** - For database connections
6. **Validate inputs** - In custom migration scripts
7. **Review SQL** - Before applying migrations

## 📊 Monitoring

### Key Metrics to Monitor

During and after migrations:

1. **Application Metrics**
    - Error rate
    - Response time
    - Request throughput
    - Success rate

2. **Database Metrics**
    - Connection count
    - Query latency
    - Lock wait time
    - Transaction rate
    - CPU and memory usage

3. **Migration Metrics**
    - Migration duration
    - Rows affected
    - Rollback frequency
    - Validation pass rate

### Alerting

Set up alerts for:

- Failed migrations
- Schema validation failures
- Data integrity issues
- Performance degradation
- Connection pool exhaustion

## 🆘 Troubleshooting

### Migration Fails to Apply

```bash
# Check migration status
cd backend
npx prisma migrate status

# Mark migration as applied (if already applied manually)
npx prisma migrate resolve --applied MIGRATION_NAME

# Mark migration as rolled back
npx prisma migrate resolve --rolled-back MIGRATION_NAME
```

### Data Validation Failures

```bash
# Run detailed validation
VERBOSE=true DB_PASSWORD=pass ./scripts/validate-migration.sh

# Check specific issues
psql -U user -d db -c "SELECT * FROM _prisma_migrations WHERE finished_at IS NULL;"
```

### Performance Issues After Migration

```bash
# Run maintenance to update statistics
DB_PASSWORD=pass ./scripts/maintenance.sh

# Check for missing indexes
psql -U user -d db -c "
  SELECT schemaname, tablename, attname
  FROM pg_stats
  WHERE schemaname = 'public'
  AND n_distinct > 100
  AND correlation < 0.1;
"
```

## 📚 Additional Resources

- [Prisma Migration Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [PostgreSQL Migration Best Practices](https://www.postgresql.org/docs/current/ddl-alter.html)
- [Zero-Downtime Deployments](https://blog.pragmaticengineer.com/zero-downtime-deployment/)
- [Database Reliability Engineering](https://www.oreilly.com/library/view/database-reliability-engineering/9781491925935/)

## 🤝 Support

For migration issues:

1. Check this guide
2. Review script output and logs
3. Check [MIGRATION.md](./MIGRATION.md) for database-specific guidance
4. Open GitHub issue with:
    - Migration name and SQL
    - Error messages
    - Database version
    - Script output
    - Steps to reproduce
