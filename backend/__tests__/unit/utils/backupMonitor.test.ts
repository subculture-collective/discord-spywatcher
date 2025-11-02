import { db } from '../../../src/db';
import {
    checkBackupHealth,
    logBackupStart,
    logBackupComplete,
    markBackupVerified,
    getBackupStats,
    getRecentBackups,
} from '../../../src/utils/backupMonitor';
import * as alertSystem from '../../../src/utils/alertSystem';

jest.mock('../../../src/db', () => ({
    db: {
        backupLog: {
            findFirst: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            findUnique: jest.fn(),
            aggregate: jest.fn(),
        },
    },
}));

jest.mock('../../../src/utils/alertSystem', () => ({
    sendAlert: jest.fn(),
}));

describe('Backup Monitor Utils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        (console.error as jest.Mock).mockRestore();
    });

    describe('checkBackupHealth', () => {
        it('should return healthy status when recent backup exists', async () => {
            const recentBackup = {
                id: 'backup-1',
                backupType: 'FULL',
                status: 'COMPLETED',
                filename: 'spywatcher_20240125_120000.dump.gz',
                fileSizeMB: 100,
                startedAt: new Date(),
                completedAt: new Date(),
                verifiedAt: new Date(),
            };

            (db.backupLog.findFirst as jest.Mock).mockResolvedValue(
                recentBackup
            );
            (db.backupLog.count as jest.Mock)
                .mockResolvedValueOnce(0) // No failures
                .mockResolvedValueOnce(0); // No unverified
            (db.backupLog.findMany as jest.Mock).mockResolvedValue([
                { fileSizeMB: 95 },
                { fileSizeMB: 105 },
            ]);

            const result = await checkBackupHealth();

            expect(result.healthy).toBe(true);
            expect(result.lastBackup).toEqual(recentBackup.startedAt);
            expect(result.issues).toHaveLength(0);
            expect(alertSystem.sendAlert).not.toHaveBeenCalled();
        });

        it('should alert when no recent backup found', async () => {
            (db.backupLog.findFirst as jest.Mock)
                .mockResolvedValueOnce(null) // No recent backup
                .mockResolvedValueOnce({
                    // Last backup
                    id: 'backup-old',
                    startedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
                });
            (db.backupLog.count as jest.Mock).mockResolvedValue(0);

            const result = await checkBackupHealth();

            expect(result.healthy).toBe(false);
            expect(result.issues[0]).toContain(
                'No successful backup in the last 24 hours'
            );
            expect(alertSystem.sendAlert).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'CRITICAL',
                    title: 'No Recent Backup Found',
                })
            );
        });

        it('should alert on recent backup failures', async () => {
            const recentBackup = {
                id: 'backup-1',
                backupType: 'FULL',
                status: 'COMPLETED',
                filename: 'test.dump.gz',
                fileSizeMB: 100,
                startedAt: new Date(),
            };

            const failedBackups = [
                {
                    id: 'backup-fail-1',
                    startedAt: new Date(),
                    errorMessage: 'Connection timeout',
                },
                {
                    id: 'backup-fail-2',
                    startedAt: new Date(),
                    errorMessage: 'Disk full',
                },
            ];

            (db.backupLog.findFirst as jest.Mock).mockResolvedValue(
                recentBackup
            );
            (db.backupLog.count as jest.Mock)
                .mockResolvedValueOnce(2) // 2 failures
                .mockResolvedValueOnce(0); // No unverified
            (db.backupLog.findMany as jest.Mock)
                .mockResolvedValueOnce(failedBackups) // Failed backups
                .mockResolvedValueOnce([{ fileSizeMB: 100 }]); // Avg size

            const result = await checkBackupHealth();

            expect(result.healthy).toBe(false);
            expect(result.issues).toContain(
                '2 backup failure(s) in the last 24 hours'
            );
            expect(alertSystem.sendAlert).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'HIGH',
                    title: 'Recent Backup Failures',
                })
            );
        });

        it('should alert on abnormal backup size', async () => {
            const recentBackup = {
                id: 'backup-1',
                backupType: 'FULL',
                status: 'COMPLETED',
                filename: 'test.dump.gz',
                fileSizeMB: 200, // 2x average
                startedAt: new Date(),
            };

            (db.backupLog.findFirst as jest.Mock).mockResolvedValue(
                recentBackup
            );
            (db.backupLog.count as jest.Mock).mockResolvedValue(0);
            (db.backupLog.findMany as jest.Mock).mockResolvedValue([
                { fileSizeMB: 100 },
                { fileSizeMB: 100 },
                { fileSizeMB: 100 },
            ]);

            const result = await checkBackupHealth();

            expect(result.healthy).toBe(false);
            expect(result.issues[0]).toContain(
                'differs significantly from average'
            );
            expect(alertSystem.sendAlert).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'MEDIUM',
                    title: 'Abnormal Backup Size',
                })
            );
        });

        it('should alert on unverified backups', async () => {
            const recentBackup = {
                id: 'backup-1',
                backupType: 'FULL',
                status: 'COMPLETED',
                filename: 'test.dump.gz',
                fileSizeMB: 100,
                startedAt: new Date(),
            };

            (db.backupLog.findFirst as jest.Mock).mockResolvedValue(
                recentBackup
            );
            (db.backupLog.count as jest.Mock)
                .mockResolvedValueOnce(0) // No failures
                .mockResolvedValueOnce(5); // 5 unverified
            (db.backupLog.findMany as jest.Mock).mockResolvedValue([
                { fileSizeMB: 100 },
            ]);

            const result = await checkBackupHealth();

            expect(result.healthy).toBe(false);
            expect(result.issues).toContain(
                '5 unverified backup(s) in the last 7 days'
            );
            expect(alertSystem.sendAlert).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'MEDIUM',
                    title: 'Unverified Backups',
                })
            );
        });

        it('should handle errors gracefully', async () => {
            (db.backupLog.findFirst as jest.Mock).mockRejectedValue(
                new Error('Database error')
            );

            const result = await checkBackupHealth();

            expect(result.healthy).toBe(false);
            expect(result.issues).toContain('Failed to check backup health');
            expect(alertSystem.sendAlert).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'HIGH',
                    title: 'Backup Health Check Failed',
                })
            );
        });
    });

    describe('logBackupStart', () => {
        it('should create backup log entry', async () => {
            const mockBackupLog = {
                id: 'backup-1',
                backupType: 'FULL',
                status: 'IN_PROGRESS',
                filename: 'test.dump.gz',
                startedAt: new Date(),
            };

            (db.backupLog.create as jest.Mock).mockResolvedValue(mockBackupLog);

            const result = await logBackupStart('FULL', 'test.dump.gz');

            expect(result).toBe('backup-1');
            expect(db.backupLog.create).toHaveBeenCalledWith({
                data: {
                    backupType: 'FULL',
                    status: 'IN_PROGRESS',
                    filename: 'test.dump.gz',
                    startedAt: expect.any(Date),
                },
            });
        });
    });

    describe('logBackupComplete', () => {
        it('should update backup log with success details', async () => {
            const startLog = {
                id: 'backup-1',
                startedAt: new Date(Date.now() - 60000), // 1 minute ago
            };

            (db.backupLog.findUnique as jest.Mock).mockResolvedValue(startLog);
            (db.backupLog.update as jest.Mock).mockResolvedValue({});

            await logBackupComplete('backup-1', {
                success: true,
                fileSizeMB: 150,
                s3Location: 's3://bucket/backup.gz',
            });

            expect(db.backupLog.update).toHaveBeenCalledWith({
                where: { id: 'backup-1' },
                data: expect.objectContaining({
                    status: 'COMPLETED',
                    fileSizeMB: 150,
                    s3Location: 's3://bucket/backup.gz',
                    duration: expect.any(Number),
                    completedAt: expect.any(Date),
                }),
            });
            expect(alertSystem.sendAlert).not.toHaveBeenCalled();
        });

        it('should update backup log with failure details and send alert', async () => {
            const startLog = {
                id: 'backup-1',
                filename: 'test.dump.gz',
                backupType: 'FULL',
                startedAt: new Date(Date.now() - 60000),
            };

            (db.backupLog.findUnique as jest.Mock).mockResolvedValue(startLog);
            (db.backupLog.update as jest.Mock).mockResolvedValue({});

            await logBackupComplete('backup-1', {
                success: false,
                errorMessage: 'Connection timeout',
            });

            expect(db.backupLog.update).toHaveBeenCalledWith({
                where: { id: 'backup-1' },
                data: expect.objectContaining({
                    status: 'FAILED',
                    errorMessage: 'Connection timeout',
                }),
            });
            expect(alertSystem.sendAlert).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'HIGH',
                    title: 'Backup Failed',
                })
            );
        });

        it('should handle missing backup log', async () => {
            jest.spyOn(console, 'error').mockImplementation(() => {});
            (db.backupLog.findUnique as jest.Mock).mockResolvedValue(null);

            await logBackupComplete('backup-1', { success: true });

            expect(db.backupLog.update).not.toHaveBeenCalled();
            expect(console.error).toHaveBeenCalledWith(
                'Backup log backup-1 not found'
            );
        });
    });

    describe('markBackupVerified', () => {
        it('should mark backup as verified', async () => {
            (db.backupLog.update as jest.Mock).mockResolvedValue({});

            await markBackupVerified('backup-1', { testResult: 'passed' });

            expect(db.backupLog.update).toHaveBeenCalledWith({
                where: { id: 'backup-1' },
                data: {
                    status: 'VERIFIED',
                    verifiedAt: expect.any(Date),
                    metadata: { testResult: 'passed' },
                },
            });
        });
    });

    describe('getBackupStats', () => {
        it('should return backup statistics', async () => {
            (db.backupLog.count as jest.Mock)
                .mockResolvedValueOnce(100) // Total
                .mockResolvedValueOnce(95) // Successful
                .mockResolvedValueOnce(5) // Failed
                .mockResolvedValueOnce(80); // Verified

            (db.backupLog.aggregate as jest.Mock)
                .mockResolvedValueOnce({ _avg: { fileSizeMB: 120.5 } }) // Avg size
                .mockResolvedValueOnce({ _avg: { duration: 180 } }); // Avg duration

            const result = await getBackupStats(30);

            expect(result).toEqual({
                totalBackups: 100,
                successfulBackups: 95,
                failedBackups: 5,
                verifiedBackups: 80,
                successRate: '95.00%',
                avgSizeMB: '120.50',
                avgDurationSeconds: '180',
                period: '30 days',
            });
        });

        it('should handle zero backups', async () => {
            (db.backupLog.count as jest.Mock).mockResolvedValue(0);
            (db.backupLog.aggregate as jest.Mock).mockResolvedValue({
                _avg: { fileSizeMB: null, duration: null },
            });

            const result = await getBackupStats(30);

            expect(result.successRate).toBe('N/A');
            expect(result.avgSizeMB).toBe('N/A');
            expect(result.avgDurationSeconds).toBe('N/A');
        });
    });

    describe('getRecentBackups', () => {
        it('should return recent backups', async () => {
            const mockBackups = [
                {
                    id: 'backup-1',
                    backupType: 'FULL',
                    status: 'COMPLETED',
                    startedAt: new Date(),
                },
                {
                    id: 'backup-2',
                    backupType: 'INCREMENTAL',
                    status: 'COMPLETED',
                    startedAt: new Date(),
                },
            ];

            (db.backupLog.findMany as jest.Mock).mockResolvedValue(mockBackups);

            const result = await getRecentBackups(10);

            expect(result).toEqual(mockBackups);
            expect(db.backupLog.findMany).toHaveBeenCalledWith({
                orderBy: { startedAt: 'desc' },
                take: 10,
            });
        });
    });
});
