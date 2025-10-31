/**
 * Metrics & Analytics Dashboard Page
 * Displays comprehensive usage metrics and insights
 */

import { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, Users, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import { getDashboardData } from '../lib/analytics';

interface DashboardData {
    activity: {
        totalEvents: number;
        uniqueUsers: number;
        consentedUsers: number;
        topEvents: Array<{ eventName: string; count: number }>;
    };
    features: Array<{
        featureName: string;
        totalUsage: number;
        uniqueUsers: number;
    }>;
    performance: {
        average: number;
        min: number;
        max: number;
        count: number;
    };
    summary: Array<{
        summaryDate: Date;
        metric: string;
        value: number;
    }>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function MetricsDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getDashboardData();
            setData(response.data);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Failed to load analytics data');
            toast.error('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-400">{error || 'No data available'}</p>
                    <button
                        onClick={fetchDashboardData}
                        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Metrics & Analytics Dashboard
                    </h1>
                    <p className="text-gray-400">
                        Usage insights and performance metrics for the last 7 days
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-gray-400 text-sm font-medium">Total Events</h3>
                            <Activity className="w-5 h-5 text-blue-500" />
                        </div>
                        <p className="text-3xl font-bold text-white">
                            {data.activity.totalEvents.toLocaleString()}
                        </p>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-gray-400 text-sm font-medium">Unique Users</h3>
                            <Users className="w-5 h-5 text-green-500" />
                        </div>
                        <p className="text-3xl font-bold text-white">
                            {data.activity.uniqueUsers.toLocaleString()}
                        </p>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-gray-400 text-sm font-medium">Consented Users</h3>
                            <TrendingUp className="w-5 h-5 text-purple-500" />
                        </div>
                        <p className="text-3xl font-bold text-white">
                            {data.activity.consentedUsers.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            {data.activity.uniqueUsers > 0 
                                ? `${((data.activity.consentedUsers / data.activity.uniqueUsers) * 100).toFixed(1)}% consent rate`
                                : 'No users yet'}
                        </p>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-gray-400 text-sm font-medium">Avg Response Time</h3>
                            <Clock className="w-5 h-5 text-yellow-500" />
                        </div>
                        <p className="text-3xl font-bold text-white">
                            {data.performance.average.toFixed(0)}ms
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            Min: {data.performance.min.toFixed(0)}ms | Max: {data.performance.max.toFixed(0)}ms
                        </p>
                    </div>
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Top Events Bar Chart */}
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <h3 className="text-lg font-semibold text-white mb-4">Top Events</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.activity.topEvents.slice(0, 8)}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis 
                                    dataKey="eventName" 
                                    stroke="#9ca3af"
                                    angle={-45}
                                    textAnchor="end"
                                    height={100}
                                />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                                    labelStyle={{ color: '#f3f4f6' }}
                                />
                                <Bar dataKey="count" fill="#3b82f6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Feature Usage Pie Chart */}
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <h3 className="text-lg font-semibold text-white mb-4">Feature Usage</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={data.features.slice(0, 6)}
                                    dataKey="totalUsage"
                                    nameKey="featureName"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label
                                >
                                    {data.features.slice(0, 6).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                                    labelStyle={{ color: '#f3f4f6' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Feature Usage Table */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Feature Details</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-700">
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Feature</th>
                                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Total Usage</th>
                                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Unique Users</th>
                                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Avg per User</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.features.map((feature, index) => (
                                    <tr key={index} className="border-b border-gray-700 hover:bg-gray-750 transition-colors">
                                        <td className="py-3 px-4 text-white">{feature.featureName}</td>
                                        <td className="py-3 px-4 text-right text-white">
                                            {feature.totalUsage.toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 text-right text-white">
                                            {feature.uniqueUsers.toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 text-right text-gray-400">
                                            {feature.uniqueUsers > 0 
                                                ? (feature.totalUsage / feature.uniqueUsers).toFixed(1)
                                                : '0.0'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
