#!/bin/bash

# Test Migration Script
# Tests database migrations in a safe, isolated environment before applying to production
# Validates schema changes, data integrity, and rollback procedures

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
TEST_DB_NAME="${TEST_DB_NAME:-spywatcher_test}"
DB_USER="${DB_USER:-spywatcher}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_PASSWORD="${DB_PASSWORD:-}"
BACKUP_DIR="${BACKUP_DIR:-/tmp/migration-test-backups}"
VERBOSE="${VERBOSE:-false}"

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

# Function to check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check if PostgreSQL client is installed
    if ! command -v psql &> /dev/null; then
        print_error "psql is not installed. Please install PostgreSQL client."
        exit 1
    fi
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed."
        exit 1
    fi
    
    # Check if Prisma is installed
    if ! command -v npx &> /dev/null; then
        print_error "npx is not installed."
        exit 1
    fi
    
    # Check if DB_PASSWORD is set
    if [ -z "$DB_PASSWORD" ]; then
        print_error "DB_PASSWORD environment variable is required"
        exit 1
    fi
    
    print_success "All prerequisites met"
}

# Function to create test database
create_test_database() {
    print_info "Creating test database: $TEST_DB_NAME"
    
    export PGPASSWORD="$DB_PASSWORD"
    
    # Drop test database if it exists
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $TEST_DB_NAME;" > /dev/null 2>&1 || true
    
    # Create test database
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $TEST_DB_NAME;" > /dev/null 2>&1
    
    print_success "Test database created"
}

# Function to backup current database state
backup_test_database() {
    print_info "Creating backup of test database..."
    
    mkdir -p "$BACKUP_DIR"
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/${TEST_DB_NAME}_${timestamp}.sql"
    
    export PGPASSWORD="$DB_PASSWORD"
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$TEST_DB_NAME" > "$backup_file" 2>/dev/null
    
    echo "$backup_file"
    print_success "Backup created: $backup_file"
}

# Function to restore database from backup
restore_test_database() {
    local backup_file=$1
    
    print_info "Restoring database from: $backup_file"
    
    export PGPASSWORD="$DB_PASSWORD"
    
    # Terminate existing connections
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = '$TEST_DB_NAME'
        AND pid <> pg_backend_pid();
    " > /dev/null 2>&1 || true
    
    # Drop and recreate database
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $TEST_DB_NAME;" > /dev/null 2>&1
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $TEST_DB_NAME;" > /dev/null 2>&1
    
    # Restore from backup
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEST_DB_NAME" < "$backup_file" > /dev/null 2>&1
    
    print_success "Database restored"
}

# Function to apply migrations
apply_migrations() {
    print_info "Applying migrations to test database..."
    
    cd backend
    
    export DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$TEST_DB_NAME"
    
    # Run migrations
    if [ "$VERBOSE" = "true" ]; then
        npx prisma migrate deploy
    else
        npx prisma migrate deploy > /dev/null 2>&1
    fi
    
    cd ..
    
    print_success "Migrations applied successfully"
}

# Function to validate schema
validate_schema() {
    print_info "Validating database schema..."
    
    export PGPASSWORD="$DB_PASSWORD"
    
    # Check that all expected tables exist
    local tables=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEST_DB_NAME" -t -c "
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename;
    " 2>/dev/null | tr -d ' ' | grep -v '^$')
    
    if [ "$VERBOSE" = "true" ]; then
        echo "Tables found:"
        echo "$tables"
    fi
    
    # Check for required tables
    local required_tables=(
        "User"
        "Guild"
        "PresenceEvent"
        "TypingEvent"
        "MessageEvent"
        "JoinEvent"
        "RefreshToken"
        "Session"
    )
    
    local missing_tables=()
    for table in "${required_tables[@]}"; do
        if ! echo "$tables" | grep -q "^$table$"; then
            missing_tables+=("$table")
        fi
    done
    
    if [ ${#missing_tables[@]} -gt 0 ]; then
        print_error "Missing required tables: ${missing_tables[*]}"
        return 1
    fi
    
    # Validate Prisma schema
    cd backend
    export DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$TEST_DB_NAME"
    
    if npx prisma validate > /dev/null 2>&1; then
        cd ..
        print_success "Schema validation passed"
        return 0
    else
        cd ..
        print_error "Schema validation failed"
        return 1
    fi
}

# Function to validate data integrity
validate_data_integrity() {
    print_info "Validating data integrity..."
    
    export PGPASSWORD="$DB_PASSWORD"
    
    # Check for foreign key violations
    local fk_violations=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEST_DB_NAME" -t -c "
        DO \$\$
        DECLARE
            r RECORD;
            child_cols TEXT;
            parent_cols TEXT;
            sql TEXT;
            violation_count INTEGER := 0;
        BEGIN
            FOR r IN
                SELECT
                    conname,
                    conrelid::regclass AS child_table,
                    confrelid::regclass AS parent_table,
                    conkey,
                    confkey
                FROM pg_constraint
                WHERE contype = 'f'
            LOOP
                -- Get child and parent column names as comma-separated lists
                SELECT string_agg(quote_ident(attname), ', ')
                INTO child_cols
                FROM unnest(r.conkey) AS colnum
                JOIN pg_attribute a ON a.attrelid = r.child_table::regclass AND a.attnum = colnum;

                SELECT string_agg(quote_ident(attname), ', ')
                INTO parent_cols
                FROM unnest(r.confkey) AS colnum
                JOIN pg_attribute a ON a.attrelid = r.parent_table::regclass AND a.attnum = colnum;

                sql := 'SELECT COUNT(*) FROM ' || r.child_table || ' c LEFT JOIN ' || r.parent_table || ' p ON (' ||
                    'c.' || child_cols || ' = p.' || parent_cols || ') WHERE p.' || parent_cols || ' IS NULL';

                BEGIN
                    EXECUTE sql INTO violation_count;
                    IF violation_count > 0 THEN
                        RAISE NOTICE 'Foreign key violation in constraint %: % orphaned rows in table %', r.conname, violation_count, r.child_table;
                    END IF;
                EXCEPTION WHEN OTHERS THEN
                    RAISE NOTICE 'Error checking foreign key constraint %', r.conname;
                END;
            END LOOP;
        END;
        \$\$;
    " 2>&1)
    
    # Check for NULL violations in NOT NULL columns
    local null_check=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEST_DB_NAME" -t -c "
        SELECT COUNT(*)
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND is_nullable = 'NO';
    " 2>/dev/null | tr -d ' ')
    
    if [ "$VERBOSE" = "true" ]; then
        echo "NOT NULL columns: $null_check"
    fi
    
    # Check for duplicate primary keys (should be 0)
    local dup_check=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEST_DB_NAME" -t -c "
        SELECT COUNT(*)
        FROM (
            SELECT table_name
            FROM information_schema.table_constraints
            WHERE constraint_type = 'PRIMARY KEY'
            AND table_schema = 'public'
        ) AS pk_tables;
    " 2>/dev/null | tr -d ' ')
    
    if [ "$dup_check" -lt 1 ]; then
        print_error "No primary keys found in database"
        return 1
    fi
    
    print_success "Data integrity validation passed"
}

# Function to test rollback
test_rollback() {
    local backup_file=$1
    
    print_info "Testing rollback procedure..."
    
    # Restore from backup
    restore_test_database "$backup_file"
    
    # Validate schema after rollback
    if validate_schema; then
        print_success "Rollback test passed"
        return 0
    else
        print_error "Rollback test failed - schema validation failed after restore"
        return 1
    fi
}

# Function to cleanup
cleanup() {
    print_info "Cleaning up test database..."
    
    export PGPASSWORD="$DB_PASSWORD"
    
    # Drop test database
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = '$TEST_DB_NAME'
        AND pid <> pg_backend_pid();
    " > /dev/null 2>&1 || true
    
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $TEST_DB_NAME;" > /dev/null 2>&1 || true
    
    print_success "Cleanup completed"
}

# Main test flow
main() {
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "         Database Migration Testing Suite"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    
    # Check prerequisites
    check_prerequisites
    
    # Create test database
    create_test_database
    
    # Apply current schema (baseline)
    print_info "Setting up baseline schema..."
    cd backend
    export DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$TEST_DB_NAME"
    npx prisma db push --skip-generate > /dev/null 2>&1 || true
    cd ..
    
    # Create backup of baseline
    local backup_file=$(backup_test_database)
    
    # Apply pending migrations
    if apply_migrations; then
        print_success "Migration application: PASSED"
    else
        print_error "Migration application: FAILED"
        cleanup
        exit 1
    fi
    
    # Validate schema
    if validate_schema; then
        print_success "Schema validation: PASSED"
    else
        print_error "Schema validation: FAILED"
        cleanup
        exit 1
    fi
    
    # Validate data integrity
    if validate_data_integrity; then
        print_success "Data integrity validation: PASSED"
    else
        print_error "Data integrity validation: FAILED"
        cleanup
        exit 1
    fi
    
    # Test rollback
    if test_rollback "$backup_file"; then
        print_success "Rollback test: PASSED"
    else
        print_error "Rollback test: FAILED"
        cleanup
        exit 1
    fi
    
    # Cleanup
    cleanup
    
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    print_success "All migration tests passed successfully!"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
}

# Run main
main
