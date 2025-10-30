import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import DateRangeSelector from '../components/analytics/DateRangeSelector';
import ExportButton from '../components/analytics/ExportButton';
import HeatmapChart from '../components/analytics/HeatmapChart';
import MetricCard from '../components/analytics/MetricCard';
import TimelineChart from '../components/analytics/TimelineChart';
import VolumeChart from '../components/analytics/VolumeChart';
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
        } catch {
            toast.error('Failed to fetch analytics data');
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

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
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Analytics Dashboard
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Last updated: {lastUpdated.toLocaleTimeString()}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={fetchData}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            {loading ? 'Refreshing...' : 'Refresh'}
                        </button>
                        <ExportButton
                            data={suspicionData}
                            filename="analytics_suspicion"
                        />
                    </div>
                </div>

                <DateRangeSelector onRangeChange={setDateRange} />
            </div>

            {loading && !heatmapData.length ? (
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Loading analytics...</div>
                </div>
            ) : (
                <>
                    {/* Key Metrics Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        <MetricCard
                            title="Total Users"
                            value={totalUsers}
                            subtitle="Unique users tracked"
                        />
                        <MetricCard
                            title="Total Activity"
                            value={totalActivity.toLocaleString()}
                            subtitle="Channel interactions"
                        />
                        <MetricCard
                            title="High Suspicion"
                            value={highSuspicionUsers}
                            subtitle="Users with score > 50"
                        />
                        <MetricCard
                            title="Ghost Users"
                            value={totalGhosts}
                            subtitle="High ghost score (>5)"
                        />
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Channel Activity Heatmap */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Channel Activity Heatmap
                                </h2>
                                <ExportButton
                                    data={heatmapData}
                                    filename="analytics_heatmap"
                                    label="Export"
                                />
                            </div>
                            <HeatmapChart data={heatmapData} />
                        </div>

                        {/* User Activity Volume */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    User Activity Volume
                                </h2>
                                <ExportButton
                                    data={ghostData}
                                    filename="analytics_volume"
                                    label="Export"
                                />
                            </div>
                            <VolumeChart data={ghostData} />
                        </div>
                    </div>

                    {/* Suspicion Timeline */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Top Suspicion Scores
                            </h2>
                            <ExportButton
                                data={suspicionData}
                                filename="analytics_suspicion"
                                label="Export"
                            />
                        </div>
                        <TimelineChart data={suspicionData} />
                    </div>

                    {/* Additional Metrics */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <MetricCard
                            title="Active Lurkers"
                            value={activeLurkers}
                            subtitle="Users reading but not posting"
                        />
                        <MetricCard
                            title="Avg Ghost Score"
                            value={
                                ghostData.length > 0
                                    ? (ghostData.reduce((sum, d) => sum + d.ghostScore, 0) / ghostData.length).toFixed(2)
                                    : '0'
                            }
                            subtitle="Mean ghost behavior score"
                        />
                        <MetricCard
                            title="Avg Suspicion Score"
                            value={
                                suspicionData.length > 0
                                    ? (suspicionData.reduce((sum, d) => sum + d.suspicionScore, 0) / suspicionData.length).toFixed(2)
                                    : '0'
                            }
                            subtitle="Mean suspicion score"
                        />
                    </div>
                </>
            )}
        </div>
    );
}

export default Analytics;
