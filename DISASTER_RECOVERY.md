# Disaster Recovery Runbook

## Overview

This document provides detailed procedures for recovering from various disaster scenarios. The procedures are designed to meet our Recovery Time Objective (RTO) of < 4 hours and Recovery Point Objective (RPO) of < 1 hour.

## Quick Reference

| Scenario                        | RTO     | RPO    | Primary Contact |
| ------------------------------- | ------- | ------ | --------------- |
| Database Corruption             | 2 hours | 1 hour | Database Admin  |
| Complete Infrastructure Failure | 4 hours | 1 hour | DevOps Lead     |
| Regional Outage                 | 6 hours | 1 hour | Cloud Architect |
| Ransomware Attack               | 3 hours | 1 hour | Security Team   |

## Prerequisites

### Required Access

- [ ] Database credentials (DB_PASSWORD)
- [ ] AWS CLI configured with appropriate permissions
- [ ] S3 bucket access (spywatcher-backups)
- [ ] GPG keys for backup decryption
- [ ] SSH access to production servers
- [ ] Admin access to cloud provider console

### Required Tools

- [ ] PostgreSQL client tools (psql, pg_restore)
- [ ] AWS CLI
- [ ] GPG/OpenSSL
- [ ] Docker (if using containerized deployments)
- [ ] kubectl (if using Kubernetes)

## Backup Strategy

### Automated Backups

Our backup strategy includes:

1. **Full Database Backups** (Daily at 2 AM UTC)
    - Compressed with gzip
    - Encrypted with GPG
    - Stored in primary and secondary S3 buckets
    - Retention: 30 days daily, 12 months (monthly snapshots)

2. **Incremental Backups** (Every 6 hours)
    - WAL archiving for point-in-time recovery
    - Stored in S3
    - Retention: 7 days

3. **Configuration Backups** (On change)
    - Environment variables
    - SSL certificates
    - Application configuration files
    - Infrastructure as Code (Terraform/CloudFormation)

### Backup Locations

- **Primary**: `s3://spywatcher-backups/postgres/full/`
- **Secondary**: `s3://spywatcher-backups-us-west/postgres/full/`
- **WAL Archives**: `s3://spywatcher-backups/wal/`
- **Local**: `/var/backups/spywatcher/` (7-day retention)

## Recovery Procedures

### Scenario 1: Database Corruption

**Symptoms:**

- Data inconsistencies
- Query errors
- Failed integrity checks
- Corrupted indexes

**Recovery Steps:**

1. **Assess the Damage** (10 minutes)

    ```bash
    # Connect to database
    psql -h $DB_HOST -U spywatcher -d spywatcher

    # Check for errors in logs
    tail -100 /var/log/postgresql/postgresql-15-main.log

    # Run integrity checks
    SELECT * FROM pg_stat_database WHERE datname = 'spywatcher';
    ```

2. **Stop the Application** (5 minutes)

    ```bash
    # If using Kubernetes
    kubectl scale deployment spywatcher-backend --replicas=0

    # If using Docker Compose
    docker-compose stop backend

    # If using systemd
    sudo systemctl stop spywatcher-backend
    ```

3. **Identify Last Known Good Backup** (5 minutes)

    ```bash
    # List recent backups
    aws s3 ls s3://spywatcher-backups/postgres/full/ --recursive | sort -r | head -10

    # Check backup logs
    cd $PROJECT_ROOT/backend
    npm run db:backup-logs
    ```

4. **Restore Database** (60 minutes)

    ```bash
    # Download and restore the backup
    cd $PROJECT_ROOT/scripts

    # Set environment variables
    export DB_NAME="spywatcher"
    export DB_USER="spywatcher"
    export DB_PASSWORD="your_password"
    export DB_HOST="localhost"
    export S3_BUCKET="spywatcher-backups"

    # Run restore
    ./restore.sh s3://spywatcher-backups/postgres/full/spywatcher_full_20240125_120000.dump.gz
    ```

5. **Verify Data Integrity** (15 minutes)

    ```bash
    # Run data integrity checks
    psql -h $DB_HOST -U spywatcher -d spywatcher -c "
    SELECT
      (SELECT COUNT(*) FROM \"User\") as users,
      (SELECT COUNT(*) FROM \"Guild\") as guilds,
      (SELECT COUNT(*) FROM \"ApiKey\") as api_keys;
    "

    # Check for critical records
    psql -h $DB_HOST -U spywatcher -d spywatcher -c "
    SELECT * FROM \"User\" WHERE role = 'ADMIN' LIMIT 5;
    "
    ```

6. **Restart Application** (15 minutes)

    ```bash
    # If using Kubernetes
    kubectl scale deployment spywatcher-backend --replicas=3

    # If using Docker Compose
    docker-compose up -d backend

    # If using systemd
    sudo systemctl start spywatcher-backend
    ```

7. **Monitor for Errors** (20 minutes)

    ```bash
    # Watch application logs
    kubectl logs -f deployment/spywatcher-backend

    # Or with Docker
    docker-compose logs -f backend

    # Check health endpoint
    curl https://api.spywatcher.com/health
    ```

8. **Post-Recovery Verification** (10 minutes)
    - Test critical API endpoints
    - Verify user logins
    - Check data consistency
    - Monitor error rates in Sentry
    - Verify Discord bot connectivity

**Total RTO: ~2 hours**

### Scenario 2: Complete Infrastructure Failure

**Symptoms:**

- All services down
- Cannot access servers
- Cloud provider outage
- Hardware failure

**Recovery Steps:**

1. **Assess Infrastructure Status** (15 minutes)
    - Check cloud provider status page
    - Verify network connectivity
    - Identify affected resources
    - Contact cloud support if needed

2. **Activate Disaster Recovery Site** (30 minutes)

    ```bash
    # If using Terraform
    cd infrastructure/

    # Initialize Terraform with DR workspace
    terraform workspace select disaster-recovery

    # Review planned changes
    terraform plan -out=dr.tfplan

    # Apply infrastructure
    terraform apply dr.tfplan
    ```

3. **Restore Database in New Environment** (90 minutes)

    ```bash
    # Set new environment variables
    export DB_HOST="new-db-host.region.rds.amazonaws.com"
    export S3_BUCKET="spywatcher-backups"

    # Restore from secondary backup location
    cd $PROJECT_ROOT/scripts
    ./restore.sh s3://spywatcher-backups-us-west/postgres/full/latest.dump.gz
    ```

4. **Deploy Application Containers** (45 minutes)

    ```bash
    # If using Kubernetes
    kubectl config use-context disaster-recovery

    # Apply Kubernetes manifests
    kubectl apply -f k8s/namespace.yaml
    kubectl apply -f k8s/secrets.yaml
    kubectl apply -f k8s/configmaps.yaml
    kubectl apply -f k8s/deployments.yaml
    kubectl apply -f k8s/services.yaml
    kubectl apply -f k8s/ingress.yaml

    # If using Docker Compose
    docker-compose -f docker-compose.prod.yml up -d
    ```

5. **Update DNS Records** (15 minutes)

    ```bash
    # Update DNS to point to new infrastructure
    # This depends on your DNS provider
    # Example with AWS Route53:
    aws route53 change-resource-record-sets \
      --hosted-zone-id Z1234567890ABC \
      --change-batch file://dns-update.json
    ```

6. **Run Smoke Tests** (20 minutes)

    ```bash
    # Test critical endpoints
    curl https://api.spywatcher.com/health
    curl https://api.spywatcher.com/api/status

    # Test authentication
    curl -X POST https://api.spywatcher.com/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"username": "test", "password": "test"}'

    # Test Discord bot
    # (Check bot status in Discord server)
    ```

7. **Monitor System Health** (20 minutes)
    - Check all services are running
    - Verify database connections
    - Monitor error rates
    - Check Discord bot presence
    - Verify frontend accessibility

8. **Notify Stakeholders**
    - Update status page
    - Send notification to users
    - Post in Discord/Slack channels
    - Document incident for post-mortem

**Total RTO: ~4 hours**

### Scenario 3: Regional Outage

**Symptoms:**

- Primary region unavailable
- High latency to primary services
- Cloud provider regional outage

**Recovery Steps:**

1. **Confirm Regional Outage** (10 minutes)
    - Check cloud provider status page
    - Verify other regions are operational
    - Assess blast radius

2. **Activate Secondary Region** (30 minutes)

    ```bash
    # Switch to secondary region infrastructure
    cd infrastructure/
    terraform workspace select us-west-2
    terraform apply
    ```

3. **Restore Database in Secondary Region** (90 minutes)

    ```bash
    # Use secondary backup location
    export DB_HOST="secondary-db.us-west-2.rds.amazonaws.com"
    export S3_BUCKET="spywatcher-backups-us-west"

    cd $PROJECT_ROOT/scripts
    ./restore.sh s3://spywatcher-backups-us-west/postgres/full/latest.dump.gz
    ```

4. **Deploy to Secondary Region** (60 minutes)

    ```bash
    # Deploy application to secondary region
    kubectl config use-context us-west-2
    kubectl apply -f k8s/

    # Wait for pods to be ready
    kubectl wait --for=condition=ready pod -l app=spywatcher-backend --timeout=300s
    ```

5. **Update Global DNS** (30 minutes)

    ```bash
    # Update DNS to point to secondary region
    aws route53 change-resource-record-sets \
      --hosted-zone-id Z1234567890ABC \
      --change-batch file://failover-to-west.json

    # Verify DNS propagation
    dig api.spywatcher.com +short
    ```

6. **Monitor Service Restoration** (20 minutes)
    - Verify all services are healthy
    - Check database replication lag (if applicable)
    - Monitor error rates
    - Verify user access

7. **Plan for Failback** (When primary region recovers)
    - Schedule maintenance window
    - Reverse failover procedure
    - Update DNS back to primary region
    - Run full system tests

**Total RTO: ~6 hours**

### Scenario 4: Ransomware Attack

**Symptoms:**

- Encrypted files
- Ransom notes
- Unusual file modifications
- Compromised accounts

**Recovery Steps:**

1. **Contain the Attack** (Immediate)

    ```bash
    # Isolate affected systems
    # Disable network access
    # Revoke compromised credentials

    # If using AWS
    aws ec2 modify-instance-attribute \
      --instance-id i-1234567890abcdef0 \
      --no-source-dest-check
    ```

2. **Assess Impact** (30 minutes)
    - Identify compromised systems
    - Determine data loss
    - Check backup integrity
    - Review security logs

3. **Contact Security Team** (15 minutes)
    - Notify security team
    - Contact law enforcement if required
    - Engage incident response team
    - Preserve evidence

4. **Restore from Clean Backup** (90 minutes)

    ```bash
    # Use backup from before attack
    # Verify backup is not compromised

    cd $PROJECT_ROOT/scripts

    # Identify clean backup (before attack)
    aws s3 ls s3://spywatcher-backups/postgres/full/ | \
      grep "2024-01-20" # Date before attack

    # Restore clean backup
    ./restore.sh s3://spywatcher-backups/postgres/full/spywatcher_full_20240120_020000.dump.gz
    ```

5. **Rebuild Infrastructure** (120 minutes)
    - Provision new clean infrastructure
    - Apply security patches
    - Update all credentials
    - Implement additional security controls

6. **Restore Service** (45 minutes)
    - Deploy application to clean infrastructure
    - Verify all security measures
    - Enable monitoring and alerting
    - Test thoroughly before full restoration

7. **Post-Incident Actions**
    - Conduct forensic analysis
    - Update security policies
    - Implement additional controls
    - Train team on security awareness
    - Schedule security audit

**Total RTO: ~3 hours (excluding investigation time)**

## Point-in-Time Recovery (PITR)

If you need to recover to a specific point in time:

```bash
# Restore to specific timestamp
cd $PROJECT_ROOT/scripts
./restore.sh <backup_file> '2024-01-25 14:30:00'
```

**Requirements:**

- WAL archiving must be enabled
- WAL files must be available in S3
- Backup must be from before the target time

## Testing Schedule

### Monthly Tests

- [ ] Restore from latest backup to test database
- [ ] Verify backup integrity
- [ ] Test backup decryption
- [ ] Validate data completeness

### Quarterly Drills

- [ ] Full disaster recovery drill
- [ ] Document time to recovery
- [ ] Update procedures based on findings
- [ ] Train team members

### Annual Review

- [ ] Review and update RTO/RPO targets
- [ ] Update contact information
- [ ] Review and update procedures
- [ ] Conduct table-top exercise

## Contacts and Escalation

### Primary Contacts

- **Database Admin**: db-admin@spywatcher.com
- **DevOps Lead**: devops@spywatcher.com
- **Security Team**: security@spywatcher.com
- **On-Call Engineer**: oncall@spywatcher.com

### Escalation Path

1. On-Call Engineer (0-30 minutes)
2. Team Lead (30-60 minutes)
3. Engineering Manager (1-2 hours)
4. CTO (2+ hours)

### External Contacts

- **Cloud Provider Support**: support@aws.com
- **Database Vendor**: support@postgresql.org
- **Security Incident Response**: incident@security-firm.com

## Monitoring and Alerts

### Critical Alerts

- Backup failure alerts (via PagerDuty)
- Database health alerts
- Service availability alerts
- Security incident alerts

### Alert Channels

- **Email**: alerts@spywatcher.com
- **Slack**: #production-alerts
- **Discord**: #ops-alerts
- **PagerDuty**: On-call rotation

## Post-Recovery Checklist

After completing any recovery procedure:

- [ ] Verify all services are operational
- [ ] Confirm data integrity
- [ ] Review logs for errors
- [ ] Update status page
- [ ] Notify stakeholders
- [ ] Document incident
- [ ] Schedule post-mortem
- [ ] Identify improvement opportunities
- [ ] Update runbook if needed
- [ ] Test backup integrity
- [ ] Review security measures

## Appendix

### Useful Commands

```bash
# Check backup status
aws s3 ls s3://spywatcher-backups/postgres/full/ --recursive | sort -r | head -10

# Check database size
psql -h $DB_HOST -U spywatcher -c "SELECT pg_size_pretty(pg_database_size('spywatcher'));"

# Check WAL archiving status
psql -h $DB_HOST -U postgres -c "SELECT * FROM pg_stat_archiver;"

# List recent backup logs
cd $PROJECT_ROOT/backend
npm run db:backup-logs

# Monitor backup health
npm run backup:health-check
```

### Configuration Files

- **PostgreSQL Config**: `/etc/postgresql/15/main/postgresql.conf`
- **Backup Config**: `$PROJECT_ROOT/scripts/backup.sh`
- **Environment**: `$PROJECT_ROOT/backend/.env`
- **Infrastructure**: `$PROJECT_ROOT/infrastructure/`

### Additional Resources

- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [AWS Disaster Recovery](https://aws.amazon.com/disaster-recovery/)
- [Backup Best Practices](https://www.postgresql.org/docs/current/backup-file.html)

---

**Last Updated**: 2024-11-02  
**Version**: 1.0  
**Next Review**: 2025-02-02
