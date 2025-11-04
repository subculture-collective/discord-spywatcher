# Infrastructure Overview

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          AWS Cloud                               │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    VPC (10.0.0.0/16)                     │   │
│  │                                                           │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │           Application Load Balancer (ALB)          │  │   │
│  │  │              with WAF Protection                    │  │   │
│  │  └──────────────────┬─────────────────────────────────┘  │   │
│  │                     │                                     │   │
│  │  ┌──────────────────┴────────────────────────┐           │   │
│  │  │          EKS Cluster (Kubernetes)         │           │   │
│  │  │                                            │           │   │
│  │  │  ┌────────────────┐  ┌─────────────────┐ │           │   │
│  │  │  │   Backend      │  │   Frontend      │ │           │   │
│  │  │  │   Pods (3)     │  │   Pods (2)      │ │           │   │
│  │  │  │                │  │                 │ │           │   │
│  │  │  │ - Auto-scaling │  │ - Auto-scaling  │ │           │   │
│  │  │  │ - Health checks│  │ - Health checks │ │           │   │
│  │  │  └────────┬───────┘  └────────┬────────┘ │           │   │
│  │  │           │                   │          │           │   │
│  │  │           └───────┬───────────┘          │           │   │
│  │  │                   │                      │           │   │
│  │  └───────────────────┼──────────────────────┘           │   │
│  │                      │                                  │   │
│  │  ┌───────────────────┼──────────────────────────────┐  │   │
│  │  │  Database Subnets │                              │  │   │
│  │  │                   │                              │  │   │
│  │  │  ┌────────────────▼────────┐  ┌───────────────┐ │  │   │
│  │  │  │  RDS PostgreSQL 15      │  │ ElastiCache   │ │  │   │
│  │  │  │                         │  │ Redis         │ │  │   │
│  │  │  │ - Multi-AZ              │  │               │ │  │   │
│  │  │  │ - Encrypted             │  │ - Encrypted   │ │  │   │
│  │  │  │ - Automated Backups     │  │ - Failover    │ │  │   │
│  │  │  └─────────────────────────┘  └───────────────┘ │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │  CloudWatch      │  │  Secrets Manager │                   │
│  │  Monitoring      │  │  Credentials     │                   │
│  └──────────────────┘  └──────────────────┘                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Actions                            │
│                                                                   │
│  Build → Test → Deploy → Smoke Tests → Monitor                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### Compute

- **EKS Cluster**: Managed Kubernetes cluster (v1.28)
- **Node Groups**: Auto-scaling EC2 instances (t3.large)
- **Pods**: Containerized applications with health checks

### Networking

- **VPC**: Isolated network (10.0.0.0/16)
- **Subnets**: Public, Private, and Database across 3 AZs
- **NAT Gateways**: Internet access for private subnets
- **ALB**: HTTPS termination and routing

### Data Storage

- **RDS PostgreSQL**: Managed database (15.3)
    - Multi-AZ for high availability
    - Automated backups (7 days retention)
    - Encryption at rest (KMS)
- **ElastiCache Redis**: In-memory cache (7.0)
    - Authentication token
    - Encryption in transit
    - Automatic failover

### Security

- **WAF**: Web Application Firewall with rate limiting
- **Security Groups**: Network-level access control
- **IAM Roles**: Fine-grained permissions
- **Secrets Manager**: Secure credential storage
- **TLS/SSL**: End-to-end encryption

### Monitoring

- **CloudWatch**: Metrics, logs, and alarms
- **Health Checks**: Liveness and readiness probes
- **Resource Metrics**: CPU, memory, network usage

## Resource Sizing

### Production Environment

| Component  | Type        | Specs               | Replicas     | Scaling |
| ---------- | ----------- | ------------------- | ------------ | ------- |
| Backend    | Pod         | 512Mi RAM, 500m CPU | 3            | 2-10    |
| Frontend   | Pod         | 128Mi RAM, 100m CPU | 2            | 2-5     |
| PostgreSQL | RDS         | db.t3.large         | 1 (Multi-AZ) | Manual  |
| Redis      | ElastiCache | cache.t3.medium     | 2            | Manual  |
| EKS Nodes  | EC2         | t3.large            | 3            | 2-10    |

### Staging Environment

| Component  | Type        | Specs               | Replicas | Scaling |
| ---------- | ----------- | ------------------- | -------- | ------- |
| Backend    | Pod         | 256Mi RAM, 250m CPU | 1        | 1-3     |
| Frontend   | Pod         | 128Mi RAM, 100m CPU | 1        | 1-2     |
| PostgreSQL | RDS         | db.t3.medium        | 1        | N/A     |
| Redis      | ElastiCache | cache.t3.small      | 1        | N/A     |
| EKS Nodes  | EC2         | t3.medium           | 2        | 1-4     |

## Cost Estimation

### Monthly Costs (US East 1)

#### Production

- EKS Cluster: $73
- EC2 Nodes (3x t3.large): ~$150
- RDS PostgreSQL (db.t3.large, Multi-AZ): ~$290
- ElastiCache Redis (cache.t3.medium x2): ~$100
- ALB: ~$25
- Data Transfer: ~$50
- Backups & Monitoring: ~$30

**Total: ~$718/month**

#### Staging

- EKS Cluster: $73
- EC2 Nodes (2x t3.medium): ~$60
- RDS PostgreSQL (db.t3.medium): ~$70
- ElastiCache Redis (cache.t3.small): ~$25
- ALB: ~$25
- Data Transfer: ~$20

**Total: ~$273/month**

_Note: Costs are estimates and may vary based on usage_

## Deployment Strategies

### 1. Rolling Update (Default)

- **Use Case**: Standard deployments
- **Downtime**: Zero
- **Risk**: Low
- **Duration**: 5-10 minutes

### 2. Blue-Green

- **Use Case**: Major releases, critical changes
- **Downtime**: Zero
- **Risk**: Very Low (instant rollback)
- **Duration**: 10-15 minutes

### 3. Canary

- **Use Case**: High-risk changes, gradual rollout
- **Downtime**: Zero
- **Risk**: Minimal (gradual exposure)
- **Duration**: 30-60 minutes

## High Availability

### Application Layer

- Multiple replicas across availability zones
- Pod anti-affinity rules
- Pod disruption budgets (min 1 available)
- Health checks with automatic restart

### Database Layer

- Multi-AZ deployment for RDS
- Automated failover (< 60 seconds)
- Read replicas for scaling (optional)
- Point-in-time recovery

### Network Layer

- Multi-AZ load balancing
- Health checks on targets
- Automatic target deregistration
- DDoS protection (AWS Shield)

## Disaster Recovery

### RTO (Recovery Time Objective)

- Application: < 5 minutes
- Database: < 1 minute (automated failover)
- Full Infrastructure: < 30 minutes (Terraform redeploy)

### RPO (Recovery Point Objective)

- Database: < 5 minutes (automated backups)
- Application: 0 (stateless, recreatable)

### Backup Strategy

- **Database**: Daily automated backups (7 days retention)
- **Configuration**: Git repository (versioned)
- **Infrastructure**: Terraform state (versioned in S3)

## Security Measures

### Network Security

- Private subnets for application and database
- Security groups with least-privilege rules
- Network ACLs
- VPC Flow Logs

### Application Security

- Containers run as non-root
- Read-only root filesystems where possible
- No privilege escalation
- Security scanning in CI/CD

### Data Security

- Encryption at rest (KMS)
- Encryption in transit (TLS 1.2+)
- Secrets stored in AWS Secrets Manager
- Database credentials auto-rotated

### Access Control

- IAM roles with least privilege
- RBAC in Kubernetes
- MFA for admin access
- Audit logging enabled

## Scaling Strategy

### Horizontal Scaling

- **Triggers**:
    - CPU > 70%
    - Memory > 80%
    - Custom metrics (request rate)
- **Limits**:
    - Backend: 2-10 pods
    - Frontend: 2-5 pods
    - Nodes: 2-10 instances

### Vertical Scaling

- Database: Manual scaling with downtime
- Redis: Manual scaling with failover
- Pods: Update resource limits and restart

## Monitoring Strategy

### Application Metrics

- Request rate and latency
- Error rate
- Active connections
- Cache hit rate

### Infrastructure Metrics

- CPU utilization
- Memory utilization
- Network throughput
- Disk I/O

### Business Metrics

- Active users
- API usage per tier
- Feature usage
- User sessions

### Alerting

- Critical: Page immediately
    - Service down
    - Database unavailable
    - High error rate
- Warning: Notify during business hours
    - High CPU/memory
    - Low disk space
    - Elevated response time

## Maintenance Windows

### Planned Maintenance

- **Schedule**: Sundays 02:00-04:00 UTC
- **Notification**: 7 days advance notice
- **Activities**:
    - OS patches
    - Database maintenance
    - Kubernetes upgrades
    - SSL certificate renewal

### Emergency Maintenance

- Immediate security patches
- Critical bug fixes
- Infrastructure failures

## Compliance & Governance

### Tagging Strategy

All resources tagged with:

- `Environment`: production/staging
- `Project`: spywatcher
- `ManagedBy`: terraform
- `CostCenter`: engineering

### Resource Naming

- Pattern: `{project}-{environment}-{resource}`
- Example: `spywatcher-production-backend`

### Access Audit

- CloudTrail enabled
- Quarterly access review
- Regular security audits

## Quick Reference

### Useful Commands

```bash
# Check cluster status
kubectl cluster-info
kubectl get nodes

# View application status
kubectl get all -n spywatcher

# View logs
kubectl logs -f deployment/spywatcher-backend -n spywatcher

# Scale application
kubectl scale deployment spywatcher-backend --replicas=5 -n spywatcher

# Rollback deployment
kubectl rollout undo deployment/spywatcher-backend -n spywatcher

# Database backup
aws rds create-db-snapshot --db-instance-identifier spywatcher-production

# View CloudWatch alarms
aws cloudwatch describe-alarms --state-value ALARM
```

### Important URLs

- Production: https://spywatcher.example.com
- API: https://api.spywatcher.example.com
- Staging: https://staging.spywatcher.example.com
- Grafana: https://grafana.spywatcher.example.com
- AWS Console: https://console.aws.amazon.com

### Support Contacts

- On-Call: oncall@spywatcher.example.com
- DevOps: devops@spywatcher.example.com
- Security: security@spywatcher.example.com
