import axios from 'axios';

import { db } from '../db';
import { env } from './env';
import { SecurityEvent } from './securityLogger';

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Alert {
    severity: AlertSeverity;
    title: string;
    message: string;
    details?: Record<string, unknown>;
}

/**
 * Get color for alert severity in Discord embeds
 */
function getSeverityColor(severity: AlertSeverity): number {
    switch (severity) {
        case 'LOW':
            return 0x3498db; // Blue
        case 'MEDIUM':
            return 0xf39c12; // Orange
        case 'HIGH':
            return 0xe67e22; // Dark Orange
        case 'CRITICAL':
            return 0xe74c3c; // Red
        default:
            return 0x95a5a6; // Gray
    }
}

/**
 * Get emoji for alert severity
 */
function getSeverityEmoji(severity: AlertSeverity): string {
    switch (severity) {
        case 'LOW':
            return '🔵';
        case 'MEDIUM':
            return '🟡';
        case 'HIGH':
            return '🟠';
        case 'CRITICAL':
            return '🔴';
        default:
            return '⚪';
    }
}

/**
 * Send alert to configured channels
 */
export async function sendAlert(alert: Alert): Promise<void> {
    try {
        // Send to Discord webhook if configured
        const discordWebhook = process.env.DISCORD_ALERT_WEBHOOK;
        if (discordWebhook) {
            await sendDiscordAlert(discordWebhook, alert);
        }

        // Send to Slack webhook if configured
        const slackWebhook = process.env.SLACK_ALERT_WEBHOOK;
        if (slackWebhook) {
            await sendSlackAlert(slackWebhook, alert);
        }

        // TODO: Implement email alerts for HIGH/CRITICAL
        // if (alert.severity === 'HIGH' || alert.severity === 'CRITICAL') {
        //     await sendEmailAlert(alert);
        // }

        // Log the alert to database
        await db.alertLog.create({
            data: {
                severity: alert.severity,
                title: alert.title,
                message: alert.message,
                details: alert.details as never,
                sentAt: new Date(),
            },
        });

        console.log(
            `${getSeverityEmoji(alert.severity)} Alert sent: [${alert.severity}] ${alert.title}`
        );
    } catch (error) {
        console.error('Failed to send alert:', error);
        // Don't throw - alert failures shouldn't break the main flow
    }
}

/**
 * Send alert to Discord webhook
 */
async function sendDiscordAlert(
    webhookUrl: string,
    alert: Alert
): Promise<void> {
    const fields = alert.details
        ? Object.entries(alert.details).map(([key, value]) => ({
              name: key,
              value: String(value),
              inline: true,
          }))
        : [];

    await axios.post(webhookUrl, {
        embeds: [
            {
                title: `${getSeverityEmoji(alert.severity)} ${alert.severity}: ${alert.title}`,
                description: alert.message,
                color: getSeverityColor(alert.severity),
                fields,
                timestamp: new Date().toISOString(),
                footer: {
                    text: 'Discord SpyWatcher Security Alert',
                },
            },
        ],
    });
}

/**
 * Send alert to Slack webhook
 */
async function sendSlackAlert(
    webhookUrl: string,
    alert: Alert
): Promise<void> {
    const color = (() => {
        switch (alert.severity) {
            case 'LOW':
                return '#3498db';
            case 'MEDIUM':
                return '#f39c12';
            case 'HIGH':
                return '#e67e22';
            case 'CRITICAL':
                return '#e74c3c';
            default:
                return '#95a5a6';
        }
    })();

    const fields = alert.details
        ? Object.entries(alert.details).map(([key, value]) => ({
              title: key,
              value: String(value),
              short: true,
          }))
        : [];

    await axios.post(webhookUrl, {
        attachments: [
            {
                color,
                title: `${getSeverityEmoji(alert.severity)} ${alert.severity}: ${alert.title}`,
                text: alert.message,
                fields,
                footer: 'Discord SpyWatcher Security Alert',
                ts: Math.floor(Date.now() / 1000),
            },
        ],
    });
}

/**
 * Check for alert conditions based on security events
 */
export async function checkAlertConditions(
    event: SecurityEvent
): Promise<void> {
    try {
        // Check for multiple failed login attempts
        if (
            event.action === 'LOGIN_ATTEMPT' &&
            event.result === 'FAILURE' &&
            event.ipAddress
        ) {
            await checkFailedLoginAttempts(event);
        }

        // Check for privilege escalation attempts
        if (event.action === 'PRIVILEGE_ESCALATION_ATTEMPT') {
            await sendAlert({
                severity: 'CRITICAL',
                title: 'Privilege Escalation Attempt Detected',
                message: `User ${event.userId || 'unknown'} attempted to escalate privileges`,
                details: {
                    userId: event.userId || 'unknown',
                    ipAddress: event.ipAddress || 'unknown',
                    resource: event.resource || 'unknown',
                    userAgent: event.userAgent || 'unknown',
                },
            });
        }

        // Check for suspicious activity
        if (event.action === 'SUSPICIOUS_ACTIVITY') {
            await sendAlert({
                severity: 'HIGH',
                title: 'Suspicious Activity Detected',
                message: `Suspicious activity detected from ${event.ipAddress || 'unknown IP'}`,
                details: {
                    userId: event.userId || 'unknown',
                    ipAddress: event.ipAddress || 'unknown',
                    resource: event.resource || 'unknown',
                    metadata: event.metadata
                        ? JSON.stringify(event.metadata)
                        : 'none',
                },
            });
        }

        // Check for unauthorized access attempts
        if (event.action === 'FORBIDDEN_ACCESS' && event.userId) {
            await checkUnauthorizedAccessPattern(event);
        }

        // Check for SQL injection or XSS attempts
        if (
            event.action === 'SQL_INJECTION_ATTEMPT' ||
            event.action === 'XSS_ATTEMPT'
        ) {
            await sendAlert({
                severity: 'CRITICAL',
                title: `${event.action.replace('_', ' ')} Detected`,
                message: `Potential attack detected from ${event.ipAddress || 'unknown IP'}`,
                details: {
                    ipAddress: event.ipAddress || 'unknown',
                    userAgent: event.userAgent || 'unknown',
                    resource: event.resource || 'unknown',
                },
            });
        }

        // Check for mass data export
        if (event.action === 'DATA_EXPORT' && event.metadata) {
            await checkMassDataExport(event);
        }
    } catch (error) {
        console.error('Failed to check alert conditions:', error);
    }
}

/**
 * Check for multiple failed login attempts and send alert if threshold exceeded
 */
async function checkFailedLoginAttempts(
    event: SecurityEvent
): Promise<void> {
    if (!event.ipAddress) return;

    const recentFailures = await db.securityLog.count({
        where: {
            action: 'LOGIN_ATTEMPT',
            result: 'FAILURE',
            ipAddress: event.ipAddress,
            timestamp: {
                gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
            },
        },
    });

    if (recentFailures >= 5) {
        await sendAlert({
            severity: 'HIGH',
            title: 'Multiple Failed Login Attempts',
            message: `IP ${event.ipAddress} has ${recentFailures} failed login attempts in the last 5 minutes`,
            details: {
                ipAddress: event.ipAddress,
                attempts: recentFailures,
                window: '5 minutes',
                action: 'Consider auto-blocking this IP',
            },
        });

        // Auto-block the IP if enabled
        if (env.ENABLE_IP_BLOCKING) {
            try {
                const { autoBlockOnAbuse } = await import('./ipManagement');
                await autoBlockOnAbuse(event.ipAddress, 3600); // Block for 1 hour
                console.log(
                    `🔒 Auto-blocked IP ${event.ipAddress} due to multiple failed login attempts`
                );
            } catch (error) {
                console.error('Failed to auto-block IP:', error);
            }
        }
    }
}

/**
 * Check for patterns of unauthorized access attempts
 */
async function checkUnauthorizedAccessPattern(
    event: SecurityEvent
): Promise<void> {
    if (!event.userId) return;

    const recentDenials = await db.securityLog.count({
        where: {
            userId: event.userId,
            action: {
                in: ['FORBIDDEN_ACCESS', 'PERMISSION_DENIED'],
            },
            timestamp: {
                gte: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
            },
        },
    });

    if (recentDenials >= 10) {
        await sendAlert({
            severity: 'MEDIUM',
            title: 'Multiple Unauthorized Access Attempts',
            message: `User ${event.userId} has ${recentDenials} permission denials in the last 15 minutes`,
            details: {
                userId: event.userId,
                attempts: recentDenials,
                window: '15 minutes',
                ipAddress: event.ipAddress || 'unknown',
            },
        });
    }
}

/**
 * Check for mass data export
 */
async function checkMassDataExport(event: SecurityEvent): Promise<void> {
    const metadata = event.metadata as { recordCount?: number };
    const recordCount = metadata?.recordCount || 0;

    // Alert if exporting more than 1000 records
    if (recordCount > 1000) {
        await sendAlert({
            severity: 'MEDIUM',
            title: 'Mass Data Export Detected',
            message: `User ${event.userId || 'unknown'} exported ${recordCount} records`,
            details: {
                userId: event.userId || 'unknown',
                recordCount,
                resource: event.resource || 'unknown',
                ipAddress: event.ipAddress || 'unknown',
            },
        });
    }
}

/**
 * Get recent alerts
 */
export async function getRecentAlerts(options: {
    severity?: AlertSeverity;
    limit?: number;
    offset?: number;
}) {
    const { severity, limit = 50, offset = 0 } = options;

    return db.alertLog.findMany({
        where: { severity },
        orderBy: { sentAt: 'desc' },
        take: limit,
        skip: offset,
    });
}

/**
 * Get alert statistics
 */
export async function getAlertStats(
    timeWindow: number = 24 * 60 * 60 * 1000
) {
    const since = new Date(Date.now() - timeWindow);

    const [total, critical, high, medium, low] = await Promise.all([
        db.alertLog.count({
            where: { sentAt: { gte: since } },
        }),
        db.alertLog.count({
            where: { severity: 'CRITICAL', sentAt: { gte: since } },
        }),
        db.alertLog.count({
            where: { severity: 'HIGH', sentAt: { gte: since } },
        }),
        db.alertLog.count({
            where: { severity: 'MEDIUM', sentAt: { gte: since } },
        }),
        db.alertLog.count({
            where: { severity: 'LOW', sentAt: { gte: since } },
        }),
    ]);

    return {
        total,
        bySeverity: { critical, high, medium, low },
        timeWindow: timeWindow / (60 * 60 * 1000) + ' hours',
    };
}
