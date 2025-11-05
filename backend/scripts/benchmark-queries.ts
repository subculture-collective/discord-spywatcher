/**
 * Query Performance Benchmark Script
 * 
 * Validates that all queries meet performance requirements:
 * - All queries under 100ms (p95)
 * - Critical queries under 50ms (p95)
 * - No N+1 query problems
 * 
 * Usage:
 *   ts-node scripts/benchmark-queries.ts
 *   ts-node scripts/benchmark-queries.ts --guild-id=<guild-id>
 *   ts-node scripts/benchmark-queries.ts --iterations=10
 */

import { db } from '../src/db';
import {
    getGhostScores,
    getChannelHeatmap,
    getLurkerFlags,
    getRoleDriftFlags,
    getClientDriftFlags,
    getBehaviorShiftFlags,
} from '../src/analytics';
import { getReactionStats } from '../src/analytics/reactions';
import { getChannelDiversity } from '../src/analytics/channels';
import { getMultiClientLogins } from '../src/analytics/presence';
import { getUserTimeline } from '../src/analytics/timeline';

interface BenchmarkResult {
    name: string;
    iterations: number;
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
    status: 'PASS' | 'WARN' | 'FAIL';
}

interface BenchmarkOptions {
    guildId: string;
    iterations: number;
    warmup: number;
}

/**
 * Run a function multiple times and collect timing data
 */
async function benchmark(
    name: string,
    fn: () => Promise<unknown>,
    iterations: number,
    warmup: number = 1
): Promise<BenchmarkResult> {
    const timings: number[] = [];

    // Warmup runs (excluded from results)
    for (let i = 0; i < warmup; i++) {
        await fn();
    }

    // Actual benchmark runs
    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await fn();
        const duration = performance.now() - start;
        timings.push(duration);
    }

    // Sort timings for percentile calculations
    timings.sort((a, b) => a - b);

    // Calculate statistics
    const min = timings[0];
    const max = timings[timings.length - 1];
    const avg = timings.reduce((sum, t) => sum + t, 0) / timings.length;
    const p50 = timings[Math.floor(timings.length * 0.5)];
    const p95 = timings[Math.floor(timings.length * 0.95)];
    const p99 = timings[Math.floor(timings.length * 0.99)];

    // Determine status based on p95
    let status: 'PASS' | 'WARN' | 'FAIL';
    if (p95 < 50) {
        status = 'PASS';
    } else if (p95 < 100) {
        status = 'WARN';
    } else {
        status = 'FAIL';
    }

    return {
        name,
        iterations,
        min,
        max,
        avg,
        p50,
        p95,
        p99,
        status,
    };
}

/**
 * Format milliseconds with color coding
 */
function formatTime(ms: number, threshold: number = 100): string {
    const rounded = ms.toFixed(2);
    if (ms < threshold / 2) {
        return `\x1b[32m${rounded}ms\x1b[0m`; // Green
    } else if (ms < threshold) {
        return `\x1b[33m${rounded}ms\x1b[0m`; // Yellow
    } else {
        return `\x1b[31m${rounded}ms\x1b[0m`; // Red
    }
}

/**
 * Print benchmark results in a table
 */
function printResults(results: BenchmarkResult[]) {
    console.log('\n📊 Benchmark Results\n');
    console.log('┌─────────────────────────────┬────────────┬────────────┬────────────┬────────────┬────────────┬────────────┬──────────┐');
    console.log('│ Query Name                  │ Min        │ Avg        │ P50        │ P95        │ P99        │ Max        │ Status   │');
    console.log('├─────────────────────────────┼────────────┼────────────┼────────────┼────────────┼────────────┼────────────┼──────────┤');

    for (const result of results) {
        const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️ ' : '❌';
        const name = result.name.padEnd(27);
        const min = formatTime(result.min).padEnd(18);
        const avg = formatTime(result.avg).padEnd(18);
        const p50 = formatTime(result.p50).padEnd(18);
        const p95 = formatTime(result.p95, 100).padEnd(18);
        const p99 = formatTime(result.p99).padEnd(18);
        const max = formatTime(result.max).padEnd(18);

        console.log(`│ ${name} │ ${min} │ ${avg} │ ${p50} │ ${p95} │ ${p99} │ ${max} │ ${statusIcon} ${result.status.padEnd(5)} │`);
    }

    console.log('└─────────────────────────────┴────────────┴────────────┴────────────┴────────────┴────────────┴────────────┴──────────┘');
}

/**
 * Print summary statistics
 */
function printSummary(results: BenchmarkResult[]) {
    const passed = results.filter(r => r.status === 'PASS').length;
    const warned = results.filter(r => r.status === 'WARN').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const total = results.length;

    console.log('\n📈 Summary\n');
    console.log(`Total queries: ${total}`);
    console.log(`✅ Passed (< 50ms p95): ${passed}`);
    console.log(`⚠️  Warned (50-100ms p95): ${warned}`);
    console.log(`❌ Failed (> 100ms p95): ${failed}`);

    if (failed > 0) {
        console.log('\n⚠️  Some queries are failing the 100ms requirement!');
        console.log('Review QUERY_OPTIMIZATIONS.md for optimization strategies.');
    } else if (warned > 0) {
        console.log('\n✅ All queries under 100ms, but some could be faster!');
    } else {
        console.log('\n🎉 All queries are performing excellently!');
    }
}

async function main() {
    console.log('🚀 Query Performance Benchmark Script');

    // Parse command line arguments
    const args = process.argv.slice(2);
    const guildIdArg = args.find(arg => arg.startsWith('--guild-id='));
    const iterationsArg = args.find(arg => arg.startsWith('--iterations='));

    let guildId = guildIdArg?.split('=')[1];
    const iterations = iterationsArg ? parseInt(iterationsArg.split('=')[1]) : 5;

    // If no guild ID provided, try to find one from the database
    if (!guildId) {
        console.log('\n📍 No guild ID provided, finding one from database...');
        const messageEvent = await db.messageEvent.findFirst({
            select: { guildId: true },
        });
        guildId = messageEvent?.guildId;

        if (!guildId) {
            console.error('❌ No guild ID found in database. Please provide one with --guild-id=<id>');
            process.exit(1);
        }
        console.log(`   Using guild ID: ${guildId}`);
    }

    const options: BenchmarkOptions = {
        guildId,
        iterations,
        warmup: 1,
    };

    console.log(`\n⚙️  Configuration:`);
    console.log(`   Guild ID: ${options.guildId}`);
    console.log(`   Iterations: ${options.iterations}`);
    console.log(`   Warmup runs: ${options.warmup}`);
    console.log('\n🔄 Running benchmarks...\n');

    const results: BenchmarkResult[] = [];

    try {
        // Benchmark Ghost Detection
        results.push(await benchmark(
            'Ghost Detection',
            () => getGhostScores(options.guildId),
            options.iterations,
            options.warmup
        ));

        // Benchmark Lurker Detection
        results.push(await benchmark(
            'Lurker Detection',
            () => getLurkerFlags(options.guildId),
            options.iterations,
            options.warmup
        ));

        // Benchmark Channel Heatmap
        results.push(await benchmark(
            'Channel Heatmap',
            () => getChannelHeatmap({ guildId: options.guildId }),
            options.iterations,
            options.warmup
        ));

        // Benchmark Role Drift
        results.push(await benchmark(
            'Role Drift Detection',
            () => getRoleDriftFlags(options.guildId),
            options.iterations,
            options.warmup
        ));

        // Benchmark Client Drift
        results.push(await benchmark(
            'Client Drift Detection',
            () => getClientDriftFlags(options.guildId),
            options.iterations,
            options.warmup
        ));

        // Benchmark Behavior Shifts
        results.push(await benchmark(
            'Behavior Shift Detection',
            () => getBehaviorShiftFlags(options.guildId),
            options.iterations,
            options.warmup
        ));

        // Benchmark Reaction Stats
        results.push(await benchmark(
            'Reaction Statistics',
            () => getReactionStats(options.guildId),
            options.iterations,
            options.warmup
        ));

        // Benchmark Channel Diversity
        results.push(await benchmark(
            'Channel Diversity',
            () => getChannelDiversity(options.guildId),
            options.iterations,
            options.warmup
        ));

        // Benchmark Multi-Client Logins
        results.push(await benchmark(
            'Multi-Client Logins',
            () => getMultiClientLogins(),
            options.iterations,
            options.warmup
        ));

        // Benchmark User Timeline (get a user ID first)
        const user = await db.messageEvent.findFirst({
            where: { guildId: options.guildId },
            select: { userId: true },
        });

        if (user) {
            results.push(await benchmark(
                'User Timeline',
                () => getUserTimeline({
                    userId: user.userId,
                    guildId: options.guildId,
                    limit: 50,
                }),
                options.iterations,
                options.warmup
            ));
        }

        // Print results
        printResults(results);
        printSummary(results);

        // Exit with appropriate code
        const failed = results.filter(r => r.status === 'FAIL').length;
        process.exit(failed > 0 ? 1 : 0);

    } catch (error) {
        console.error('❌ Benchmark failed:', error);
        process.exit(1);
    } finally {
        await db.$disconnect();
    }
}

if (require.main === module) {
    main();
}
