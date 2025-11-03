# Restore Procedures

Complete guide to restoring Spywatcher from backups, including disaster recovery procedures.

## Overview

Restore procedures cover:

- **Full Database Restore**: Complete database restoration
- **Point-in-Time Recovery (PITR)**: Restore to specific moment
- **Partial Restore**: Restore specific data
- **Disaster Recovery**: Complete system recovery
- **Rollback**: Undo recent changes

See [DISASTER_RECOVERY.md](/DISASTER_RECOVERY.md) for complete disaster recovery documentation.

## Recovery Objectives

**RTO (Recovery Time Objective)**: < 4 hours
**RPO (Recovery Point Objective)**: < 1 hour

```yaml
Recovery Scenarios:
  Full System Failure: 2-4 hours
  Database Corruption: 1-2 hours
  Data Loss: 30 minutes
  Application Error: 15 minutes
```

## Full Database Restore

### Restore from Latest Backup

**Prerequisites:**
- Access to backup files or S3
- GPG private key for decryption
- Database admin credentials
- Downtime window scheduled

**Restore Steps:**

**1. Download Backup:**
```bash
# From S3
aws s3 cp s3://spywatcher-backups/production/backups/backup_latest.sql.gz.gpg .

# Or use specific backup
aws s3 cp s3://spywatcher-backups/production/backups/backup_20241103_020000.sql.gz.gpg .
```

**2. Decrypt Backup:**
```bash
# Decrypt using GPG
gpg --decrypt backup_20241103_020000.sql.gz.gpg > backup.sql.gz

# Verify decryption
file backup.sql.gz
# Output: backup.sql.gz: gzip compressed data
```

**3. Decompress Backup:**
```bash
# Decompress
gunzip backup.sql.gz

# Verify
file backup.sql
# Output: backup.sql: ASCII text
```

**4. Stop Application:**
```bash
# Stop backend services
sudo systemctl stop spywatcher-bot
sudo systemctl stop spywatcher-api

# Or via Docker
docker-compose down
```

**5. Restore Database:**
```bash
# Drop existing database (CAUTION!)
psql -U postgres -c "DROP DATABASE IF EXISTS spywatcher;"

# Create new database
psql -U postgres -c "CREATE DATABASE spywatcher;"

# Restore from backup
psql -U postgres -d spywatcher < backup.sql

# Verify restoration
psql -U postgres -d spywatcher -c "SELECT COUNT(*) FROM users;"
```

**6. Restart Application:**
```bash
# Restart services
sudo systemctl start spywatcher-bot
sudo systemctl start spywatcher-api

# Or via Docker
docker-compose up -d

# Verify services
sudo systemctl status spywatcher-api
```

**7. Verify Restoration:**
```bash
# Check health endpoint
curl http://localhost:3001/health

# Check database connectivity
psql -U postgres -d spywatcher -c "SELECT version();"

# Test application
# - Login to dashboard
# - Check data appears correct
# - Test key functionality
```

### Restore via Admin Panel

**Admin Panel** → **Operations** → **Restore** → **Full Restore**

**Restore Wizard:**
```yaml
Step 1: Select Backup
  - Latest backup: 2024-11-03 02:00 (1.8 GB)
  - Previous backup: 2024-11-02 02:00 (1.7 GB)
  - Custom: Select from S3

Step 2: Confirm Downtime
  ⚠️ Warning: Application will be unavailable during restore
  Estimated Duration: 15-30 minutes
  Notify Users: Yes / No
  
Step 3: Verification
  - Backup checksum verified ✅
  - Encryption valid ✅
  - Space available ✅
  
Step 4: Restore
  [Start Restore]
```

### Restore via CLI

**Quick Restore Command:**
```bash
cd backend
npm run db:restore

# With specific backup
npm run db:restore -- --backup=backup_20241103_020000.sql.gz.gpg

# With options
npm run db:restore -- \
  --backup=backup_latest.sql.gz.gpg \
  --no-stop-services \
  --verify
```

## Point-in-Time Recovery (PITR)

### Restore to Specific Time

Use WAL archiving for PITR:

**Prerequisites:**
- WAL archiving enabled
- Base backup available
- WAL files available

**PITR Steps:**

**1. Stop PostgreSQL:**
```bash
sudo systemctl stop postgresql
```

**2. Backup Current Data (safety):**
```bash
sudo mv /var/lib/postgresql/14/main /var/lib/postgresql/14/main.backup
```

**3. Restore Base Backup:**
```bash
# Extract base backup
sudo mkdir /var/lib/postgresql/14/main
sudo tar -xzf base_backup_20241103.tar.gz -C /var/lib/postgresql/14/main
```

**4. Configure Recovery:**
```bash
# Create recovery.conf (PostgreSQL 11) or recovery.signal (PostgreSQL 12+)
sudo -u postgres bash -c 'cat > /var/lib/postgresql/14/main/recovery.conf << EOF
restore_command = '\''cp /var/lib/postgresql/wal_archive/%f %p'\''
recovery_target_time = '\''2024-11-03 14:30:00 UTC'\''
recovery_target_action = '\''promote'\''
EOF'
```

**5. Start PostgreSQL:**
```bash
sudo systemctl start postgresql

# Monitor recovery
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

**6. Verify Recovery:**
```bash
# Check recovery completed
psql -U postgres -d spywatcher -c "SELECT pg_is_in_recovery();"
# Should return: f (false = recovery complete)

# Verify data at target time
psql -U postgres -d spywatcher -c "SELECT * FROM users WHERE created_at <= '2024-11-03 14:30:00';"
```

See [DISASTER_RECOVERY.md](/DISASTER_RECOVERY.md) for detailed PITR procedures.

## Partial Restore

### Restore Single Table

**Export from Backup:**
```bash
# Extract specific table
pg_restore -U postgres -d temp_restore -t users backup.sql

# Export table data
pg_dump -U postgres -d temp_restore -t users --data-only > users_data.sql

# Import to production
psql -U postgres -d spywatcher < users_data.sql
```

### Restore Specific Data

**Restore User Data:**
```sql
-- Create temp table from backup
CREATE TABLE users_backup AS SELECT * FROM users;

-- Restore specific user
INSERT INTO users 
SELECT * FROM users_backup 
WHERE discord_id = '123456789012345678';

-- Verify
SELECT * FROM users WHERE discord_id = '123456789012345678';
```

## Disaster Recovery Scenarios

### Complete System Failure

**Recovery Steps:**

**1. Assess Damage:**
- Identify failed components
- Determine data loss extent
- Estimate recovery time

**2. Provision New Infrastructure:**
```bash
# Using Terraform
cd terraform
terraform apply -var-file="environments/production/terraform.tfvars"

# Or manually provision:
# - EC2 instances
# - RDS database
# - ElastiCache Redis
# - Load balancers
```

**3. Restore Application:**
```bash
# Clone repository
git clone https://github.com/subculture-collective/discord-spywatcher.git
cd discord-spywatcher

# Configure environment
cp .env.example .env
# Edit .env with production values

# Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
```

**4. Restore Database:**
```bash
# Follow full database restore procedure
# (See "Full Database Restore" section above)
```

**5. Restore Configuration:**
```bash
# Restore environment variables
# Restore secrets from secrets manager
# Configure integrations
```

**6. Start Services:**
```bash
# Via Docker
docker-compose -f docker-compose.prod.yml up -d

# Or via systemd
sudo systemctl start spywatcher-bot
sudo systemctl start spywatcher-api
```

**7. Verify System:**
```bash
# Health checks
curl https://api.spywatcher.com/health
curl https://app.spywatcher.com/

# Test functionality
# - User login
# - Data display
# - Bot connectivity
# - API endpoints
```

**8. Update DNS:**
```bash
# Update DNS to point to new infrastructure
# Wait for DNS propagation (5-60 minutes)
```

**9. Monitor:**
```bash
# Monitor logs
tail -f /var/log/spywatcher/*.log

# Monitor metrics
# Check Grafana dashboards
# Watch Sentry for errors
```

**10. Notify Users:**
```
# Send status update
# - Incident resolved
# - Services restored
# - Any data loss
# - Next steps
```

### Database Corruption

**Recovery Steps:**

**1. Stop Writing:**
```bash
# Stop application immediately
sudo systemctl stop spywatcher-bot
sudo systemctl stop spywatcher-api
```

**2. Assess Corruption:**
```bash
# Check database integrity
psql -U postgres -d spywatcher

# Run integrity checks
VACUUM ANALYZE;
REINDEX DATABASE spywatcher;
```

**3. Restore from Backup:**
```bash
# If corruption severe, restore from backup
# Follow full database restore procedure
```

**4. Verify Data:**
```bash
# Check critical tables
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM guild_members;
SELECT COUNT(*) FROM presences;
```

## Rollback Procedures

### Rollback Recent Changes

**Application Rollback:**
```bash
# Via Git
git checkout previous-stable-tag
npm install
npm run build
pm2 restart all

# Via Docker
docker-compose down
docker-compose pull previous-version
docker-compose up -d
```

**Database Rollback:**
```bash
# Rollback migrations
cd backend
npx prisma migrate rollback

# Or restore from backup before change
# (Follow full database restore)
```

**Configuration Rollback:**
```bash
# Restore previous .env
cp .env.backup .env

# Restart services
sudo systemctl restart spywatcher-api
```

## Validation Procedures

### Post-Restore Validation

**Checklist:**
```yaml
✅ Database:
  - Users table has expected count
  - Guilds table populated
  - Recent data present
  - Indexes intact
  - Constraints valid

✅ Application:
  - Services running
  - Health checks passing
  - Bot connected to Discord
  - API responding
  - Dashboard accessible

✅ Data Integrity:
  - Sample user data correct
  - Analytics data present
  - Settings preserved
  - API keys valid
  - Permissions intact

✅ Functionality:
  - User login works
  - Guild selection works
  - Analytics load
  - API endpoints respond
  - Real-time updates work

✅ Performance:
  - Response times normal
  - Database queries fast
  - No error spikes
  - Resource usage normal
```

**Validation Script:**
```bash
#!/bin/bash
# Post-restore validation

echo "Validating database..."
psql -U postgres -d spywatcher -c "SELECT COUNT(*) FROM users;" || exit 1

echo "Checking services..."
systemctl is-active spywatcher-api || exit 1
systemctl is-active spywatcher-bot || exit 1

echo "Testing API..."
curl -f http://localhost:3001/health || exit 1

echo "Testing authentication..."
curl -f http://localhost:3001/api/health || exit 1

echo "✅ Validation complete!"
```

## Best Practices

### Restore Best Practices

✅ **Do:**
- Test restore procedures regularly
- Document restore steps
- Verify backups before restore
- Take safety backup before restore
- Test in staging first
- Notify stakeholders
- Monitor restoration progress
- Validate after restore
- Document issues encountered
- Update procedures

❌ **Don't:**
- Restore to production without testing
- Skip verification steps
- Rush through restoration
- Forget to stop services first
- Overwrite without backup
- Skip integrity checks
- Ignore errors during restore
- Forget to update DNS
- Skip post-restore validation

## Troubleshooting

### Restore Fails

**Symptoms:**
- psql errors during restore
- "relation already exists" errors
- Incomplete restoration

**Solutions:**
1. Verify backup file integrity
2. Check database is empty or drop first
3. Review error messages in detail
4. Check disk space
5. Verify database credentials
6. Try restoring to test database first
7. Check PostgreSQL logs

### Data Missing After Restore

**Symptoms:**
- Tables empty or incomplete
- Recent data missing
- Inconsistent data

**Solutions:**
1. Verify correct backup was used
2. Check backup date/time
3. Review backup logs
4. Try newer backup
5. Consider PITR if needed
6. Check table structure matches

### Application Won't Start After Restore

**Symptoms:**
- Services fail to start
- Connection errors
- Schema mismatch errors

**Solutions:**
1. Run database migrations
2. Check schema version
3. Verify environment variables
4. Review application logs
5. Check database permissions
6. Rebuild application if needed

## Related Documentation

- [Backup Procedures](./backup) - Backup creation
- [Disaster Recovery](/DISASTER_RECOVERY.md) - DR procedures
- [Monitoring](./monitoring) - System monitoring
- [Maintenance](./maintenance) - Maintenance procedures
- [Incident Response](./incident-response) - Security incidents

---

::: tip Need Help?
For additional support, check the [troubleshooting guide](/guide/troubleshooting) or open an issue on [GitHub](https://github.com/subculture-collective/discord-spywatcher/issues).
:::
