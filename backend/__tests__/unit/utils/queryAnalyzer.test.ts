/**
 * Unit tests for Query Analyzer utility
 */

import {
    parseExplainOutput,
    generateRecommendations,
    meetsPerformanceThreshold,
    usesIndex,
    formatQueryAnalysis,
    analyzeQuery,
    getTableStatistics,
} from '../../../src/utils/queryAnalyzer';

// Mock the database
jest.mock('../../../src/db', () => ({
    db: {
        $queryRawUnsafe: jest.fn(),
        $queryRaw: jest.fn(),
    },
}));

import { db } from '../../../src/db';

describe('Query Analyzer', () => {
    describe('parseExplainOutput', () => {
        it('should detect sequential scans', () => {
            const output = `
Seq Scan on "MessageEvent"  (cost=0.00..1000.00 rows=5000 width=100)
Planning Time: 0.5 ms
Execution Time: 45.2 ms
            `.trim();

            const result = parseExplainOutput(output);

            expect(result.hasSeqScan).toBe(true);
            expect(result.hasIndexScan).toBe(false);
            expect(result.warnings).toContain(
                'Sequential scan detected - consider adding an index'
            );
        });

        it('should detect index scans', () => {
            const output = `
Index Scan using idx_message_guild on "MessageEvent"  (cost=0.42..100.00 rows=50 width=100)
Planning Time: 0.3 ms
Execution Time: 12.5 ms
            `.trim();

            const result = parseExplainOutput(output);

            expect(result.hasSeqScan).toBe(false);
            expect(result.hasIndexScan).toBe(true);
        });

        it('should parse execution time', () => {
            const output = `
Index Scan using idx_message_guild on "MessageEvent"
Planning Time: 1.2 ms
Execution Time: 45.8 ms
            `.trim();

            const result = parseExplainOutput(output);

            expect(result.planningTime).toBe(1.2);
            expect(result.executionTime).toBe(45.8);
            expect(result.totalTime).toBe(47.0);
        });

        it('should warn about slow queries', () => {
            const output = `
Seq Scan on "MessageEvent"
Planning Time: 2.0 ms
Execution Time: 150.5 ms
            `.trim();

            const result = parseExplainOutput(output);

            expect(result.warnings).toContain(
                'Slow query: execution time 150.50ms exceeds 100ms threshold'
            );
        });

        it('should detect Index Only Scan', () => {
            const output = `
Index Only Scan using idx_message_created on "MessageEvent"
Planning Time: 0.5 ms
Execution Time: 8.2 ms
            `.trim();

            const result = parseExplainOutput(output);

            expect(result.hasIndexScan).toBe(true);
            expect(result.hasSeqScan).toBe(false);
        });
    });

    describe('meetsPerformanceThreshold', () => {
        it('should return true for queries under threshold', () => {
            const plan = {
                plan: '',
                executionTime: 45.0,
                planningTime: 1.0,
                totalTime: 46.0,
                hasSeqScan: false,
                hasIndexScan: true,
                warnings: [],
            };

            expect(meetsPerformanceThreshold(plan, 100)).toBe(true);
        });

        it('should return false for queries over threshold', () => {
            const plan = {
                plan: '',
                executionTime: 150.0,
                planningTime: 2.0,
                totalTime: 152.0,
                hasSeqScan: true,
                hasIndexScan: false,
                warnings: [],
            };

            expect(meetsPerformanceThreshold(plan, 100)).toBe(false);
        });

        it('should use default threshold of 100ms', () => {
            const plan = {
                plan: '',
                executionTime: 75.0,
                planningTime: 1.0,
                totalTime: 76.0,
                hasSeqScan: false,
                hasIndexScan: true,
                warnings: [],
            };

            expect(meetsPerformanceThreshold(plan)).toBe(true);
        });
    });

    describe('usesIndex', () => {
        it('should return true when using index scan only', () => {
            const plan = {
                plan: '',
                executionTime: 25.0,
                planningTime: 1.0,
                totalTime: 26.0,
                hasSeqScan: false,
                hasIndexScan: true,
                warnings: [],
            };

            expect(usesIndex(plan)).toBe(true);
        });

        it('should return false when using sequential scan', () => {
            const plan = {
                plan: '',
                executionTime: 45.0,
                planningTime: 1.0,
                totalTime: 46.0,
                hasSeqScan: true,
                hasIndexScan: false,
                warnings: [],
            };

            expect(usesIndex(plan)).toBe(false);
        });

        it('should return false when using both seq and index scan', () => {
            const plan = {
                plan: '',
                executionTime: 50.0,
                planningTime: 1.0,
                totalTime: 51.0,
                hasSeqScan: true,
                hasIndexScan: true,
                warnings: [],
            };

            expect(usesIndex(plan)).toBe(false);
        });
    });

    describe('formatQueryAnalysis', () => {
        it('should format query analysis with all sections', () => {
            const analysis = {
                query: 'SELECT * FROM "MessageEvent" WHERE "guildId" = $1',
                params: ['guild123'],
                plan: {
                    plan: 'Mock plan',
                    executionTime: 45.5,
                    planningTime: 1.2,
                    totalTime: 46.7,
                    hasSeqScan: false,
                    hasIndexScan: true,
                    warnings: ['Test warning'],
                },
                recommendations: ['Test recommendation'],
            };

            const formatted = formatQueryAnalysis(analysis);

            expect(formatted).toContain('Query Analysis');
            expect(formatted).toContain('Performance Metrics');
            expect(formatted).toContain('Planning Time: 1.20ms');
            expect(formatted).toContain('Execution Time: 45.50ms');
            expect(formatted).toContain('Total Time: 46.70ms');
            expect(formatted).toContain('Sequential Scan: ✅ No');
            expect(formatted).toContain('Index Scan: ✅ Yes');
            expect(formatted).toContain('Test warning');
            expect(formatted).toContain('Test recommendation');
        });

        it('should handle long queries by truncating', () => {
            const longQuery = 'A'.repeat(200);
            const analysis = {
                query: longQuery,
                plan: {
                    plan: '',
                    executionTime: 10.0,
                    planningTime: 1.0,
                    totalTime: 11.0,
                    hasSeqScan: false,
                    hasIndexScan: true,
                    warnings: [],
                },
                recommendations: [],
            };

            const formatted = formatQueryAnalysis(analysis);

            expect(formatted).toContain('...');
            expect(formatted.indexOf(longQuery)).toBe(-1);
        });
    });

    describe('generateRecommendations', () => {
        it('should recommend adding indexes for sequential scans', () => {
            const plan = {
                plan: '',
                executionTime: 45.0,
                planningTime: 1.0,
                totalTime: 46.0,
                hasSeqScan: true,
                hasIndexScan: false,
                warnings: [],
            };

            const recommendations = generateRecommendations(plan);

            expect(recommendations).toContain(
                'Add indexes on columns used in WHERE, JOIN, and ORDER BY clauses'
            );
        });

        it('should recommend optimization for slow queries', () => {
            const plan = {
                plan: '',
                executionTime: 150.0,
                planningTime: 1.0,
                totalTime: 151.0,
                hasSeqScan: false,
                hasIndexScan: true,
                warnings: [],
            };

            const recommendations = generateRecommendations(plan);

            expect(recommendations).toContain(
                'Consider optimizing query logic or adding caching'
            );
        });

        it('should recommend improvement for moderate queries', () => {
            const plan = {
                plan: '',
                executionTime: 75.0,
                planningTime: 1.0,
                totalTime: 76.0,
                hasSeqScan: false,
                hasIndexScan: true,
                warnings: [],
            };

            const recommendations = generateRecommendations(plan);

            expect(recommendations).toContain(
                'Query performance is acceptable but could be improved'
            );
        });

        it('should praise excellent performance', () => {
            const plan = {
                plan: '',
                executionTime: 15.0,
                planningTime: 0.5,
                totalTime: 15.5,
                hasSeqScan: false,
                hasIndexScan: true,
                warnings: [],
            };

            const recommendations = generateRecommendations(plan);

            expect(recommendations).toContain(
                'Query performance is excellent - no optimization needed'
            );
        });

        it('should recommend prepared statements for high planning time', () => {
            const plan = {
                plan: '',
                executionTime: 10.0,
                planningTime: 25.0,
                totalTime: 35.0,
                hasSeqScan: false,
                hasIndexScan: true,
                warnings: [],
            };

            const recommendations = generateRecommendations(plan);

            expect(recommendations).toContain(
                'Planning time is high - consider using prepared statements'
            );
        });
    });

    describe('Security Validation', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        describe('analyzeQuery', () => {
            it('should accept valid SELECT queries', async () => {
                (db.$queryRawUnsafe as jest.Mock).mockResolvedValue([
                    { 'QUERY PLAN': 'Index Scan\nExecution Time: 10.5 ms\nPlanning Time: 1.2 ms' }
                ]);

                await expect(
                    analyzeQuery('SELECT * FROM "MessageEvent" WHERE "guildId" = $1')
                ).resolves.toBeDefined();
            });

            it('should accept queries with CTEs (WITH clause)', async () => {
                (db.$queryRawUnsafe as jest.Mock).mockResolvedValue([
                    { 'QUERY PLAN': 'CTE Scan\nExecution Time: 15.0 ms\nPlanning Time: 2.0 ms' }
                ]);

                await expect(
                    analyzeQuery('WITH cte AS (SELECT * FROM table) SELECT * FROM cte')
                ).resolves.toBeDefined();
            });

            it('should reject INSERT queries', async () => {
                await expect(
                    analyzeQuery('INSERT INTO "MessageEvent" VALUES (1, 2, 3)')
                ).rejects.toThrow();
            });

            it('should reject UPDATE queries', async () => {
                await expect(
                    analyzeQuery('UPDATE "MessageEvent" SET column = value')
                ).rejects.toThrow();
            });

            it('should reject DELETE queries', async () => {
                await expect(
                    analyzeQuery('DELETE FROM "MessageEvent" WHERE id = 1')
                ).rejects.toThrow();
            });

            it('should reject DROP queries', async () => {
                await expect(
                    analyzeQuery('DROP TABLE "MessageEvent"')
                ).rejects.toThrow();
            });

            it('should reject queries with semicolons (multiple statements)', async () => {
                await expect(
                    analyzeQuery('SELECT * FROM table; DROP TABLE users')
                ).rejects.toThrow('Multiple statements are not allowed');
            });

            it('should accept SELECT queries with keywords in string literals', async () => {
                (db.$queryRawUnsafe as jest.Mock).mockResolvedValue([
                    { 'QUERY PLAN': 'Index Scan\nExecution Time: 10.5 ms\nPlanning Time: 1.2 ms' }
                ]);

                await expect(
                    analyzeQuery("SELECT * FROM table WHERE description LIKE '%DELETE%'")
                ).resolves.toBeDefined();
            });

            it('should accept queries with leading comments', async () => {
                (db.$queryRawUnsafe as jest.Mock).mockResolvedValue([
                    { 'QUERY PLAN': 'Index Scan\nExecution Time: 10.5 ms\nPlanning Time: 1.2 ms' }
                ]);

                await expect(
                    analyzeQuery('/* comment */ SELECT * FROM table')
                ).resolves.toBeDefined();
            });

            it('should reject queries that start with non-SELECT/WITH after removing comments', async () => {
                await expect(
                    analyzeQuery('/* comment */ UPDATE table SET x = 1')
                ).rejects.toThrow('Only SELECT or WITH (CTE) statements are allowed for analysis');
            });
        });

        describe('getTableStatistics', () => {
            it('should accept valid table names', async () => {
                (db.$queryRaw as jest.Mock).mockResolvedValue([
                    {
                        schemaname: 'public',
                        tablename: 'MessageEvent',
                        n_live_tup: BigInt(1000),
                        n_dead_tup: BigInt(10),
                        last_vacuum: null,
                        last_autovacuum: new Date(),
                        last_analyze: null,
                        last_autoanalyze: new Date(),
                    }
                ]);

                await expect(getTableStatistics('MessageEvent')).resolves.toBeDefined();
                await expect(getTableStatistics('_underscoreStart')).resolves.toBeDefined();
                await expect(getTableStatistics('Table123')).resolves.toBeDefined();
            });

            it('should reject table names starting with numbers', async () => {
                await expect(getTableStatistics('123Table')).rejects.toThrow('Invalid table name');
            });

            it('should reject table names with special characters', async () => {
                await expect(getTableStatistics('table-name')).rejects.toThrow('Invalid table name');
                await expect(getTableStatistics('table.name')).rejects.toThrow('Invalid table name');
                await expect(getTableStatistics('table;DROP')).rejects.toThrow('Invalid table name');
                await expect(getTableStatistics('table name')).rejects.toThrow('Invalid table name');
            });

            it('should reject empty table names', async () => {
                await expect(getTableStatistics('')).rejects.toThrow('Invalid table name');
            });
        });
    });
});
