import { db } from '../db';

/**
 * Database maintenance utilities for monitoring and optimizing performance
 */

interface IndexStats {
    schemaname: string;
    tablename: string;
    indexname: string;
    idx_scan: number;
    idx_tup_read: number;
    idx_tup_fetch: number;
    index_size: string;
}

interface TableStats {
    schemaname: string;
    tablename: string;
    row_count: number;
    total_size: string;
    table_size: string;
    indexes_size: string;
}

interface SlowQuery {
    query: string;
    calls: number;
    total_time: number;
    mean_time: number;
    max_time: number;
}

/**
 * Get index usage statistics to identify unused or underutilized indexes
 */
export async function getIndexUsageStats(): Promise<IndexStats[]> {
    const result = await db.$queryRaw<IndexStats[]>`
    SELECT 
      schemaname,
      tablename,
      indexname,
      idx_scan,
      idx_tup_read,
      idx_tup_fetch,
      pg_size_pretty(pg_relation_size(indexrelid::regclass)) as index_size
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    ORDER BY idx_scan ASC, pg_relation_size(indexrelid::regclass) DESC
    LIMIT 50
  `;

    return result;
}

/**
 * Get unused indexes (never scanned and not primary/unique)
 */
export async function getUnusedIndexes(): Promise<
    { indexname: string; tablename: string; index_size: string }[]
> {
    const result = await db.$queryRaw<
        { indexname: string; tablename: string; index_size: string }[]
    >`
    SELECT 
      indexname,
      tablename,
      pg_size_pretty(pg_relation_size(indexrelid::regclass)) as index_size
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
      AND idx_scan = 0
      AND indexrelid NOT IN (
        SELECT indexrelid 
        FROM pg_index 
        WHERE indisprimary OR indisunique
      )
    ORDER BY pg_relation_size(indexrelid::regclass) DESC
  `;

    return result;
}

/**
 * Get table statistics including row count and sizes
 */
export async function getTableStats(): Promise<TableStats[]> {
    const result = await db.$queryRaw<TableStats[]>`
    SELECT 
      schemaname,
      tablename,
      n_live_tup as row_count,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
      pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - 
                     pg_relation_size(schemaname||'.'||tablename)) as indexes_size
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
  `;

    return result;
}

/**
 * Run ANALYZE on all tables to update statistics
 */
export async function analyzeAllTables(): Promise<void> {
    const tables = await db.$queryRaw<{ tablename: string }[]>`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
  `;

    for (const table of tables) {
        await db.$executeRawUnsafe(`ANALYZE "${table.tablename}"`);
        console.log(`✓ Analyzed table: ${table.tablename}`);
    }

    console.log(`✅ Analyzed ${tables.length} tables`);
}

/**
 * Get slow queries from pg_stat_statements (requires extension)
 * Note: This requires pg_stat_statements extension to be enabled
 */
export async function getSlowQueries(
    minCallsThreshold = 10
): Promise<SlowQuery[]> {
    try {
        const result = await db.$queryRaw<SlowQuery[]>`
      SELECT 
        LEFT(query, 100) as query,
        calls,
        total_exec_time as total_time,
        mean_exec_time as mean_time,
        max_exec_time as max_time
      FROM pg_stat_statements
      WHERE mean_exec_time > 100
        AND calls > ${minCallsThreshold}
      ORDER BY mean_exec_time DESC
      LIMIT 20
    `;

        return result;
    } catch (error) {
        console.warn(
            'pg_stat_statements extension not available. Skipping slow query analysis.'
        );
        return [];
    }
}

/**
 * Check database connection and health
 */
export async function checkDatabaseHealth(): Promise<{
    connected: boolean;
    version: string;
    activeConnections: number;
    maxConnections: number;
}> {
    try {
        const versionResult = await db.$queryRaw<{ version: string }[]>`
      SELECT version()
    `;

        const connectionsResult = await db.$queryRaw<
            { count: bigint; setting: string }[]
        >`
      SELECT 
        (SELECT count(*) FROM pg_stat_activity) as count,
        (SELECT setting FROM pg_settings WHERE name = 'max_connections') as setting
    `;

        return {
            connected: true,
            version: versionResult[0].version,
            activeConnections: Number(connectionsResult[0].count),
            maxConnections: parseInt(connectionsResult[0].setting, 10),
        };
    } catch (error) {
        return {
            connected: false,
            version: 'unknown',
            activeConnections: 0,
            maxConnections: 0,
        };
    }
}

/**
 * Get index bloat information
 */
export async function getIndexBloat(): Promise<
    {
        tablename: string;
        indexname: string;
        bloat_pct: number;
        bloat_size: string;
    }[]
> {
    try {
        const result = await db.$queryRaw<
            {
                tablename: string;
                indexname: string;
                bloat_pct: number;
                bloat_size: string;
            }[]
        >`
      SELECT 
        tablename,
        indexname,
        ROUND(100 * (pg_relation_size(indexrelid::regclass) - 
              pg_relation_size(indexrelid::regclass, 'main'))::numeric / 
              NULLIF(pg_relation_size(indexrelid::regclass), 0), 2) as bloat_pct,
        pg_size_pretty(pg_relation_size(indexrelid::regclass) - 
                       pg_relation_size(indexrelid::regclass, 'main')) as bloat_size
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
        AND pg_relation_size(indexrelid::regclass) > 1048576 -- > 1MB
      ORDER BY bloat_pct DESC
      LIMIT 20
    `;

        return result;
    } catch (error) {
        console.warn('Could not calculate index bloat:', error);
        return [];
    }
}

/**
 * Run comprehensive database maintenance report
 */
export async function generateMaintenanceReport(): Promise<{
    health: Awaited<ReturnType<typeof checkDatabaseHealth>>;
    tableStats: TableStats[];
    indexStats: IndexStats[];
    unusedIndexes: Awaited<ReturnType<typeof getUnusedIndexes>>;
    slowQueries: SlowQuery[];
}> {
    console.log('📊 Generating database maintenance report...\n');

    const [health, tableStats, indexStats, unusedIndexes, slowQueries] =
        await Promise.all([
            checkDatabaseHealth(),
            getTableStats(),
            getIndexUsageStats(),
            getUnusedIndexes(),
            getSlowQueries(),
        ]);

    console.log('✅ Report generated\n');

    return {
        health,
        tableStats,
        indexStats,
        unusedIndexes,
        slowQueries,
    };
}
