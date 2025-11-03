import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import type {
    ActionType,
    ConditionOperator,
    CreateRuleRequest,
    RuleAction,
    RuleCondition,
} from '../../types/rules';
import { Button } from '../ui/Button';

interface RuleBuilderProps {
    initialData?: CreateRuleRequest;
    onSubmit: (data: CreateRuleRequest) => void;
    onCancel: () => void;
}

const FIELD_OPTIONS = [
    { value: 'ghostScore', label: 'Ghost Score', type: 'number' },
    { value: 'suspicionScore', label: 'Suspicion Score', type: 'number' },
    { value: 'messageCount', label: 'Message Count', type: 'number' },
    { value: 'typingCount', label: 'Typing Count', type: 'number' },
    { value: 'username', label: 'Username', type: 'string' },
];

const OPERATOR_OPTIONS: Array<{ value: ConditionOperator; label: string }> = [
    { value: 'EQUALS', label: 'Equals' },
    { value: 'NOT_EQUALS', label: 'Not Equals' },
    { value: 'GREATER_THAN', label: 'Greater Than' },
    { value: 'LESS_THAN', label: 'Less Than' },
    { value: 'GREATER_THAN_OR_EQUAL', label: 'Greater Than or Equal' },
    { value: 'LESS_THAN_OR_EQUAL', label: 'Less Than or Equal' },
    { value: 'CONTAINS', label: 'Contains' },
    { value: 'NOT_CONTAINS', label: 'Does Not Contain' },
];

const ACTION_TYPE_OPTIONS: Array<{ value: ActionType; label: string }> = [
    { value: 'WEBHOOK', label: 'Webhook' },
    { value: 'NOTIFICATION', label: 'Notification' },
    { value: 'EMAIL', label: 'Email' },
    { value: 'DISCORD_MESSAGE', label: 'Discord Message' },
];

export default function RuleBuilder({
    initialData,
    onSubmit,
    onCancel,
}: RuleBuilderProps) {
    const [name, setName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [status, setStatus] = useState(initialData?.status || 'DRAFT');
    const [dataSource, setDataSource] = useState<string>(
        (initialData?.metadata?.dataSource as string) || 'ghosts',
    );
    const [conditions, setConditions] = useState<RuleCondition[]>(
        initialData?.conditions || [
            { field: 'ghostScore', operator: 'GREATER_THAN', value: 80 },
        ],
    );
    const [actions, setActions] = useState<RuleAction[]>(
        initialData?.actions || [
            { type: 'WEBHOOK', config: { url: '', message: '' } },
        ],
    );

    const addCondition = () => {
        setConditions([
            ...conditions,
            { field: 'ghostScore', operator: 'GREATER_THAN', value: 0 },
        ]);
    };

    const removeCondition = (index: number) => {
        setConditions(conditions.filter((_, i) => i !== index));
    };

    const updateCondition = (
        index: number,
        field: keyof RuleCondition,
        value: unknown,
    ) => {
        const newConditions = [...conditions];
        newConditions[index] = { ...newConditions[index], [field]: value };
        setConditions(newConditions);
    };

    const addAction = () => {
        setActions([
            ...actions,
            { type: 'WEBHOOK', config: { url: '', message: '' } },
        ]);
    };

    const removeAction = (index: number) => {
        setActions(actions.filter((_, i) => i !== index));
    };

    const updateAction = (index: number, field: string, value: unknown) => {
        const newActions = [...actions];
        if (field === 'type') {
            newActions[index] = { ...newActions[index], type: value as ActionType };
        } else {
            newActions[index] = {
                ...newActions[index],
                config: { ...newActions[index].config, [field]: value },
            };
        }
        setActions(newActions);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            name,
            description,
            status,
            conditions,
            actions,
            metadata: { dataSource },
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
                <div>
                    <label htmlFor="rule-name" className="block text-sm font-medium text-surface-text mb-2">
                        Rule Name *
                    </label>
                    <input
                        id="rule-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full px-4 py-2 bg-surface-base border border-border rounded-lg text-surface-text focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="e.g., High Ghost Score Alert"
                    />
                </div>

                <div>
                    <label htmlFor="rule-description" className="block text-sm font-medium text-surface-text mb-2">
                        Description
                    </label>
                    <textarea
                        id="rule-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 bg-surface-base border border-border rounded-lg text-surface-text focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Describe what this rule does..."
                    />
                </div>

                <div>
                    <label htmlFor="rule-status" className="block text-sm font-medium text-surface-text mb-2">
                        Status
                    </label>
                    <select
                        id="rule-status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'ACTIVE' | 'PAUSED')}
                        className="w-full px-4 py-2 bg-surface-base border border-border rounded-lg text-surface-text focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                        <option value="DRAFT">Draft</option>
                        <option value="ACTIVE">Active</option>
                        <option value="PAUSED">Paused</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="data-source" className="block text-sm font-medium text-surface-text mb-2">
                        Data Source
                    </label>
                    <select
                        id="data-source"
                        value={dataSource}
                        onChange={(e) => setDataSource(e.target.value)}
                        className="w-full px-4 py-2 bg-surface-base border border-border rounded-lg text-surface-text focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                        <option value="ghosts">Ghost Users (typing vs messages)</option>
                        <option value="suspicion">Suspicious Activity</option>
                    </select>
                </div>
            </div>

            {/* Conditions */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-surface-text">
                        Conditions (All must match)
                    </h3>
                    <Button type="button" size="sm" onClick={addCondition}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add Condition
                    </Button>
                </div>

                <div className="space-y-3">
                    {conditions.map((condition, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-3 p-3 bg-surface-hover rounded-lg"
                        >
                            <select
                                value={condition.field}
                                onChange={(e) =>
                                    updateCondition(index, 'field', e.target.value)
                                }
                                className="flex-1 px-3 py-2 bg-surface-base border border-border rounded text-surface-text"
                            >
                                {FIELD_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={condition.operator}
                                onChange={(e) =>
                                    updateCondition(index, 'operator', e.target.value)
                                }
                                className="flex-1 px-3 py-2 bg-surface-base border border-border rounded text-surface-text"
                            >
                                {OPERATOR_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>

                            <input
                                type="text"
                                value={String(condition.value)}
                                onChange={(e) => {
                                    const field = FIELD_OPTIONS.find(
                                        (f) => f.value === condition.field,
                                    );
                                    const value =
                                        field?.type === 'number'
                                            ? Number(e.target.value)
                                            : e.target.value;
                                    updateCondition(index, 'value', value);
                                }}
                                className="flex-1 px-3 py-2 bg-surface-base border border-border rounded text-surface-text"
                                placeholder="Value"
                            />

                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeCondition(index)}
                                disabled={conditions.length === 1}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-surface-text">
                        Actions
                    </h3>
                    <Button type="button" size="sm" onClick={addAction}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add Action
                    </Button>
                </div>

                <div className="space-y-3">
                    {actions.map((action, index) => (
                        <div
                            key={index}
                            className="p-3 bg-surface-hover rounded-lg space-y-3"
                        >
                            <div className="flex items-center gap-3">
                                <select
                                    value={action.type}
                                    onChange={(e) =>
                                        updateAction(index, 'type', e.target.value)
                                    }
                                    className="flex-1 px-3 py-2 bg-surface-base border border-border rounded text-surface-text"
                                >
                                    {ACTION_TYPE_OPTIONS.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeAction(index)}
                                    disabled={actions.length === 1}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>

                            {action.type === 'WEBHOOK' && (
                                <input
                                    type="url"
                                    value={action.config.url || ''}
                                    onChange={(e) =>
                                        updateAction(index, 'url', e.target.value)
                                    }
                                    className="w-full px-3 py-2 bg-surface-base border border-border rounded text-surface-text"
                                    placeholder="Webhook URL"
                                />
                            )}

                            <textarea
                                value={action.config.message || ''}
                                onChange={(e) =>
                                    updateAction(index, 'message', e.target.value)
                                }
                                rows={2}
                                className="w-full px-3 py-2 bg-surface-base border border-border rounded text-surface-text"
                                placeholder="Message template (use {{field}} for variables)"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit">Save Rule</Button>
            </div>
        </form>
    );
}
