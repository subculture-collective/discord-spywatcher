import { Network, GitBranch, Share2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

import ChartExport from '../components/analytics/ChartExport';
import ChordDiagram from '../components/analytics/ChordDiagram';
import DateRangeSelector from '../components/analytics/DateRangeSelector';
import InteractiveFilter from '../components/analytics/InteractiveFilter';
import type { FilterConfig } from '../components/analytics/InteractiveFilter';
import NetworkGraph from '../components/analytics/NetworkGraph';
import SankeyDiagram from '../components/analytics/SankeyDiagram';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useAnalytics } from '../hooks/useAnalytics';
import api from '../lib/api';

interface AnalyticsData {
    userId: string;
    username: string;
    channelId?: string;
    channel?: string;
    count?: number;
    suspicionScore?: number;
    ghostScore?: number;
    interactions?: number;
}

function AdvancedAnalytics() {
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);
    const [data, setData] = useState<AnalyticsData[]>([]);
    const [filteredData, setFilteredData] = useState<AnalyticsData[]>([]);
    const [filters, setFilters] = useState<FilterConfig>({
        suspicionMin: 0,
        suspicionMax: 100,
        ghostMin: 0,
        ghostMax: 100,
        channelSearch: '',
        userSearch: '',
        minInteractions: 0,
    });
    const [activeView, setActiveView] = useState<'network' | 'sankey' | 'chord'>('network');
    const { trackFeatureUsage } = useAnalytics();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const sinceParam = dateRange?.start.toISOString();

            const [heatmapRes, suspicionRes] = await Promise.all([
                api.get('/heatmap', { params: { since: sinceParam } }),
                api.get('/suspicion', { params: { since: sinceParam } }),
            ]);

            // Combine data
            const combinedData: AnalyticsData[] = [];
            const dataMap = new Map<string, AnalyticsData>();

            // Process heatmap data
            heatmapRes.data.forEach((item: unknown) => {
                const heatmapItem = item as {
                    userId: string;
                    username: string;
                    channelId: string;
                    channel: string;
                    count: number;
                };
                const key = `${heatmapItem.userId}-${heatmapItem.channelId}`;
                dataMap.set(key, {
                    userId: heatmapItem.userId,
                    username: heatmapItem.username,
                    channelId: heatmapItem.channelId,
                    channel: heatmapItem.channel,
                    count: heatmapItem.count,
                    interactions: heatmapItem.count,
                });
            });

            // Merge suspicion data
            suspicionRes.data.forEach((item: unknown) => {
                const suspicionItem = item as {
                    userId: string;
                    suspicionScore: number;
                    ghostScore: number;
                };
                dataMap.forEach((existing, key) => {
                    if (existing.userId === suspicionItem.userId) {
                        dataMap.set(key, {
                            ...existing,
                            suspicionScore: suspicionItem.suspicionScore,
                            ghostScore: suspicionItem.ghostScore,
                        });
                    }
                });
            });

            dataMap.forEach(value => combinedData.push(value));
            setData(combinedData);
            setFilteredData(combinedData);
            
            trackFeatureUsage('advanced_analytics_view');
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to fetch analytics data');
        } finally {
            setLoading(false);
        }
    }, [dateRange, trackFeatureUsage]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Apply filters
    useEffect(() => {
        let filtered = [...data];

        // Suspicion score filter
        filtered = filtered.filter(
            (item) =>
                (item.suspicionScore || 0) >= filters.suspicionMin &&
                (item.suspicionScore || 0) <= filters.suspicionMax
        );

        // Ghost score filter
        filtered = filtered.filter(
            (item) =>
                (item.ghostScore || 0) >= filters.ghostMin &&
                (item.ghostScore || 0) <= filters.ghostMax
        );

        // Minimum interactions filter
        filtered = filtered.filter(
            (item) => (item.interactions || 0) >= filters.minInteractions
        );

        // User search filter
        if (filters.userSearch) {
            filtered = filtered.filter((item) =>
                item.username.toLowerCase().includes(filters.userSearch.toLowerCase())
            );
        }

        // Channel search filter
        if (filters.channelSearch) {
            filtered = filtered.filter(
                (item) =>
                    item.channel &&
                    item.channel.toLowerCase().includes(filters.channelSearch.toLowerCase())
            );
        }

        setFilteredData(filtered);
    }, [data, filters]);

    return (
        <div className="min-h-screen bg-ctp-base p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-ctp-text">
                                Advanced Analytics
                            </h1>
                            <p className="text-sm text-ctp-subtext0 mt-1">
                                Interactive visualizations and deep insights
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
                                {loading ? 'Loading...' : 'Refresh'}
                            </Button>
                            <InteractiveFilter onFilterChange={setFilters} />
                            <ThemeToggle />
                        </div>
                    </div>

                    <DateRangeSelector onRangeChange={setDateRange} />

                    {/* View Toggle */}
                    <div className="flex gap-2 mt-4">
                        <Button
                            onClick={() => setActiveView('network')}
                            variant={activeView === 'network' ? 'primary' : 'secondary'}
                            size="sm"
                        >
                            <Network className="w-4 h-4 mr-2" />
                            Network Graph
                        </Button>
                        <Button
                            onClick={() => setActiveView('sankey')}
                            variant={activeView === 'sankey' ? 'primary' : 'secondary'}
                            size="sm"
                        >
                            <GitBranch className="w-4 h-4 mr-2" />
                            Sankey Flow
                        </Button>
                        <Button
                            onClick={() => setActiveView('chord')}
                            variant={activeView === 'chord' ? 'primary' : 'secondary'}
                            size="sm"
                        >
                            <Share2 className="w-4 h-4 mr-2" />
                            Chord Diagram
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm text-ctp-subtext0">Total Users</p>
                                <p className="text-3xl font-bold text-ctp-text mt-2">
                                    {new Set(filteredData.map((d) => d.userId)).size}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm text-ctp-subtext0">Total Channels</p>
                                <p className="text-3xl font-bold text-ctp-text mt-2">
                                    {new Set(filteredData.map((d) => d.channelId).filter(Boolean)).size}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm text-ctp-subtext0">Interactions</p>
                                <p className="text-3xl font-bold text-ctp-text mt-2">
                                    {filteredData.reduce((sum, item) => sum + (item.interactions || 0), 0)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm text-ctp-subtext0">Filters Active</p>
                                <p className="text-3xl font-bold text-ctp-text mt-2">
                                    {Object.values(filters).filter((v) => v !== 0 && v !== 100 && v !== '').length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Visualization */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>
                                {activeView === 'network' && 'Network Relationship Graph'}
                                {activeView === 'sankey' && 'Sankey Flow Diagram'}
                                {activeView === 'chord' && 'Chord Interaction Diagram'}
                            </CardTitle>
                            <ChartExport
                                elementId="visualization-container"
                                filename={`${activeView}-diagram`}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center h-96">
                                <p className="text-ctp-subtext0">Loading visualization...</p>
                            </div>
                        ) : (
                            <div id="visualization-container">
                                {activeView === 'network' && (
                                    <NetworkGraph data={filteredData} height={500} />
                                )}
                                {activeView === 'sankey' && (
                                    <SankeyDiagram data={filteredData} width={800} height={500} />
                                )}
                                {activeView === 'chord' && (
                                    <ChordDiagram data={filteredData} width={600} height={600} />
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Help Text */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-sm text-ctp-subtext0 space-y-2">
                            <p>
                                <strong className="text-ctp-text">Network Graph:</strong> Shows relationships
                                between users and channels. Node size represents activity level.
                            </p>
                            <p>
                                <strong className="text-ctp-text">Sankey Flow:</strong> Visualizes the flow
                                of interactions from users to channels.
                            </p>
                            <p>
                                <strong className="text-ctp-text">Chord Diagram:</strong> Displays
                                interaction patterns between all entities in a circular layout.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default AdvancedAnalytics;
