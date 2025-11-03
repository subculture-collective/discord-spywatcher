# Backup Procedures

Complete guide to data backup procedures, strategies, and best practices for Spywatcher.

## Overview

Spywatcher implements comprehensive backup procedures:

- **Automated Backups**: Daily full backups, 6-hour incremental
- **WAL Archiving**: Point-in-time recovery (PITR)
- **Encrypted Backups**: GPG encryption for security
- **Multi-Region Storage**: Primary and secondary S3 buckets
- **Backup Monitoring**: Health checks and alerting

See [BACKUP.md](/BACKUP.md) and [DISASTER_RECOVERY.md](/DISASTER_RECOVERY.md) for complete documentation.

## Backup Strategy

### Backup Types

**Full Backup:**
```yaml
Frequency: Daily at 2 AM UTC
Method: pg_dump with custom format
Compression: gzip
Encryption: GPG
Retention: 30 days
Storage: S3 primary + secondary
```

**Incremental Backup:**
```yaml
Frequency: Every 6 hours
Method: WAL archiving
Compression: lz4
Encryption: Yes
Retention: 7 days
Recovery: Point-in-time
```

**On-Demand Backup:**
```yaml
Trigger: Manual via admin panel or CLI
Use Cases:
  - Before major updates
  - Before schema changes
  - Before data migrations
  - Compliance requirements
```

### Backup Schedule

**Default Schedule:**
```
00:00 UTC - Incremental (WAL archive)
02:00 UTC - Full backup + Health check
06:00 UTC - Incremental (WAL archive)
12:00 UTC - Incremental (WAL archive)
18:00 UTC - Incremental (WAL archive) + Health check
```

**Configuration:**
```bash
# Backup Schedule (cron format)
BACKUP_SCHEDULE="0 2 * * *"  # Daily at 2 AM
WAL_ARCHIVE_SCHEDULE="0 */6 * * *"  # Every 6 hours
HEALTH_CHECK_SCHEDULE="0 */6 * * *"  # Every 6 hours
```

## Manual Backups

### Via Admin Panel

**Admin Panel** → **Operations** → **Backup** → **Create Backup**

**Backup Options:**
```yaml
Backup Type: Full / Incremental
Description: Pre-update backup for v1.3.0
Notify on Completion: Yes
Upload to S3: Yes
Keep Local Copy: Yes (7 days)
```

**Backup Progress:**
```
Status: In Progress
Started: 2024-11-03 14:30:00 UTC
Progress: 67% (1.2 GB / 1.8 GB)
Estimated Time Remaining: 2 minutes
```

### Via CLI

**Create Manual Backup:**
```bash
# Full backup
cd backend
npm run db:backup

# With custom options
export BACKUP_DIR="/mnt/backups"
export S3_BUCKET="my-backup-bucket"
export ENABLE_ENCRYPTION="true"
cd scripts
./backup.sh
```

**Backup Script Options:**
```bash
# Environment variables
BACKUP_DIR="/path/to/backups"
BACKUP_TYPE="FULL"  # FULL or INCREMENTAL
ENABLE_ENCRYPTION="true"
GPG_RECIPIENT="backups@example.com"
S3_BUCKET="spywatcher-backups"
S3_BUCKET_SECONDARY="spywatcher-backups-replica"
KEEP_LOCAL_DAYS=7
```

### Via API

**Trigger Backup via API:**
```bash
POST /api/admin/backups
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

{
  "type": "FULL",
  "description": "Pre-deployment backup",
  "notify": true,
  "uploadToS3": true
}

Response:
{
  "backupId": "backup_20241103_143000",
  "status": "STARTED",
  "estimatedDuration": 300
}
```

## Backup Storage

### Local Storage

**Local Backup Location:**
```bash
# Default backup directory
/var/backups/spywatcher/

# Directory structure
/var/backups/spywatcher/
├── full/
│   ├── backup_20241103_020000.sql.gz.gpg
│   ├── backup_20241102_020000.sql.gz.gpg
│   └── backup_20241101_020000.sql.gz.gpg
├── incremental/
│   ├── 000000010000000000000001.gz
│   ├── 000000010000000000000002.gz
│   └── ...
└── logs/
    ├── backup_20241103.log
    └── backup_20241102.log
```

**Local Retention:**
```yaml
Full Backups: 7 days locally, 30 days in S3
Incremental: 3 days locally, 7 days in S3
Logs: 30 days
```

### S3 Storage

**S3 Configuration:**
```yaml
Primary Bucket:
  Name: spywatcher-backups
  Region: us-east-1
  Path: production/backups/
  Encryption: AES-256
  Versioning: Enabled
  
Secondary Bucket:
  Name: spywatcher-backups-replica
  Region: us-west-2
  Replication: Cross-region
  
Lifecycle Policies:
  - Transition to Glacier: After 30 days
  - Delete: After 90 days
```

**Environment Configuration:**
```bash
S3_ENABLED=true
S3_BUCKET=spywatcher-backups
S3_REGION=us-east-1
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key
S3_BUCKET_SECONDARY=spywatcher-backups-replica
```

## Backup Encryption

### GPG Encryption

**Configure GPG:**
```bash
# Generate GPG key for backups
gpg --gen-key

# Export public key
gpg --armor --export backups@example.com > backup-public.key

# Import on backup server
gpg --import backup-public.key

# Set recipient in environment
export GPG_RECIPIENT="backups@example.com"
```

**Encrypted Backup Example:**
```bash
# Backup with encryption
pg_dump spywatcher | gzip | gpg --encrypt --recipient backups@example.com > backup.sql.gz.gpg

# Decrypt backup
gpg --decrypt backup.sql.gz.gpg | gunzip > backup.sql
```

## WAL Archiving

### Point-in-Time Recovery Setup

**Enable WAL Archiving:**
```bash
# PostgreSQL configuration
# Edit postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /var/lib/postgresql/wal_archive/%f && cp %p /var/lib/postgresql/wal_archive/%f'
archive_timeout = 300  # 5 minutes
```

**Setup WAL Archive Script:**
```bash
cd scripts
./setup-wal-archiving.sh

# Configure archive location
export WAL_ARCHIVE_DIR="/var/lib/postgresql/wal_archive"
export WAL_ARCHIVE_S3_BUCKET="spywatcher-wal-archive"
```

**WAL Archive Benefits:**
- Point-in-time recovery (restore to any moment)
- Continuous backup (5-minute intervals)
- Minimal data loss (RPO < 5 minutes)
- Fast recovery (RTO < 1 hour)

See [DISASTER_RECOVERY.md](/DISASTER_RECOVERY.md) for PITR procedures.

## Backup Verification

### Automated Verification

**Backup Health Checks:**
```yaml
Health Check Schedule: Every 6 hours

Checks Performed:
  ✅ Backup file exists
  ✅ File size reasonable (>10MB)
  ✅ File not corrupted
  ✅ Encryption valid
  ✅ S3 upload successful
  ✅ Age < 24 hours
  
On Failure:
  - Alert admin team
  - Log error details
  - Retry backup
  - Update status dashboard
```

**Manual Verification:**
```bash
# Via admin panel
Admin Panel → Operations → Backups → Verify Latest

# Via CLI
cd backend
npm run backup:health-check

# Via script
cd scripts
./verify-backup.sh backup_20241103_020000.sql.gz.gpg
```

### Test Restore

**Regular Test Restores:**
```yaml
Frequency: Monthly
Process:
  1. Restore to test environment
  2. Verify data integrity
  3. Check application functionality
  4. Document results
  5. Update procedures if needed
```

**Test Restore Procedure:**
```bash
# 1. Download backup
aws s3 cp s3://spywatcher-backups/backup_latest.sql.gz.gpg .

# 2. Decrypt
gpg --decrypt backup_latest.sql.gz.gpg > backup.sql.gz

# 3. Decompress
gunzip backup.sql.gz

# 4. Restore to test database
psql -U postgres -d spywatcher_test < backup.sql

# 5. Verify
psql -U postgres -d spywatcher_test -c "SELECT COUNT(*) FROM users;"
```

## Backup Monitoring

### Monitoring Dashboard

**Admin Panel** → **Monitoring** → **Backups**

**Dashboard Metrics:**
```yaml
Backup Status:
  Last Successful: 2024-11-03 02:00:00 UTC (12 hours ago)
  Next Scheduled: 2024-11-04 02:00:00 UTC (in 12 hours)
  Success Rate (30d): 100%
  
Storage:
  Local: 15.3 GB (7 days)
  S3 Primary: 127.5 GB (30 days)
  S3 Secondary: 127.5 GB (synced)
  
Recent Backups:
  ✅ 2024-11-03 02:00 - 1.8 GB - Success
  ✅ 2024-11-02 02:00 - 1.7 GB - Success
  ✅ 2024-11-01 02:00 - 1.7 GB - Success
```

### Backup Alerts

**Alert Configuration:**

**Backup Failed:**
```yaml
Alert: Backup Failed
Trigger: Backup job fails
Severity: CRITICAL
Notification:
  - Email: admin team
  - SMS: On-call engineer
  - Slack: #alerts
Action: Retry immediately
```

**Backup Delayed:**
```yaml
Alert: Backup Overdue
Trigger: No backup in 25 hours
Severity: HIGH
Notification:
  - Email: admin team
  - Slack: #alerts
Action: Investigate and run manual backup
```

**Storage Warning:**
```yaml
Alert: Low Backup Storage
Trigger: Local storage >85% full
Severity: WARNING
Notification: Email admin team
Action: Clean up old backups, increase storage
```

## Best Practices

### Backup Best Practices

✅ **Do:**
- Automate all backups
- Test restores regularly (monthly minimum)
- Encrypt all backups
- Store backups off-site
- Monitor backup success/failure
- Document backup procedures
- Verify backup integrity
- Keep multiple backup generations
- Use point-in-time recovery
- Have rollback procedures

❌ **Don't:**
- Rely on single backup location
- Skip backup testing
- Store backups on same server
- Forget to monitor backups
- Use unencrypted backups
- Delete backups prematurely
- Ignore backup failures
- Skip documentation
- Assume backups work without testing

### 3-2-1 Backup Rule

**Follow the 3-2-1 rule:**
```
3 - Keep 3 copies of data
2 - On 2 different media types
1 - With 1 copy off-site

Implementation:
✅ Primary database (production server)
✅ Local backups (server disk)
✅ S3 primary (cloud storage)
✅ S3 secondary (different region)
```

## Troubleshooting

### Backup Fails

**Symptoms:**
- Backup job fails to complete
- Error in backup logs
- Backup file not created

**Solutions:**
1. Check disk space availability
2. Verify database is accessible
3. Check backup script permissions
4. Review error logs
5. Verify encryption keys
6. Check S3 credentials
7. Run manual backup to identify issue

### Cannot Decrypt Backup

**Symptoms:**
- GPG decryption fails
- "No secret key" error
- Corrupted backup file

**Solutions:**
1. Verify GPG private key is available
2. Check key hasn't expired
3. Verify backup file integrity
4. Check file permissions
5. Try different backup file
6. Restore GPG key from backup
7. Contact admin with key access

### S3 Upload Fails

**Symptoms:**
- Backup created locally but not in S3
- S3 upload timeout
- Authentication errors

**Solutions:**
1. Verify S3 credentials
2. Check network connectivity
3. Verify bucket exists and accessible
4. Check bucket permissions
5. Review S3 rate limits
6. Check file size limits
7. Try manual S3 upload

## Related Documentation

- [Restore Procedures](./restore) - Backup restoration
- [Disaster Recovery](/DISASTER_RECOVERY.md) - DR procedures
- [Monitoring](./monitoring) - System monitoring
- [Maintenance](./maintenance) - System maintenance
- [BACKUP.md](/BACKUP.md) - Technical backup details

---

::: tip Need Help?
For additional support, check the [troubleshooting guide](/guide/troubleshooting) or open an issue on [GitHub](https://github.com/subculture-collective/discord-spywatcher/issues).
:::
