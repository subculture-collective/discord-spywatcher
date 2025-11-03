import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import RuleBuilder from '../components/rules/RuleBuilder';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { CardSkeleton } from '../components/ui/LoadingSkeleton';
import api from '../lib/api';
import { AnalyticsRule, CreateRuleRequest } from '../types/rules';

function RuleEditor() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(!!id);
    const [rule, setRule] = useState<AnalyticsRule | null>(null);

    useEffect(() => {
        if (id) {
            fetchRule();
        }
    }, [id]);

    const fetchRule = async () => {
        if (!id) return;

        setLoading(true);
        try {
            const response = await api.get(`/analytics/rules/${id}`);
            setRule(response.data);
        } catch {
            toast.error('Failed to load rule');
            navigate('/rules');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data: CreateRuleRequest) => {
        try {
            if (id) {
                await api.put(`/analytics/rules/${id}`, data);
                toast.success('Rule updated successfully');
            } else {
                await api.post('/analytics/rules', data);
                toast.success('Rule created successfully');
            }
            navigate('/rules');
        } catch {
            toast.error(`Failed to ${id ? 'update' : 'create'} rule`);
        }
    };

    const handleCancel = () => {
        navigate('/rules');
    };

    if (loading) {
        return (
            <div className="p-6">
                <CardSkeleton />
            </div>
        );
    }

    return (
        <div className="p-6">
            <Card>
                <CardHeader>
                    <CardTitle>
                        {id ? 'Edit Rule' : 'Create New Rule'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <RuleBuilder
                        initialData={
                            rule
                                ? {
                                      name: rule.name,
                                      description: rule.description,
                                      status: rule.status,
                                      conditions: rule.conditions,
                                      actions: rule.actions,
                                      metadata: rule.metadata,
                                  }
                                : undefined
                        }
                        onSubmit={handleSubmit}
                        onCancel={handleCancel}
                    />
                </CardContent>
            </Card>
        </div>
    );
}

export default RuleEditor;
