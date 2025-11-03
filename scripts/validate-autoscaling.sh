#!/bin/bash

# Validate Auto-scaling Configuration
# This script validates that auto-scaling and load balancing are properly configured

set -e

NAMESPACE="${NAMESPACE:-spywatcher}"
VERBOSE="${VERBOSE:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "Required command '$1' not found. Please install it."
        return 1
    fi
    return 0
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local missing=0
    
    if ! check_command kubectl; then
        missing=1
    fi
    
    if ! check_command jq; then
        log_warn "jq not found (optional, but recommended for better output)"
    fi
    
    if [ $missing -eq 1 ]; then
        log_error "Missing required commands. Please install them and try again."
        exit 1
    fi
    
    log_info "Prerequisites check passed ✓"
}

check_namespace() {
    log_info "Checking namespace '$NAMESPACE'..."
    
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_error "Namespace '$NAMESPACE' does not exist"
        return 1
    fi
    
    log_info "Namespace exists ✓"
    return 0
}

check_metrics_server() {
    log_info "Checking metrics-server..."
    
    if ! kubectl get deployment metrics-server -n kube-system &> /dev/null; then
        log_error "metrics-server not found. HPA requires metrics-server to function."
        log_error "Install with: kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml"
        return 1
    fi
    
    # Check if metrics-server is ready
    local ready=$(kubectl get deployment metrics-server -n kube-system -o jsonpath='{.status.readyReplicas}')
    local desired=$(kubectl get deployment metrics-server -n kube-system -o jsonpath='{.status.replicas}')
    
    if [ "$ready" != "$desired" ]; then
        log_warn "metrics-server is not fully ready ($ready/$desired replicas)"
        return 1
    fi
    
    log_info "metrics-server is running ✓"
    return 0
}

check_hpa() {
    local name=$1
    log_info "Checking HPA '$name'..."
    
    if ! kubectl get hpa "$name" -n "$NAMESPACE" &> /dev/null; then
        log_error "HPA '$name' not found"
        return 1
    fi
    
    # Get HPA status
    local current=$(kubectl get hpa "$name" -n "$NAMESPACE" -o jsonpath='{.status.currentReplicas}')
    local desired=$(kubectl get hpa "$name" -n "$NAMESPACE" -o jsonpath='{.status.desiredReplicas}')
    local min=$(kubectl get hpa "$name" -n "$NAMESPACE" -o jsonpath='{.spec.minReplicas}')
    local max=$(kubectl get hpa "$name" -n "$NAMESPACE" -o jsonpath='{.spec.maxReplicas}')
    
    log_info "  Current: $current, Desired: $desired, Min: $min, Max: $max"
    
    # Check if metrics are available
    local cpu_current=$(kubectl get hpa "$name" -n "$NAMESPACE" -o jsonpath='{.status.currentMetrics[?(@.type=="Resource")].resource.current.averageUtilization}' 2>/dev/null || echo "")
    
    if [ -z "$cpu_current" ] || [ "$cpu_current" = "<unknown>" ]; then
        log_warn "  CPU metrics not available yet (this is normal for new deployments)"
    else
        log_info "  CPU Utilization: $cpu_current%"
    fi
    
    # Check if current replicas is within range
    if [ "$current" -lt "$min" ] || [ "$current" -gt "$max" ]; then
        log_warn "  Current replicas ($current) outside of range [$min, $max]"
    fi
    
    log_info "HPA '$name' configuration ✓"
    return 0
}

check_deployment() {
    local name=$1
    log_info "Checking deployment '$name'..."
    
    if ! kubectl get deployment "$name" -n "$NAMESPACE" &> /dev/null; then
        log_error "Deployment '$name' not found"
        return 1
    fi
    
    # Check deployment status
    local ready=$(kubectl get deployment "$name" -n "$NAMESPACE" -o jsonpath='{.status.readyReplicas}')
    local desired=$(kubectl get deployment "$name" -n "$NAMESPACE" -o jsonpath='{.status.replicas}')
    local available=$(kubectl get deployment "$name" -n "$NAMESPACE" -o jsonpath='{.status.availableReplicas}')
    
    log_info "  Ready: $ready/$desired, Available: $available"
    
    if [ "$ready" != "$desired" ]; then
        log_warn "  Deployment not fully ready"
    fi
    
    # Check rolling update strategy
    local strategy=$(kubectl get deployment "$name" -n "$NAMESPACE" -o jsonpath='{.spec.strategy.type}')
    log_info "  Update Strategy: $strategy"
    
    if [ "$strategy" != "RollingUpdate" ]; then
        log_warn "  Update strategy is not RollingUpdate (current: $strategy)"
    fi
    
    # Check resource requests (required for HPA)
    local cpu_request=$(kubectl get deployment "$name" -n "$NAMESPACE" -o jsonpath='{.spec.template.spec.containers[0].resources.requests.cpu}')
    local mem_request=$(kubectl get deployment "$name" -n "$NAMESPACE" -o jsonpath='{.spec.template.spec.containers[0].resources.requests.memory}')
    
    if [ -z "$cpu_request" ] || [ -z "$mem_request" ]; then
        log_error "  Resource requests not set (required for HPA)"
        return 1
    fi
    
    log_info "  Resource Requests: CPU=$cpu_request, Memory=$mem_request"
    
    # Check health probes
    local liveness=$(kubectl get deployment "$name" -n "$NAMESPACE" -o jsonpath='{.spec.template.spec.containers[0].livenessProbe}')
    local readiness=$(kubectl get deployment "$name" -n "$NAMESPACE" -o jsonpath='{.spec.template.spec.containers[0].readinessProbe}')
    
    if [ -z "$liveness" ]; then
        log_warn "  Liveness probe not configured"
    else
        log_info "  Liveness probe configured ✓"
    fi
    
    if [ -z "$readiness" ]; then
        log_warn "  Readiness probe not configured"
    else
        log_info "  Readiness probe configured ✓"
    fi
    
    log_info "Deployment '$name' configuration ✓"
    return 0
}

check_service() {
    local name=$1
    log_info "Checking service '$name'..."
    
    if ! kubectl get service "$name" -n "$NAMESPACE" &> /dev/null; then
        log_error "Service '$name' not found"
        return 1
    fi
    
    # Check service type
    local type=$(kubectl get service "$name" -n "$NAMESPACE" -o jsonpath='{.spec.type}')
    log_info "  Type: $type"
    
    # Check endpoints
    local endpoints=$(kubectl get endpoints "$name" -n "$NAMESPACE" -o jsonpath='{.subsets[*].addresses[*].ip}' | wc -w)
    log_info "  Endpoints: $endpoints"
    
    if [ "$endpoints" -eq 0 ]; then
        log_warn "  No endpoints available (pods may not be ready)"
    fi
    
    log_info "Service '$name' configuration ✓"
    return 0
}

check_pdb() {
    local name=$1
    log_info "Checking PodDisruptionBudget '$name'..."
    
    if ! kubectl get pdb "$name" -n "$NAMESPACE" &> /dev/null; then
        log_warn "PodDisruptionBudget '$name' not found (recommended for production)"
        return 1
    fi
    
    local allowed=$(kubectl get pdb "$name" -n "$NAMESPACE" -o jsonpath='{.status.disruptionsAllowed}')
    local current=$(kubectl get pdb "$name" -n "$NAMESPACE" -o jsonpath='{.status.currentHealthy}')
    local desired=$(kubectl get pdb "$name" -n "$NAMESPACE" -o jsonpath='{.status.desiredHealthy}')
    
    log_info "  Allowed Disruptions: $allowed, Current: $current, Desired: $desired"
    
    log_info "PodDisruptionBudget '$name' configuration ✓"
    return 0
}

check_ingress() {
    local name=$1
    log_info "Checking ingress '$name'..."
    
    if ! kubectl get ingress "$name" -n "$NAMESPACE" &> /dev/null; then
        log_warn "Ingress '$name' not found"
        return 1
    fi
    
    # Check ingress class
    local class=$(kubectl get ingress "$name" -n "$NAMESPACE" -o jsonpath='{.spec.ingressClassName}')
    log_info "  Ingress Class: $class"
    
    # Check hosts
    local hosts=$(kubectl get ingress "$name" -n "$NAMESPACE" -o jsonpath='{.spec.rules[*].host}')
    log_info "  Hosts: $hosts"
    
    log_info "Ingress '$name' configuration ✓"
    return 0
}

test_pod_metrics() {
    log_info "Testing pod metrics availability..."
    
    if kubectl top pods -n "$NAMESPACE" &> /dev/null; then
        log_info "Pod metrics available ✓"
        
        if [ "$VERBOSE" = "true" ]; then
            kubectl top pods -n "$NAMESPACE"
        fi
        return 0
    else
        log_error "Pod metrics not available"
        return 1
    fi
}

generate_report() {
    log_info ""
    log_info "======================================"
    log_info "Auto-scaling Validation Report"
    log_info "======================================"
    log_info ""
    log_info "Namespace: $NAMESPACE"
    log_info "Timestamp: $(date)"
    log_info ""
    
    # Summary
    local checks_passed=0
    local checks_failed=0
    
    # Components to check
    declare -A components=(
        ["metrics-server"]="check_metrics_server"
        ["backend-hpa"]="check_hpa spywatcher-backend-hpa"
        ["frontend-hpa"]="check_hpa spywatcher-frontend-hpa"
        ["backend-deployment"]="check_deployment spywatcher-backend"
        ["frontend-deployment"]="check_deployment spywatcher-frontend"
        ["backend-service"]="check_service spywatcher-backend"
        ["frontend-service"]="check_service spywatcher-frontend"
        ["backend-pdb"]="check_pdb spywatcher-backend-pdb"
        ["frontend-pdb"]="check_pdb spywatcher-frontend-pdb"
        ["ingress"]="check_ingress spywatcher-ingress"
        ["pod-metrics"]="test_pod_metrics"
    )
    
    log_info "Component Status:"
    log_info ""
    
    for component in "${!components[@]}"; do
        if eval "${components[$component]}"; then
            log_info "  ✓ $component"
            ((checks_passed++))
        else
            log_error "  ✗ $component"
            ((checks_failed++))
        fi
        log_info ""
    done
    
    log_info "======================================"
    log_info "Summary:"
    log_info "  Passed: $checks_passed"
    log_info "  Failed: $checks_failed"
    log_info "======================================"
    log_info ""
    
    if [ $checks_failed -gt 0 ]; then
        log_error "Validation completed with $checks_failed failed checks"
        return 1
    else
        log_info "All checks passed successfully! ✓"
        return 0
    fi
}

main() {
    log_info "Starting auto-scaling validation..."
    log_info ""
    
    check_prerequisites
    
    if ! check_namespace; then
        log_error "Namespace check failed. Exiting."
        exit 1
    fi
    
    log_info ""
    generate_report
}

# Run main if script is executed directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main
fi
