#!/bin/bash
# Setup Full-Text Search for MessageEvent
# This script adds full-text search capabilities to the MessageEvent table

set -e

# Configuration
DB_NAME="${DB_NAME:-spywatcher}"
DB_USER="${DB_USER:-spywatcher}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up full-text search for MessageEvent...${NC}"
echo "Database: $DB_NAME"
echo ""

# Check if DB_PASSWORD is set
if [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}Error: DB_PASSWORD environment variable not set${NC}"
    exit 1
fi

# Add tsvector column and GIN index
echo -e "${YELLOW}Adding tsvector column...${NC}"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << 'EOF'
-- Add a tsvector column for full-text search
ALTER TABLE "MessageEvent" ADD COLUMN IF NOT EXISTS content_search tsvector
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS "MessageEvent_content_search_idx" 
  ON "MessageEvent" USING GIN (content_search);

-- Verify the index was created
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'MessageEvent'
  AND indexname = 'MessageEvent_content_search_idx';
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Full-text search setup completed${NC}"
    echo ""
    echo "You can now perform full-text searches like:"
    echo "  SELECT * FROM \"MessageEvent\""
    echo "  WHERE content_search @@ to_tsquery('english', 'search & terms');"
else
    echo -e "${RED}✗ Full-text search setup failed${NC}"
    exit 1
fi
