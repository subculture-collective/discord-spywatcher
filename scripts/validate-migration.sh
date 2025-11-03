#!/bin/bash

# Validate Migration Script
# Performs comprehensive data validation checks after migrations
# Ensures data integrity, consistency, and correctness

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DB_NAME="${DB_NAME:-spywatcher}"
DB_USER="${DB_USER:-spywatcher}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_PASSWORD="${DB_PASSWORD:-}"
VERBOSE="${VERBOSE:-false}"

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
    ((CHECKS_PASSED++))
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
    ((CHECKS_WARNING++))
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
    ((CHECKS_FAILED++))
}

# Function to check prerequisites
check_prerequisites() {
    if ! command -v psql &> /dev/null; then
        echo "Error: psql is not installed"
        exit 1
    fi
    
    if [ -z "$DB_PASSWORD" ]; then
        echo "Error: DB_PASSWORD environment variable is required"
        exit 1
    fi
}

# Function to check database connection
check_connection() {
    print_info "Checking database connection..."
    
    export PGPASSWORD="$DB_PASSWORD"
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        print_success "Database connection successful"
    else
        print_error "Cannot connect to database"
        exit 1
    fi
}

# Function to validate schema exists
validate_schema_exists() {
    print_info "Validating schema existence..."
    
    export PGPASSWORD="$DB_PASSWORD"
    
    local table_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*)
        FROM information_schema.tables
        WHERE table_schema = 'public';
    " 2>/dev/null | tr -d ' ')
    
    if [ "$table_count" -gt 0 ]; then
        print_success "Found $table_count tables in database"
    else
        print_error "No tables found in database"
    fi
}

# Function to validate required tables
validate_required_tables() {
    print_info "Validating required tables..."
    
    export PGPASSWORD="$DB_PASSWORD"
    
    local required_tables=(
        "User"
        "Guild"
        "RefreshToken"
        "Session"
        "ApiKey"
        "PresenceEvent"
        "TypingEvent"
        "MessageEvent"
        "JoinEvent"
        "DeletedMessageEvent"
        "ReactionTime"
        "RoleChangeEvent"
        "BlockedIP"
        "WhitelistedIP"
        "BannedUser"
    )
    
    for table in "${required_tables[@]}"; do
        local exists=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = '$table';
        " 2>/dev/null | tr -d ' ')
        
        if [ "$exists" -eq "1" ]; then
            if [ "$VERBOSE" = "true" ]; then
                print_success "Table exists: $table"
            fi
        else
            print_error "Missing required table: $table"
        fi
    done
}

# Function to validate indexes
validate_indexes() {
    print_info "Validating indexes..."
    
    export PGPASSWORD="$DB_PASSWORD"
    
    local index_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*)
        FROM pg_indexes
        WHERE schemaname = 'public';
    " 2>/dev/null | tr -d ' ')
    
    if [ "$index_count" -gt 10 ]; then
        print_success "Found $index_count indexes"
    else
        print_warning "Only $index_count indexes found (expected more)"
    fi
    
    # Check for critical indexes
    local critical_indexes=(
        "User_discordId_key"
        "Guild_guildId_key"
        "RefreshToken_token_key"
    )
    
    for index_name in "${critical_indexes[@]}"; do
        local exists=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
            SELECT COUNT(*)
            FROM pg_indexes
            WHERE schemaname = 'public' AND indexname = '$index_name';
        " 2>/dev/null | tr -d ' ')
        
        if [ "$exists" -eq "1" ]; then
            if [ "$VERBOSE" = "true" ]; then
                print_success "Critical index exists: $index_name"
            fi
        else
            print_warning "Missing critical index: $index_name"
        fi
    done
}

# Function to validate foreign keys
validate_foreign_keys() {
    print_info "Validating foreign key constraints..."
    
    export PGPASSWORD="$DB_PASSWORD"
    
    local fk_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*)
        FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public';
    " 2>/dev/null | tr -d ' ')
    
    if [ "$fk_count" -gt 5 ]; then
        print_success "Found $fk_count foreign key constraints"
    else
        print_warning "Only $fk_count foreign key constraints found"
    fi
    
    # Check for foreign key violations
    local violations=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        DO \$\$
        DECLARE
            r RECORD;
            violation_count INTEGER := 0;
        BEGIN
            FOR r IN (
                SELECT tc.table_name, tc.constraint_name
                FROM information_schema.table_constraints tc
                WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
            ) LOOP
                BEGIN
                    EXECUTE 'ALTER TABLE \"' || r.table_name || '\" VALIDATE CONSTRAINT \"' || r.constraint_name || '\"';
                EXCEPTION WHEN OTHERS THEN
                    violation_count := violation_count + 1;
                    RAISE NOTICE 'Foreign key violation in %.%', r.table_name, r.constraint_name;
                END;
            END LOOP;
            RAISE NOTICE 'Total violations: %', violation_count;
        END;
        \$\$;
    " 2>&1 | grep "Total violations" | grep -oP '\d+' || echo "0")
    
    if [ "$violations" -eq "0" ]; then
        print_success "No foreign key violations detected"
    else
        print_error "Found $violations foreign key violations"
    fi
}

# Function to validate primary keys
validate_primary_keys() {
    print_info "Validating primary key constraints..."
    
    export PGPASSWORD="$DB_PASSWORD"
    
    local tables_without_pk=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT t.table_name
        FROM information_schema.tables t
        LEFT JOIN information_schema.table_constraints tc
            ON t.table_name = tc.table_name
            AND tc.constraint_type = 'PRIMARY KEY'
            AND tc.table_schema = 'public'
        WHERE t.table_schema = 'public'
            AND t.table_type = 'BASE TABLE'
            AND tc.constraint_name IS NULL
            AND t.table_name NOT LIKE '_prisma%';
    " 2>/dev/null | tr -d ' ' | grep -v '^$')
    
    if [ -z "$tables_without_pk" ]; then
        print_success "All tables have primary keys"
    else
        print_error "Tables without primary keys:"
        echo "$tables_without_pk"
    fi
}

# Function to validate data types
validate_data_types() {
    print_info "Validating critical data types..."
    
    export PGPASSWORD="$DB_PASSWORD"
    
    # Check that User.discordId is String (text/varchar)
    local discord_id_type=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
            AND table_name = 'User'
            AND column_name = 'discordId';
    " 2>/dev/null | tr -d ' ')
    
    if [[ "$discord_id_type" == *"character"* ]] || [[ "$discord_id_type" == *"text"* ]]; then
        if [ "$VERBOSE" = "true" ]; then
            print_success "User.discordId has correct type: $discord_id_type"
        fi
    else
        print_warning "User.discordId type might be incorrect: $discord_id_type"
    fi
    
    # Check that timestamps use timestamptz
    local tz_aware_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*)
        FROM information_schema.columns
        WHERE table_schema = 'public'
            AND column_name IN ('createdAt', 'updatedAt')
            AND data_type = 'timestamp with time zone';
    " 2>/dev/null | tr -d ' ')
    
    if [ "$tz_aware_count" -gt 10 ]; then
        print_success "Timestamps are timezone-aware ($tz_aware_count columns)"
    else
        print_warning "Some timestamps may not be timezone-aware"
    fi
}

# Function to validate data consistency
validate_data_consistency() {
    print_info "Validating data consistency..."
    
    export PGPASSWORD="$DB_PASSWORD"
    
    # Check for NULL values in required fields
    local null_violations=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*)
        FROM \"User\"
        WHERE discordId IS NULL OR username IS NULL;
    " 2>/dev/null | tr -d ' ')
    
    if [ "$null_violations" -eq "0" ]; then
        if [ "$VERBOSE" = "true" ]; then
            print_success "No NULL violations in User table"
        fi
    else
        print_error "Found $null_violations NULL violations in User table"
    fi
    
    # Check for duplicate discordIds
    local dup_discord_ids=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*)
        FROM (
            SELECT discordId, COUNT(*) as cnt
            FROM \"User\"
            GROUP BY discordId
            HAVING COUNT(*) > 1
        ) dups;
    " 2>/dev/null | tr -d ' ')
    
    if [ "$dup_discord_ids" -eq "0" ]; then
        if [ "$VERBOSE" = "true" ]; then
            print_success "No duplicate discordIds found"
        fi
    else
        print_error "Found $dup_discord_ids duplicate discordIds"
    fi
}

# Function to validate Prisma migrations table
validate_prisma_migrations() {
    print_info "Validating Prisma migrations..."
    
    export PGPASSWORD="$DB_PASSWORD"
    
    # Check migrations table exists
    local migrations_exists=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*)
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = '_prisma_migrations';
    " 2>/dev/null | tr -d ' ')
    
    if [ "$migrations_exists" -eq "1" ]; then
        print_success "Prisma migrations table exists"
        
        # Check for failed migrations
        local failed_migrations=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
            SELECT COUNT(*)
            FROM _prisma_migrations
            WHERE finished_at IS NULL OR rolled_back_at IS NOT NULL;
        " 2>/dev/null | tr -d ' ')
        
        if [ "$failed_migrations" -eq "0" ]; then
            print_success "All migrations completed successfully"
        else
            print_error "Found $failed_migrations failed or rolled back migrations"
        fi
        
        # Show migration count
        local total_migrations=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
            SELECT COUNT(*)
            FROM _prisma_migrations
            WHERE finished_at IS NOT NULL;
        " 2>/dev/null | tr -d ' ')
        
        print_info "Total applied migrations: $total_migrations"
    else
        print_warning "Prisma migrations table not found"
    fi
}

# Function to check database size
check_database_size() {
    print_info "Checking database size..."
    
    export PGPASSWORD="$DB_PASSWORD"
    
    local db_size=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT pg_size_pretty(pg_database_size('$DB_NAME'));
    " 2>/dev/null | tr -d ' ')
    
    print_info "Database size: $db_size"
    
    # Show table sizes if verbose
    if [ "$VERBOSE" = "true" ]; then
        echo ""
        print_info "Table sizes:"
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
            SELECT
                schemaname,
                tablename,
                pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
            FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
            LIMIT 10;
        " 2>/dev/null
    fi
}

# Function to generate summary report
generate_summary() {
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "           Validation Summary"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo -e "${GREEN}Passed:  $CHECKS_PASSED${NC}"
    echo -e "${YELLOW}Warnings: $CHECKS_WARNING${NC}"
    echo -e "${RED}Failed:  $CHECKS_FAILED${NC}"
    echo ""
    
    if [ $CHECKS_FAILED -eq 0 ]; then
        print_success "All critical validations passed!"
        if [ $CHECKS_WARNING -gt 0 ]; then
            print_warning "Please review warnings above"
        fi
        return 0
    else
        print_error "Validation failed with $CHECKS_FAILED critical errors"
        return 1
    fi
}

# Main execution
main() {
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "       Database Migration Validation Suite"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    
    check_prerequisites
    check_connection
    
    validate_schema_exists
    validate_required_tables
    validate_indexes
    validate_foreign_keys
    validate_primary_keys
    validate_data_types
    validate_data_consistency
    validate_prisma_migrations
    check_database_size
    
    generate_summary
}

# Run main
main
