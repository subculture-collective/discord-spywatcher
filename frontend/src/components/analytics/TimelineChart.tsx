import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface TimelineData {
    userId: string;
    username: string;
    suspicionScore: number;
    ghostScore: number;
}

interface TimelineChartProps {
    data: TimelineData[];
}

function TimelineChart({ data }: TimelineChartProps) {
    // Sort by suspicion score and take top 10 for clarity
    const topUsers = [...data]
        .sort((a, b) => b.suspicionScore - a.suspicionScore)
        .slice(0, 10);

    const chartData = topUsers.map((user, index) => ({
        name: user.username.length > 15 ? user.username.substring(0, 15) + '...' : user.username,
        suspicion: user.suspicionScore,
        ghost: user.ghostScore,
        rank: index + 1,
    }));

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                No data available
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                    type="monotone"
                    dataKey="suspicion"
                    stroke="#ef4444"
                    name="Suspicion Score"
                    strokeWidth={2}
                />
                <Line
                    type="monotone"
                    dataKey="ghost"
                    stroke="#8b5cf6"
                    name="Ghost Score"
                    strokeWidth={2}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}

export default TimelineChart;
