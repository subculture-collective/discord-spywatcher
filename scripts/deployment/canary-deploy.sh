#!/bin/bash
set -e

# Canary Deployment Script for Spywatcher
# This script gradually shifts traffic to a new version while monitoring for errors

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="${NAMESPACE:-spywatcher}"
APP_NAME="${APP_NAME:-spywatcher-backend}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
HEALTH_CHECK_PATH="${HEALTH_CHECK_PATH:-/health/ready}"

# Canary rollout percentages
CANARY_STEPS="${CANARY_STEPS:-5 25 50 75 100}"
CANARY_WAIT="${CANARY_WAIT:-60}"  # Wait time between steps in seconds

# Error thresholds
ERROR_THRESHOLD="${ERROR_THRESHOLD:-5}"  # Max error percentage before rollback

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check deployment health
check_health() {
    local deployment=$1
    local replicas=$(kubectl get deployment "$deployment" -n "$NAMESPACE" -o jsonpath='{.status.readyReplicas}')
    local desired=$(kubectl get deployment "$deployment" -n "$NAMESPACE" -o jsonpath='{.spec.replicas}')
    
    if [ "$replicas" = "$desired" ] && [ "$replicas" -gt 0 ]; then
        return 0
    else
        return 1
    fi
}

# Function to check error rate (simplified - you should integrate with your monitoring system)
check_error_rate() {
    local deployment=$1
    
    # Get pod logs and check for errors
    local pods=$(kubectl get pods -n "$NAMESPACE" -l app=spywatcher,version=canary -o jsonpath='{.items[*].metadata.name}')
    
    if [ -z "$pods" ]; then
        print_warning "No canary pods found"
        return 0
    fi
    
    # Simple error check - count ERROR log entries
    local error_count=0
    for pod in $pods; do
        local pod_errors=$(kubectl logs "$pod" -n "$NAMESPACE" --tail=100 | grep -c "ERROR" || true)
        error_count=$((error_count + pod_errors))
    done
    
    print_info "Detected $error_count errors in canary pods"
    
    if [ "$error_count" -gt "$ERROR_THRESHOLD" ]; then
        return 1
    else
        return 0
    fi
}

# Function to update traffic weights
update_traffic_weight() {
    local canary_weight=$1
    local stable_weight=$((100 - canary_weight))
    
    print_info "Adjusting traffic: Canary $canary_weight%, Stable $stable_weight%"
    
    # Calculate replica counts based on percentages
    local total_replicas=3
    local canary_replicas=$(( (total_replicas * canary_weight + 50) / 100 ))
    local stable_replicas=$((total_replicas - canary_replicas))
    
    # Ensure at least 1 replica
    [ "$canary_replicas" -eq 0 ] && canary_replicas=1
    [ "$stable_replicas" -eq 0 ] && stable_replicas=1
    
    # Scale deployments
    kubectl scale deployment "$APP_NAME-canary" --replicas=$canary_replicas -n "$NAMESPACE"
    kubectl scale deployment "$APP_NAME-stable" --replicas=$stable_replicas -n "$NAMESPACE"
    
    # Wait for scaling to complete
    kubectl rollout status "deployment/$APP_NAME-canary" -n "$NAMESPACE" --timeout=2m
    kubectl rollout status "deployment/$APP_NAME-stable" -n "$NAMESPACE" --timeout=2m
}

# Function to promote canary to stable
promote_canary() {
    print_info "Promoting canary to stable..."
    
    # Update stable deployment with canary image
    local canary_image=$(kubectl get deployment "$APP_NAME-canary" -n "$NAMESPACE" -o jsonpath='{.spec.template.spec.containers[0].image}')
    
    kubectl set image "deployment/$APP_NAME-stable" backend="$canary_image" -n "$NAMESPACE"
    kubectl rollout status "deployment/$APP_NAME-stable" -n "$NAMESPACE" --timeout=5m
    
    # Scale stable back to full capacity
    kubectl scale deployment "$APP_NAME-stable" --replicas=3 -n "$NAMESPACE"
    
    # Remove canary deployment
    kubectl delete deployment "$APP_NAME-canary" -n "$NAMESPACE" --ignore-not-found=true
    
    print_info "Canary promoted to stable successfully!"
}

# Function to rollback canary
rollback_canary() {
    print_error "Rolling back canary deployment..."
    
    # Delete canary deployment
    kubectl delete deployment "$APP_NAME-canary" -n "$NAMESPACE" --ignore-not-found=true
    
    # Ensure stable is at full capacity
    kubectl scale deployment "$APP_NAME-stable" --replicas=3 -n "$NAMESPACE"
    
    print_info "Canary deployment rolled back"
}

# Main deployment logic
main() {
    print_info "Starting Canary deployment for $APP_NAME"
    print_info "Namespace: $NAMESPACE"
    print_info "Image Tag: $IMAGE_TAG"
    print_info "Canary steps: $CANARY_STEPS"
    
    # Ensure stable deployment exists
    if ! kubectl get deployment "$APP_NAME-stable" -n "$NAMESPACE" &> /dev/null; then
        # If stable doesn't exist, copy from existing deployment
        if kubectl get deployment "$APP_NAME" -n "$NAMESPACE" &> /dev/null; then
            print_info "Creating stable deployment from existing deployment"
            kubectl get deployment "$APP_NAME" -n "$NAMESPACE" -o yaml | \
                sed "s/name: $APP_NAME$/name: $APP_NAME-stable/" | \
                kubectl apply -f -
            # Update the original deployment name if needed
            kubectl label deployment "$APP_NAME-stable" version=stable -n "$NAMESPACE" --overwrite
        else
            print_error "No existing deployment found"
            exit 1
        fi
    fi
    
    # Create canary deployment
    print_info "Creating canary deployment..."
    kubectl get deployment "$APP_NAME-stable" -n "$NAMESPACE" -o yaml | \
        sed "s/$APP_NAME-stable/$APP_NAME-canary/g" | \
        sed "s/version: stable/version: canary/g" | \
        kubectl apply -f -
    
    # Update canary image
    kubectl set image "deployment/$APP_NAME-canary" \
        backend="ghcr.io/subculture-collective/spywatcher-backend:$IMAGE_TAG" \
        -n "$NAMESPACE"
    
    kubectl label deployment "$APP_NAME-canary" version=canary -n "$NAMESPACE" --overwrite
    
    # Start with minimal canary traffic
    kubectl scale deployment "$APP_NAME-canary" --replicas=1 -n "$NAMESPACE"
    kubectl rollout status "deployment/$APP_NAME-canary" -n "$NAMESPACE" --timeout=5m
    
    # Gradually shift traffic
    for step in $CANARY_STEPS; do
        print_info "Canary rollout: ${step}%"
        
        # Update traffic weights
        update_traffic_weight "$step"
        
        # Wait for the step duration
        print_info "Waiting ${CANARY_WAIT}s before next step..."
        sleep "$CANARY_WAIT"
        
        # Check health
        if ! check_health "$APP_NAME-canary"; then
            print_error "Canary health check failed"
            rollback_canary
            exit 1
        fi
        
        # Check error rate
        if ! check_error_rate "$APP_NAME-canary"; then
            print_error "Canary error rate exceeded threshold"
            rollback_canary
            exit 1
        fi
        
        print_info "Step ${step}% completed successfully"
    done
    
    # Promote canary to stable
    promote_canary
    
    print_info "Canary deployment completed successfully!"
}

# Run main function
main
