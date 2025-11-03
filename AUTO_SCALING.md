# Auto-scaling & Load Balancing Guide

This document describes the auto-scaling and load balancing configuration for Spywatcher, ensuring dynamic resource scaling and zero-downtime deployments.

## Table of Contents

- [Overview](#overview)
- [Horizontal Pod Autoscaling (HPA)](#horizontal-pod-autoscaling-hpa)
- [Load Balancing Configuration](#load-balancing-configuration)
- [Health-based Routing](#health-based-routing)
- [Rolling Updates Strategy](#rolling-updates-strategy)
- [Zero-downtime Deployment](#zero-downtime-deployment)
- [Monitoring and Metrics](#monitoring-and-metrics)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

Spywatcher implements comprehensive auto-scaling and load balancing to handle variable workloads efficiently:

- **Horizontal Pod Autoscaling (HPA)**: Automatically scales pods based on CPU, memory, and custom metrics
- **Load Balancing**: Distributes traffic across healthy instances
- **Health Checks**: Removes unhealthy instances from rotation
- **Rolling Updates**: Zero-downtime deployments with gradual rollouts
- **Pod Disruption Budgets**: Ensures minimum availability during maintenance

## Horizontal Pod Autoscaling (HPA)

### Backend HPA

The backend service automatically scales between 2 and 10 replicas based on resource utilization:

```yaml
# k8s/base/backend-hpa.yaml
minReplicas: 2
maxReplicas: 10
metrics:
    - CPU: 70% average utilization
    - Memory: 80% average utilization
```

**Scaling Behavior:**

- **Scale Up**: Rapid response to load increases
    - 100% increase or 2 pods every 30 seconds
    - No stabilization window (immediate scale-up)
- **Scale Down**: Conservative to prevent flapping
    - 50% decrease or 1 pod every 60 seconds
    - 5-minute stabilization window

### Frontend HPA

The frontend service scales between 2 and 5 replicas:

```yaml
# k8s/base/frontend-hpa.yaml
minReplicas: 2
maxReplicas: 5
metrics:
    - CPU: 70% average utilization
    - Memory: 80% average utilization
```

**Scaling Behavior:**

- Same aggressive scale-up policy
- Conservative scale-down with 5-minute stabilization

### Custom Metrics (Optional)

For advanced scaling, configure custom metrics using Prometheus adapter:

```yaml
# Additional metrics can be added:
- http_requests_per_second: scale at 1000 rps/pod
- active_connections: scale at 100 connections/pod
- queue_depth: scale based on message queue length
```

**Setup Requirements:**

1. Install Prometheus Operator
2. Install Prometheus Adapter
3. Configure custom metrics API
4. Uncomment custom metrics in HPA configuration

### Checking HPA Status

```bash
# View HPA status
kubectl get hpa -n spywatcher

# Detailed HPA information
kubectl describe hpa spywatcher-backend-hpa -n spywatcher

# Watch HPA in real-time
kubectl get hpa -n spywatcher --watch

# View HPA events
kubectl get events -n spywatcher | grep -i horizontal
```

## Load Balancing Configuration

### NGINX Ingress Load Balancing

The ingress controller implements intelligent load balancing:

**Load Balancing Algorithm:**

- **EWMA (Exponentially Weighted Moving Average)**: Distributes requests based on response time
- Automatically favors faster backends
- Provides better performance than round-robin

**Connection Management:**

```yaml
upstream-keepalive-connections: 100
upstream-keepalive-timeout: 60s
upstream-keepalive-requests: 100
```

**Session Affinity:**

- Hash-based routing using client IP
- Sticky sessions for WebSocket connections
- 3-hour timeout for backend sessions

### AWS Load Balancer

For AWS deployments, the ALB/NLB provides:

**Features:**

- Cross-zone load balancing (traffic distributed across all AZs)
- Connection draining (60-second timeout for graceful shutdown)
- Health checks every 30 seconds
- HTTP/2 support enabled
- Deletion protection enabled

**Health Check Configuration:**

```yaml
Path: /health/live
Interval: 30s
Timeout: 5s
Healthy Threshold: 2
Unhealthy Threshold: 3
```

### Service-level Load Balancing

Kubernetes services use ClusterIP with client IP session affinity:

```yaml
sessionAffinity: ClientIP
sessionAffinityConfig:
    clientIP:
        timeoutSeconds: 10800 # 3 hours
```

## Health-based Routing

### Health Check Endpoints

**Backend Health Checks:**

- **Liveness**: `/health/live` - Container is alive
- **Readiness**: `/health/ready` - Ready to serve traffic
- **Startup**: `/health/live` - Slow startup tolerance

**Frontend Health Checks:**

- **Liveness**: `/` - NGINX is responding
- **Readiness**: `/` - Ready to serve traffic

### Health Check Configuration

**Backend:**

```yaml
livenessProbe:
    httpGet:
        path: /health/live
        port: 3001
    initialDelaySeconds: 30
    periodSeconds: 10
    timeoutSeconds: 5
    failureThreshold: 3

readinessProbe:
    httpGet:
        path: /health/ready
        port: 3001
    initialDelaySeconds: 10
    periodSeconds: 5
    timeoutSeconds: 3
    failureThreshold: 3

startupProbe:
    httpGet:
        path: /health/live
        port: 3001
    periodSeconds: 10
    failureThreshold: 30 # 5 minutes total
```

### Automatic Retry Logic

The ingress controller automatically retries failed requests:

```yaml
proxy-next-upstream: 'error timeout http_502 http_503 http_504'
proxy-next-upstream-tries: 3
proxy-next-upstream-timeout: 10s
```

**Behavior:**

- Retries on backend errors, timeouts, 502/503/504
- Maximum 3 attempts
- 10-second timeout for retries
- Automatically routes to healthy backends

### Removing Unhealthy Instances

Instances are removed from load balancer rotation when:

1. Readiness probe fails 3 consecutive times (15 seconds)
2. Health check endpoint returns non-200 status
3. Request timeout exceeds threshold
4. Container becomes unresponsive

**Recovery:**

- Readiness probe must succeed before pod receives traffic
- 2 consecutive successful health checks required
- Gradual traffic restoration

## Rolling Updates Strategy

### Deployment Strategy

Both backend and frontend use RollingUpdate strategy:

```yaml
strategy:
    type: RollingUpdate
    rollingUpdate:
        maxSurge: 1 # 1 extra pod during update
        maxUnavailable: 0 # All pods must be available
```

**Benefits:**

- Zero downtime - at least minimum pods always available
- Gradual rollout - one pod at a time
- Automatic rollback on failure
- No service interruption

### Update Process

**Step-by-step:**

1. New pod with updated image is created (maxSurge: 1)
2. New pod passes startup probe (up to 5 minutes)
3. New pod passes readiness probe
4. New pod receives traffic from load balancer
5. Old pod is marked for termination
6. Load balancer drains connections from old pod (60s)
7. Old pod receives SIGTERM signal
8. Graceful shutdown (30s timeout)
9. Process repeats for next pod

### Revision History

Keep last 10 revisions for rollback:

```yaml
revisionHistoryLimit: 10
```

**View revision history:**

```bash
kubectl rollout history deployment/spywatcher-backend -n spywatcher
```

## Zero-downtime Deployment

### Requirements Checklist

- [x] Multiple replicas (minimum 2)
- [x] Health checks configured (liveness, readiness, startup)
- [x] Pod Disruption Budget (minAvailable: 1)
- [x] Rolling update strategy (maxUnavailable: 0)
- [x] Graceful shutdown handling
- [x] Connection draining
- [x] Pre-stop hooks (if needed)

### Deployment Process

**Using kubectl:**

```bash
# Update image
kubectl set image deployment/spywatcher-backend \
  backend=ghcr.io/subculture-collective/spywatcher-backend:v2.0.0 \
  -n spywatcher

# Watch rollout status
kubectl rollout status deployment/spywatcher-backend -n spywatcher

# Pause rollout (if issues detected)
kubectl rollout pause deployment/spywatcher-backend -n spywatcher

# Resume rollout
kubectl rollout resume deployment/spywatcher-backend -n spywatcher

# Rollback if needed
kubectl rollout undo deployment/spywatcher-backend -n spywatcher
```

**Using Kustomize:**

```bash
# Update image tag in kustomization.yaml
kubectl apply -k k8s/overlays/production

# Monitor rollout
kubectl rollout status deployment/spywatcher-backend -n spywatcher
```

### Graceful Shutdown

Applications must handle SIGTERM signal:

```javascript
// Backend graceful shutdown example
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, starting graceful shutdown');

    // Stop accepting new connections
    server.close(() => {
        console.log('Server closed');
    });

    // Close database connections
    await prisma.$disconnect();

    // Close Redis connections
    await redis.quit();

    // Exit process
    process.exit(0);
});
```

**Kubernetes termination flow:**

1. Pod marked for termination
2. Removed from service endpoints (stops receiving new traffic)
3. SIGTERM sent to container
4. Grace period starts (default 30s)
5. Container performs cleanup
6. If not terminated after grace period, SIGKILL sent

### Connection Draining

**Load Balancer Level:**

- 60-second connection draining
- Existing connections allowed to complete
- No new connections routed to terminating pod

**Application Level:**

- Stop accepting new requests
- Complete in-flight requests
- Close persistent connections gracefully

### Pod Disruption Budget

Ensures minimum availability during voluntary disruptions:

```yaml
# k8s/base/pdb.yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
    name: spywatcher-backend-pdb
spec:
    minAvailable: 1 # At least 1 pod must be available
    selector:
        matchLabels:
            app: spywatcher
            tier: backend
```

**Protects against:**

- Node drain operations
- Voluntary evictions
- Cluster upgrades
- Node maintenance

## Monitoring and Metrics

### HPA Metrics

```bash
# View current metrics
kubectl get hpa -n spywatcher

# Detailed metrics
kubectl describe hpa spywatcher-backend-hpa -n spywatcher

# Raw metrics from metrics-server
kubectl top pods -n spywatcher
kubectl top nodes
```

### Scaling Events

```bash
# View scaling events
kubectl get events -n spywatcher | grep -i horizontal

# Watch for scaling events
kubectl get events -n spywatcher --watch | grep -i horizontal
```

### Load Balancer Metrics

**AWS CloudWatch Metrics:**

- Target health count
- Request count
- Response time
- HTTP status codes
- Connection count

**Prometheus Metrics:**

```promql
# Request rate
rate(http_requests_total[5m])

# Average response time
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Pod count
count(kube_pod_status_phase{namespace="spywatcher", phase="Running"})

# HPA current replicas
kube_horizontalpodautoscaler_status_current_replicas{namespace="spywatcher"}
```

### Alerting Rules

**Recommended Alerts:**

```yaml
# HPA at max capacity
- alert: HPAMaxedOut
  expr: |
      kube_horizontalpodautoscaler_status_current_replicas
      >= kube_horizontalpodautoscaler_spec_max_replicas
  for: 15m
  labels:
      severity: warning
  annotations:
      summary: HPA has reached maximum replicas

# High scaling frequency
- alert: FrequentScaling
  expr: |
      rate(kube_horizontalpodautoscaler_status_current_replicas[15m]) > 0.5
  for: 30m
  labels:
      severity: warning
  annotations:
      summary: HPA is scaling frequently

# Deployment rollout stuck
- alert: RolloutStuck
  expr: |
      kube_deployment_status_replicas_updated
      < kube_deployment_spec_replicas
  for: 15m
  labels:
      severity: critical
  annotations:
      summary: Deployment rollout is stuck
```

## Troubleshooting

### HPA Not Scaling

**Symptoms:**

- HPA shows `<unknown>` for metrics
- Pods not scaling despite high load

**Solutions:**

1. **Check metrics-server is running:**

```bash
kubectl get deployment metrics-server -n kube-system
kubectl logs -n kube-system deployment/metrics-server
```

2. **Verify resource requests are set:**

```bash
kubectl describe deployment spywatcher-backend -n spywatcher | grep -A 5 Requests
```

3. **Check HPA events:**

```bash
kubectl describe hpa spywatcher-backend-hpa -n spywatcher
```

4. **Verify metrics are available:**

```bash
kubectl top pods -n spywatcher
```

### Pods Not Receiving Traffic

**Symptoms:**

- Pods are running but not receiving requests
- High load on some pods, idle others

**Solutions:**

1. **Check readiness probe:**

```bash
kubectl describe pod <pod-name> -n spywatcher | grep -A 10 Readiness
```

2. **Verify service endpoints:**

```bash
kubectl get endpoints spywatcher-backend -n spywatcher
```

3. **Check ingress configuration:**

```bash
kubectl describe ingress spywatcher-ingress -n spywatcher
```

4. **Test health endpoint directly:**

```bash
kubectl port-forward pod/<pod-name> 3001:3001 -n spywatcher
curl http://localhost:3001/health/ready
```

### Rolling Update Stuck

**Symptoms:**

- Deployment shows pods pending
- Old pods not terminating
- Update taking too long

**Solutions:**

1. **Check rollout status:**

```bash
kubectl rollout status deployment/spywatcher-backend -n spywatcher
kubectl describe deployment spywatcher-backend -n spywatcher
```

2. **View pod events:**

```bash
kubectl get events -n spywatcher --sort-by='.lastTimestamp' | grep -i error
```

3. **Check PDB is not blocking:**

```bash
kubectl get pdb -n spywatcher
```

4. **Verify node resources:**

```bash
kubectl describe nodes | grep -A 5 "Allocated resources"
```

5. **Force rollout (last resort):**

```bash
kubectl rollout restart deployment/spywatcher-backend -n spywatcher
```

### High Latency During Scaling

**Symptoms:**

- Response times increase during scale-up
- Connections failing during scale-down

**Solutions:**

1. **Adjust readiness probe:**
    - Reduce initialDelaySeconds
    - Increase periodSeconds for stability

2. **Configure connection draining:**
    - Ensure pre-stop hooks are configured
    - Increase termination grace period

3. **Optimize startup time:**
    - Use startup probe for slow-starting apps
    - Reduce container image size
    - Implement application-level warmup

4. **Review HPA behavior:**
    - Adjust stabilization windows
    - Modify scale-up/down policies
    - Consider custom metrics

## Best Practices

### Design for Auto-scaling

1. **Stateless Applications**
    - Store state externally (Redis, database)
    - Enable horizontal scaling
    - Simplify deployment and recovery

2. **Resource Requests and Limits**
    - Always set resource requests (required for HPA)
    - Set realistic limits based on actual usage
    - Leave headroom for traffic spikes

3. **Proper Health Checks**
    - Implement meaningful health endpoints
    - Check external dependencies
    - Use startup probes for slow initialization

4. **Graceful Shutdown**
    - Handle SIGTERM signal
    - Complete in-flight requests
    - Close connections cleanly
    - Set appropriate termination grace period

### Scaling Strategy

1. **Conservative Scale-down**
    - Use longer stabilization windows
    - Prevent flapping
    - Reduce pod churn

2. **Aggressive Scale-up**
    - Respond quickly to load increases
    - Prevent service degradation
    - Better user experience

3. **Set Realistic Limits**
    - Maximum replicas based on cluster capacity
    - Minimum replicas for redundancy
    - Consider cost vs. performance trade-offs

4. **Monitor and Adjust**
    - Review scaling patterns regularly
    - Adjust thresholds based on actual load
    - Optimize resource requests

### Load Balancing

1. **Health Check Tuning**
    - Balance between responsiveness and stability
    - Consider application startup time
    - Use appropriate timeout values

2. **Connection Management**
    - Enable keepalive connections
    - Configure appropriate timeouts
    - Use connection pooling

3. **Session Affinity**
    - Use for stateful sessions
    - Configure appropriate timeout
    - Consider sticky sessions for WebSockets

4. **Cross-zone Distribution**
    - Enable cross-zone load balancing
    - Use pod anti-affinity rules
    - Distribute across availability zones

### Deployment Strategy

1. **Test in Staging First**
    - Validate changes in non-production
    - Test auto-scaling behavior
    - Verify health checks work correctly

2. **Monitor During Rollout**
    - Watch error rates
    - Check response times
    - Monitor resource usage

3. **Progressive Delivery**
    - Use canary deployments for risky changes
    - Implement feature flags
    - Have rollback plan ready

4. **Database Migrations**
    - Run migrations before code deployment
    - Ensure backward compatibility
    - Test rollback scenarios

### Cost Optimization

1. **Right-size Resources**
    - Set requests based on actual usage
    - Use VPA (Vertical Pod Autoscaler) for recommendations
    - Review and adjust regularly

2. **Efficient Scaling**
    - Scale based on meaningful metrics
    - Avoid over-provisioning
    - Use cluster autoscaler for nodes

3. **Schedule-based Scaling**
    - Reduce replicas during off-peak hours
    - Use CronJobs for scheduled scaling
    - Consider regional traffic patterns

4. **Resource Quotas**
    - Set namespace quotas
    - Prevent runaway scaling
    - Control costs

## References

- [Kubernetes HPA Documentation](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
- [Kubernetes Rolling Updates](https://kubernetes.io/docs/tutorials/kubernetes-basics/update/update-intro/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/)
- [Pod Disruption Budgets](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/)

## Support

For issues with auto-scaling or load balancing:

- Check monitoring dashboards
- Review HPA and deployment events
- Consult CloudWatch/Prometheus metrics
- Contact DevOps team
