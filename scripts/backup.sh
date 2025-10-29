#!/bin/bash
# PostgreSQL Backup Script for Discord SpyWatcher
# This script creates compressed backups and manages retention

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/spywatcher}"
DB_NAME="${DB_NAME:-spywatcher}"
DB_USER="${DB_USER:-spywatcher}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/spywatcher_$TIMESTAMP.sql.gz"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}Starting backup...${NC}"
echo "Database: $DB_NAME"
echo "Backup file: $BACKUP_FILE"

# Create backup
if PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -F c -b -v "$DB_NAME" | gzip > "$BACKUP_FILE"; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✓ Backup completed successfully${NC}"
    echo "Backup size: $BACKUP_SIZE"
else
    echo -e "${RED}✗ Backup failed${NC}"
    exit 1
fi

# Optional: Upload to cloud storage (S3)
if [ -n "$S3_BUCKET" ]; then
    echo -e "${YELLOW}Uploading backup to S3...${NC}"
    if aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/db-backups/" 2>&1; then
        echo -e "${GREEN}✓ Uploaded to S3${NC}"
    else
        echo -e "${RED}✗ S3 upload failed${NC}"
    fi
fi

# Cleanup old backups
echo -e "${YELLOW}Cleaning up old backups (keeping last $RETENTION_DAYS days)...${NC}"
OLD_BACKUPS=$(find "$BACKUP_DIR" -name "spywatcher_*.sql.gz" -mtime +$RETENTION_DAYS)
if [ -n "$OLD_BACKUPS" ]; then
    echo "$OLD_BACKUPS" | while read -r file; do
        echo "Removing: $file"
        rm "$file"
    done
    echo -e "${GREEN}✓ Cleanup completed${NC}"
else
    echo "No old backups to remove"
fi

# Summary
TOTAL_BACKUPS=$(find "$BACKUP_DIR" -name "spywatcher_*.sql.gz" | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo ""
echo "Backup Summary:"
echo "  Total backups: $TOTAL_BACKUPS"
echo "  Total size: $TOTAL_SIZE"
echo -e "${GREEN}✓ Backup process completed${NC}"
