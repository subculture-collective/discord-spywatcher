#!/bin/bash
# PostgreSQL WAL Archiving Setup Script
# This script configures WAL archiving for point-in-time recovery

set -e

# Configuration
POSTGRESQL_VERSION="${POSTGRESQL_VERSION:-15}"
POSTGRESQL_CONF="${POSTGRESQL_CONF:-/etc/postgresql/$POSTGRESQL_VERSION/main/postgresql.conf}"
S3_BUCKET="${S3_BUCKET:-}"
WAL_ARCHIVE_DIR="${WAL_ARCHIVE_DIR:-/var/lib/postgresql/wal_archive}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   PostgreSQL WAL Archiving Configuration${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# Check if running as root or postgres user
if [ "$EUID" -ne 0 ] && [ "$(whoami)" != "postgres" ]; then
    echo -e "${RED}Error: This script must be run as root or postgres user${NC}"
    exit 1
fi

# Create WAL archive directory if using local storage
if [ -z "$S3_BUCKET" ]; then
    echo -e "${YELLOW}Configuring local WAL archiving...${NC}"
    mkdir -p "$WAL_ARCHIVE_DIR"
    chown postgres:postgres "$WAL_ARCHIVE_DIR"
    chmod 700 "$WAL_ARCHIVE_DIR"
    echo -e "${GREEN}✓ WAL archive directory created: $WAL_ARCHIVE_DIR${NC}"
fi

# Backup current postgresql.conf
echo -e "${YELLOW}Backing up postgresql.conf...${NC}"
cp "$POSTGRESQL_CONF" "${POSTGRESQL_CONF}.backup.$(date +%Y%m%d_%H%M%S)"
echo -e "${GREEN}✓ Backup created${NC}"

# Configure WAL archiving
echo -e "${YELLOW}Configuring WAL archiving in postgresql.conf...${NC}"

# Remove existing WAL configuration if present (backing up removed lines)
echo -e "${YELLOW}Removing existing WAL configuration (if any)...${NC}"
grep -E "^(wal_level|archive_mode|archive_command|archive_timeout|max_wal_senders|wal_keep_size)" "$POSTGRESQL_CONF" >> "${POSTGRESQL_CONF}.removed.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true

# Cleanup old .removed backup files, keep only the 5 most recent
ls -1t "${POSTGRESQL_CONF}.removed."* 2>/dev/null | tail -n +6 | xargs -r rm -- 2>/dev/null || true

sed -i '/^wal_level/d' "$POSTGRESQL_CONF"
sed -i '/^archive_mode/d' "$POSTGRESQL_CONF"
sed -i '/^archive_command/d' "$POSTGRESQL_CONF"
sed -i '/^archive_timeout/d' "$POSTGRESQL_CONF"
sed -i '/^max_wal_senders/d' "$POSTGRESQL_CONF"
sed -i '/^wal_keep_size/d' "$POSTGRESQL_CONF"

# Add WAL configuration
cat >> "$POSTGRESQL_CONF" <<EOF

# ============================================
# WAL Archiving Configuration
# Added by setup-wal-archiving.sh
# ============================================

# WAL level (replica enables archiving and streaming replication)
wal_level = replica

# Enable WAL archiving
archive_mode = on

EOF

# Configure archive command based on storage type
if [ -n "$S3_BUCKET" ]; then
    echo -e "${YELLOW}Configuring S3 WAL archiving...${NC}"
    cat >> "$POSTGRESQL_CONF" <<EOF
# Archive to S3 (requires AWS CLI configured)
# Retry up to 3 times and verify upload success
archive_command = 'test ! -f s3://${S3_BUCKET}/wal/%f && for i in 1 2 3; do aws s3 cp %p s3://${S3_BUCKET}/wal/%f --storage-class STANDARD_IA && aws s3 ls s3://${S3_BUCKET}/wal/%f > /dev/null 2>&1 && exit 0; sleep 1; done; exit 1'

# Restore command for recovery
# restore_command = 'aws s3 cp s3://${S3_BUCKET}/wal/%f %p'

EOF
    echo -e "${GREEN}✓ Configured S3 WAL archiving to: s3://${S3_BUCKET}/wal/${NC}"
else
    echo -e "${YELLOW}Configuring local WAL archiving...${NC}"
    cat >> "$POSTGRESQL_CONF" <<EOF
# Archive to local directory with verification
archive_command = 'test ! -f ${WAL_ARCHIVE_DIR}/%f && cp %p ${WAL_ARCHIVE_DIR}/%f && test -f ${WAL_ARCHIVE_DIR}/%f'

# Restore command for recovery
# restore_command = 'cp ${WAL_ARCHIVE_DIR}/%f %p'

EOF
    echo -e "${GREEN}✓ Configured local WAL archiving to: ${WAL_ARCHIVE_DIR}${NC}"
fi

# Add remaining WAL configuration
cat >> "$POSTGRESQL_CONF" <<EOF
# Archive timeout (force WAL switch every hour)
archive_timeout = 3600

# Replication settings
max_wal_senders = 3
wal_keep_size = 1024  # MB

# ============================================
# End WAL Archiving Configuration
# ============================================
EOF

echo -e "${GREEN}✓ WAL configuration added to postgresql.conf${NC}"

# Verify configuration
echo -e "${YELLOW}Verifying configuration...${NC}"
if grep -q "^wal_level = replica" "$POSTGRESQL_CONF" && \
   grep -q "^archive_mode = on" "$POSTGRESQL_CONF" && \
   grep -q "^archive_command" "$POSTGRESQL_CONF"; then
    echo -e "${GREEN}✓ Configuration verified${NC}"
else
    echo -e "${RED}✗ Configuration verification failed${NC}"
    exit 1
fi

# Instructions for restart
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Configuration Complete${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}⚠ PostgreSQL must be restarted for changes to take effect${NC}"
echo ""
echo -e "${BLUE}To restart PostgreSQL:${NC}"
echo "  sudo systemctl restart postgresql"
echo ""
echo -e "${BLUE}To verify WAL archiving is working:${NC}"
echo "  sudo -u postgres psql -c \"SELECT * FROM pg_stat_archiver;\""
echo ""

if [ -n "$S3_BUCKET" ]; then
    echo -e "${BLUE}S3 WAL Archive Location:${NC}"
    echo "  s3://${S3_BUCKET}/wal/"
    echo ""
    echo -e "${BLUE}To list archived WAL files:${NC}"
    echo "  aws s3 ls s3://${S3_BUCKET}/wal/"
else
    echo -e "${BLUE}Local WAL Archive Location:${NC}"
    echo "  ${WAL_ARCHIVE_DIR}"
    echo ""
    echo -e "${BLUE}To list archived WAL files:${NC}"
    echo "  ls -lh ${WAL_ARCHIVE_DIR}"
fi

echo ""
echo -e "${YELLOW}Point-in-Time Recovery (PITR) is now enabled!${NC}"
echo ""
echo -e "${BLUE}For point-in-time recovery, use:${NC}"
echo "  ./restore.sh <backup_file> 'YYYY-MM-DD HH:MM:SS'"
echo ""
