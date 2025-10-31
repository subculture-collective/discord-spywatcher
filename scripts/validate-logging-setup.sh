#!/bin/bash

# Script to validate the centralized logging setup
# This script checks if all logging components are properly configured

# Don't exit on error - we want to collect all errors
set +e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "🔍 Validating Centralized Logging Setup"
echo "========================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

success_count=0
error_count=0

# Function to print success
print_success() {
    echo -e "${GREEN}✓${NC} $1"
    ((success_count++))
}

# Function to print error
print_error() {
    echo -e "${RED}✗${NC} $1"
    ((error_count++))
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo "1. Checking configuration files..."
echo "-----------------------------------"

# Check Loki configuration
if [ -f "$PROJECT_ROOT/loki/loki-config.yml" ]; then
    print_success "Loki configuration file exists"
    
    # Validate YAML syntax
    if python3 -c "import yaml; yaml.safe_load(open('$PROJECT_ROOT/loki/loki-config.yml'))" 2>/dev/null; then
        print_success "Loki configuration is valid YAML"
    else
        print_error "Loki configuration has invalid YAML syntax"
    fi
else
    print_error "Loki configuration file not found"
fi

# Check Promtail configuration
if [ -f "$PROJECT_ROOT/promtail/promtail-config.yml" ]; then
    print_success "Promtail configuration file exists"
    
    # Validate YAML syntax
    if python3 -c "import yaml; yaml.safe_load(open('$PROJECT_ROOT/promtail/promtail-config.yml'))" 2>/dev/null; then
        print_success "Promtail configuration is valid YAML"
    else
        print_error "Promtail configuration has invalid YAML syntax"
    fi
else
    print_error "Promtail configuration file not found"
fi

# Check Grafana datasource configuration
if [ -f "$PROJECT_ROOT/grafana/provisioning/datasources/loki.yml" ]; then
    print_success "Grafana datasource configuration exists"
    
    # Validate YAML syntax
    if python3 -c "import yaml; yaml.safe_load(open('$PROJECT_ROOT/grafana/provisioning/datasources/loki.yml'))" 2>/dev/null; then
        print_success "Grafana datasource configuration is valid YAML"
    else
        print_error "Grafana datasource configuration has invalid YAML syntax"
    fi
else
    print_error "Grafana datasource configuration not found"
fi

# Check Grafana dashboard
if [ -f "$PROJECT_ROOT/grafana/provisioning/dashboards/json/spywatcher-logs.json" ]; then
    print_success "Grafana dashboard JSON exists"
    
    # Validate JSON syntax
    if python3 -c "import json; json.load(open('$PROJECT_ROOT/grafana/provisioning/dashboards/json/spywatcher-logs.json'))" 2>/dev/null; then
        print_success "Grafana dashboard JSON is valid"
    else
        print_error "Grafana dashboard JSON has invalid syntax"
    fi
else
    print_error "Grafana dashboard JSON not found"
fi

echo ""
echo "2. Checking Docker Compose configuration..."
echo "--------------------------------------------"

# Check docker-compose files include logging services
if grep -q "loki:" "$PROJECT_ROOT/docker-compose.dev.yml" 2>/dev/null; then
    print_success "Loki service defined in docker-compose.dev.yml"
else
    print_error "Loki service not found in docker-compose.dev.yml"
fi

if grep -q "promtail:" "$PROJECT_ROOT/docker-compose.dev.yml" 2>/dev/null; then
    print_success "Promtail service defined in docker-compose.dev.yml"
else
    print_error "Promtail service not found in docker-compose.dev.yml"
fi

if grep -q "grafana:" "$PROJECT_ROOT/docker-compose.dev.yml" 2>/dev/null; then
    print_success "Grafana service defined in docker-compose.dev.yml"
else
    print_error "Grafana service not found in docker-compose.dev.yml"
fi

# Validate docker-compose files
if command -v docker &> /dev/null; then
    if docker compose -f "$PROJECT_ROOT/docker-compose.dev.yml" config --quiet 2>/dev/null; then
        print_success "docker-compose.dev.yml is valid"
    else
        print_error "docker-compose.dev.yml has syntax errors"
    fi
    
    if docker compose -f "$PROJECT_ROOT/docker-compose.prod.yml" config --quiet 2>/dev/null; then
        print_success "docker-compose.prod.yml is valid"
    else
        print_error "docker-compose.prod.yml has syntax errors"
    fi
else
    print_warning "Docker not available, skipping compose validation"
fi

echo ""
echo "3. Checking documentation..."
echo "----------------------------"

# Check documentation files
if [ -f "$PROJECT_ROOT/LOGGING.md" ]; then
    print_success "LOGGING.md documentation exists"
else
    print_error "LOGGING.md documentation not found"
fi

if [ -f "$PROJECT_ROOT/docs/CENTRALIZED_LOGGING_QUICKSTART.md" ]; then
    print_success "Quick start guide exists"
else
    print_error "Quick start guide not found"
fi

if [ -f "$PROJECT_ROOT/loki/README.md" ]; then
    print_success "Loki README exists"
else
    print_error "Loki README not found"
fi

if [ -f "$PROJECT_ROOT/promtail/README.md" ]; then
    print_success "Promtail README exists"
else
    print_error "Promtail README not found"
fi

if [ -f "$PROJECT_ROOT/grafana/README.md" ]; then
    print_success "Grafana README exists"
else
    print_error "Grafana README not found"
fi

echo ""
echo "4. Checking Winston logger configuration..."
echo "--------------------------------------------"

# Check if Winston logger exists
if [ -f "$PROJECT_ROOT/backend/src/middleware/winstonLogger.ts" ]; then
    print_success "Winston logger middleware exists"
    
    # Check if it outputs JSON format
    if grep -q "format.json()" "$PROJECT_ROOT/backend/src/middleware/winstonLogger.ts" 2>/dev/null; then
        print_success "Winston logger configured for JSON output"
    else
        print_warning "Winston logger may not be configured for structured JSON output"
    fi
    
    # Check if log files are configured
    if grep -q "transports.File" "$PROJECT_ROOT/backend/src/middleware/winstonLogger.ts" 2>/dev/null; then
        print_success "Winston logger configured to write to files"
    else
        print_error "Winston logger not configured to write to files"
    fi
else
    print_error "Winston logger middleware not found"
fi

# Check security logger
if [ -f "$PROJECT_ROOT/backend/src/utils/securityLogger.ts" ]; then
    print_success "Security logger utility exists"
else
    print_error "Security logger utility not found"
fi

echo ""
echo "========================================"
echo "📊 Validation Summary"
echo "========================================"
echo -e "${GREEN}Successful checks: $success_count${NC}"
echo -e "${RED}Failed checks: $error_count${NC}"
echo ""

if [ $error_count -eq 0 ]; then
    echo -e "${GREEN}✓ All validation checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Start the logging stack: docker compose -f docker-compose.dev.yml up -d"
    echo "2. Access Grafana at: http://localhost:3000 (admin/admin)"
    echo "3. View the Spywatcher - Log Aggregation dashboard"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some validation checks failed. Please review the errors above.${NC}"
    echo ""
    exit 1
fi
