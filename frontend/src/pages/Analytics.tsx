import { Users, Activity, AlertTriangle, TrendingUp } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import DateRangeSelector from '../components/analytics/DateRangeSelector';
import ExportButton from '../components/analytics/ExportButton';
import HeatmapChart from '../components/analytics/HeatmapChart';
import TimelineChart from '../components/analytics/TimelineChart';
import VolumeChart from '../components/analytics/VolumeChart';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { CardSkeleton, ChartSkeleton } from '../components/ui/LoadingSkeleton';
import { StatCard } from '../components/ui/StatCard';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useAnalytics } from '../hooks/useAnalytics';
import api from '../lib/api';

interface HeatmapData {
    userId: string;
    username: string;
    channelId: string;
    channel: string;
    count: number;
}

interface GhostData {
    userId: string;
    username: string;
    typingCount: number;
    messageCount: number;
    ghostScore: number;
}

interface SuspicionData {
    userId: string;
    username: string;
    suspicionScore: number;
    ghostScore: number;
    multiClientCount: number;
    channelCount: number;
    accountAgeDays: number;
}

interface LurkerData {
    userId: string;
    username: string;
    channelCount: number;
    messageCount: number;
}

function Analytics() {
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const { trackFeatureUsage } = useAnalytics();

    // State for different data types
    const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
    const [ghostData, setGhostData] = useState<GhostData[]>([]);
    const [suspicionData, setSuspicionData] = useState<SuspicionData[]>([]);
    const [lurkerData, setLurkerData] = useState<LurkerData[]>([]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const sinceParam = dateRange?.start.toISOString();

            const [heatmapRes, ghostRes, suspicionRes, lurkerRes] = await Promise.all([
                api.get('/heatmap', { params: { since: sinceParam } }),
                api.get('/ghosts', { params: { since: sinceParam } }),
                api.get('/suspicion', { params: { since: sinceParam } }),
                api.get('/lurkers', { params: { since: sinceParam } }),
            ]);

            setHeatmapData(heatmapRes.data);
            setGhostData(ghostRes.data);
            setSuspicionData(suspicionRes.data);
            setLurkerData(lurkerRes.data);
            setLastUpdated(new Date());
            
            // Track feature usage
            trackFeatureUsage('analytics_dashboard_view');
        } catch {
            toast.error('Failed to fetch analytics data');
        } finally {
            setLoading(false);
        }
    }, [dateRange, trackFeatureUsage]);

    useEffect(() => {
        fetchData();
        // Set up auto-refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    // Calculate key metrics
    const totalUsers = new Set([
        ...heatmapData.map(d => d.userId),
        ...ghostData.map(d => d.userId),
        ...suspicionData.map(d => d.userId),
    ]).size;

    const totalActivity = heatmapData.reduce((sum, item) => sum + item.count, 0);
    const highSuspicionUsers = suspicionData.filter(d => d.suspicionScore > 50).length;
    const totalGhosts = ghostData.filter(d => d.ghostScore > 5).length;
    const activeLurkers = lurkerData.length;

    return (
        <div className="min-h-screen bg-ctp-base p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-ctp-text">
                                Analytics Dashboard
                            </h1>
                            <p className="text-sm text-ctp-subtext0 mt-1">
                                Last updated: {lastUpdated.toLocaleTimeString()}
                            </p>
                        </div>
                        <div className="flex gap-2 items-center">
                            <Button
                                onClick={fetchData}
                                disabled={loading}
                                isLoading={loading}
                                variant="primary"
                                size="md"
                            >
                                {loading ? 'Refreshing...' : 'Refresh'}
                            </Button>
                            <ExportButton
                                data={suspicionData}
                                filename="analytics_suspicion"
                            />
                            <ThemeToggle />
                        </div>
                    </div>

                    <DateRangeSelector onRangeChange={setDateRange} />
                </div>

                {loading && !heatmapData.length ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                            <CardSkeleton />
                            <CardSkeleton />
                            <CardSkeleton />
                            <CardSkeleton />
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <ChartSkeleton />
                            <ChartSkeleton />
                        </div>
                    </>
                ) : (
                    <>
                        {/* Key Metrics Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                            <StatCard
                                title="Total Users"
                                value={totalUsers}
                                subtitle="Unique users tracked"
                                icon={Users}
                            />
                            <StatCard
                                title="Total Activity"
                                value={totalActivity.toLocaleString()}
                                subtitle="Channel interactions"
                                icon={Activity}
                            />
                            <StatCard
                                title="High Suspicion"
                                value={highSuspicionUsers}
                                subtitle="Users with score > 50"
                                icon={AlertTriangle}
                                trend={highSuspicionUsers > 0 ? 'up' : 'down'}
                            />
                            <StatCard
                                title="Ghost Users"
                                value={totalGhosts}
                                subtitle="High ghost score (>5)"
                                icon={TrendingUp}
                            />
                        </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Channel Activity Heatmap */}
                        <Card hover>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Channel Activity Heatmap</CardTitle>
                                    <ExportButton
                                        data={heatmapData}
                                        filename="analytics_heatmap"
                                        label="Export"
                                    />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <HeatmapChart data={heatmapData} />
                            </CardContent>
                        </Card>

                        {/* User Activity Volume */}
                        <Card hover>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>User Activity Volume</CardTitle>
                                    <ExportButton
                                        data={ghostData}
                                        filename="analytics_volume"
                                        label="Export"
                                    />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <VolumeChart data={ghostData} />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Suspicion Timeline */}
                    <Card hover className="mb-6">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Top Suspicion Scores</CardTitle>
                                <ExportButton
                                    data={suspicionData}
                                    filename="analytics_suspicion"
                                    label="Export"
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <TimelineChart data={suspicionData} />
                        </CardContent>
                    </Card>

                    {/* Additional Metrics */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <StatCard
                            title="Active Lurkers"
                            value={activeLurkers}
                            subtitle="Users reading but not posting"
                            icon={Activity}
                        />
                        <StatCard
                            title="Avg Ghost Score"
                            value={
                                ghostData.length > 0
                                    ? (ghostData.reduce((sum, d) => sum + d.ghostScore, 0) / ghostData.length).toFixed(2)
                                    : '0'
                            }
                            subtitle="Mean ghost behavior score"
                            icon={AlertTriangle}
                        />
                        <StatCard
                            title="Avg Suspicion Score"
                            value={
                                suspicionData.length > 0
                                    ? (suspicionData.reduce((sum, d) => sum + d.suspicionScore, 0) / suspicionData.length).toFixed(2)
                                    : '0'
                            }
                            subtitle="Mean suspicion score"
                            icon={TrendingUp}
                        />
                    </div>
                </>
            )}
            </div>
        </div>
    );
}

export default Analytics;
