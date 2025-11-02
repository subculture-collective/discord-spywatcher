#!/bin/bash
set -e

# Blue-Green Deployment Script for Spywatcher
# This script performs zero-downtime deployments by maintaining two identical environments

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
HEALTH_CHECK_RETRIES="${HEALTH_CHECK_RETRIES:-10}"
HEALTH_CHECK_INTERVAL="${HEALTH_CHECK_INTERVAL:-10}"

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

# Function to check if a deployment exists
deployment_exists() {
    kubectl get deployment "$1" -n "$NAMESPACE" &> /dev/null
}

# Function to get current active environment
get_active_environment() {
    local service_selector=$(kubectl get service "$APP_NAME" -n "$NAMESPACE" -o jsonpath='{.spec.selector.version}')
    echo "$service_selector"
}

# Function to perform health check
health_check() {
    local deployment=$1
    local retries=$HEALTH_CHECK_RETRIES
    
    print_info "Performing health check on $deployment..."
    
    while [ $retries -gt 0 ]; do
        # Get pod name
        local pod=$(kubectl get pods -n "$NAMESPACE" -l app=spywatcher,version=$deployment -o jsonpath='{.items[0].metadata.name}')
        
        if [ -z "$pod" ]; then
            print_warning "No pod found for $deployment, retrying..."
            sleep $HEALTH_CHECK_INTERVAL
            retries=$((retries - 1))
            continue
        fi
        
        # Check if pod is running
        local pod_status=$(kubectl get pod "$pod" -n "$NAMESPACE" -o jsonpath='{.status.phase}')
        if [ "$pod_status" != "Running" ]; then
            print_warning "Pod $pod is not running (status: $pod_status), retrying..."
            sleep $HEALTH_CHECK_INTERVAL
            retries=$((retries - 1))
            continue
        fi
        
        # Perform HTTP health check
        if kubectl exec "$pod" -n "$NAMESPACE" -- wget -q -O- "http://localhost:3001$HEALTH_CHECK_PATH" &> /dev/null; then
            print_info "Health check passed for $deployment"
            return 0
        else
            print_warning "Health check failed for $deployment, retrying..."
            sleep $HEALTH_CHECK_INTERVAL
            retries=$((retries - 1))
        fi
    done
    
    print_error "Health check failed after $HEALTH_CHECK_RETRIES retries"
    return 1
}

# Main deployment logic
main() {
    print_info "Starting Blue-Green deployment for $APP_NAME"
    print_info "Namespace: $NAMESPACE"
    print_info "Image Tag: $IMAGE_TAG"
    
    # Determine current active environment
    local current_env=$(get_active_environment)
    
    if [ -z "$current_env" ]; then
        # No active environment, default to blue
        current_env="blue"
        new_env="green"
        print_info "No active environment found, will deploy to green"
    elif [ "$current_env" = "blue" ]; then
        new_env="green"
    else
        new_env="blue"
    fi
    
    print_info "Current active environment: $current_env"
    print_info "Deploying to: $new_env"
    
    # Create or update new environment deployment
    local new_deployment="$APP_NAME-$new_env"
    
    # Apply deployment
    kubectl set image "deployment/$new_deployment" \
        backend="ghcr.io/subculture-collective/spywatcher-backend:$IMAGE_TAG" \
        -n "$NAMESPACE" 2>/dev/null || \
    kubectl create deployment "$new_deployment" \
        --image="ghcr.io/subculture-collective/spywatcher-backend:$IMAGE_TAG" \
        -n "$NAMESPACE"
    
    # Label the deployment
    kubectl label deployment "$new_deployment" app=spywatcher version=$new_env -n "$NAMESPACE" --overwrite
    
    # Wait for deployment to be ready
    print_info "Waiting for deployment $new_deployment to be ready..."
    kubectl rollout status "deployment/$new_deployment" -n "$NAMESPACE" --timeout=5m
    
    # Perform health checks
    if ! health_check "$new_env"; then
        print_error "Health check failed for $new_env environment"
        print_error "Keeping traffic on $current_env environment"
        exit 1
    fi
    
    # Update service selector to point to new environment
    print_info "Switching traffic to $new_env environment..."
    kubectl patch service "$APP_NAME" -n "$NAMESPACE" \
        -p "{\"spec\":{\"selector\":{\"version\":\"$new_env\"}}}"
    
    print_info "Traffic successfully switched to $new_env"
    
    # Wait a bit before considering old environment for removal
    print_info "Waiting 60 seconds before cleaning up old environment..."
    sleep 60
    
    # Optional: Scale down old environment instead of deleting
    if deployment_exists "$APP_NAME-$current_env"; then
        print_info "Scaling down old environment: $current_env"
        kubectl scale deployment "$APP_NAME-$current_env" --replicas=0 -n "$NAMESPACE"
        print_info "Old environment scaled to 0 replicas (can be used for quick rollback)"
    fi
    
    print_info "Blue-Green deployment completed successfully!"
    print_info "Active environment: $new_env"
}

# Rollback function
rollback() {
    print_warning "Rolling back deployment..."
    
    local current_env=$(get_active_environment)
    local previous_env
    
    if [ "$current_env" = "blue" ]; then
        previous_env="green"
    else
        previous_env="blue"
    fi
    
    # Check if previous environment exists
    if ! deployment_exists "$APP_NAME-$previous_env"; then
        print_error "Previous environment $previous_env does not exist, cannot rollback"
        exit 1
    fi
    
    # Scale up previous environment if it's scaled down
    local replicas=$(kubectl get deployment "$APP_NAME-$previous_env" -n "$NAMESPACE" -o jsonpath='{.spec.replicas}')
    if [ "$replicas" -eq 0 ]; then
        print_info "Scaling up previous environment: $previous_env"
        kubectl scale deployment "$APP_NAME-$previous_env" --replicas=3 -n "$NAMESPACE"
        kubectl rollout status "deployment/$APP_NAME-$previous_env" -n "$NAMESPACE" --timeout=5m
    fi
    
    # Switch traffic back
    print_info "Switching traffic back to $previous_env"
    kubectl patch service "$APP_NAME" -n "$NAMESPACE" \
        -p "{\"spec\":{\"selector\":{\"version\":\"$previous_env\"}}}"
    
    print_info "Rollback completed successfully!"
    print_info "Active environment: $previous_env"
}

# Check if rollback flag is set
if [ "$1" = "--rollback" ]; then
    rollback
else
    main
fi
