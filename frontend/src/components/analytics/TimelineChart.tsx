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
    onUserClick?: (userId: string, username: string) => void;
}

function TimelineChart({ data, onUserClick }: TimelineChartProps) {
    // Sort by suspicion score and take top 10 for clarity
    const topUsers = [...data]
        .sort((a, b) => b.suspicionScore - a.suspicionScore)
        .slice(0, 10);

    const chartData = topUsers.map((user, index) => ({
        name: user.username.length > 15 ? user.username.substring(0, 15) + '...' : user.username,
        fullName: user.username,
        userId: user.userId,
        suspicion: user.suspicionScore,
        ghost: user.ghostScore,
        rank: index + 1,
    }));
    
    const handleLineClick = (data: unknown) => {
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
            <div>
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
                            onClick={handleLineClick}
                            cursor={onUserClick ? 'pointer' : 'default'}
                        />
                        <Line
                            type="monotone"
                            dataKey="ghost"
                            stroke="#8b5cf6"
                            name="Ghost Score"
                            strokeWidth={2}
                            onClick={handleLineClick}
                            cursor={onUserClick ? 'pointer' : 'default'}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            {/* Screen reader accessible data table */}
            <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                    View suspicion data as table
                </summary>
                <div className="mt-2 overflow-x-auto">
                    <table className="min-w-full text-sm border border-gray-300 dark:border-gray-700">
                        <caption className="sr-only">User Suspicion and Ghost Score Data</caption>
                        <thead className="bg-gray-100 dark:bg-gray-800">
                            <tr>
                                <th scope="col" className="px-4 py-2 text-left">Rank</th>
                                <th scope="col" className="px-4 py-2 text-left">Username</th>
                                <th scope="col" className="px-4 py-2 text-right">Suspicion Score</th>
                                <th scope="col" className="px-4 py-2 text-right">Ghost Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {topUsers.map((user, index) => (
                                <tr key={user.userId}>
                                    <td className="px-4 py-2">{index + 1}</td>
                                    <td className="px-4 py-2">{user.username}</td>
                                    <td className="px-4 py-2 text-right">{user.suspicionScore}</td>
                                    <td className="px-4 py-2 text-right">{user.ghostScore}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </details>
        </div>
    );
}

export default TimelineChart;
