# Backup & Recovery Guide

Quick reference guide for backup and recovery operations.

## Table of Contents

- [Backup Operations](#backup-operations)
- [Recovery Operations](#recovery-operations)
- [Monitoring](#monitoring)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

## Backup Operations

### Manual Backup

Create a manual backup of the database:

```bash
cd backend
npm run db:backup
```

With custom options:

```bash
# Set environment variables for custom backup
export BACKUP_DIR="/path/to/backups"
export S3_BUCKET="my-backup-bucket"
export S3_BUCKET_SECONDARY="my-backup-bucket-secondary"
export ENABLE_ENCRYPTION="true"
export GPG_RECIPIENT="backups@example.com"

cd scripts
./backup.sh
```

### Automated Backups

Backups are automatically scheduled:

- **Full backups**: Daily at 2 AM UTC
- **Incremental backups**: Every 6 hours (via WAL archiving)
- **Health checks**: Every 6 hours

Configuration is handled by the scheduled tasks system in `src/utils/scheduledTasks.ts`.

### Backup Types

1. **Full Backup** (`BACKUP_TYPE=FULL`)
    - Complete database dump
    - Compressed with gzip
    - Optionally encrypted with GPG
    - Stored in S3 and locally

2. **Incremental Backup** (`BACKUP_TYPE=INCREMENTAL`)
    - WAL (Write-Ahead Log) segments
    - Enables point-in-time recovery
    - Automatically archived every hour

3. **WAL Archive** (`BACKUP_TYPE=WAL_ARCHIVE`)
    - Continuous archiving of transaction logs
    - Required for point-in-time recovery

## Recovery Operations

### Restore from Latest Backup

```bash
cd backend
npm run db:restore
```

This will prompt you to select from available backups.

### Restore from Specific Backup

```bash
cd scripts

# Restore from local file
./restore.sh /var/backups/spywatcher/spywatcher_full_20240125_120000.dump.gz

# Restore from S3
./restore.sh s3://spywatcher-backups/postgres/full/spywatcher_full_20240125_120000.dump.gz

# Restore encrypted backup (will prompt for decryption)
./restore.sh /var/backups/spywatcher/spywatcher_full_20240125_120000.dump.gz.gpg
```

### Point-in-Time Recovery

Restore to a specific point in time (requires WAL archiving):

```bash
cd scripts
./restore.sh <backup_file> "2024-01-25 14:30:00"
```

Example:

```bash
./restore.sh s3://spywatcher-backups/postgres/full/backup.dump.gz "2024-01-25 14:30:00"
```

## Monitoring

### Check Backup Health

```bash
cd backend
npm run backup:health-check
```

Returns:

- Last successful backup time
- Any issues detected
- Overall health status

### View Backup Statistics

```bash
cd backend
npm run backup:stats
```

Returns:

- Total backups
- Success rate
- Average size and duration
- Failed backups count

### List Recent Backups

```bash
cd backend
npm run backup:recent
```

Lists the 10 most recent backups with their status.

### Backup Logs

All backup operations are logged to the database in the `BackupLog` table:

```sql
SELECT * FROM "BackupLog"
ORDER BY "startedAt" DESC
LIMIT 10;
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Backup directory (default: /var/backups/spywatcher)
BACKUP_DIR=/var/backups/spywatcher

# Retention in days (default: 30)
RETENTION_DAYS=30

# Number of monthly backups to keep (default: 12)
RETENTION_MONTHLY=12

# Enable encryption (default: false)
ENABLE_ENCRYPTION=true
GPG_RECIPIENT=backups@example.com

# S3 storage
S3_BUCKET=spywatcher-backups
S3_BUCKET_SECONDARY=spywatcher-backups-us-west
S3_STORAGE_CLASS=STANDARD_IA

# Notifications
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
DISCORD_WEBHOOK=https://discord.com/api/webhooks/YOUR/WEBHOOK/URL
```

### WAL Archiving Setup

Enable WAL archiving for point-in-time recovery:

```bash
cd scripts
sudo ./setup-wal-archiving.sh
```

This will:

1. Configure PostgreSQL for WAL archiving
2. Set up archive command
3. Enable point-in-time recovery

**Note**: Requires restart of PostgreSQL after setup.

### Verify WAL Archiving

```bash
sudo -u postgres psql -c "SELECT * FROM pg_stat_archiver;"
```

Check for:

- `archived_count` increasing over time
- `failed_count` should be 0
- `last_archived_time` should be recent

## Troubleshooting

### Backup Fails

**Check logs:**

```bash
tail -f /var/log/postgresql/postgresql-15-main.log
```

**Common issues:**

1. **Disk space full**

    ```bash
    df -h /var/backups/spywatcher
    ```

2. **Database connection issues**

    ```bash
    psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1;"
    ```

3. **S3 permissions**
    ```bash
    aws s3 ls s3://$S3_BUCKET/
    ```

### Restore Fails

**Common issues:**

1. **File not found**
    - Check backup file path
    - Verify S3 bucket and key
    - Ensure AWS credentials are configured

2. **Decryption fails**
    - Verify GPG key is available
    - Check GPG recipient matches

3. **Database locked**
    - Stop the application first
    - Kill existing connections:
        ```sql
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = 'spywatcher'
          AND pid <> pg_backend_pid();
        ```

### No Recent Backups

**Check scheduled tasks:**

```bash
# Check if scheduled tasks are running
ps aux | grep node | grep scheduledTasks

# Check application logs
tail -f logs/app.log
```

**Manual trigger:**

```bash
cd backend
npm run db:backup
```

### Backup Size Abnormal

**Check database size:**

```sql
SELECT pg_size_pretty(pg_database_size('spywatcher'));
```

**Check for data growth:**

```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### WAL Archiving Not Working

**Check archive status:**

```sql
SELECT * FROM pg_stat_archiver;
```

**Check PostgreSQL config:**

```bash
grep -E "wal_level|archive_mode|archive_command" /etc/postgresql/15/main/postgresql.conf
```

**Check archive directory permissions:**

```bash
ls -la /var/lib/postgresql/wal_archive/
# or for S3
aws s3 ls s3://$S3_BUCKET/wal/
```

## Best Practices

1. **Test Restores Regularly**
    - Monthly restore to test database
    - Quarterly disaster recovery drills
    - Document restore times

2. **Monitor Backup Health**
    - Review backup health check daily
    - Set up alerts for failures
    - Monitor backup size trends

3. **Keep Multiple Copies**
    - Local backups (7 days)
    - Primary S3 bucket (30 days)
    - Secondary S3 bucket in different region

4. **Secure Your Backups**
    - Enable encryption for sensitive data
    - Use strong GPG keys
    - Rotate keys regularly
    - Restrict S3 bucket access

5. **Document Everything**
    - Keep this guide updated
    - Document any custom procedures
    - Maintain contact lists
    - Record drill results

## Emergency Contacts

For disaster recovery situations:

- **Primary On-Call**: Check PagerDuty schedule
- **Database Admin**: db-admin@spywatcher.com
- **DevOps Lead**: devops@spywatcher.com
- **Security Team**: security@spywatcher.com

## Related Documentation

- [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md) - Comprehensive disaster recovery runbook
- [CONNECTION_POOLING.md](./CONNECTION_POOLING.md) - Database connection management
- [POSTGRESQL.md](./POSTGRESQL.md) - PostgreSQL setup and management
- [MONITORING.md](./MONITORING.md) - Monitoring and alerting setup

---

**Last Updated**: 2024-11-02  
**Maintained By**: DevOps Team  
**Next Review**: 2025-02-02
