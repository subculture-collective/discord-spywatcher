# Auto-scaling Examples and Tutorials

This guide provides practical examples for deploying and managing auto-scaling in Spywatcher.

## Table of Contents

- [Quick Start](#quick-start)
- [Basic Deployment](#basic-deployment)
- [Production Deployment](#production-deployment)
- [Testing Auto-scaling](#testing-auto-scaling)
- [Monitoring](#monitoring)
- [Troubleshooting Scenarios](#troubleshooting-scenarios)
- [Advanced Configurations](#advanced-configurations)

## Quick Start

### Prerequisites

Ensure you have:

- Kubernetes cluster (1.25+)
- kubectl configured
- metrics-server installed

### 5-Minute Setup

```bash
# 1. Deploy with Kustomize
kubectl apply -k k8s/base

# 2. Verify HPA is working
kubectl get hpa -n spywatcher

# 3. Check pod metrics
kubectl top pods -n spywatcher

# 4. Validate configuration
./scripts/validate-autoscaling.sh
```

## Basic Deployment

### Deploy Base Configuration

```bash
# Create namespace
kubectl create namespace spywatcher

# Deploy all components
kubectl apply -k k8s/base

# Wait for deployments to be ready
kubectl wait --for=condition=available --timeout=300s \
  deployment/spywatcher-backend -n spywatcher

kubectl wait --for=condition=available --timeout=300s \
  deployment/spywatcher-frontend -n spywatcher
```

### Verify Deployment

```bash
# Check all resources
kubectl get all -n spywatcher

# Check HPA status
kubectl get hpa -n spywatcher -o wide

# Expected output:
# NAME                      REFERENCE                        TARGETS         MINPODS   MAXPODS   REPLICAS
# spywatcher-backend-hpa    Deployment/spywatcher-backend   50%/70%, 40%/80%   2         10        3
# spywatcher-frontend-hpa   Deployment/spywatcher-frontend  30%/70%, 25%/80%   2         5         2
```

### View Detailed HPA Configuration

```bash
# Backend HPA details
kubectl describe hpa spywatcher-backend-hpa -n spywatcher

# Frontend HPA details
kubectl describe hpa spywatcher-frontend-hpa -n spywatcher
```

## Production Deployment

### Deploy to Production with Helm

```bash
# Add any required Helm repositories
# helm repo add <repo-name> <repo-url>

# Install/Upgrade with production values
helm upgrade --install spywatcher ./helm/spywatcher \
  --namespace spywatcher \
  --create-namespace \
  --values helm/spywatcher/values-production.yaml \
  --wait \
  --timeout 10m

# Verify deployment
helm status spywatcher -n spywatcher
```

### Deploy with Kustomize (Production Overlay)

```bash
# Apply production overlay
kubectl apply -k k8s/overlays/production

# Monitor rollout
kubectl rollout status deployment/spywatcher-backend -n spywatcher
kubectl rollout status deployment/spywatcher-frontend -n spywatcher

# Verify HPA
kubectl get hpa -n spywatcher
```

### Production Checklist

After deployment, verify:

```bash
# 1. Check HPA status
kubectl get hpa -n spywatcher

# 2. Verify PDB configuration
kubectl get pdb -n spywatcher

# 3. Check service endpoints
kubectl get endpoints -n spywatcher

# 4. Verify ingress
kubectl get ingress -n spywatcher

# 5. Check pod distribution across nodes
kubectl get pods -n spywatcher -o wide

# 6. Validate configuration
./scripts/validate-autoscaling.sh
```

## Testing Auto-scaling

### Manual Scaling Test

```bash
# Watch HPA and pods in real-time
watch -n 2 'kubectl get hpa,pods -n spywatcher'

# In another terminal, generate load
kubectl run -it --rm load-generator \
  --image=busybox \
  --restart=Never \
  -n spywatcher \
  -- /bin/sh -c "while true; do wget -q -O- http://spywatcher-backend/health/live; done"
```

### Automated Load Test

```bash
# Test with default settings (5 minutes, 50 concurrent)
./scripts/load-test.sh

# Custom duration and concurrency
./scripts/load-test.sh --duration 600 --concurrent 100 --rps 200

# Simulate traffic spike pattern
./scripts/load-test.sh --spike

# Monitor HPA only
./scripts/load-test.sh --monitor
```

### Expected Behavior

During load test, you should observe:

1. **Scale Up Phase** (0-2 minutes):
    - CPU/Memory utilization increases
    - HPA triggers scale-up
    - New pods are created
    - Pods pass readiness checks
    - Load balancer adds new endpoints

2. **Steady State** (2-8 minutes):
    - Replicas stabilize
    - Metrics stay around target threshold
    - Load distributed across pods

3. **Scale Down Phase** (8+ minutes):
    - Load decreases
    - 5-minute stabilization window
    - Gradual pod termination
    - Returns to minimum replicas

### Observing Scaling Events

```bash
# View HPA events
kubectl get events -n spywatcher | grep -i horizontal

# Watch scaling in real-time
kubectl get events -n spywatcher --watch | grep -i horizontal

# View pod lifecycle events
kubectl get events -n spywatcher --sort-by='.lastTimestamp' | tail -20
```

## Monitoring

### Metrics Dashboard

```bash
# View current metrics
kubectl top pods -n spywatcher
kubectl top nodes

# HPA metrics
kubectl get hpa -n spywatcher -o yaml

# Resource usage per pod
kubectl top pods -n spywatcher --containers
```

### Prometheus Queries

If Prometheus is installed:

```promql
# Current replica count
kube_horizontalpodautoscaler_status_current_replicas{namespace="spywatcher"}

# CPU utilization
kube_horizontalpodautoscaler_status_current_metrics_average_utilization{
  namespace="spywatcher",
  metric_name="cpu"
}

# Scaling events
rate(kube_horizontalpodautoscaler_status_current_replicas{namespace="spywatcher"}[5m])

# Request rate per pod
rate(http_requests_total{namespace="spywatcher"}[5m])
```

### Grafana Dashboard

Import the dashboard template:

```bash
# Install Prometheus and Grafana
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace

# Access Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
# Visit http://localhost:3000 (admin/prom-operator)
```

Key metrics to monitor:

- Pod replica count over time
- CPU/Memory utilization
- Request rate and latency
- Scaling event frequency
- Error rate

## Troubleshooting Scenarios

### Scenario 1: HPA Shows `<unknown>` for Metrics

**Problem:**

```bash
$ kubectl get hpa -n spywatcher
NAME                      REFERENCE                        TARGETS           MINPODS   MAXPODS   REPLICAS
spywatcher-backend-hpa    Deployment/spywatcher-backend   <unknown>/70%     2         10        0
```

**Solution:**

```bash
# 1. Check metrics-server is running
kubectl get deployment metrics-server -n kube-system

# 2. Check metrics-server logs
kubectl logs -n kube-system deployment/metrics-server

# 3. Verify resource requests are set
kubectl get deployment spywatcher-backend -n spywatcher -o yaml | grep -A 4 resources

# 4. Wait a few minutes for metrics to populate
# 5. If still not working, restart metrics-server
kubectl rollout restart deployment/metrics-server -n kube-system
```

### Scenario 2: Pods Not Scaling Despite High Load

**Problem:**
CPU is at 90% but HPA is not scaling up.

**Solution:**

```bash
# 1. Check HPA target
kubectl describe hpa spywatcher-backend-hpa -n spywatcher

# 2. Verify HPA conditions
kubectl get hpa spywatcher-backend-hpa -n spywatcher -o yaml

# 3. Check for events
kubectl get events -n spywatcher | grep -i horizontal

# 4. Verify not at max replicas
kubectl get hpa -n spywatcher

# 5. Check scaling behavior configuration
kubectl get hpa spywatcher-backend-hpa -n spywatcher -o yaml | grep -A 20 behavior
```

### Scenario 3: Pods Scaling Too Frequently

**Problem:**
Pods constantly scaling up and down (flapping).

**Solution:**

```bash
# 1. Check scaling events
kubectl get events -n spywatcher | grep -i horizontal | tail -20

# 2. Adjust stabilization window (edit HPA)
kubectl edit hpa spywatcher-backend-hpa -n spywatcher

# Increase scaleDown.stabilizationWindowSeconds to 600 (10 minutes)
# Increase scaleUp.stabilizationWindowSeconds to 60 (1 minute)

# 3. Adjust scaling policies
# Edit to be more conservative:
# - Reduce scale-up percentage
# - Increase scale-down stabilization
# - Adjust CPU/Memory thresholds
```

### Scenario 4: Rolling Update Stuck

**Problem:**
New pods not starting during deployment.

**Solution:**

```bash
# 1. Check deployment status
kubectl rollout status deployment/spywatcher-backend -n spywatcher

# 2. Describe deployment
kubectl describe deployment spywatcher-backend -n spywatcher

# 3. Check pod events
kubectl get events -n spywatcher --sort-by='.lastTimestamp' | tail -20

# 4. Check if PDB is blocking
kubectl get pdb -n spywatcher
kubectl describe pdb spywatcher-backend-pdb -n spywatcher

# 5. Check node resources
kubectl describe nodes | grep -A 10 "Allocated resources"

# 6. If needed, pause and resume rollout
kubectl rollout pause deployment/spywatcher-backend -n spywatcher
# Fix the issue
kubectl rollout resume deployment/spywatcher-backend -n spywatcher

# 7. Last resort - restart rollout
kubectl rollout restart deployment/spywatcher-backend -n spywatcher
```

### Scenario 5: Uneven Load Distribution

**Problem:**
Some pods receiving more traffic than others.

**Solution:**

```bash
# 1. Check service endpoints
kubectl get endpoints spywatcher-backend -n spywatcher

# 2. Verify all pods are ready
kubectl get pods -n spywatcher -l tier=backend

# 3. Check readiness probe status
kubectl describe pods -n spywatcher -l tier=backend | grep -A 5 Readiness

# 4. Verify ingress configuration
kubectl describe ingress spywatcher-ingress -n spywatcher

# 5. Check session affinity settings
kubectl get svc spywatcher-backend -n spywatcher -o yaml | grep -A 5 sessionAffinity

# 6. Review load balancing algorithm in ingress
kubectl get ingress spywatcher-ingress -n spywatcher -o yaml | grep load-balance
```

## Advanced Configurations

### Custom Metrics with Prometheus Adapter

```bash
# 1. Install Prometheus Adapter
helm install prometheus-adapter prometheus-community/prometheus-adapter \
  --namespace monitoring \
  --set prometheus.url=http://prometheus-kube-prometheus-prometheus.monitoring.svc

# 2. Configure custom metrics
kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: adapter-config
  namespace: monitoring
data:
  config.yaml: |
    rules:
    - seriesQuery: 'http_requests_total{namespace="spywatcher"}'
      resources:
        overrides:
          namespace: {resource: "namespace"}
          pod: {resource: "pod"}
      name:
        matches: "^(.*)_total"
        as: "\${1}_per_second"
      metricsQuery: 'sum(rate(<<.Series>>{<<.LabelMatchers>>}[2m])) by (<<.GroupBy>>)'
EOF

# 3. Update HPA to use custom metrics
kubectl patch hpa spywatcher-backend-hpa -n spywatcher --type='json' -p='[
  {
    "op": "add",
    "path": "/spec/metrics/-",
    "value": {
      "type": "Pods",
      "pods": {
        "metric": {
          "name": "http_requests_per_second"
        },
        "target": {
          "type": "AverageValue",
          "averageValue": "1000"
        }
      }
    }
  }
]'
```

### Schedule-based Scaling

For predictable traffic patterns:

```bash
# Create CronJob to scale up before peak hours
kubectl apply -f - <<EOF
apiVersion: batch/v1
kind: CronJob
metadata:
  name: scale-up-peak-hours
  namespace: spywatcher
spec:
  schedule: "0 8 * * 1-5"  # 8 AM weekdays
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: scaler
          containers:
          - name: kubectl
            image: bitnami/kubectl:latest
            command:
            - /bin/sh
            - -c
            - |
              kubectl patch hpa spywatcher-backend-hpa -n spywatcher --type='json' -p='[
                {"op": "replace", "path": "/spec/minReplicas", "value": 5}
              ]'
          restartPolicy: OnFailure
---
apiVersion: batch/v1
kind: CronJob
metadata:
  name: scale-down-off-hours
  namespace: spywatcher
spec:
  schedule: "0 18 * * 1-5"  # 6 PM weekdays
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: scaler
          containers:
          - name: kubectl
            image: bitnami/kubectl:latest
            command:
            - /bin/sh
            - -c
            - |
              kubectl patch hpa spywatcher-backend-hpa -n spywatcher --type='json' -p='[
                {"op": "replace", "path": "/spec/minReplicas", "value": 2}
              ]'
          restartPolicy: OnFailure
EOF
```

### Vertical Pod Autoscaler (VPA)

For right-sizing resource requests:

```bash
# 1. Install VPA
git clone https://github.com/kubernetes/autoscaler.git
cd autoscaler/vertical-pod-autoscaler
./hack/vpa-up.sh

# 2. Create VPA for recommendations
kubectl apply -f - <<EOF
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: spywatcher-backend-vpa
  namespace: spywatcher
spec:
  targetRef:
    apiVersion: "apps/v1"
    kind: Deployment
    name: spywatcher-backend
  updatePolicy:
    updateMode: "Off"  # Recommendation only, no auto-updates
EOF

# 3. View recommendations
kubectl describe vpa spywatcher-backend-vpa -n spywatcher
```

### Multi-Metric Scaling

Scale based on multiple metrics:

```bash
kubectl apply -f - <<EOF
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: spywatcher-backend-hpa-advanced
  namespace: spywatcher
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: spywatcher-backend
  minReplicas: 2
  maxReplicas: 20
  metrics:
  # CPU-based scaling
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  # Memory-based scaling
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  # Custom metric: Request rate
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"
  # Custom metric: Queue depth
  - type: Pods
    pods:
      metric:
        name: queue_depth
      target:
        type: AverageValue
        averageValue: "100"
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 4
        periodSeconds: 15
      selectPolicy: Max
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
      - type: Pods
        value: 1
        periodSeconds: 60
      selectPolicy: Min
EOF
```

## Summary

This guide covered:

- ✅ Quick deployment and validation
- ✅ Production deployment procedures
- ✅ Auto-scaling testing and validation
- ✅ Monitoring and observability
- ✅ Common troubleshooting scenarios
- ✅ Advanced scaling configurations

For more information, see:

- [AUTO_SCALING.md](../AUTO_SCALING.md) - Detailed auto-scaling documentation
- [DEPLOYMENT.md](../DEPLOYMENT.md) - Deployment strategies
- [INFRASTRUCTURE.md](../INFRASTRUCTURE.md) - Infrastructure overview
- [MONITORING.md](../MONITORING.md) - Monitoring setup
