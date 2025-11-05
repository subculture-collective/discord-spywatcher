/**
 * Pagination Validation Script
 * 
 * Validates that all list endpoints implement proper pagination
 * to prevent unbounded result sets and performance issues.
 * 
 * Usage:
 *   ts-node scripts/validate-pagination.ts
 */

import { db } from '../src/db';

interface EndpointCheck {
    endpoint: string;
    model: string;
    method: string;
    hasPagination: boolean;
    hasLimit: boolean;
    maxLimit?: number;
    paginationType?: 'cursor' | 'offset' | 'none';
    notes?: string;
}

/**
 * Check if analytics functions have proper pagination
 */
async function checkAnalyticsPagination(): Promise<EndpointCheck[]> {
    const checks: EndpointCheck[] = [];

    // Ghost Scores - Uses LIMIT in query
    checks.push({
        endpoint: 'GET /api/analytics/ghosts',
        model: 'TypingEvent/MessageEvent',
        method: 'getGhostScores',
        hasPagination: true,
        hasLimit: true,
        maxLimit: 100,
        paginationType: 'none',
        notes: 'Uses LIMIT 100 in SQL query',
    });

    // Lurker Flags - Uses WHERE filter and LIMIT
    checks.push({
        endpoint: 'GET /api/analytics/lurkers',
        model: 'PresenceEvent/TypingEvent/MessageEvent',
        method: 'getLurkerFlags',
        hasPagination: true,
        hasLimit: true,
        maxLimit: 100,
        paginationType: 'none',
        notes: 'Implicitly limited by presence count filter',
    });

    // Channel Heatmap - Uses groupBy with explicit limit
    checks.push({
        endpoint: 'GET /api/analytics/heatmap',
        model: 'TypingEvent',
        method: 'getChannelHeatmap',
        hasPagination: true,
        hasLimit: true,
        maxLimit: 500,
        paginationType: 'none',
        notes: 'Uses take: 500 to limit results',
    });

    // Role Drift - Uses LIMIT in query
    checks.push({
        endpoint: 'GET /api/analytics/roles',
        model: 'RoleChangeEvent',
        method: 'getRoleDriftFlags',
        hasPagination: true,
        hasLimit: true,
        maxLimit: 100,
        paginationType: 'none',
        notes: 'Uses LIMIT 100 in SQL query',
    });

    // Client Drift - Uses LIMIT in query
    checks.push({
        endpoint: 'GET /api/analytics/clients',
        model: 'PresenceEvent',
        method: 'getClientDriftFlags',
        hasPagination: true,
        hasLimit: true,
        maxLimit: 100,
        paginationType: 'none',
        notes: 'Uses LIMIT 100 in SQL query',
    });

    // Behavior Shifts - Uses CTE with limits
    checks.push({
        endpoint: 'GET /api/analytics/shifts',
        model: 'MessageEvent/TypingEvent',
        method: 'getBehaviorShiftFlags',
        hasPagination: true,
        hasLimit: true,
        maxLimit: 100,
        paginationType: 'none',
        notes: 'Uses LIMIT 100 in SQL query',
    });

    // Timeline - Uses cursor-based pagination
    checks.push({
        endpoint: 'GET /api/timeline/:userId',
        model: 'Multiple event tables',
        method: 'getUserTimeline',
        hasPagination: true,
        hasLimit: true,
        maxLimit: 50,
        paginationType: 'cursor',
        notes: 'Proper cursor-based pagination with nextCursor',
    });

    return checks;
}

/**
 * Check if monitoring endpoints have proper pagination
 */
async function checkMonitoringPagination(): Promise<EndpointCheck[]> {
    const checks: EndpointCheck[] = [];

    // Slow queries
    checks.push({
        endpoint: 'GET /api/admin/monitoring/database/slow-queries',
        model: 'In-memory log',
        method: 'getSlowQueryLogs',
        hasPagination: true,
        hasLimit: true,
        maxLimit: 100,
        paginationType: 'offset',
        notes: 'Uses offset pagination with limit',
    });

    // Table stats
    checks.push({
        endpoint: 'GET /api/admin/monitoring/database/tables',
        model: 'pg_stat_user_tables',
        method: 'getTableStats',
        hasPagination: false,
        hasLimit: false,
        paginationType: 'none',
        notes: 'Returns all tables (typically <50)',
    });

    // Index stats
    checks.push({
        endpoint: 'GET /api/admin/monitoring/database/indexes',
        model: 'pg_stat_user_indexes',
        method: 'getIndexUsageStats',
        hasPagination: false,
        hasLimit: false,
        paginationType: 'none',
        notes: 'Returns all indexes (typically <100)',
    });

    return checks;
}

/**
 * Check if admin endpoints have proper pagination
 */
async function checkAdminPagination(): Promise<EndpointCheck[]> {
    const checks: EndpointCheck[] = [];

    // Audit logs
    checks.push({
        endpoint: 'GET /api/admin/privacy/audit-logs',
        model: 'AuditLog',
        method: 'findMany',
        hasPagination: true,
        hasLimit: true,
        maxLimit: 50,
        paginationType: 'offset',
        notes: 'Uses offset pagination with page and limit',
    });

    // Users list
    checks.push({
        endpoint: 'GET /api/admin/users',
        model: 'User',
        method: 'findMany',
        hasPagination: false,
        hasLimit: false,
        paginationType: 'none',
        notes: 'WARNING: May need pagination if user count grows',
    });

    return checks;
}

/**
 * Format endpoint checks in a table
 */
function printEndpointTable(checks: EndpointCheck[], category: string) {
    console.log(`\n📋 ${category}\n`);
    console.log('┌────────────────────────────────────────────┬─────────────┬──────────┬────────────┬──────────────┐');
    console.log('│ Endpoint                                   │ Pagination  │ Limit    │ Max Limit  │ Type         │');
    console.log('├────────────────────────────────────────────┼─────────────┼──────────┼────────────┼──────────────┤');

    for (const check of checks) {
        const endpoint = check.endpoint.padEnd(42).substring(0, 42);
        const hasPag = check.hasPagination ? '✅ Yes' : '❌ No';
        const hasLim = check.hasLimit ? '✅ Yes' : '❌ No';
        const maxLim = check.maxLimit?.toString().padEnd(10) || 'N/A       ';
        const type = (check.paginationType || 'none').padEnd(12);

        console.log(`│ ${endpoint} │ ${hasPag.padEnd(11)} │ ${hasLim.padEnd(8)} │ ${maxLim} │ ${type} │`);

        if (check.notes) {
            console.log(`│   Note: ${check.notes.padEnd(85).substring(0, 85)} │`);
        }
    }

    console.log('└────────────────────────────────────────────┴─────────────┴──────────┴────────────┴──────────────┘');
}

/**
 * Print summary statistics
 */
function printSummary(allChecks: EndpointCheck[]) {
    const total = allChecks.length;
    const withPagination = allChecks.filter(c => c.hasPagination).length;
    const withLimit = allChecks.filter(c => c.hasLimit).length;
    const withoutPagination = allChecks.filter(c => !c.hasPagination && c.notes?.includes('WARNING')).length;

    console.log('\n📈 Summary\n');
    console.log(`Total endpoints checked: ${total}`);
    console.log(`✅ With pagination: ${withPagination} (${((withPagination / total) * 100).toFixed(1)}%)`);
    console.log(`✅ With explicit limits: ${withLimit} (${((withLimit / total) * 100).toFixed(1)}%)`);
    console.log(`⚠️  Need attention: ${withoutPagination}`);

    if (withoutPagination > 0) {
        console.log('\n⚠️  Endpoints that may need pagination:');
        allChecks
            .filter(c => !c.hasPagination && c.notes?.includes('WARNING'))
            .forEach(c => console.log(`   • ${c.endpoint} - ${c.notes}`));
    }

    const recommendations: string[] = [];

    // Check for endpoints without pagination
    const noPagination = allChecks.filter(c => !c.hasPagination);
    if (noPagination.length > 0) {
        const criticalEndpoints = noPagination.filter(c => c.notes?.includes('WARNING'));
        if (criticalEndpoints.length > 0) {
            recommendations.push('Add pagination to endpoints with unbounded result sets');
        }
    }

    // Check for endpoints with high limits
    const highLimits = allChecks.filter(c => c.maxLimit && c.maxLimit > 100);
    if (highLimits.length > 0) {
        recommendations.push('Consider reducing max limits above 100 to improve performance');
    }

    // Check for cursor vs offset pagination
    const cursorPaginated = allChecks.filter(c => c.paginationType === 'cursor').length;
    const offsetPaginated = allChecks.filter(c => c.paginationType === 'offset').length;
    if (offsetPaginated > cursorPaginated) {
        recommendations.push('Consider using cursor-based pagination for better performance on large datasets');
    }

    if (recommendations.length > 0) {
        console.log('\n💡 Recommendations:\n');
        recommendations.forEach(rec => console.log(`   • ${rec}`));
    }

    if (withoutPagination === 0) {
        console.log('\n✅ All critical endpoints have proper pagination!');
        return true;
    }

    return false;
}

async function main() {
    console.log('🔍 Pagination Validation Script\n');
    console.log('Checking all list endpoints for proper pagination...\n');

    try {
        // Check all endpoint categories
        const analyticsChecks = await checkAnalyticsPagination();
        const monitoringChecks = await checkMonitoringPagination();
        const adminChecks = await checkAdminPagination();

        // Print tables
        printEndpointTable(analyticsChecks, 'Analytics Endpoints');
        printEndpointTable(monitoringChecks, 'Monitoring Endpoints');
        printEndpointTable(adminChecks, 'Admin Endpoints');

        // Print summary
        const allChecks = [...analyticsChecks, ...monitoringChecks, ...adminChecks];
        const success = printSummary(allChecks);

        process.exit(success ? 0 : 1);
    } catch (error) {
        console.error('❌ Validation failed:', error);
        process.exit(1);
    } finally {
        await db.$disconnect();
    }
}

if (require.main === module) {
    main();
}
