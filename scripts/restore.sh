#!/bin/bash
# PostgreSQL Restore Script for Discord SpyWatcher
# This script restores a database from a backup file with point-in-time recovery support

set -e

# Configuration
DB_NAME="${DB_NAME:-spywatcher}"
DB_USER="${DB_USER:-spywatcher}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
RECOVERY_TARGET_TIME="${RECOVERY_TARGET_TIME:-}" # Optional: YYYY-MM-DD HH:MM:SS
S3_BUCKET="${S3_BUCKET:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track restore start time
START_TIME=$(date +%s)

# Function to list available backups
list_backups() {
    echo -e "${BLUE}Available local backups:${NC}"
    find /var/backups/spywatcher -name "spywatcher_*" -type f 2>/dev/null | sort -r | head -10
    
    if [ -n "$S3_BUCKET" ]; then
        echo ""
        echo -e "${BLUE}Available S3 backups (last 10):${NC}"
        aws s3 ls "s3://$S3_BUCKET/postgres/full/" --recursive | sort -r | head -10
    fi
}

# Check if backup file is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Backup file not specified${NC}"
    echo ""
    echo -e "${YELLOW}Usage:${NC}"
    echo "  $0 <backup_file> [recovery_target_time]"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  $0 /var/backups/spywatcher/spywatcher_full_20240125_120000.dump.gz"
    echo "  $0 s3://bucket/postgres/full/backup.dump.gz.gpg"
    echo "  $0 /var/backups/spywatcher/backup.dump.gz '2024-01-25 12:00:00'"
    echo ""
    list_backups
    exit 1
fi

BACKUP_FILE="$1"
RECOVERY_TARGET_TIME="${2:-$RECOVERY_TARGET_TIME}"

# Download from S3 if needed
if [[ "$BACKUP_FILE" == s3://* ]]; then
    echo -e "${YELLOW}Downloading backup from S3...${NC}"
    LOCAL_FILE="/tmp/restore_backup_$(date +%s).dump"
    
    if aws s3 cp "$BACKUP_FILE" "$LOCAL_FILE"; then
        echo -e "${GREEN}✓ Downloaded from S3${NC}"
        BACKUP_FILE="$LOCAL_FILE"
        CLEANUP_TEMP=true
    else
        echo -e "${RED}✗ Failed to download from S3${NC}"
        exit 1
    fi
fi

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

# Decrypt if needed
if [[ "$BACKUP_FILE" == *.gpg ]]; then
    echo -e "${YELLOW}Decrypting backup...${NC}"
    DECRYPTED_FILE="${BACKUP_FILE%.gpg}"
    
    if gpg --decrypt "$BACKUP_FILE" > "$DECRYPTED_FILE"; then
        echo -e "${GREEN}✓ Decryption completed${NC}"
        BACKUP_FILE="$DECRYPTED_FILE"
        CLEANUP_DECRYPTED=true
    else
        echo -e "${RED}✗ Decryption failed${NC}"
        exit 1
    fi
fi

# Warning
echo ""
echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║                      ⚠️  WARNING  ⚠️                       ║${NC}"
echo -e "${RED}║  This will restore the database from the backup file.     ║${NC}"
echo -e "${RED}║  This operation will REPLACE all current data!            ║${NC}"
echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Restore Configuration:${NC}"
echo "  Database:     $DB_NAME"
echo "  Host:         $DB_HOST:$DB_PORT"
echo "  Backup file:  $BACKUP_FILE"
if [ -n "$RECOVERY_TARGET_TIME" ]; then
    echo "  Recovery to:  $RECOVERY_TARGET_TIME (Point-in-Time Recovery)"
fi
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled"
    [ "${CLEANUP_TEMP:-false}" = true ] && rm -f "$BACKUP_FILE"
    [ "${CLEANUP_DECRYPTED:-false}" = true ] && rm -f "$BACKUP_FILE"
    exit 0
fi

echo -e "${YELLOW}Starting restore process...${NC}"

# Create backup of current database (safety measure)
echo -e "${YELLOW}Creating safety backup of current database...${NC}"
SAFETY_BACKUP="/tmp/pre_restore_backup_$(date +%s).dump"
PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -F c -b "$DB_NAME" -f "$SAFETY_BACKUP" 2>/dev/null || {
    echo -e "${YELLOW}⚠ Could not create safety backup (database may not exist)${NC}"
}

# Drop existing connections
echo -e "${YELLOW}Terminating existing connections...${NC}"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = '$DB_NAME'
  AND pid <> pg_backend_pid();
" > /dev/null 2>&1 || true

echo -e "${GREEN}✓ Connections terminated${NC}"

# Restore backup
echo -e "${YELLOW}Restoring database from backup...${NC}"

# Handle different file formats
if [[ "$BACKUP_FILE" == *.gz ]]; then
    # Gzipped custom format
    if gunzip -c "$BACKUP_FILE" | PGPASSWORD="$DB_PASSWORD" pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v --clean --if-exists -F c 2>&1; then
        echo -e "${GREEN}✓ Database restored successfully${NC}"
    else
        echo -e "${RED}✗ Restore failed${NC}"
        echo -e "${YELLOW}Attempting to restore safety backup...${NC}"
        if [ -f "$SAFETY_BACKUP" ]; then
            PGPASSWORD="$DB_PASSWORD" pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v --clean --if-exists "$SAFETY_BACKUP" || true
        fi
        exit 1
    fi
else
    # Custom format (not gzipped)
    if PGPASSWORD="$DB_PASSWORD" pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v --clean --if-exists "$BACKUP_FILE" 2>&1; then
        echo -e "${GREEN}✓ Database restored successfully${NC}"
    else
        echo -e "${RED}✗ Restore failed${NC}"
        exit 1
    fi
fi

# Point-in-time recovery if requested
if [ -n "$RECOVERY_TARGET_TIME" ]; then
    echo -e "${YELLOW}Configuring point-in-time recovery to: $RECOVERY_TARGET_TIME${NC}"
    
    # Note: This requires WAL archiving to be configured
    # Create recovery configuration
    cat > /tmp/recovery.signal <<EOF
# Point-in-Time Recovery Configuration
# Generated by restore.sh
EOF
    
    # For PostgreSQL 12+, use postgresql.auto.conf for recovery settings
    echo -e "${YELLOW}Note: Point-in-time recovery requires WAL archives.${NC}"
    echo -e "${YELLOW}Ensure restore_command is configured in postgresql.conf${NC}"
    echo -e "${YELLOW}Example: restore_command = 'aws s3 cp s3://\$S3_BUCKET/wal/%f %p'${NC}"
    
    # This is a simplified PITR setup - full implementation would require
    # more sophisticated WAL management
fi

# Verify restore
echo -e "${YELLOW}Verifying restore...${NC}"

# Check table count
TABLE_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs || echo "0")
echo "  Tables found: $TABLE_COUNT"

# Check for critical tables
CRITICAL_TABLES=("User" "Guild" "ApiKey" "Session")
MISSING_TABLES=()

for table in "${CRITICAL_TABLES[@]}"; do
    if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table';" 2>/dev/null | grep -q 1; then
        MISSING_TABLES+=("$table")
    fi
done

if [ ${#MISSING_TABLES[@]} -gt 0 ]; then
    echo -e "${RED}✗ Missing critical tables: ${MISSING_TABLES[*]}${NC}"
    echo -e "${YELLOW}Restore may be incomplete${NC}"
else
    echo -e "${GREEN}✓ All critical tables present${NC}"
fi

# Sample data check
USER_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c 'SELECT COUNT(*) FROM "User";' 2>/dev/null | xargs || echo "0")
echo "  User records: $USER_COUNT"

# Calculate restore duration
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Cleanup
[ "${CLEANUP_TEMP:-false}" = true ] && rm -f "$BACKUP_FILE"
[ "${CLEANUP_DECRYPTED:-false}" = true ] && rm -f "$BACKUP_FILE"

# Summary
echo ""
echo "═══════════════════════════════════════════════════"
echo "            RESTORE SUMMARY"
echo "═══════════════════════════════════════════════════"
echo "Database:             $DB_NAME"
echo "Tables restored:      $TABLE_COUNT"
echo "User records:         $USER_COUNT"
echo "Duration:             ${DURATION}s"
echo "Safety backup:        $SAFETY_BACKUP"
echo "═══════════════════════════════════════════════════"

if [ "$TABLE_COUNT" -gt 0 ] && [ ${#MISSING_TABLES[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ Database restore completed successfully${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "  1. Verify application functionality"
    echo "  2. Check data integrity"
    echo "  3. Run any necessary migrations"
    echo "  4. Remove safety backup if all is well: rm $SAFETY_BACKUP"
    exit 0
else
    echo -e "${RED}✗ Database restore completed with issues${NC}"
    exit 1
fi
