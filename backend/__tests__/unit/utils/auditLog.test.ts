import { db } from '../../../src/db';
import {
    createAuditLog,
    getUserAuditLogs,
    getAllAuditLogs,
    AuditAction,
} from '../../../src/utils/auditLog';

// Mock the database
jest.mock('../../../src/db', () => ({
    db: {
        auditLog: {
            create: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
        },
    },
}));

describe('Audit Logging', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createAuditLog', () => {
        it('should create an audit log entry', async () => {
            const mockAuditLog = {
                id: 'log-1',
                userId: 'user-123',
                action: AuditAction.DATA_EXPORTED,
                details: { test: 'data' },
                ipAddress: '127.0.0.1',
                userAgent: 'test-agent',
                createdAt: new Date(),
            };

            (db.auditLog.create as jest.Mock).mockResolvedValue(mockAuditLog);

            await createAuditLog({
                userId: 'user-123',
                action: AuditAction.DATA_EXPORTED,
                details: { test: 'data' },
                ipAddress: '127.0.0.1',
                userAgent: 'test-agent',
            });

            expect(db.auditLog.create).toHaveBeenCalledWith({
                data: {
                    userId: 'user-123',
                    action: AuditAction.DATA_EXPORTED,
                    details: { test: 'data' },
                    ipAddress: '127.0.0.1',
                    userAgent: 'test-agent',
                },
            });
        });

        it('should not throw on failure', async () => {
            (db.auditLog.create as jest.Mock).mockRejectedValue(
                new Error('DB error')
            );

            await expect(
                createAuditLog({
                    userId: 'user-123',
                    action: AuditAction.DATA_EXPORTED,
                })
            ).resolves.not.toThrow();
        });
    });

    describe('getUserAuditLogs', () => {
        it('should return audit logs for a user', async () => {
            const mockLogs = [
                {
                    id: 'log-1',
                    action: AuditAction.DATA_EXPORTED,
                    details: {},
                    ipAddress: '127.0.0.1',
                    userAgent: 'test-agent',
                    createdAt: new Date(),
                },
            ];

            (db.auditLog.findMany as jest.Mock).mockResolvedValue(mockLogs);

            const logs = await getUserAuditLogs('user-123', 50);

            expect(db.auditLog.findMany).toHaveBeenCalledWith({
                where: { userId: 'user-123' },
                orderBy: { createdAt: 'desc' },
                take: 50,
            });
            expect(logs).toEqual(mockLogs);
        });
    });

    describe('getAllAuditLogs', () => {
        it('should return all audit logs with pagination', async () => {
            const mockLogs = [
                {
                    id: 'log-1',
                    userId: 'user-123',
                    action: AuditAction.DATA_EXPORTED,
                    details: {},
                    ipAddress: '127.0.0.1',
                    userAgent: 'test-agent',
                    createdAt: new Date(),
                },
            ];

            (db.auditLog.findMany as jest.Mock).mockResolvedValue(mockLogs);

            const logs = await getAllAuditLogs(100, 0);

            expect(db.auditLog.findMany).toHaveBeenCalledWith({
                orderBy: { createdAt: 'desc' },
                take: 100,
                skip: 0,
            });
            expect(logs).toEqual(mockLogs);
        });
    });
});
