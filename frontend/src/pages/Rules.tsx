import { Plus, Play, Pause, Trash2, Edit } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { CardSkeleton } from '../components/ui/LoadingSkeleton';
import api from '../lib/api';
import type { AnalyticsRule, RuleTemplate } from '../types/rules';

function Rules() {
    const [loading, setLoading] = useState(true);
    const [rules, setRules] = useState<AnalyticsRule[]>([]);
    const [templates, setTemplates] = useState<RuleTemplate[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rulesRes, templatesRes] = await Promise.all([
                api.get('/analytics/rules'),
                api.get('/analytics/rules/templates'),
            ]);

            setRules(rulesRes.data);
            setTemplates(templatesRes.data);
        } catch {
            toast.error('Failed to fetch rules');
        } finally {
            setLoading(false);
        }
    };

    const executeRule = async (ruleId: string) => {
        try {
            await api.post(`/analytics/rules/${ruleId}/execute`);
            toast.success('Rule execution started');
            fetchData();
        } catch {
            toast.error('Failed to execute rule');
        }
    };

    const toggleRuleStatus = async (rule: AnalyticsRule) => {
        try {
            const newStatus = rule.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
            await api.put(`/analytics/rules/${rule.id}`, { status: newStatus });
            toast.success(
                `Rule ${newStatus === 'ACTIVE' ? 'activated' : 'paused'}`,
            );
            fetchData();
        } catch {
            toast.error('Failed to update rule');
        }
    };

    const deleteRule = async (ruleId: string) => {
        if (!confirm('Are you sure you want to delete this rule?')) return;

        try {
            await api.delete(`/analytics/rules/${ruleId}`);
            toast.success('Rule deleted');
            fetchData();
        } catch {
            toast.error('Failed to delete rule');
        }
    };

    const createFromTemplate = async (templateId: string) => {
        try {
            await api.post(`/analytics/rules/templates/${templateId}/use`);
            toast.success('Rule created from template');
            fetchData();
        } catch {
            toast.error('Failed to create rule');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'PAUSED':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'DRAFT':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="p-6 space-y-6">
                <CardSkeleton />
                <CardSkeleton />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-surface-text">
                        Analytics Rules
                    </h1>
                    <p className="text-surface-text-secondary mt-1">
                        Create custom rules to automate alerts and actions
                    </p>
                </div>
                <Button onClick={() => (window.location.href = '/rules/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Rule
                </Button>
            </div>

            {/* Templates Section */}
            {templates.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Rule Templates</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {templates.map((template) => (
                                <div
                                    key={template.id}
                                    className="p-4 border border-border rounded-lg hover:bg-surface-hover transition-colors"
                                >
                                    <h3 className="font-semibold text-surface-text mb-2">
                                        {template.name}
                                    </h3>
                                    <p className="text-sm text-surface-text-secondary mb-3">
                                        {template.description}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-surface-text-secondary">
                                            Used {template.usageCount} times
                                        </span>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() =>
                                                createFromTemplate(template.id)
                                            }
                                        >
                                            Use Template
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Rules List */}
            <Card>
                <CardHeader>
                    <CardTitle>Your Rules ({rules.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {rules.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-surface-text-secondary mb-4">
                                No rules created yet
                            </p>
                            <Button onClick={() => (window.location.href = '/rules/new')}>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Your First Rule
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {rules.map((rule) => (
                                <div
                                    key={rule.id}
                                    className="p-4 border border-border rounded-lg hover:bg-surface-hover transition-colors"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-surface-text">
                                                    {rule.name}
                                                </h3>
                                                <span
                                                    className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(rule.status)}`}
                                                >
                                                    {rule.status}
                                                </span>
                                            </div>
                                            {rule.description && (
                                                <p className="text-sm text-surface-text-secondary mb-2">
                                                    {rule.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-4 text-xs text-surface-text-secondary">
                                                <span>
                                                    {rule.conditions.length}{' '}
                                                    conditions
                                                </span>
                                                <span>
                                                    {rule.actions.length} actions
                                                </span>
                                                {rule.lastExecutedAt && (
                                                    <span>
                                                        Last run:{' '}
                                                        {new Date(
                                                            rule.lastExecutedAt,
                                                        ).toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => executeRule(rule.id)}
                                            >
                                                <Play className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleRuleStatus(rule)}
                                            >
                                                {rule.status === 'ACTIVE' ? (
                                                    <Pause className="w-4 h-4" />
                                                ) : (
                                                    <Play className="w-4 h-4" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    (window.location.href = `/rules/${rule.id}/edit`)
                                                }
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => deleteRule(rule.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Execution History */}
                                    {rule.executions &&
                                        rule.executions.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-border">
                                                <p className="text-xs font-medium text-surface-text mb-2">
                                                    Recent Executions
                                                </p>
                                                <div className="space-y-1">
                                                    {rule.executions
                                                        .slice(0, 3)
                                                        .map((execution) => (
                                                            <div
                                                                key={execution.id}
                                                                className="text-xs text-surface-text-secondary flex items-center justify-between"
                                                            >
                                                                <span>
                                                                    {new Date(
                                                                        execution.startedAt,
                                                                    ).toLocaleString()}
                                                                </span>
                                                                <span>
                                                                    {
                                                                        execution.matchedCount
                                                                    }{' '}
                                                                    matches,{' '}
                                                                    {
                                                                        execution.actionsExecuted
                                                                    }{' '}
                                                                    actions
                                                                </span>
                                                                <span
                                                                    className={
                                                                        execution.status ===
                                                                        'SUCCESS'
                                                                            ? 'text-green-600'
                                                                            : 'text-red-600'
                                                                    }
                                                                >
                                                                    {execution.status}
                                                                </span>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default Rules;
