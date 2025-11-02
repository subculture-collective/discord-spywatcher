# Kubernetes Manifests

This directory contains Kubernetes manifests for deploying Spywatcher.

## Directory Structure

```
k8s/
├── base/                    # Base manifests
│   ├── namespace.yaml       # Namespace and resource quotas
│   ├── configmap.yaml       # Application configuration
│   ├── secrets.yaml         # Secrets template (DO NOT commit actual secrets)
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── backend-hpa.yaml     # Horizontal Pod Autoscaler
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
│   ├── postgres-statefulset.yaml
│   ├── redis-statefulset.yaml
│   ├── ingress.yaml
│   ├── pdb.yaml             # Pod Disruption Budget
│   └── kustomization.yaml
├── overlays/                # Environment-specific overlays
│   ├── production/
│   └── staging/
└── secrets/                 # Actual secrets (gitignored)
```

## Quick Start

### Prerequisites

- kubectl configured with cluster access
- kustomize (built into kubectl >= 1.14)

### Deploy to Production

```bash
# Review what will be deployed
kubectl kustomize k8s/overlays/production

# Apply manifests
kubectl apply -k k8s/overlays/production

# Check deployment status
kubectl get all -n spywatcher
```

### Deploy to Staging

```bash
kubectl apply -k k8s/overlays/staging
kubectl get all -n spywatcher-staging
```

## Configuration Management

### Secrets

**IMPORTANT**: Never commit actual secrets to git!

1. Copy the secrets template:
```bash
cp k8s/base/secrets.yaml k8s/secrets/secrets.yaml
```

2. Edit with actual values:
```bash
vim k8s/secrets/secrets.yaml
```

3. Apply separately:
```bash
kubectl apply -f k8s/secrets/secrets.yaml
```

### ConfigMap

Application configuration is in `k8s/base/configmap.yaml`. Environment-specific values can be patched in overlays.

## Deployment Strategies

### Rolling Update (Default)

```bash
# Update image
kubectl set image deployment/spywatcher-backend \
  backend=ghcr.io/subculture-collective/spywatcher-backend:v2.0.0 \
  -n spywatcher

# Watch rollout
kubectl rollout status deployment/spywatcher-backend -n spywatcher
```

### Blue-Green Deployment

Use the provided script:
```bash
./scripts/deployment/blue-green-deploy.sh
```

### Canary Deployment

Use the provided script:
```bash
./scripts/deployment/canary-deploy.sh
```

## Scaling

### Manual Scaling

```bash
# Scale backend
kubectl scale deployment spywatcher-backend --replicas=5 -n spywatcher

# Scale frontend
kubectl scale deployment spywatcher-frontend --replicas=3 -n spywatcher
```

### Auto-scaling

HorizontalPodAutoscaler is configured to scale based on:
- CPU utilization (target: 70%)
- Memory utilization (target: 80%)

```bash
# Check HPA status
kubectl get hpa -n spywatcher

# Describe HPA
kubectl describe hpa spywatcher-backend-hpa -n spywatcher
```

## Monitoring

### Check Pod Status

```bash
# List all pods
kubectl get pods -n spywatcher

# Describe pod
kubectl describe pod <pod-name> -n spywatcher

# View logs
kubectl logs -f <pod-name> -n spywatcher

# View logs from all replicas
kubectl logs -f deployment/spywatcher-backend -n spywatcher
```

### Health Checks

```bash
# Test liveness probe
kubectl exec -it deployment/spywatcher-backend -n spywatcher -- \
  wget -qO- http://localhost:3001/health/live

# Test readiness probe
kubectl exec -it deployment/spywatcher-backend -n spywatcher -- \
  wget -qO- http://localhost:3001/health/ready
```

### Resource Usage

```bash
# Pod resource usage
kubectl top pods -n spywatcher

# Node resource usage
kubectl top nodes
```

## Troubleshooting

### Pod Not Starting

```bash
# Check events
kubectl get events -n spywatcher --sort-by='.lastTimestamp'

# Describe pod
kubectl describe pod <pod-name> -n spywatcher

# Check logs
kubectl logs <pod-name> -n spywatcher --previous  # Previous container
```

### Network Issues

```bash
# Check services
kubectl get services -n spywatcher

# Check endpoints
kubectl get endpoints -n spywatcher

# Test service from within cluster
kubectl run -it --rm debug --image=busybox --restart=Never -n spywatcher -- \
  wget -qO- http://spywatcher-backend/health/live
```

### Database Connection

```bash
# Check database pod
kubectl get pods -n spywatcher | grep postgres

# Test database connection
kubectl exec -it postgres-0 -n spywatcher -- \
  psql -U spywatcher -d spywatcher -c "SELECT version();"

# Check database logs
kubectl logs postgres-0 -n spywatcher
```

### Redis Connection

```bash
# Check Redis pod
kubectl get pods -n spywatcher | grep redis

# Test Redis connection
kubectl exec -it redis-0 -n spywatcher -- redis-cli ping

# Check Redis logs
kubectl logs redis-0 -n spywatcher
```

## Maintenance

### Update Configuration

```bash
# Edit configmap
kubectl edit configmap spywatcher-config -n spywatcher

# Restart pods to pick up changes
kubectl rollout restart deployment/spywatcher-backend -n spywatcher
```

### Database Migrations

```bash
# Run migration job
kubectl create job --from=cronjob/db-migrate migrate-$(date +%s) -n spywatcher

# Check migration status
kubectl get jobs -n spywatcher

# View migration logs
kubectl logs job/migrate-<timestamp> -n spywatcher
```

### Backup

```bash
# Backup PostgreSQL
kubectl exec postgres-0 -n spywatcher -- \
  pg_dump -U spywatcher spywatcher > backup.sql

# Backup Redis
kubectl exec redis-0 -n spywatcher -- \
  redis-cli BGSAVE
```

## Security

### Network Policies

Network policies restrict traffic between pods:
- Backend can connect to: PostgreSQL, Redis
- Frontend can connect to: Backend
- External traffic: Ingress only

### RBAC

Service accounts with minimal permissions:
- `spywatcher-backend`: Access to secrets, configmaps
- `spywatcher-frontend`: Read-only access

### Secrets

- Use Sealed Secrets or External Secrets Operator for production
- Never commit unencrypted secrets
- Rotate secrets regularly

## Ingress

### NGINX Ingress Controller

Install if not already present:
```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install nginx-ingress ingress-nginx/ingress-nginx
```

### Cert-Manager

Install for automatic SSL certificates:
```bash
helm repo add jetstack https://charts.jetstack.io
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set installCRDs=true
```

Create ClusterIssuer:
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
```

## Clean Up

### Delete Resources

```bash
# Delete all resources in namespace
kubectl delete namespace spywatcher

# Or use kustomize
kubectl delete -k k8s/overlays/production
```

### Persistent Data

⚠️ **WARNING**: Deleting PVCs will delete all data!

```bash
# List PVCs
kubectl get pvc -n spywatcher

# Delete specific PVC
kubectl delete pvc postgres-data-postgres-0 -n spywatcher
```

## Best Practices

1. **Use namespaces**: Separate environments with namespaces
2. **Resource limits**: Always set requests and limits
3. **Health checks**: Configure liveness and readiness probes
4. **Security context**: Run containers as non-root
5. **Pod disruption budgets**: Ensure high availability
6. **Horizontal scaling**: Use HPA for dynamic scaling
7. **Rolling updates**: Use for zero-downtime deployments
8. **Monitoring**: Integrate with Prometheus/Grafana
9. **Logging**: Centralize logs with ELK or Loki
10. **Backups**: Regular backups of persistent data
