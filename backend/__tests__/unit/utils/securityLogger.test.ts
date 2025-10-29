import { db } from '../../../src/db';
import {
    logSecurityEvent,
    SecurityActions,
    getSecurityLogs,
    getSecurityStats,
} from '../../../src/utils/securityLogger';

// Mock the database
jest.mock('../../../src/db', () => ({
    db: {
        securityLog: {
            create: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
        },
    },
}));

// Mock the alert system
jest.mock('../../../src/utils/alertSystem', () => ({
    checkAlertConditions: jest.fn(),
}));

describe('Security Logger', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('logSecurityEvent', () => {
        it('should log a security event to the database', async () => {
            const event = {
                userId: 'user123',
                action: SecurityActions.LOGIN_SUCCESS,
                result: 'SUCCESS' as const,
                ipAddress: '192.168.1.1',
                userAgent: 'Mozilla/5.0',
                requestId: 'req-123',
                metadata: { test: 'data' },
            };

            (db.securityLog.create as jest.Mock).mockResolvedValue({});

            await logSecurityEvent(event);

            expect(db.securityLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId: 'user123',
                    action: SecurityActions.LOGIN_SUCCESS,
                    result: 'SUCCESS',
                    ipAddress: '192.168.1.1',
                    userAgent: 'Mozilla/5.0',
                    requestId: 'req-123',
                    metadata: { test: 'data' },
                }),
            });
        });

        it('should handle logging failures gracefully', async () => {
            const event = {
                action: SecurityActions.LOGIN_FAILURE,
                result: 'FAILURE' as const,
            };

            (db.securityLog.create as jest.Mock).mockRejectedValue(
                new Error('Database error')
            );

            // Should not throw
            await expect(logSecurityEvent(event)).resolves.not.toThrow();
        });

        it('should log authentication events', async () => {
            const loginEvent = {
                userId: 'user123',
                action: SecurityActions.LOGIN_ATTEMPT,
                result: 'SUCCESS' as const,
                ipAddress: '192.168.1.1',
            };

            (db.securityLog.create as jest.Mock).mockResolvedValue({});

            await logSecurityEvent(loginEvent);

            expect(db.securityLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    action: SecurityActions.LOGIN_ATTEMPT,
                    result: 'SUCCESS',
                }),
            });
        });

        it('should log authorization events', async () => {
            const permissionEvent = {
                userId: 'user123',
                action: SecurityActions.PERMISSION_DENIED,
                resource: '/admin/users',
                result: 'FAILURE' as const,
                metadata: { permission: 'admin.users.view' },
            };

            (db.securityLog.create as jest.Mock).mockResolvedValue({});

            await logSecurityEvent(permissionEvent);

            expect(db.securityLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    action: SecurityActions.PERMISSION_DENIED,
                    result: 'FAILURE',
                    resource: '/admin/users',
                }),
            });
        });
    });

    describe('getSecurityLogs', () => {
        it('should retrieve security logs with filters', async () => {
            const mockLogs = [
                {
                    id: '1',
                    userId: 'user123',
                    action: SecurityActions.LOGIN_SUCCESS,
                    result: 'SUCCESS',
                    timestamp: new Date(),
                },
            ];

            (db.securityLog.findMany as jest.Mock).mockResolvedValue(mockLogs);

            const logs = await getSecurityLogs({
                userId: 'user123',
                action: SecurityActions.LOGIN_SUCCESS,
                limit: 10,
            });

            expect(logs).toEqual(mockLogs);
            expect(db.securityLog.findMany).toHaveBeenCalledWith({
                where: {
                    userId: 'user123',
                    action: SecurityActions.LOGIN_SUCCESS,
                    result: undefined,
                    ipAddress: undefined,
                },
                orderBy: { timestamp: 'desc' },
                take: 10,
                skip: 0,
            });
        });

        it('should apply pagination', async () => {
            (db.securityLog.findMany as jest.Mock).mockResolvedValue([]);

            await getSecurityLogs({
                limit: 50,
                offset: 100,
            });

            expect(db.securityLog.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    take: 50,
                    skip: 100,
                })
            );
        });
    });

    describe('getSecurityStats', () => {
        it('should return security statistics', async () => {
            (db.securityLog.count as jest.Mock)
                .mockResolvedValueOnce(100) // total events
                .mockResolvedValueOnce(10) // failed logins
                .mockResolvedValueOnce(5) // permission denials
                .mockResolvedValueOnce(2) // blocked IPs
                .mockResolvedValueOnce(1); // suspicious activities

            const stats = await getSecurityStats();

            expect(stats).toEqual({
                totalEvents: 100,
                failedLogins: 10,
                permissionDenials: 5,
                blockedIPs: 2,
                suspiciousActivities: 1,
                timeWindow: '24 hours',
            });
        });

        it('should use custom time window', async () => {
            (db.securityLog.count as jest.Mock).mockResolvedValue(0);

            const stats = await getSecurityStats(3600000); // 1 hour

            expect(stats.timeWindow).toBe('1 hours');
            expect(db.securityLog.count).toHaveBeenCalled();
        });
    });

    describe('Security Actions Constants', () => {
        it('should have all required authentication actions', () => {
            expect(SecurityActions.LOGIN_ATTEMPT).toBeDefined();
            expect(SecurityActions.LOGIN_SUCCESS).toBeDefined();
            expect(SecurityActions.LOGIN_FAILURE).toBeDefined();
            expect(SecurityActions.LOGOUT).toBeDefined();
            expect(SecurityActions.TOKEN_REFRESH).toBeDefined();
        });

        it('should have all required authorization actions', () => {
            expect(SecurityActions.PERMISSION_CHECK).toBeDefined();
            expect(SecurityActions.PERMISSION_GRANTED).toBeDefined();
            expect(SecurityActions.PERMISSION_DENIED).toBeDefined();
            expect(SecurityActions.ROLE_CHANGE).toBeDefined();
        });

        it('should have all required security event actions', () => {
            expect(SecurityActions.RATE_LIMIT_VIOLATION).toBeDefined();
            expect(SecurityActions.IP_BLOCKED).toBeDefined();
            expect(SecurityActions.SUSPICIOUS_ACTIVITY).toBeDefined();
            expect(SecurityActions.CSRF_TOKEN_MISMATCH).toBeDefined();
        });
    });
});
