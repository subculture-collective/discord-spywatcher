#!/bin/bash

# Rollback Migration Script
# Safely rolls back database migrations to a previous state
# Supports both single migration rollback and full backup restore

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
BACKUP_DIR="${BACKUP_DIR:-/var/backups/spywatcher}"

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

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Rollback database migrations safely.

OPTIONS:
    -m, --migration NAME    Rollback to specific migration
    -b, --backup FILE       Restore from backup file
    -l, --list              List available backups and migrations
    -h, --help              Show this help message

EXAMPLES:
    # List available options
    DB_PASSWORD=pass $0 --list

    # Rollback to a specific migration
    DB_PASSWORD=pass $0 --migration 20250524175155_init

    # Restore from backup
    DB_PASSWORD=pass $0 --backup /path/to/backup.sql.gz

ENVIRONMENT VARIABLES:
    DB_NAME         Database name (default: spywatcher)
    DB_USER         Database user (default: spywatcher)
    DB_HOST         Database host (default: localhost)
    DB_PORT         Database port (default: 5432)
    DB_PASSWORD     Database password (required)
    BACKUP_DIR      Backup directory (default: /var/backups/spywatcher)

EOF
}

# Function to check prerequisites
check_prerequisites() {
    # Check if PostgreSQL client is installed
    if ! command -v psql &> /dev/null; then
        print_error "psql is not installed. Please install PostgreSQL client."
        exit 1
    fi
    
    # Check if DB_PASSWORD is set
    if [ -z "$DB_PASSWORD" ]; then
        print_error "DB_PASSWORD environment variable is required"
        exit 1
    fi
}

# Function to list migrations
list_migrations() {
    print_info "Applied migrations in database:"
    echo ""
    
    export PGPASSWORD="$DB_PASSWORD"
    
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT 
            migration_name,
            finished_at,
            applied_steps_count
        FROM _prisma_migrations
        WHERE finished_at IS NOT NULL
        ORDER BY finished_at DESC;
    " 2>/dev/null || print_warning "Unable to query migrations table"
    
    echo ""
}

# Function to list backups
list_backups() {
    print_info "Available backups in $BACKUP_DIR:"
    echo ""
    
    if [ -d "$BACKUP_DIR" ]; then
        ls -lh "$BACKUP_DIR" | grep -E '\.sql(\.gz)?$' | awk '{print $9, "("$5")", $6, $7, $8}' || print_warning "No backup files found"
    else
        print_warning "Backup directory does not exist: $BACKUP_DIR"
    fi
    
    echo ""
}

# Function to create pre-rollback backup
create_pre_rollback_backup() {
    print_info "Creating pre-rollback backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/pre_rollback_${DB_NAME}_${timestamp}.sql.gz"
    
    export PGPASSWORD="$DB_PASSWORD"
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" | gzip > "$backup_file" 2>/dev/null
    
    print_success "Pre-rollback backup created: $backup_file"
    echo "$backup_file"
}

# Function to rollback to specific migration
rollback_to_migration() {
    local target_migration=$1
    
    print_info "Rolling back to migration: $target_migration"
    
    # Verify migration exists
    export PGPASSWORD="$DB_PASSWORD"
    local migration_exists=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*)
        FROM _prisma_migrations
        WHERE migration_name = '$target_migration';
    " 2>/dev/null | tr -d ' ')
    
    if [ "$migration_exists" -eq "0" ]; then
        print_error "Migration not found: $target_migration"
        exit 1
    fi
    
    # Create backup before rollback
    local backup_file=$(create_pre_rollback_backup)
    
    print_warning "This will rollback all migrations after $target_migration"
    print_warning "Backup created at: $backup_file"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_info "Rollback cancelled"
        exit 0
    fi
    
    # Get migrations to rollback (all after target)
    local migrations_to_rollback=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT migration_name
        FROM _prisma_migrations
        WHERE finished_at > (
            SELECT finished_at
            FROM _prisma_migrations
            WHERE migration_name = '$target_migration'
        )
        ORDER BY finished_at DESC;
    " 2>/dev/null)
    
    if [ -z "$migrations_to_rollback" ]; then
        print_info "No migrations to rollback"
        return 0
    fi
    
    print_info "Migrations to rollback:"
    echo "$migrations_to_rollback"
    echo ""
    
    # Manually rollback using Prisma
    cd backend
    export DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
    
    # Mark migrations as rolled back
    while IFS= read -r migration; do
        if [ -n "$migration" ]; then
            migration=$(echo "$migration" | tr -d ' ')
            print_info "Marking migration as rolled back: $migration"
            
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
                UPDATE _prisma_migrations
                SET rolled_back_at = NOW()
                WHERE migration_name = '$migration';
            " > /dev/null 2>&1 || print_warning "Could not mark $migration as rolled back"
        fi
    done <<< "$migrations_to_rollback"
    
    cd ..
    
    print_success "Rollback completed"
    print_warning "You may need to manually restore the database schema from backup: $backup_file"
    print_info "To restore: DB_PASSWORD=$DB_PASSWORD ./scripts/restore.sh $backup_file"
}

# Function to restore from backup
restore_from_backup() {
    local backup_file=$1
    
    if [ ! -f "$backup_file" ]; then
        print_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    print_warning "This will REPLACE all data in database: $DB_NAME"
    print_warning "Source: $backup_file"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_info "Restore cancelled"
        exit 0
    fi
    
    print_info "Restoring database from: $backup_file"
    
    export PGPASSWORD="$DB_PASSWORD"
    
    # Terminate existing connections
    print_info "Terminating existing connections..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = '$DB_NAME'
        AND pid <> pg_backend_pid();
    " > /dev/null 2>&1 || true
    
    # Drop and recreate database
    print_info "Recreating database..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" > /dev/null 2>&1
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;" > /dev/null 2>&1
    
    # Restore from backup
    print_info "Restoring data..."
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1
    else
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "$backup_file" > /dev/null 2>&1
    fi
    
    # Verify restore
    print_info "Verifying restore..."
    local table_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*)
        FROM information_schema.tables
        WHERE table_schema = 'public';
    " 2>/dev/null | tr -d ' ')
    
    if [ "$table_count" -gt 0 ]; then
        print_success "Database restored successfully"
        print_info "Tables found: $table_count"
    else
        print_error "Restore may have failed - no tables found"
        exit 1
    fi
}

# Parse command line arguments
MODE=""
TARGET=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -m|--migration)
            MODE="migration"
            TARGET="$2"
            shift 2
            ;;
        -b|--backup)
            MODE="backup"
            TARGET="$2"
            shift 2
            ;;
        -l|--list)
            MODE="list"
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
check_prerequisites

case $MODE in
    list)
        list_migrations
        list_backups
        ;;
    migration)
        if [ -z "$TARGET" ]; then
            print_error "Migration name is required"
            show_usage
            exit 1
        fi
        rollback_to_migration "$TARGET"
        ;;
    backup)
        if [ -z "$TARGET" ]; then
            print_error "Backup file path is required"
            show_usage
            exit 1
        fi
        restore_from_backup "$TARGET"
        ;;
    *)
        print_error "No operation specified"
        show_usage
        exit 1
        ;;
esac
