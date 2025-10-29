#!/bin/bash
# PostgreSQL Maintenance Script for Discord SpyWatcher
# This script performs routine maintenance tasks

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

echo -e "${YELLOW}Starting PostgreSQL maintenance...${NC}"
echo "Database: $DB_NAME"
echo ""

# Function to run SQL command
run_sql() {
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$1" 2>&1
}

# 1. VACUUM ANALYZE
echo -e "${YELLOW}Running VACUUM ANALYZE...${NC}"
if run_sql "VACUUM ANALYZE;" > /dev/null; then
    echo -e "${GREEN}✓ VACUUM ANALYZE completed${NC}"
else
    echo -e "${RED}✗ VACUUM ANALYZE failed${NC}"
fi

# 2. Update statistics
echo -e "${YELLOW}Updating table statistics...${NC}"
TABLES=$(run_sql "SELECT tablename FROM pg_tables WHERE schemaname = 'public';" | grep -v "^(" | grep -v "rows)" | grep -v "^$" | tail -n +3 | head -n -2)

while IFS= read -r table; do
    if [ -n "$table" ]; then
        echo "  Analyzing $table..."
        run_sql "ANALYZE \"$table\";" > /dev/null 2>&1 || echo "    Warning: Failed to analyze $table"
    fi
done <<< "$TABLES"
echo -e "${GREEN}✓ Statistics updated${NC}"

# 3. Check for bloated tables
echo -e "${YELLOW}Checking for table bloat...${NC}"
BLOAT_QUERY="
SELECT 
    schemaname || '.' || tablename AS table,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    ROUND(100 * pg_table_size(schemaname||'.'||tablename) / 
          NULLIF(pg_total_relation_size(schemaname||'.'||tablename), 0), 2) AS bloat_pct
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
"
run_sql "$BLOAT_QUERY"

# 4. Check index usage
echo -e "${YELLOW}Checking index usage...${NC}"
INDEX_QUERY="
SELECT 
    schemaname || '.' || tablename AS table,
    indexname,
    idx_scan AS scans,
    pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 5;
"
UNUSED_INDEXES=$(run_sql "$INDEX_QUERY" | tail -n +3 | head -n -2 | wc -l)
if [ "$UNUSED_INDEXES" -gt 0 ]; then
    echo -e "${YELLOW}Found $UNUSED_INDEXES potentially unused indexes:${NC}"
    run_sql "$INDEX_QUERY"
else
    echo -e "${GREEN}✓ All indexes are being used${NC}"
fi

# 5. Database size
echo -e "${YELLOW}Database size:${NC}"
SIZE_QUERY="
SELECT 
    pg_size_pretty(pg_database_size('$DB_NAME')) AS database_size;
"
run_sql "$SIZE_QUERY"

# 6. Connection count
echo -e "${YELLOW}Active connections:${NC}"
CONN_QUERY="
SELECT 
    count(*) AS connections,
    state
FROM pg_stat_activity
WHERE datname = '$DB_NAME'
GROUP BY state;
"
run_sql "$CONN_QUERY"

# 7. Long-running queries
echo -e "${YELLOW}Checking for long-running queries...${NC}"
LONG_QUERY="
SELECT 
    pid,
    now() - query_start AS duration,
    state,
    LEFT(query, 50) AS query
FROM pg_stat_activity
WHERE state != 'idle'
  AND datname = '$DB_NAME'
  AND now() - query_start > interval '1 minute'
ORDER BY duration DESC;
"
LONG_QUERIES=$(run_sql "$LONG_QUERY" | tail -n +3 | head -n -2 | wc -l)
if [ "$LONG_QUERIES" -gt 0 ]; then
    echo -e "${YELLOW}Found $LONG_QUERIES long-running queries:${NC}"
    run_sql "$LONG_QUERY"
else
    echo -e "${GREEN}✓ No long-running queries${NC}"
fi

echo ""
echo -e "${GREEN}✓ Maintenance completed${NC}"
