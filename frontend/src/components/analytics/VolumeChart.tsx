import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

interface VolumeData {
    userId: string;
    username: string;
    typingCount: number;
    messageCount: number;
}

interface VolumeChartProps {
    data: VolumeData[];
}

function VolumeChart({ data }: VolumeChartProps) {
    // Aggregate total typing and message counts
    const totalTyping = data.reduce((sum, item) => sum + item.typingCount, 0);
    const totalMessages = data.reduce((sum, item) => sum + item.messageCount, 0);

    // Top users by activity
    const topUsers = [...data]
        .sort((a, b) => (b.typingCount + b.messageCount) - (a.typingCount + a.messageCount))
        .slice(0, 10);

    const chartData = topUsers.map((user) => ({
        name: user.username.length > 15 ? user.username.substring(0, 15) + '...' : user.username,
        typing: user.typingCount,
        messages: user.messageCount,
    }));

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                No data available
            </div>
        );
    }

    return (
        <div>
            <div className="mb-4 flex gap-4 text-sm" role="status" aria-live="polite">
                <div>
                    <span className="text-gray-600 dark:text-gray-400">Total Typing Events: </span>
                    <span className="font-semibold">{totalTyping.toLocaleString()}</span>
                </div>
                <div>
                    <span className="text-gray-600 dark:text-gray-400">Total Messages: </span>
                    <span className="font-semibold">{totalMessages.toLocaleString()}</span>
                </div>
            </div>
            <div role="img" aria-label={`Volume chart showing top ${topUsers.length} users by activity. Total typing events: ${totalTyping}, Total messages: ${totalMessages}`}>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Area
                            type="monotone"
                            dataKey="typing"
                            stackId="1"
                            stroke="#f59e0b"
                            fill="#fbbf24"
                            name="Typing Events"
                        />
                        <Area
                            type="monotone"
                            dataKey="messages"
                            stackId="1"
                            stroke="#10b981"
                            fill="#34d399"
                            name="Messages"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            {/* Screen reader accessible data table */}
            <details className="sr-only">
                <summary>View volume data as table</summary>
                <table>
                    <caption>User Activity Volume Data</caption>
                    <thead>
                        <tr>
                            <th scope="col">Username</th>
                            <th scope="col">Typing Events</th>
                            <th scope="col">Messages</th>
                        </tr>
                    </thead>
                    <tbody>
                        {topUsers.map((user) => (
                            <tr key={user.userId}>
                                <td>{user.username}</td>
                                <td>{user.typingCount}</td>
                                <td>{user.messageCount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </details>
        </div>
    );
}

export default VolumeChart;
