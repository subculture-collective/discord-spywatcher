export type RuleStatus = 'ACTIVE' | 'PAUSED' | 'DRAFT';
export type RuleTriggerType = 'SCHEDULED' | 'REALTIME' | 'MANUAL';
export type ActionType = 'WEBHOOK' | 'NOTIFICATION' | 'EMAIL' | 'DISCORD_MESSAGE';
export type ConditionOperator =
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

export interface RuleCondition {
    field: string;
    operator: ConditionOperator;
    value: string | number | boolean | string[] | number[];
}

export interface RuleAction {
    type: ActionType;
    config: {
        url?: string;
        message?: string;
        recipients?: string[];
        [key: string]: unknown;
    };
}

export interface RuleExecution {
    id: string;
    ruleId: string;
    status: string;
    matchedCount: number;
    actionsExecuted: number;
    error?: string;
    results?: unknown;
    executionTimeMs?: number;
    startedAt: string;
    completedAt?: string;
}

export interface AnalyticsRule {
    id: string;
    name: string;
    description?: string;
    userId: string;
    status: RuleStatus;
    triggerType: RuleTriggerType;
    schedule?: string;
    conditions: RuleCondition[];
    actions: RuleAction[];
    metadata?: Record<string, unknown>;
    lastExecutedAt?: string;
    createdAt: string;
    updatedAt: string;
    executions?: RuleExecution[];
}

export interface RuleTemplate {
    id: string;
    name: string;
    description?: string;
    category: string;
    conditions: RuleCondition[];
    actions: RuleAction[];
    metadata?: Record<string, unknown>;
    usageCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateRuleRequest {
    name: string;
    description?: string;
    status?: RuleStatus;
    triggerType?: RuleTriggerType;
    schedule?: string;
    conditions: RuleCondition[];
    actions: RuleAction[];
    metadata?: Record<string, unknown>;
}

export type UpdateRuleRequest = Partial<CreateRuleRequest>;
