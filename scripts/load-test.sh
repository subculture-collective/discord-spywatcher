#!/bin/bash

# Load Testing Script for Auto-scaling Validation
# This script generates load to test auto-scaling behavior

set -e

# Configuration
NAMESPACE="${NAMESPACE:-spywatcher}"
TARGET_URL="${TARGET_URL:-http://localhost:3001/health/live}"
DURATION="${DURATION:-300}"  # 5 minutes default
CONCURRENT_REQUESTS="${CONCURRENT_REQUESTS:-50}"
REQUESTS_PER_SECOND="${REQUESTS_PER_SECOND:-100}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_tools() {
    log_info "Checking required tools..."
    
    local missing=0
    
    # Check for load testing tools
    if ! command -v ab &> /dev/null && ! command -v wrk &> /dev/null && ! command -v hey &> /dev/null; then
        log_error "No load testing tool found. Please install one of: ab (apache-bench), wrk, or hey"
        log_info "Install options:"
        log_info "  - ab: apt-get install apache2-utils (Ubuntu) or brew install httpd (Mac)"
        log_info "  - wrk: apt-get install wrk (Ubuntu) or brew install wrk (Mac)"
        log_info "  - hey: go install github.com/rakyll/hey@latest"
        missing=1
    fi
    
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl not found"
        missing=1
    fi
    
    if [ $missing -eq 1 ]; then
        exit 1
    fi
    
    log_info "All required tools found ✓"
}

get_service_url() {
    log_info "Getting service URL..."
    
    # Try to get ingress URL
    local ingress_host=$(kubectl get ingress spywatcher-ingress -n "$NAMESPACE" -o jsonpath='{.spec.rules[0].host}' 2>/dev/null || echo "")
    
    if [ -n "$ingress_host" ]; then
        TARGET_URL="https://${ingress_host}/health/live"
        log_info "Using ingress URL: $TARGET_URL"
        return 0
    fi
    
    # Try to get LoadBalancer external IP
    local lb_ip=$(kubectl get svc spywatcher-backend -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
    
    if [ -n "$lb_ip" ]; then
        TARGET_URL="http://${lb_ip}/health/live"
        log_info "Using LoadBalancer URL: $TARGET_URL"
        return 0
    fi
    
    # Use port-forward as fallback
    log_warn "No external URL found. Will use port-forward."
    log_warn "Please ensure the service is accessible or set TARGET_URL environment variable"
    return 1
}

monitor_hpa() {
    log_info "Monitoring HPA during load test..."
    log_info "Press Ctrl+C to stop monitoring"
    
    while true; do
        clear
        echo "======================================"
        echo "HPA Status - $(date '+%H:%M:%S')"
        echo "======================================"
        echo ""
        
        kubectl get hpa -n "$NAMESPACE"
        
        echo ""
        echo "Pod Status:"
        kubectl get pods -n "$NAMESPACE" -l app=spywatcher,tier=backend --no-headers | wc -l | xargs echo "Backend pods:"
        kubectl get pods -n "$NAMESPACE" -l app=spywatcher,tier=frontend --no-headers | wc -l | xargs echo "Frontend pods:"
        
        echo ""
        echo "Resource Usage:"
        kubectl top pods -n "$NAMESPACE" -l app=spywatcher,tier=backend 2>/dev/null || echo "Metrics not available yet"
        
        sleep 5
    done
}

run_load_test_ab() {
    local total_requests=$((REQUESTS_PER_SECOND * DURATION))
    
    log_info "Running load test with Apache Bench (ab)..."
    log_info "  Target: $TARGET_URL"
    log_info "  Duration: ${DURATION}s"
    log_info "  Concurrent: $CONCURRENT_REQUESTS"
    log_info "  Total Requests: $total_requests"
    
    ab -n "$total_requests" -c "$CONCURRENT_REQUESTS" -t "$DURATION" "$TARGET_URL"
}

run_load_test_wrk() {
    log_info "Running load test with wrk..."
    log_info "  Target: $TARGET_URL"
    log_info "  Duration: ${DURATION}s"
    log_info "  Concurrent: $CONCURRENT_REQUESTS"
    
    wrk -t "$CONCURRENT_REQUESTS" -c "$CONCURRENT_REQUESTS" -d "${DURATION}s" "$TARGET_URL"
}

run_load_test_hey() {
    local total_requests=$((REQUESTS_PER_SECOND * DURATION))
    
    log_info "Running load test with hey..."
    log_info "  Target: $TARGET_URL"
    log_info "  Duration: ${DURATION}s"
    log_info "  Concurrent: $CONCURRENT_REQUESTS"
    log_info "  Total Requests: $total_requests"
    
    hey -z "${DURATION}s" -c "$CONCURRENT_REQUESTS" -q "$REQUESTS_PER_SECOND" "$TARGET_URL"
}

run_load_test() {
    # Determine which tool to use
    if command -v hey &> /dev/null; then
        run_load_test_hey
    elif command -v wrk &> /dev/null; then
        run_load_test_wrk
    elif command -v ab &> /dev/null; then
        run_load_test_ab
    else
        log_error "No load testing tool available"
        exit 1
    fi
}

watch_scaling() {
    log_info "Starting HPA monitoring in background..."
    
    # Start monitoring in background
    (
        while true; do
            timestamp=$(date '+%Y-%m-%d %H:%M:%S')
            backend_replicas=$(kubectl get hpa spywatcher-backend-hpa -n "$NAMESPACE" -o jsonpath='{.status.currentReplicas}' 2>/dev/null || echo "N/A")
            backend_cpu=$(kubectl get hpa spywatcher-backend-hpa -n "$NAMESPACE" -o jsonpath='{.status.currentMetrics[0].resource.current.averageUtilization}' 2>/dev/null || echo "N/A")
            
            echo "$timestamp - Backend: $backend_replicas replicas, CPU: ${backend_cpu}%"
            
            sleep 10
        done
    ) &
    
    MONITOR_PID=$!
    
    # Cleanup on exit
    trap "kill $MONITOR_PID 2>/dev/null || true" EXIT
}

simulate_traffic_spike() {
    log_info "Simulating traffic spike pattern..."
    
    # Phase 1: Warmup (30s)
    log_info "Phase 1: Warmup (30 seconds)"
    DURATION=30 CONCURRENT_REQUESTS=10 REQUESTS_PER_SECOND=20 run_load_test
    sleep 10
    
    # Phase 2: Gradual increase (60s)
    log_info "Phase 2: Gradual increase (60 seconds)"
    DURATION=60 CONCURRENT_REQUESTS=30 REQUESTS_PER_SECOND=50 run_load_test
    sleep 10
    
    # Phase 3: Peak load (120s)
    log_info "Phase 3: Peak load (120 seconds)"
    DURATION=120 CONCURRENT_REQUESTS=100 REQUESTS_PER_SECOND=200 run_load_test
    sleep 10
    
    # Phase 4: Scale down (60s)
    log_info "Phase 4: Cool down period (60 seconds)"
    log_info "Waiting for scale-down..."
    sleep 60
    
    log_info "Traffic spike simulation complete"
}

show_results() {
    log_info ""
    log_info "======================================"
    log_info "Load Test Results"
    log_info "======================================"
    log_info ""
    log_info "Final HPA Status:"
    kubectl get hpa -n "$NAMESPACE"
    log_info ""
    log_info "Final Pod Count:"
    kubectl get pods -n "$NAMESPACE" -l app=spywatcher
    log_info ""
    log_info "Recent Scaling Events:"
    kubectl get events -n "$NAMESPACE" --sort-by='.lastTimestamp' | grep -i "horizontal\|scaled" | tail -10
    log_info ""
}

usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -u, --url URL              Target URL (default: auto-detect)"
    echo "  -d, --duration SECONDS     Duration in seconds (default: 300)"
    echo "  -c, --concurrent NUM       Concurrent requests (default: 50)"
    echo "  -r, --rps NUM             Requests per second (default: 100)"
    echo "  -s, --spike               Simulate traffic spike pattern"
    echo "  -m, --monitor             Monitor HPA only (no load test)"
    echo "  -h, --help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --duration 600 --concurrent 100 --rps 200"
    echo "  $0 --spike"
    echo "  $0 --monitor"
    echo ""
}

main() {
    local mode="normal"
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -u|--url)
                TARGET_URL="$2"
                shift 2
                ;;
            -d|--duration)
                DURATION="$2"
                shift 2
                ;;
            -c|--concurrent)
                CONCURRENT_REQUESTS="$2"
                shift 2
                ;;
            -r|--rps)
                REQUESTS_PER_SECOND="$2"
                shift 2
                ;;
            -s|--spike)
                mode="spike"
                shift
                ;;
            -m|--monitor)
                mode="monitor"
                shift
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done
    
    check_tools
    
    if [ "$mode" = "monitor" ]; then
        monitor_hpa
        exit 0
    fi
    
    if [ -z "$TARGET_URL" ] || [ "$TARGET_URL" = "http://localhost:3001/health/live" ]; then
        get_service_url || log_warn "Using default URL: $TARGET_URL"
    fi
    
    log_info "Starting load test..."
    log_info "Test will run for approximately $DURATION seconds"
    log_info ""
    
    # Start watching scaling events
    watch_scaling
    
    if [ "$mode" = "spike" ]; then
        simulate_traffic_spike
    else
        run_load_test
    fi
    
    show_results
    
    log_info "Load test complete!"
}

# Run main if executed directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi
