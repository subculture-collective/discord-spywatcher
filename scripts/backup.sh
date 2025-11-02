#!/bin/bash
# PostgreSQL Backup Script for Discord SpyWatcher
# This script creates compressed, encrypted backups with cloud storage support

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/spywatcher}"
DB_NAME="${DB_NAME:-spywatcher}"
DB_USER="${DB_USER:-spywatcher}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_TYPE="${BACKUP_TYPE:-FULL}" # FULL or INCREMENTAL
RETENTION_DAYS="${RETENTION_DAYS:-30}"
RETENTION_MONTHLY="${RETENTION_MONTHLY:-12}" # Keep 12 monthly backups

# Encryption configuration
ENABLE_ENCRYPTION="${ENABLE_ENCRYPTION:-false}"
GPG_RECIPIENT="${GPG_RECIPIENT:-backups@spywatcher.dev}"

# S3 configuration
S3_BUCKET="${S3_BUCKET:-}"
S3_BUCKET_SECONDARY="${S3_BUCKET_SECONDARY:-}" # Secondary region for DR
S3_STORAGE_CLASS="${S3_STORAGE_CLASS:-STANDARD_IA}" # STANDARD_IA for infrequent access

# Webhook notifications
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"
DISCORD_WEBHOOK="${DISCORD_WEBHOOK:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track backup start time
START_TIME=$(date +%s)

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}Starting $BACKUP_TYPE backup...${NC}"
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "Timestamp: $TIMESTAMP"

# Create backup filename
BACKUP_FILE="spywatcher_${BACKUP_TYPE,,}_${TIMESTAMP}.dump"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"

# Perform backup
echo -e "${YELLOW}Creating database dump...${NC}"
if PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -F c -b -v "$DB_NAME" -f "$BACKUP_PATH"; then
    echo -e "${GREEN}✓ Database dump completed${NC}"
else
    echo -e "${RED}✗ Database dump failed${NC}"
    exit 1
fi

# Compress backup
echo -e "${YELLOW}Compressing backup...${NC}"
gzip "$BACKUP_PATH"
BACKUP_FILE="${BACKUP_FILE}.gz"
BACKUP_PATH="${BACKUP_PATH}.gz"

BACKUP_SIZE_BYTES=$(stat -f%z "$BACKUP_PATH" 2>/dev/null || stat -c%s "$BACKUP_PATH" 2>/dev/null)
BACKUP_SIZE_MB=$(echo "scale=2; $BACKUP_SIZE_BYTES / 1048576" | bc)
BACKUP_SIZE_HUMAN=$(du -h "$BACKUP_PATH" | cut -f1)

echo -e "${GREEN}✓ Compression completed${NC}"
echo "Backup size: $BACKUP_SIZE_HUMAN"

# Encrypt backup if enabled
FINAL_FILE="$BACKUP_FILE"
FINAL_PATH="$BACKUP_PATH"

if [ "$ENABLE_ENCRYPTION" = "true" ]; then
    echo -e "${YELLOW}Encrypting backup...${NC}"
    if command -v gpg &> /dev/null; then
        if gpg --encrypt --recipient "$GPG_RECIPIENT" "$BACKUP_PATH"; then
            FINAL_FILE="${BACKUP_FILE}.gpg"
            FINAL_PATH="${BACKUP_PATH}.gpg"
            rm "$BACKUP_PATH" # Remove unencrypted file
            echo -e "${GREEN}✓ Encryption completed${NC}"
        else
            echo -e "${RED}✗ Encryption failed, keeping unencrypted backup${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ GPG not found, skipping encryption${NC}"
    fi
fi

# Upload to primary S3 bucket
S3_SUCCESS=false
S3_LOCATION=""
if [ -n "$S3_BUCKET" ]; then
    echo -e "${YELLOW}Uploading to primary S3 bucket...${NC}"
    S3_KEY="postgres/${BACKUP_TYPE,,}/${FINAL_FILE}"
    if aws s3 cp "$FINAL_PATH" "s3://$S3_BUCKET/$S3_KEY" --storage-class "$S3_STORAGE_CLASS" 2>&1; then
        S3_LOCATION="s3://$S3_BUCKET/$S3_KEY"
        echo -e "${GREEN}✓ Uploaded to primary S3: $S3_LOCATION${NC}"
        S3_SUCCESS=true
    else
        echo -e "${RED}✗ Primary S3 upload failed${NC}"
    fi
fi

# Upload to secondary S3 bucket (different region for disaster recovery)
S3_SECONDARY_SUCCESS=false
S3_LOCATION_SECONDARY=""
if [ -n "$S3_BUCKET_SECONDARY" ] && [ "$S3_SUCCESS" = true ]; then
    echo -e "${YELLOW}Uploading to secondary S3 bucket...${NC}"
    S3_KEY_SECONDARY="postgres/${BACKUP_TYPE,,}/${FINAL_FILE}"
    if aws s3 cp "$FINAL_PATH" "s3://$S3_BUCKET_SECONDARY/$S3_KEY_SECONDARY" --storage-class "$S3_STORAGE_CLASS" 2>&1; then
        S3_LOCATION_SECONDARY="s3://$S3_BUCKET_SECONDARY/$S3_KEY_SECONDARY"
        echo -e "${GREEN}✓ Uploaded to secondary S3: $S3_LOCATION_SECONDARY${NC}"
        S3_SECONDARY_SUCCESS=true
    else
        echo -e "${YELLOW}⚠ Secondary S3 upload failed${NC}"
    fi
fi

# Verify primary S3 upload
if [ "$S3_SUCCESS" = true ]; then
    echo -e "${YELLOW}Verifying S3 upload...${NC}"
    if aws s3 ls "$S3_LOCATION" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ S3 upload verified${NC}"
    else
        echo -e "${RED}✗ S3 verification failed${NC}"
        S3_SUCCESS=false
    fi
fi

# Calculate backup duration
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Cleanup old local backups (keep last 7 days locally)
echo -e "${YELLOW}Cleaning up old local backups (keeping last 7 days)...${NC}"
DELETED_COUNT=$(find "$BACKUP_DIR" -name "spywatcher_*" -type f -mtime +7 -delete -print | wc -l)
echo "Removed $DELETED_COUNT old backup(s)"
echo -e "${GREEN}✓ Local cleanup completed${NC}"

# Cleanup old S3 backups based on retention policy
if [ "$S3_SUCCESS" = true ] && [ "$BACKUP_TYPE" = "FULL" ]; then
    echo -e "${YELLOW}Applying S3 retention policy...${NC}"
    
    # Keep daily backups for 30 days
    CUTOFF_DATE=$(date -d "$RETENTION_DAYS days ago" +%Y%m%d 2>/dev/null || date -v-${RETENTION_DAYS}d +%Y%m%d 2>/dev/null)
    aws s3 ls "s3://$S3_BUCKET/postgres/full/" | \
        awk '{print $4}' | \
        grep -E "spywatcher_full_[0-9]+_.*" | \
        while read -r file; do
            FILE_DATE=$(echo "$file" | grep -oE "[0-9]{8}" | head -1)
            if [ "$FILE_DATE" -lt "$CUTOFF_DATE" ]; then
                # Check if it's a monthly backup (1st of month)
                FILE_DAY="${FILE_DATE:6:2}"
                if [ "$FILE_DAY" != "01" ]; then
                    echo "Removing old backup: $file"
                    aws s3 rm "s3://$S3_BUCKET/postgres/full/$file" || true
                fi
            fi
        done
    
    echo -e "${GREEN}✓ S3 retention policy applied${NC}"
fi

# Summary
TOTAL_BACKUPS=$(find "$BACKUP_DIR" -name "spywatcher_*" -type f 2>/dev/null | wc -l || echo "0")
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1 || echo "0B")

echo ""
echo "═══════════════════════════════════════════════════"
echo "              BACKUP SUMMARY"
echo "═══════════════════════════════════════════════════"
echo "Backup Type:          $BACKUP_TYPE"
echo "Filename:             $FINAL_FILE"
echo "Size:                 $BACKUP_SIZE_HUMAN (${BACKUP_SIZE_MB}MB)"
echo "Duration:             ${DURATION}s"
echo "Encrypted:            $ENABLE_ENCRYPTION"
echo "Primary S3:           $([ "$S3_SUCCESS" = true ] && echo "✓ $S3_LOCATION" || echo "✗ Failed")"
echo "Secondary S3:         $([ "$S3_SECONDARY_SUCCESS" = true ] && echo "✓ $S3_LOCATION_SECONDARY" || echo "- Not configured")"
echo "Local backups:        $TOTAL_BACKUPS ($TOTAL_SIZE)"
echo "═══════════════════════════════════════════════════"

# Send notifications
if [ "$S3_SUCCESS" = true ]; then
    NOTIFICATION_STATUS="✅ SUCCESS"
    NOTIFICATION_COLOR="good"
else
    NOTIFICATION_STATUS="❌ FAILED"
    NOTIFICATION_COLOR="danger"
fi

# Slack notification
if [ -n "$SLACK_WEBHOOK" ]; then
    curl -X POST "$SLACK_WEBHOOK" \
        -H 'Content-Type: application/json' \
        -d "{
            \"text\": \"$NOTIFICATION_STATUS Database Backup\",
            \"attachments\": [{
                \"color\": \"$NOTIFICATION_COLOR\",
                \"fields\": [
                    {\"title\": \"Type\", \"value\": \"$BACKUP_TYPE\", \"short\": true},
                    {\"title\": \"Size\", \"value\": \"$BACKUP_SIZE_HUMAN\", \"short\": true},
                    {\"title\": \"Duration\", \"value\": \"${DURATION}s\", \"short\": true},
                    {\"title\": \"File\", \"value\": \"$FINAL_FILE\", \"short\": false}
                ]
            }]
        }" 2>/dev/null || true
fi

# Discord notification
if [ -n "$DISCORD_WEBHOOK" ]; then
    curl -X POST "$DISCORD_WEBHOOK" \
        -H 'Content-Type: application/json' \
        -d "{
            \"embeds\": [{
                \"title\": \"$NOTIFICATION_STATUS Database Backup\",
                \"color\": $([ "$S3_SUCCESS" = true ] && echo "3066993" || echo "15158332"),
                \"fields\": [
                    {\"name\": \"Type\", \"value\": \"$BACKUP_TYPE\", \"inline\": true},
                    {\"name\": \"Size\", \"value\": \"$BACKUP_SIZE_HUMAN\", \"inline\": true},
                    {\"name\": \"Duration\", \"value\": \"${DURATION}s\", \"inline\": true},
                    {\"name\": \"File\", \"value\": \"$FINAL_FILE\", \"inline\": false}
                ],
                \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\"
            }]
        }" 2>/dev/null || true
fi

echo -e "${GREEN}✓ Backup process completed${NC}"

# Exit with appropriate code
if [ "$S3_SUCCESS" = true ] || [ -z "$S3_BUCKET" ]; then
    exit 0
else
    exit 1
fi
