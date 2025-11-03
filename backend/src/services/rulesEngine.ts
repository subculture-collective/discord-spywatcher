import { PrismaClient, AnalyticsRule, RuleStatus } from '@prisma/client';
import axios from 'axios';

import logger from '../middleware/winstonLogger';

const prisma = new PrismaClient();

// Maximum number of matched results to store in execution history
const MAX_STORED_MATCHES = 100;

export interface RuleCondition {
    field: string;
    operator:
        | 'EQUALS'
        | 'NOT_EQUALS'
        | 'GREATER_THAN'
        | 'LESS_THAN'
        | 'GREATER_THAN_OR_EQUAL'
        | 'LESS_THAN_OR_EQUAL'
        | 'CONTAINS'
        | 'NOT_CONTAINS'
        | 'IN'
        | 'NOT_IN';
    value: string | number | boolean | string[] | number[];
}

export interface RuleAction {
    type: 'WEBHOOK' | 'NOTIFICATION' | 'EMAIL' | 'DISCORD_MESSAGE';
    config: {
        url?: string;
        message?: string;
        recipients?: string[];
        [key: string]: unknown;
    };
}

/**
 * Evaluates a single condition against data
 */
export function evaluateCondition(
    data: Record<string, unknown>,
    condition: RuleCondition,
): boolean {
    const fieldValue = data[condition.field];
    const conditionValue = condition.value;

    switch (condition.operator) {
        case 'EQUALS':
            return fieldValue === conditionValue;
        case 'NOT_EQUALS':
            return fieldValue !== conditionValue;
        case 'GREATER_THAN':
            return (
                typeof fieldValue === 'number' &&
                typeof conditionValue === 'number' &&
                fieldValue > conditionValue
            );
        case 'LESS_THAN':
            return (
                typeof fieldValue === 'number' &&
                typeof conditionValue === 'number' &&
                fieldValue < conditionValue
            );
        case 'GREATER_THAN_OR_EQUAL':
            return (
                typeof fieldValue === 'number' &&
                typeof conditionValue === 'number' &&
                fieldValue >= conditionValue
            );
        case 'LESS_THAN_OR_EQUAL':
            return (
                typeof fieldValue === 'number' &&
                typeof conditionValue === 'number' &&
                fieldValue <= conditionValue
            );
        case 'CONTAINS':
            return (
                typeof fieldValue === 'string' &&
                typeof conditionValue === 'string' &&
                fieldValue.includes(conditionValue)
            );
        case 'NOT_CONTAINS':
            return (
                typeof fieldValue === 'string' &&
                typeof conditionValue === 'string' &&
                !fieldValue.includes(conditionValue)
            );
        case 'IN':
            if (!Array.isArray(conditionValue)) return false;
            return conditionValue.some((val) => val === fieldValue);
        case 'NOT_IN':
            if (!Array.isArray(conditionValue)) return false;
            return !conditionValue.some((val) => val === fieldValue);
        default:
            return false;
    }
}

/**
 * Evaluates all conditions for a rule (AND logic)
 */
export function evaluateRuleConditions(
    data: Record<string, unknown>,
    conditions: RuleCondition[],
): boolean {
    return conditions.every((condition) => evaluateCondition(data, condition));
}

/**
 * Executes an action based on its type
 */
export async function executeAction(
    action: RuleAction,
    matchedData: Record<string, unknown>[],
): Promise<boolean> {
    try {
        switch (action.type) {
            case 'WEBHOOK':
                if (!action.config.url) {
                    throw new Error('Webhook URL is required');
                }
                await axios.post(String(action.config.url), {
                    matches: matchedData,
                    timestamp: new Date().toISOString(),
                });
                return true;

            case 'NOTIFICATION':
                // Placeholder for notification system integration
                logger.info('Notification action executed', {
                    message: action.config.message,
                    matchCount: matchedData.length,
                });
                return true;

            case 'EMAIL':
                // Placeholder for email service integration
                logger.info('Email action executed', {
                    recipients: action.config.recipients,
                    matchCount: matchedData.length,
                });
                return true;

            case 'DISCORD_MESSAGE':
                // Placeholder for Discord bot integration
                logger.info('Discord message action executed', {
                    message: action.config.message,
                    matchCount: matchedData.length,
                });
                return true;

            default:
                throw new Error(`Unknown action type: ${String(action.type)}`);
        }
    } catch (error) {
        logger.error('Failed to execute action', { action, error });
        return false;
    }
}

/**
 * Fetches analytics data based on rule configuration
 */
export async function fetchAnalyticsData(
    rule: AnalyticsRule,
): Promise<Record<string, unknown>[]> {
    // Extract metadata to determine what data to fetch
    const metadata = rule.metadata as Record<string, unknown> | null;
    const dataSource = (metadata?.dataSource as string) || 'ghosts';
    
    // Allow configurable time window in hours via metadata, default to 24 hours
    const timeWindowHours =
        typeof metadata?.timeWindowHours === 'number' &&
        metadata.timeWindowHours > 0
            ? metadata.timeWindowHours
            : 24;
    const since = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000);

    switch (dataSource) {
        case 'ghosts': {
            const ghosts = await prisma.$queryRaw<
                Array<{
                    userId: string;
                    username: string;
                    typingCount: bigint;
                    messageCount: bigint;
                    ghostScore: number;
                }>
            >`
        SELECT 
          t."userId",
          t."username",
          COUNT(DISTINCT t.id) as "typingCount",
          COUNT(DISTINCT m.id) as "messageCount",
          ROUND(
            (COUNT(DISTINCT t.id)::numeric / NULLIF(COUNT(DISTINCT m.id), 0)::numeric) * 100,
            2
          ) as "ghostScore"
        FROM "TypingEvent" t
        LEFT JOIN "MessageEvent" m ON t."userId" = m."userId" AND m."createdAt" >= ${since}
        WHERE t."createdAt" >= ${since}
        GROUP BY t."userId", t."username"
        HAVING COUNT(DISTINCT t.id) > 0
        ORDER BY "ghostScore" DESC
      `;
            return ghosts.map((g) => ({
                userId: g.userId,
                username: g.username,
                typingCount: Number(g.typingCount),
                messageCount: Number(g.messageCount),
                ghostScore: g.ghostScore,
            }));
        }
        case 'suspicion': {
            const suspicion = await prisma.$queryRaw<
                Array<{
                    userId: string;
                    username: string;
                    suspicionScore: number;
                }>
            >`
        SELECT 
          "userId",
          "username",
          (
            COALESCE(COUNT(DISTINCT "channelId"), 0) * 2 +
            COALESCE(SUM(CASE WHEN cardinality("clients") > 1 THEN 1 ELSE 0 END), 0) * 3
          ) as "suspicionScore"
        FROM "PresenceEvent"
        WHERE "createdAt" >= ${since}
        GROUP BY "userId", "username"
        ORDER BY "suspicionScore" DESC
      `;
            return suspicion.map((s) => ({
                userId: s.userId,
                username: s.username,
                suspicionScore: s.suspicionScore,
            }));
        }
        default:
            return [];
    }
}

/**
 * Executes a single rule
 */
export async function executeRule(ruleId: string): Promise<void> {
    const startTime = Date.now();
    let executionRecord;

    try {
        // Fetch the rule
        const rule = await prisma.analyticsRule.findUnique({
            where: { id: ruleId },
        });

        if (!rule || rule.status !== RuleStatus.ACTIVE) {
            logger.warn('Rule not found or not active', { ruleId });
            return;
        }

        // Create execution record
        executionRecord = await prisma.ruleExecution.create({
            data: {
                ruleId: rule.id,
                status: 'IN_PROGRESS',
            },
        });

        // Fetch data
        const data = await fetchAnalyticsData(rule);

        // Evaluate conditions
        const conditions = rule.conditions as unknown as RuleCondition[];
        const matchedData = data.filter((item) =>
            evaluateRuleConditions(item, conditions),
        );

        // Execute actions
        const actions = rule.actions as unknown as RuleAction[];
        let actionsExecuted = 0;

        if (matchedData.length > 0) {
            for (const action of actions) {
                const success = await executeAction(action, matchedData);
                if (success) actionsExecuted++;
            }
        }

        // Update execution record
        const executionTimeMs = Date.now() - startTime;
        await prisma.ruleExecution.update({
            where: { id: executionRecord.id },
            data: {
                status: 'SUCCESS',
                matchedCount: matchedData.length,
                actionsExecuted,
                executionTimeMs,
                completedAt: new Date(),
                results: matchedData.slice(0, MAX_STORED_MATCHES) as never,
            },
        });

        // Update rule's last executed timestamp
        await prisma.analyticsRule.update({
            where: { id: rule.id },
            data: { lastExecutedAt: new Date() },
        });

        logger.info('Rule executed successfully', {
            ruleId: rule.id,
            matchedCount: matchedData.length,
            actionsExecuted,
        });
    } catch (error) {
        logger.error('Failed to execute rule', { ruleId, error });

        if (executionRecord) {
            await prisma.ruleExecution.update({
                where: { id: executionRecord.id },
                data: {
                    status: 'FAILED',
                    error: error instanceof Error ? error.message : 'Unknown error',
                    completedAt: new Date(),
                    executionTimeMs: Date.now() - startTime,
                },
            });
        }
    }
}

/**
 * Executes all active scheduled rules
 */
export async function executeScheduledRules(): Promise<void> {
    const rules = await prisma.analyticsRule.findMany({
        where: {
            status: RuleStatus.ACTIVE,
            triggerType: 'SCHEDULED',
        },
    });

    logger.info('Executing scheduled rules', { count: rules.length });

    for (const rule of rules) {
        await executeRule(rule.id);
    }
}
