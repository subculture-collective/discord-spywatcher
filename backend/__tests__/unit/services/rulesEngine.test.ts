import {
    evaluateCondition,
    evaluateRuleConditions,
    RuleCondition,
} from '../../../src/services/rulesEngine';

describe('Rules Engine', () => {
    describe('evaluateCondition', () => {
        it('should evaluate EQUALS operator correctly', () => {
            const condition: RuleCondition = {
                field: 'username',
                operator: 'EQUALS',
                value: 'testuser',
            };

            expect(
                evaluateCondition({ username: 'testuser' }, condition),
            ).toBe(true);
            expect(
                evaluateCondition({ username: 'otheruser' }, condition),
            ).toBe(false);
        });

        it('should evaluate GREATER_THAN operator correctly', () => {
            const condition: RuleCondition = {
                field: 'score',
                operator: 'GREATER_THAN',
                value: 50,
            };

            expect(evaluateCondition({ score: 75 }, condition)).toBe(true);
            expect(evaluateCondition({ score: 50 }, condition)).toBe(false);
            expect(evaluateCondition({ score: 25 }, condition)).toBe(false);
        });

        it('should evaluate LESS_THAN operator correctly', () => {
            const condition: RuleCondition = {
                field: 'count',
                operator: 'LESS_THAN',
                value: 10,
            };

            expect(evaluateCondition({ count: 5 }, condition)).toBe(true);
            expect(evaluateCondition({ count: 10 }, condition)).toBe(false);
            expect(evaluateCondition({ count: 15 }, condition)).toBe(false);
        });

        it('should evaluate CONTAINS operator correctly', () => {
            const condition: RuleCondition = {
                field: 'message',
                operator: 'CONTAINS',
                value: 'test',
            };

            expect(
                evaluateCondition({ message: 'this is a test' }, condition),
            ).toBe(true);
            expect(
                evaluateCondition({ message: 'no match here' }, condition),
            ).toBe(false);
        });

        it('should evaluate IN operator correctly', () => {
            const condition: RuleCondition = {
                field: 'status',
                operator: 'IN',
                value: ['active', 'pending'],
            };

            expect(evaluateCondition({ status: 'active' }, condition)).toBe(true);
            expect(evaluateCondition({ status: 'pending' }, condition)).toBe(true);
            expect(evaluateCondition({ status: 'inactive' }, condition)).toBe(
                false,
            );
        });

        it('should evaluate NOT_IN operator correctly', () => {
            const condition: RuleCondition = {
                field: 'role',
                operator: 'NOT_IN',
                value: ['admin', 'moderator'],
            };

            expect(evaluateCondition({ role: 'user' }, condition)).toBe(true);
            expect(evaluateCondition({ role: 'admin' }, condition)).toBe(false);
        });

        it('should handle missing fields gracefully', () => {
            const condition: RuleCondition = {
                field: 'nonexistent',
                operator: 'EQUALS',
                value: 'test',
            };

            expect(evaluateCondition({}, condition)).toBe(false);
        });
    });

    describe('evaluateRuleConditions', () => {
        it('should evaluate multiple conditions with AND logic', () => {
            const conditions: RuleCondition[] = [
                {
                    field: 'score',
                    operator: 'GREATER_THAN',
                    value: 50,
                },
                {
                    field: 'status',
                    operator: 'EQUALS',
                    value: 'active',
                },
            ];

            expect(
                evaluateRuleConditions(
                    { score: 75, status: 'active' },
                    conditions,
                ),
            ).toBe(true);
            expect(
                evaluateRuleConditions(
                    { score: 25, status: 'active' },
                    conditions,
                ),
            ).toBe(false);
            expect(
                evaluateRuleConditions(
                    { score: 75, status: 'inactive' },
                    conditions,
                ),
            ).toBe(false);
        });

        it('should return true for empty conditions array', () => {
            expect(evaluateRuleConditions({ test: 'value' }, [])).toBe(true);
        });

        it('should handle complex multi-field conditions', () => {
            const conditions: RuleCondition[] = [
                {
                    field: 'ghostScore',
                    operator: 'GREATER_THAN',
                    value: 80,
                },
                {
                    field: 'messageCount',
                    operator: 'LESS_THAN',
                    value: 10,
                },
                {
                    field: 'typingCount',
                    operator: 'GREATER_THAN',
                    value: 50,
                },
            ];

            expect(
                evaluateRuleConditions(
                    {
                        ghostScore: 85,
                        messageCount: 5,
                        typingCount: 60,
                    },
                    conditions,
                ),
            ).toBe(true);

            expect(
                evaluateRuleConditions(
                    {
                        ghostScore: 85,
                        messageCount: 15,
                        typingCount: 60,
                    },
                    conditions,
                ),
            ).toBe(false);
        });
    });
});
