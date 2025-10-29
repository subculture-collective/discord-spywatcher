import axios from 'axios';

import { db } from '../../../src/db';
import {
    sendAlert,
    checkAlertConditions,
    getRecentAlerts,
    getAlertStats,
} from '../../../src/utils/alertSystem';
import { SecurityEvent } from '../../../src/utils/securityLogger';

// Mock dependencies
jest.mock('axios');
jest.mock('../../../src/db', () => ({
    db: {
        alertLog: {
            create: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
        },
        securityLog: {
            count: jest.fn(),
        },
        blockedIP: {
            findFirst: jest.fn(),
            create: jest.fn(),
        },
        whitelistedIP: {
            findFirst: jest.fn(),
        },
    },
}));

jest.mock('../../../src/utils/ipManagement', () => ({
    autoBlockOnAbuse: jest.fn(),
}));

jest.mock('../../../src/utils/env', () => ({
    env: {
        ENABLE_IP_BLOCKING: true,
    },
}));

describe('Alert System', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        delete process.env.DISCORD_ALERT_WEBHOOK;
        delete process.env.SLACK_ALERT_WEBHOOK;
    });

    describe('sendAlert', () => {
        it('should send alert to Discord webhook if configured', async () => {
            process.env.DISCORD_ALERT_WEBHOOK =
                'https://discord.com/api/webhooks/test';
            (axios.post as jest.Mock).mockResolvedValue({});
            (db.alertLog.create as jest.Mock).mockResolvedValue({});

            const alert = {
                severity: 'HIGH' as const,
                title: 'Test Alert',
                message: 'This is a test alert',
                details: { test: 'data' },
            };

            await sendAlert(alert);

            expect(axios.post).toHaveBeenCalledWith(
                'https://discord.com/api/webhooks/test',
                expect.objectContaining({
                    embeds: expect.arrayContaining([
                        expect.objectContaining({
                            title: expect.stringContaining('HIGH'),
                            description: 'This is a test alert',
                        }),
                    ]),
                })
            );
        });

        it('should send alert to Slack webhook if configured', async () => {
            process.env.SLACK_ALERT_WEBHOOK =
                'https://hooks.slack.com/services/test';
            (axios.post as jest.Mock).mockResolvedValue({});
            (db.alertLog.create as jest.Mock).mockResolvedValue({});

            const alert = {
                severity: 'CRITICAL' as const,
                title: 'Critical Alert',
                message: 'This is critical',
            };

            await sendAlert(alert);

            expect(axios.post).toHaveBeenCalledWith(
                'https://hooks.slack.com/services/test',
                expect.objectContaining({
                    attachments: expect.arrayContaining([
                        expect.objectContaining({
                            title: expect.stringContaining('CRITICAL'),
                            text: 'This is critical',
                        }),
                    ]),
                })
            );
        });

        it('should log alert to database', async () => {
            (db.alertLog.create as jest.Mock).mockResolvedValue({});

            const alert = {
                severity: 'MEDIUM' as const,
                title: 'Medium Alert',
                message: 'Test message',
            };

            await sendAlert(alert);

            expect(db.alertLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    severity: 'MEDIUM',
                    title: 'Medium Alert',
                    message: 'Test message',
                }),
            });
        });

        it('should handle webhook errors gracefully', async () => {
            process.env.DISCORD_ALERT_WEBHOOK =
                'https://discord.com/api/webhooks/test';
            (axios.post as jest.Mock).mockRejectedValue(
                new Error('Webhook failed')
            );
            (db.alertLog.create as jest.Mock).mockResolvedValue({});

            const alert = {
                severity: 'LOW' as const,
                title: 'Test',
                message: 'Test',
            };

            // Should not throw
            await expect(sendAlert(alert)).resolves.not.toThrow();
        });
    });

    describe('checkAlertConditions', () => {
        it('should trigger alert for multiple failed login attempts', async () => {
            const event: SecurityEvent = {
                action: 'LOGIN_ATTEMPT',
                result: 'FAILURE',
                ipAddress: '192.168.1.1',
                userAgent: 'Mozilla/5.0',
            };

            (db.securityLog.count as jest.Mock).mockResolvedValue(5);
            (db.blockedIP.findFirst as jest.Mock).mockResolvedValue(null);
            (db.whitelistedIP.findFirst as jest.Mock).mockResolvedValue(null);
            (db.blockedIP.create as jest.Mock).mockResolvedValue({});
            (db.alertLog.create as jest.Mock).mockResolvedValue({});

            await checkAlertConditions(event);

            expect(db.securityLog.count).toHaveBeenCalledWith({
                where: expect.objectContaining({
                    action: 'LOGIN_ATTEMPT',
                    result: 'FAILURE',
                    ipAddress: '192.168.1.1',
                }),
            });
        });

        it('should trigger alert for privilege escalation attempt', async () => {
            const event: SecurityEvent = {
                userId: 'user123',
                action: 'PRIVILEGE_ESCALATION_ATTEMPT',
                result: 'FAILURE',
                ipAddress: '192.168.1.1',
            };

            (db.alertLog.create as jest.Mock).mockResolvedValue({});

            await checkAlertConditions(event);

            expect(db.alertLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    severity: 'CRITICAL',
                    title: 'Privilege Escalation Attempt Detected',
                }),
            });
        });

        it('should trigger alert for suspicious activity', async () => {
            const event: SecurityEvent = {
                action: 'SUSPICIOUS_ACTIVITY',
                result: 'FAILURE',
                ipAddress: '192.168.1.1',
            };

            (db.alertLog.create as jest.Mock).mockResolvedValue({});

            await checkAlertConditions(event);

            expect(db.alertLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    severity: 'HIGH',
                    title: 'Suspicious Activity Detected',
                }),
            });
        });

        it('should trigger alert for SQL injection attempt', async () => {
            const event: SecurityEvent = {
                action: 'SQL_INJECTION_ATTEMPT',
                result: 'FAILURE',
                ipAddress: '192.168.1.1',
            };

            (db.alertLog.create as jest.Mock).mockResolvedValue({});

            await checkAlertConditions(event);

            expect(db.alertLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    severity: 'CRITICAL',
                }),
            });
        });

        it('should not trigger alert for events below threshold', async () => {
            const event: SecurityEvent = {
                action: 'LOGIN_ATTEMPT',
                result: 'FAILURE',
                ipAddress: '192.168.1.1',
            };

            (db.securityLog.count as jest.Mock).mockResolvedValue(2); // Below threshold of 5

            await checkAlertConditions(event);

            expect(db.alertLog.create).not.toHaveBeenCalled();
        });
    });

    describe('getRecentAlerts', () => {
        it('should retrieve recent alerts', async () => {
            const mockAlerts = [
                {
                    id: '1',
                    severity: 'HIGH',
                    title: 'Alert 1',
                    message: 'Message 1',
                    sentAt: new Date(),
                },
            ];

            (db.alertLog.findMany as jest.Mock).mockResolvedValue(mockAlerts);

            const alerts = await getRecentAlerts({
                severity: 'HIGH',
                limit: 10,
            });

            expect(alerts).toEqual(mockAlerts);
            expect(db.alertLog.findMany).toHaveBeenCalledWith({
                where: { severity: 'HIGH' },
                orderBy: { sentAt: 'desc' },
                take: 10,
                skip: 0,
            });
        });

        it('should apply pagination', async () => {
            (db.alertLog.findMany as jest.Mock).mockResolvedValue([]);

            await getRecentAlerts({
                limit: 25,
                offset: 50,
            });

            expect(db.alertLog.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    take: 25,
                    skip: 50,
                })
            );
        });
    });

    describe('getAlertStats', () => {
        it('should return alert statistics', async () => {
            (db.alertLog.count as jest.Mock)
                .mockResolvedValueOnce(100) // total
                .mockResolvedValueOnce(10) // critical
                .mockResolvedValueOnce(20) // high
                .mockResolvedValueOnce(30) // medium
                .mockResolvedValueOnce(40); // low

            const stats = await getAlertStats();

            expect(stats).toEqual({
                total: 100,
                bySeverity: {
                    critical: 10,
                    high: 20,
                    medium: 30,
                    low: 40,
                },
                timeWindow: '24 hours',
            });
        });

        it('should use custom time window', async () => {
            (db.alertLog.count as jest.Mock).mockResolvedValue(0);

            const stats = await getAlertStats(7200000); // 2 hours

            expect(stats.timeWindow).toBe('2 hours');
        });
    });
});
