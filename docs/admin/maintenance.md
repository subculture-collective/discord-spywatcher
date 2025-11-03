# Maintenance

Guide to routine maintenance, system updates, and operational procedures for Spywatcher.

## Overview

Regular maintenance includes:
- **System Updates**: Software and dependency updates
- **Database Maintenance**: Vacuuming, reindexing, optimization
- **Performance Optimization**: Query optimization, caching
- **Security Updates**: Patching, credential rotation
- **Cleanup Operations**: Log rotation, old data purging
- **Capacity Planning**: Resource monitoring and scaling

## Maintenance Schedule

### Daily Tasks

**Automated:**
- Backups (2 AM UTC)
- Log rotation
- Temporary file cleanup
- Cache cleanup

**Manual:**
- Review monitoring dashboards
- Check alert status
- Review error logs (if alerts)

### Weekly Tasks

**Every Monday:**
- Review backup integrity
- Check disk space usage
- Review slow query log
- Update security block lists

**Actions:**
```bash
# Check backup status
cd backend && npm run backup:health-check

# Review disk space
df -h

# Check slow queries
tail -100 /var/log/postgresql/slow-query.log

# Update IP block lists
cd scripts && ./update-blocklists.sh
```

### Monthly Tasks

**First Monday:**
- Full system audit
- Review user accounts
- Check for dependency updates
- Review and archive old logs
- Capacity planning review

**Actions:**
```bash
# Check for updates
npm outdated
cd backend && npm outdated
cd frontend && npm outdated

# Review inactive users
psql -c "SELECT COUNT(*) FROM users WHERE last_login < NOW() - INTERVAL '90 days';"

# Archive old logs
cd scripts && ./archive-logs.sh
```

### Quarterly Tasks

**Every 3 months:**
- Major dependency updates
- Security audit
- Disaster recovery test
- Performance optimization
- Documentation review

## System Updates

### Dependency Updates

**Check for Updates:**
```bash
# Check npm packages
npm outdated

# Backend
cd backend && npm outdated

# Frontend
cd frontend && npm outdated
```

**Update Strategy:**

**Minor Updates (Low Risk):**
```bash
# Update patch versions
npm update

# Test
npm test
npm run build
```

**Major Updates (Higher Risk):**
```bash
# Update one at a time
npm install package@latest

# Test thoroughly
npm test
npm run test:integration
npm run build

# Deploy to staging first
npm run deploy:staging

# Monitor for issues
# Deploy to production
npm run deploy:production
```

**Security Updates (Immediate):**
```bash
# Check security vulnerabilities
npm audit

# Fix automatically if possible
npm audit fix

# Manual fix for breaking changes
npm audit fix --force  # Caution: may break things
```

### Operating System Updates

**Update Schedule:**
- Security patches: Weekly
- Minor updates: Monthly
- Major updates: Quarterly (with testing)

**Update Process:**
```bash
# Update packages
sudo apt update
sudo apt upgrade -y

# Reboot if kernel updated
sudo needs-restarting -r
sudo reboot

# Verify services after reboot
systemctl status spywatcher-api
systemctl status spywatcher-bot
```

### Database Updates

**PostgreSQL Updates:**
```bash
# Minor version updates
sudo apt update postgresql

# Major version upgrades (requires planning)
# 1. Backup database
cd backend && npm run db:backup

# 2. Test in staging
# 3. Schedule maintenance window
# 4. Perform upgrade
sudo pg_upgradecluster 14 main

# 5. Verify
psql --version
```

## Database Maintenance

### Vacuum and Analyze

**Automatic Vacuum:**
```sql
-- Check autovacuum settings
SHOW autovacuum;

-- View last vacuum times
SELECT schemaname, relname, last_vacuum, last_autovacuum
FROM pg_stat_user_tables;
```

**Manual Vacuum:**
```bash
# Regular vacuum
psql -U postgres -d spywatcher -c "VACUUM ANALYZE;"

# Full vacuum (locks tables, use during maintenance)
psql -U postgres -d spywatcher -c "VACUUM FULL ANALYZE;"
```

**Schedule:**
- Automatic: Continuous (autovacuum)
- Manual VACUUM ANALYZE: Weekly
- VACUUM FULL: Quarterly (during maintenance window)

### Reindex Database

**Check Index Health:**
```sql
-- Check index bloat
SELECT schemaname, tablename, indexname, 
       pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC;
```

**Reindex:**
```bash
# Reindex specific table
psql -U postgres -d spywatcher -c "REINDEX TABLE users;"

# Reindex database (during maintenance window)
psql -U postgres -d spywatcher -c "REINDEX DATABASE spywatcher;"
```

**Schedule:** Monthly or when performance degrades

### Database Statistics

**Update Statistics:**
```sql
-- Analyze all tables
ANALYZE;

-- Analyze specific table
ANALYZE users;
```

**Schedule:** After large data imports or deletes

## Log Management

### Log Rotation

**Configure logrotate:**
```bash
# /etc/logrotate.d/spywatcher
/var/log/spywatcher/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 spywatcher spywatcher
    sharedscripts
    postrotate
        systemctl reload spywatcher-api > /dev/null
    endscript
}
```

### Log Cleanup

**Clean Old Logs:**
```bash
# Remove logs older than 90 days
find /var/log/spywatcher -name "*.log" -mtime +90 -delete

# Compress old logs
find /var/log/spywatcher -name "*.log" -mtime +7 -exec gzip {} \;
```

### Log Analysis

**Analyze Logs:**
```bash
# Count errors
grep -c "ERROR" /var/log/spywatcher/app.log

# Find most common errors
grep "ERROR" /var/log/spywatcher/app.log | sort | uniq -c | sort -rn | head -10

# Check slow queries
tail -100 /var/log/postgresql/slow-query.log
```

## Performance Optimization

### Query Optimization

**Identify Slow Queries:**
```sql
-- Enable slow query logging
ALTER DATABASE spywatcher SET log_min_duration_statement = 1000;

-- View slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

**Optimize Queries:**
1. Add missing indexes
2. Optimize WHERE clauses
3. Use EXPLAIN ANALYZE
4. Consider materialized views
5. Review N+1 queries

### Cache Optimization

**Redis Cache:**
```bash
# Check cache hit rate
redis-cli INFO stats | grep keyspace_hits
redis-cli INFO stats | grep keyspace_misses

# Clear cache if needed
redis-cli FLUSHDB

# Monitor memory usage
redis-cli INFO memory
```

**Application Cache:**
```javascript
// Review cache TTL settings
// Adjust based on usage patterns
const CACHE_TTL = {
  users: 3600,      // 1 hour
  guilds: 1800,     // 30 minutes
  analytics: 300    // 5 minutes
};
```

## Maintenance Windows

### Scheduling Maintenance

**Announce Maintenance:**
```markdown
Scheduled Maintenance

Date: 2024-11-10
Time: 02:00 - 04:00 UTC (off-peak hours)
Duration: Up to 2 hours
Impact: Service will be unavailable

Work:
- Database maintenance
- System updates
- Performance optimization

Status Updates: status.spywatcher.com
```

### Maintenance Checklist

**Pre-Maintenance:**
```yaml
- [ ] Schedule announced (7 days prior)
- [ ] Backup completed
- [ ] Change plan documented
- [ ] Rollback plan ready
- [ ] Team notified
- [ ] Status page updated
- [ ] Enable maintenance mode
```

**During Maintenance:**
```yaml
- [ ] Take final backup
- [ ] Stop services
- [ ] Perform updates
- [ ] Run tests
- [ ] Verify functionality
- [ ] Post status updates
```

**Post-Maintenance:**
```yaml
- [ ] Services restored
- [ ] Health checks passing
- [ ] Performance normal
- [ ] No errors in logs
- [ ] Status page updated
- [ ] Announce completion
- [ ] Monitor for issues
- [ ] Document work completed
```

### Enable Maintenance Mode

**Via Admin Panel:**
Admin Panel → System → Maintenance Mode → Enable

**Via CLI:**
```bash
# Enable maintenance mode
export MAINTENANCE_MODE=true
systemctl restart spywatcher-api

# Custom message
export MAINTENANCE_MESSAGE="System maintenance in progress. Back soon!"

# Disable maintenance mode
export MAINTENANCE_MODE=false
systemctl restart spywatcher-api
```

## Cleanup Operations

### Database Cleanup

**Remove Old Data:**
```sql
-- Delete old audit logs (older than 2 years)
DELETE FROM audit_logs 
WHERE created_at < NOW() - INTERVAL '2 years';

-- Delete expired bans
DELETE FROM bans 
WHERE expires_at < NOW();

-- Delete inactive users (>1 year, with caution)
DELETE FROM users 
WHERE last_login < NOW() - INTERVAL '1 year'
AND deleted_at IS NOT NULL;
```

### File Cleanup

**Clean Temporary Files:**
```bash
# Remove old temp files
find /tmp/spywatcher -type f -mtime +7 -delete

# Clean build artifacts
cd frontend && rm -rf dist/ node_modules/.cache

# Remove old logs
find /var/log/spywatcher -name "*.gz" -mtime +90 -delete
```

### Cache Cleanup

**Clear Stale Cache:**
```bash
# Clear Redis cache
redis-cli FLUSHDB

# Clear specific keys
redis-cli DEL "cache:users:*"

# Clear expired keys (automatic, but can trigger manually)
redis-cli --scan --pattern "cache:*" | xargs redis-cli DEL
```

## Capacity Planning

### Resource Monitoring

**Track Usage Trends:**
```yaml
Monthly Review:
  CPU Usage: Track average and peak
  Memory Usage: Track growth rate
  Disk Space: Project when full
  Database Size: Monitor growth
  Network Traffic: Track bandwidth
  User Growth: Active users trend
```

**Capacity Metrics:**
```bash
# Disk space growth
df -h | grep -E "vda1|sda1"

# Database size growth
psql -c "SELECT pg_size_pretty(pg_database_size('spywatcher'));"

# Memory usage trend
free -h

# User growth
psql -c "SELECT DATE(created_at), COUNT(*) FROM users GROUP BY DATE(created_at) ORDER BY DATE(created_at) DESC LIMIT 30;"
```

### Scaling Decisions

**When to Scale:**
```yaml
CPU: Consistently > 70%
Memory: Consistently > 80%
Disk: > 85% full
Database: Query times increasing
Response Times: P95 > 1 second
```

**Scaling Options:**
- Vertical: Increase server resources
- Horizontal: Add more servers
- Database: Read replicas, sharding
- Caching: Increase cache size
- CDN: Offload static content

## Best Practices

### Maintenance Best Practices

✅ **Do:**
- Schedule maintenance during off-peak hours
- Announce maintenance in advance
- Always backup before changes
- Test in staging first
- Have rollback plan ready
- Monitor after maintenance
- Document all changes
- Update runbooks

❌ **Don't:**
- Skip backups before maintenance
- Make unannounced changes
- Rush through procedures
- Skip testing
- Ignore warnings
- Forget rollback plan
- Skip documentation

## Related Documentation

- [Backup Procedures](./backup) - Backup creation
- [Restore Procedures](./restore) - Restoration
- [Monitoring](./monitoring) - System monitoring
- [Performance Optimization](/DATABASE_OPTIMIZATION.md) - Database optimization
- [DEPLOYMENT.md](/DEPLOYMENT.md) - Deployment procedures

---

::: tip Need Help?
For additional support, check the [troubleshooting guide](/guide/troubleshooting) or open an issue on [GitHub](https://github.com/subculture-collective/discord-spywatcher/issues).
:::
