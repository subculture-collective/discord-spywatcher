# Deployment Guide

This document describes the production deployment strategy for Spywatcher, including infrastructure setup, deployment procedures, and rollback strategies.

## Table of Contents

- [Overview](#overview)
- [Infrastructure Setup](#infrastructure-setup)
- [Deployment Strategies](#deployment-strategies)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Terraform Infrastructure](#terraform-infrastructure)
- [Helm Charts](#helm-charts)
- [CI/CD Pipeline](#cicd-pipeline)
- [Rollback Procedures](#rollback-procedures)
- [Monitoring and Alerts](#monitoring-and-alerts)
- [Troubleshooting](#troubleshooting)

## Overview

Spywatcher uses a multi-strategy deployment approach with:

- **Infrastructure as Code**: Terraform for AWS infrastructure
- **Container Orchestration**: Kubernetes (EKS) for application deployment
- **Package Management**: Helm charts for simplified deployments
- **Deployment Strategies**: Rolling, Blue-Green, and Canary deployments
- **CI/CD**: GitHub Actions for automated deployments

## Infrastructure Setup

### Prerequisites

1. AWS Account with appropriate permissions
2. AWS CLI configured
3. kubectl installed
4. Terraform installed (>= 1.5.0)
5. Helm installed (>= 3.0)

### Terraform Infrastructure

The infrastructure is defined in Terraform modules:

```bash
cd terraform

# Initialize Terraform
terraform init

# Review the plan
terraform plan -var-file="environments/production/terraform.tfvars"

# Apply infrastructure
terraform apply -var-file="environments/production/terraform.tfvars"
```

#### Infrastructure Components

- **VPC**: Isolated network with public, private, and database subnets across 3 AZs
- **EKS Cluster**: Kubernetes cluster with managed node groups
- **RDS PostgreSQL**: Managed database with encryption and automated backups
- **ElastiCache Redis**: In-memory cache with cluster mode
- **Application Load Balancer**: With WAF for security
- **Security Groups**: Least-privilege network access
- **IAM Roles**: Service accounts and node permissions

### Configure kubectl

After infrastructure deployment:

```bash
aws eks update-kubeconfig --name spywatcher-production --region us-east-1
kubectl cluster-info
```

## Deployment Strategies

### Rolling Deployment (Default)

Updates pods gradually, maintaining service availability.

```bash
# Triggered automatically on push to main branch
# Or manually via GitHub Actions UI
```

**Advantages:**
- Simple and predictable
- Zero downtime
- Automatic rollback on failure

**Disadvantages:**
- Gradual rollout may take time
- Both versions run simultaneously during update

### Blue-Green Deployment

Maintains two identical environments, switching traffic instantly.

```bash
# Via GitHub Actions
# Select "blue-green" as deployment strategy

# Or manually
IMAGE_TAG=latest ./scripts/deployment/blue-green-deploy.sh

# Rollback if needed
./scripts/deployment/blue-green-deploy.sh --rollback
```

**Advantages:**
- Instant traffic switch
- Easy rollback
- Full environment testing before switch

**Disadvantages:**
- Requires double resources temporarily
- Database migrations must be compatible with both versions

### Canary Deployment

Gradually shifts traffic to new version while monitoring metrics.

```bash
# Via GitHub Actions
# Select "canary" as deployment strategy

# Or manually
IMAGE_TAG=latest CANARY_STEPS="5 25 50 100" ./scripts/deployment/canary-deploy.sh
```

**Advantages:**
- Risk mitigation through gradual rollout
- Real-world testing with subset of users
- Automated rollback on errors

**Disadvantages:**
- Longer deployment time
- Requires robust monitoring

## Kubernetes Deployment

### Using Kustomize

Deploy to different environments:

```bash
# Production
kubectl apply -k k8s/overlays/production

# Staging
kubectl apply -k k8s/overlays/staging

# Development (base)
kubectl apply -k k8s/base
```

### Manual Deployment

```bash
# Create namespace
kubectl apply -f k8s/base/namespace.yaml

# Apply configurations
kubectl apply -f k8s/base/configmap.yaml
kubectl apply -f k8s/base/secrets.yaml

# Deploy databases
kubectl apply -f k8s/base/postgres-statefulset.yaml
kubectl apply -f k8s/base/redis-statefulset.yaml

# Deploy applications
kubectl apply -f k8s/base/backend-deployment.yaml
kubectl apply -f k8s/base/frontend-deployment.yaml

# Create services
kubectl apply -f k8s/base/backend-service.yaml
kubectl apply -f k8s/base/frontend-service.yaml

# Configure ingress
kubectl apply -f k8s/base/ingress.yaml
```

### Scaling

```bash
# Manual scaling
kubectl scale deployment spywatcher-backend --replicas=5 -n spywatcher

# Auto-scaling is configured via HPA
kubectl get hpa -n spywatcher
```

## Helm Charts

### Installation

```bash
# Install with default values
helm install spywatcher ./helm/spywatcher -n spywatcher --create-namespace

# Install with custom values
helm install spywatcher ./helm/spywatcher \
  -n spywatcher \
  --create-namespace \
  -f helm/spywatcher/values-production.yaml
```

### Upgrade

```bash
helm upgrade spywatcher ./helm/spywatcher -n spywatcher
```

### Rollback

```bash
# List releases
helm history spywatcher -n spywatcher

# Rollback to previous version
helm rollback spywatcher -n spywatcher

# Rollback to specific revision
helm rollback spywatcher 2 -n spywatcher
```

## CI/CD Pipeline

### GitHub Actions Workflow

The deployment pipeline is triggered by:

1. Push to `main` branch (automatic)
2. Manual workflow dispatch

#### Pipeline Steps

1. **Build and Push**
   - Build Docker images for backend and frontend
   - Push to GitHub Container Registry
   - Tag with commit SHA and latest

2. **Database Migration**
   - Run Prisma migrations
   - Verify migration success

3. **Deploy**
   - Apply selected deployment strategy
   - Update Kubernetes deployments
   - Monitor rollout status

4. **Smoke Tests**
   - Health check endpoints
   - Basic functionality tests

5. **Rollback on Failure**
   - Automatic rollback if deployment fails
   - Notification to team

### Required Secrets

Configure in GitHub repository settings:

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
DATABASE_URL
REDIS_URL
JWT_SECRET
JWT_REFRESH_SECRET
DISCORD_BOT_TOKEN
DISCORD_CLIENT_ID
DISCORD_CLIENT_SECRET
SLACK_WEBHOOK (optional)
```

## Rollback Procedures

### Kubernetes Rollback

```bash
# View rollout history
kubectl rollout history deployment/spywatcher-backend -n spywatcher

# Rollback to previous version
kubectl rollout undo deployment/spywatcher-backend -n spywatcher

# Rollback to specific revision
kubectl rollout undo deployment/spywatcher-backend --to-revision=2 -n spywatcher

# Check rollback status
kubectl rollout status deployment/spywatcher-backend -n spywatcher
```

### Blue-Green Rollback

```bash
./scripts/deployment/blue-green-deploy.sh --rollback
```

### Database Rollback

```bash
# If migration needs to be rolled back
kubectl exec -it deployment/spywatcher-backend -n spywatcher -- npx prisma migrate resolve --rolled-back <migration_name>
```

## Monitoring and Alerts

### Health Checks

```bash
# Liveness probe
curl https://api.spywatcher.example.com/health/live

# Readiness probe
curl https://api.spywatcher.example.com/health/ready
```

### Kubernetes Monitoring

```bash
# Check pod status
kubectl get pods -n spywatcher

# View pod logs
kubectl logs -f deployment/spywatcher-backend -n spywatcher

# Check events
kubectl get events -n spywatcher --sort-by='.lastTimestamp'

# Resource usage
kubectl top pods -n spywatcher
kubectl top nodes
```

### CloudWatch Metrics

Monitor via AWS CloudWatch:
- EKS cluster metrics
- RDS performance metrics
- ElastiCache metrics
- ALB request metrics

## Troubleshooting

### Pod Not Starting

```bash
# Describe pod to see events
kubectl describe pod <pod-name> -n spywatcher

# Check logs
kubectl logs <pod-name> -n spywatcher

# Check resource constraints
kubectl describe node <node-name>
```

### Database Connection Issues

```bash
# Verify database secret
kubectl get secret spywatcher-secrets -n spywatcher -o yaml

# Test database connection
kubectl run -it --rm debug --image=postgres:15-alpine --restart=Never -n spywatcher -- \
  psql -h <rds-endpoint> -U spywatcher -d spywatcher
```

### Traffic Not Routing

```bash
# Check service endpoints
kubectl get endpoints -n spywatcher

# Check ingress
kubectl describe ingress spywatcher-ingress -n spywatcher

# Check ALB target groups
aws elbv2 describe-target-health --target-group-arn <arn>
```

### High Resource Usage

```bash
# Check HPA status
kubectl get hpa -n spywatcher

# Scale manually if needed
kubectl scale deployment spywatcher-backend --replicas=10 -n spywatcher

# Check resource limits
kubectl describe deployment spywatcher-backend -n spywatcher
```

## Best Practices

1. **Always test in staging first**
2. **Run database migrations before deploying code**
3. **Use feature flags for risky changes**
4. **Monitor error rates during deployment**
5. **Keep rollback scripts ready**
6. **Document all configuration changes**
7. **Regular backup testing**
8. **Security patches applied promptly**

## Support

For deployment issues:
- Check GitHub Actions logs
- Review CloudWatch logs
- Contact DevOps team
- Create incident in issue tracker
