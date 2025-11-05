/**
 * Query Analyzer Utility
 * 
 * Provides tools for analyzing query performance using EXPLAIN ANALYZE
 * and monitoring query execution plans.
 */

import { db } from '../db';

export interface QueryPlan {
    plan: string;
    executionTime: number;
    planningTime: number;
    totalTime: number;
    hasSeqScan: boolean;
    hasIndexScan: boolean;
    warnings: string[];
}

export interface QueryAnalysis {
    query: string;
    params?: unknown[];
    plan: QueryPlan;
    recommendations: string[];
}

/**
 * Parse EXPLAIN ANALYZE output to extract key metrics
 * Exported for testing purposes
 */
export function parseExplainOutput(output: string): QueryPlan {
    const lines = output.split('\n');
    const warnings: string[] = [];
    let hasSeqScan = false;
    let hasIndexScan = false;
    let executionTime = 0;
    let planningTime = 0;

    for (const line of lines) {
        // Check for sequential scans (potential performance issue)
        if (line.includes('Seq Scan')) {
            hasSeqScan = true;
            warnings.push('Sequential scan detected - consider adding an index');
        }

        // Check for index scans (good)
        if (line.includes('Index Scan') || line.includes('Index Only Scan')) {
            hasIndexScan = true;
        }

        // Extract timing information
        const execMatch = line.match(/Execution Time: ([\d.]+) ms/);
        if (execMatch) {
            executionTime = parseFloat(execMatch[1]);
        }

        const planMatch = line.match(/Planning Time: ([\d.]+) ms/);
        if (planMatch) {
            planningTime = parseFloat(planMatch[1]);
        }

        // Check for expensive operations
        if (line.includes('Sort') && line.includes('Disk')) {
            warnings.push('Sort operation spilling to disk - consider increasing work_mem');
        }

        if (line.includes('Hash') && line.includes('Batches')) {
            warnings.push('Hash join using multiple batches - consider increasing work_mem');
        }
    }

    const totalTime = executionTime + planningTime;

    // Add performance warnings
    if (executionTime > 100) {
        warnings.push(`Slow query: execution time ${executionTime.toFixed(2)}ms exceeds 100ms threshold`);
    }

    if (!hasIndexScan && hasSeqScan) {
        warnings.push('Query uses sequential scans without index scans - review indexing strategy');
    }

    return {
        plan: output,
        executionTime,
        planningTime,
        totalTime,
        hasSeqScan,
        hasIndexScan,
        warnings,
    };
}

/**
 * Generate recommendations based on query analysis
 * Exported for testing purposes
 */
export function generateRecommendations(plan: QueryPlan): string[] {
    const recommendations: string[] = [];

    if (plan.hasSeqScan && !plan.hasIndexScan) {
        recommendations.push('Add indexes on columns used in WHERE, JOIN, and ORDER BY clauses');
    }

    if (plan.executionTime > 100) {
        recommendations.push('Consider optimizing query logic or adding caching');
    }

    if (plan.executionTime > 50 && plan.executionTime <= 100) {
        recommendations.push('Query performance is acceptable but could be improved');
    }

    if (plan.planningTime > plan.executionTime) {
        recommendations.push('Planning time is high - consider using prepared statements');
    }

    if (plan.warnings.some(w => w.includes('work_mem'))) {
        recommendations.push('Increase work_mem configuration parameter for this session or globally');
    }

    if (recommendations.length === 0 && plan.executionTime < 50) {
        recommendations.push('Query performance is excellent - no optimization needed');
    }

    return recommendations;
}

/**
 * Analyze a raw SQL query using EXPLAIN ANALYZE
 */
export async function analyzeQuery(
    query: string,
    params?: unknown[]
): Promise<QueryAnalysis> {
    // Prepare the EXPLAIN ANALYZE query
    let explainQuery = `EXPLAIN (ANALYZE true, BUFFERS true, VERBOSE true, FORMAT text) ${query}`;

    try {
        // Execute EXPLAIN ANALYZE
        const result = await db.$queryRawUnsafe<Array<{ 'QUERY PLAN': string }>>(
            explainQuery,
            ...(params || [])
        );

        // Combine all lines of the query plan
        const planOutput = result.map(row => row['QUERY PLAN']).join('\n');

        // Parse the output
        const plan = parseExplainOutput(planOutput);

        // Generate recommendations
        const recommendations = generateRecommendations(plan);

        return {
            query,
            params,
            plan,
            recommendations,
        };
    } catch (error) {
        throw new Error(`Failed to analyze query: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Analyze a Prisma query by capturing the generated SQL
 * Note: This is a helper that works with raw SQL queries
 */
export async function analyzePrismaQuery(
    queryFn: () => Promise<unknown>
): Promise<{ result: unknown; analysis?: QueryAnalysis }> {
    // For now, just execute the query
    // Full Prisma query analysis would require query event middleware
    const result = await queryFn();
    
    return {
        result,
        analysis: undefined, // Would need to capture SQL from Prisma middleware
    };
}

/**
 * Batch analyze multiple queries
 */
export async function analyzeQueries(
    queries: Array<{ name: string; sql: string; params?: unknown[] }>
): Promise<Array<QueryAnalysis & { name: string }>> {
    const results: Array<QueryAnalysis & { name: string }> = [];

    for (const query of queries) {
        try {
            const analysis = await analyzeQuery(query.sql, query.params);
            results.push({
                name: query.name,
                ...analysis,
            });
        } catch (error) {
            console.error(`Failed to analyze query "${query.name}":`, error);
        }
    }

    return results;
}

/**
 * Get table statistics for query optimization
 */
export async function getTableStatistics(tableName: string) {
    const stats = await db.$queryRaw<
        Array<{
            schemaname: string;
            tablename: string;
            n_live_tup: bigint;
            n_dead_tup: bigint;
            last_vacuum: Date | null;
            last_autovacuum: Date | null;
            last_analyze: Date | null;
            last_autoanalyze: Date | null;
        }>
    >`
        SELECT 
            schemaname,
            tablename,
            n_live_tup,
            n_dead_tup,
            last_vacuum,
            last_autovacuum,
            last_analyze,
            last_autoanalyze
        FROM pg_stat_user_tables
        WHERE tablename = ${tableName}
    `;

    return stats[0] || null;
}

/**
 * Check if a query plan uses an index
 */
export function usesIndex(plan: QueryPlan): boolean {
    return plan.hasIndexScan && !plan.hasSeqScan;
}

/**
 * Check if a query meets performance thresholds
 */
export function meetsPerformanceThreshold(
    plan: QueryPlan,
    threshold: number = 100
): boolean {
    return plan.executionTime < threshold;
}

/**
 * Format query analysis for display
 */
export function formatQueryAnalysis(analysis: QueryAnalysis): string {
    const { plan, recommendations } = analysis;
    
    let output = '\n📊 Query Analysis\n';
    output += '─'.repeat(80) + '\n\n';
    
    output += `Query: ${analysis.query.substring(0, 100)}${analysis.query.length > 100 ? '...' : ''}\n\n`;
    
    output += '⏱️  Performance Metrics:\n';
    output += `   Planning Time: ${plan.planningTime.toFixed(2)}ms\n`;
    output += `   Execution Time: ${plan.executionTime.toFixed(2)}ms\n`;
    output += `   Total Time: ${plan.totalTime.toFixed(2)}ms\n\n`;
    
    output += '🔍 Query Plan:\n';
    output += `   Sequential Scan: ${plan.hasSeqScan ? '❌ Yes' : '✅ No'}\n`;
    output += `   Index Scan: ${plan.hasIndexScan ? '✅ Yes' : '❌ No'}\n\n`;
    
    if (plan.warnings.length > 0) {
        output += '⚠️  Warnings:\n';
        for (const warning of plan.warnings) {
            output += `   • ${warning}\n`;
        }
        output += '\n';
    }
    
    if (recommendations.length > 0) {
        output += '💡 Recommendations:\n';
        for (const rec of recommendations) {
            output += `   • ${rec}\n`;
        }
        output += '\n';
    }
    
    output += '─'.repeat(80) + '\n';
    
    return output;
}
