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
    onUserClick?: (userId: string, username: string) => void;
}

function VolumeChart({ data, onUserClick }: VolumeChartProps) {
    // Aggregate total typing and message counts
    const totalTyping = data.reduce((sum, item) => sum + item.typingCount, 0);
    const totalMessages = data.reduce((sum, item) => sum + item.messageCount, 0);

    // Top users by activity
    const topUsers = [...data]
        .sort((a, b) => (b.typingCount + b.messageCount) - (a.typingCount + a.messageCount))
        .slice(0, 10);

    const chartData = topUsers.map((user) => ({
        name: user.username.length > 15 ? user.username.substring(0, 15) + '...' : user.username,
        fullName: user.username,
        userId: user.userId,
        typing: user.typingCount,
        messages: user.messageCount,
    }));
    
    const handleAreaClick = (data: unknown) => {
        if (onUserClick && data && typeof data === 'object' && 'userId' in data && 'fullName' in data) {
            const entry = data as { userId: string; fullName: string };
            onUserClick(entry.userId, entry.fullName);
        }
    };

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
            <div role="region" aria-label={`Volume chart showing top ${topUsers.length} users by activity. Total typing events: ${totalTyping}, Total messages: ${totalMessages}`}>
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
                            onClick={handleAreaClick}
                            cursor={onUserClick ? 'pointer' : 'default'}
                        />
                        <Area
                            type="monotone"
                            dataKey="messages"
                            stackId="1"
                            stroke="#10b981"
                            fill="#34d399"
                            name="Messages"
                            onClick={handleAreaClick}
                            cursor={onUserClick ? 'pointer' : 'default'}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            {/* Screen reader accessible data table */}
            <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                    View volume data as table
                </summary>
                <div className="mt-2 overflow-x-auto">
                    <table className="min-w-full text-sm border border-gray-300 dark:border-gray-700">
                        <caption className="sr-only">User Activity Volume Data</caption>
                        <thead className="bg-gray-100 dark:bg-gray-800">
                            <tr>
                                <th scope="col" className="px-4 py-2 text-left">Username</th>
                                <th scope="col" className="px-4 py-2 text-right">Typing Events</th>
                                <th scope="col" className="px-4 py-2 text-right">Messages</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {topUsers.map((user) => (
                                <tr key={user.userId}>
                                    <td className="px-4 py-2">{user.username}</td>
                                    <td className="px-4 py-2 text-right">{user.typingCount}</td>
                                    <td className="px-4 py-2 text-right">{user.messageCount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </details>
        </div>
    );
}

export default VolumeChart;
