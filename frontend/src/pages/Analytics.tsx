import { Users, Activity, AlertTriangle, TrendingUp, Network, Wifi, WifiOff } from 'lucide-react';
import { useCallback, useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Link, useSearchParams } from 'react-router-dom';

import DateRangeSelector from '../components/analytics/DateRangeSelector';
import DrillDownPanel, { type DrillDownData } from '../components/analytics/DrillDownPanel';
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
import { socketService, type AnalyticsUpdateData } from '../lib/socket';
import { useAuth } from '../store/auth';

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
    const { accessToken } = useAuth();
    const [isLiveConnected, setIsLiveConnected] = useState(false);
    const [drillDownData, setDrillDownData] = useState<DrillDownData | null>(null);
    
    // Get guildId from URL params or environment - will react to URL changes
    const [searchParams] = useSearchParams();
    const guildId = searchParams.get('guildId') || import.meta.env.VITE_DISCORD_GUILD_ID;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange]);

    useEffect(() => {
        fetchData();
        
        // Set up WebSocket for real-time updates if authenticated and guildId is available
        if (!accessToken || !guildId) {
            return undefined;
        }
        
        // Define analytics update handler
        const handleAnalyticsUpdate = (data: AnalyticsUpdateData) => {
            // Update ghost data from real-time updates
            if (data.data.ghosts) {
                setGhostData(prev => {
                    const newGhosts = data.data.ghosts.map(g => ({
                        userId: g.userId,
                        username: g.username,
                        ghostScore: g.ghostScore,
                        typingCount: 0,
                        messageCount: 0,
                    }));
                    
                    // Merge with existing data
                    const merged = [...newGhosts];
                    prev.forEach(existing => {
                        if (!merged.find(g => g.userId === existing.userId)) {
                            merged.push(existing);
                        }
                    });
                    
                    return merged.slice(0, 50); // Keep top 50
                });
            }
            
            // Update lurker data from real-time updates
            if (data.data.lurkers) {
                setLurkerData(data.data.lurkers.map(l => ({
                    userId: l.userId,
                    username: l.username,
                    channelCount: l.channelCount,
                    messageCount: 0,
                })));
            }
            
            setLastUpdated(new Date(data.timestamp));
        };
        
        try {
            const socket = socketService.connect();
            
            socket.on('connect', () => {
                setIsLiveConnected(true);
            });
            
            socket.on('disconnect', () => {
                setIsLiveConnected(false);
            });
            
            socketService.subscribeToAnalytics(guildId, handleAnalyticsUpdate);
            
            // Cleanup function to unsubscribe and disconnect
            return () => {
                socketService.unsubscribeFromAnalytics(guildId, handleAnalyticsUpdate);
            };
        } catch (error) {
            console.error('Failed to connect to WebSocket:', error);
            return undefined;
        }
    }, [fetchData, accessToken, guildId]);

    // Calculate key metrics with useMemo for performance optimization
    const totalUsers = useMemo(() => new Set([
        ...heatmapData.map(d => d.userId),
        ...ghostData.map(d => d.userId),
        ...suspicionData.map(d => d.userId),
    ]).size, [heatmapData, ghostData, suspicionData]);

    const totalActivity = useMemo(() => 
        heatmapData.reduce((sum, item) => sum + item.count, 0), 
        [heatmapData]
    );
    
    const highSuspicionUsers = useMemo(() => 
        suspicionData.filter(d => d.suspicionScore > 50).length,
        [suspicionData]
    );
    
    const totalGhosts = useMemo(() => 
        ghostData.filter(d => d.ghostScore > 5).length,
        [ghostData]
    );
    
    const activeLurkers = useMemo(() => lurkerData.length, [lurkerData]);
    
    const avgGhostScore = useMemo(() => 
        ghostData.length > 0
            ? (ghostData.reduce((sum, d) => sum + d.ghostScore, 0) / ghostData.length).toFixed(2)
            : '0',
        [ghostData]
    );
    
    const avgSuspicionScore = useMemo(() => 
        suspicionData.length > 0
            ? (suspicionData.reduce((sum, d) => sum + d.suspicionScore, 0) / suspicionData.length).toFixed(2)
            : '0',
        [suspicionData]
    );
    
    // Drill-down handler
    const handleDrillDown = useCallback((type: 'user' | 'channel', id: string, name: string) => {
        // Find data for this item
        const userData = suspicionData.find(d => d.userId === id);
        const heatmapItems = heatmapData.filter(d => 
            type === 'user' ? d.userId === id : d.channelId === id
        );
        
        const details: DrillDownData['details'] = {
            suspicionScore: userData?.suspicionScore,
            ghostScore: userData?.ghostScore,
            channelCount: userData?.channelCount,
            messageCount: heatmapItems.reduce((sum, item) => sum + item.count, 0),
            interactions: heatmapItems.reduce((sum, item) => sum + item.count, 0),
        };
        
        setDrillDownData({ type, id, name, details });
        trackFeatureUsage('analytics_drilldown');
    }, [suspicionData, heatmapData, trackFeatureUsage]);

    return (
        <div className="min-h-screen bg-ctp-base p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-ctp-text">
                                Analytics Dashboard
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-sm text-ctp-subtext0">
                                    Last updated: {lastUpdated.toLocaleTimeString()}
                                </p>
                                {isLiveConnected ? (
                                    <span className="flex items-center gap-1 text-xs text-ctp-green">
                                        <Wifi className="w-3 h-3" />
                                        Live
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-xs text-ctp-subtext0">
                                        <WifiOff className="w-3 h-3" />
                                        Polling
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2 items-center">
                            <Link to="/advanced-analytics">
                                <Button variant="secondary" size="md">
                                    <Network className="w-4 h-4 mr-2" />
                                    Advanced Charts
                                </Button>
                            </Link>
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
                                <HeatmapChart 
                                    data={heatmapData}
                                    onChannelClick={(channelId, channelName) => 
                                        handleDrillDown('channel', channelId, channelName)
                                    }
                                />
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
                                <VolumeChart 
                                    data={ghostData}
                                    onUserClick={(userId, username) => 
                                        handleDrillDown('user', userId, username)
                                    }
                                />
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
                            <TimelineChart 
                                data={suspicionData}
                                onUserClick={(userId, username) => 
                                    handleDrillDown('user', userId, username)
                                }
                            />
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
                            value={avgGhostScore}
                            subtitle="Mean ghost behavior score"
                            icon={AlertTriangle}
                        />
                        <StatCard
                            title="Avg Suspicion Score"
                            value={avgSuspicionScore}
                            subtitle="Mean suspicion score"
                            icon={TrendingUp}
                        />
                    </div>
                </>
            )}
            
            {/* Drill-down Panel */}
            <DrillDownPanel
                data={drillDownData}
                onClose={() => setDrillDownData(null)}
            />
            </div>
        </div>
    );
}

export default Analytics;
