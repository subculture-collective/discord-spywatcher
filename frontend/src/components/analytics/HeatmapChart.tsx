import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface HeatmapData {
    userId: string;
    username: string;
    channelId: string;
    channel: string;
    count: number;
}

interface HeatmapChartProps {
    data: HeatmapData[];
}

function HeatmapChart({ data }: HeatmapChartProps) {
    // Aggregate data by channel
    const channelActivity = data.reduce(
        (acc, item) => {
            if (!acc[item.channel]) {
                acc[item.channel] = 0;
            }
            acc[item.channel] += item.count;
            return acc;
        },
        {} as Record<string, number>
    );

    const chartData = Object.entries(channelActivity)
        .map(([channel, count]) => ({
            channel: channel.length > 20 ? channel.substring(0, 20) + '...' : channel,
            activity: count,
        }))
        .sort((a, b) => b.activity - a.activity)
        .slice(0, 10); // Top 10 channels

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                No data available
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#313244" />
                <XAxis
                    dataKey="channel"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    stroke="#a6adc8"
                    style={{ fontSize: '12px', fill: '#a6adc8' }}
                />
                <YAxis 
                    stroke="#a6adc8"
                    style={{ fontSize: '12px', fill: '#a6adc8' }}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#1e1e2e',
                        border: '1px solid #313244',
                        borderRadius: '8px',
                        color: '#cdd6f4',
                    }}
                />
                <Legend 
                    wrapperStyle={{ color: '#cdd6f4' }}
                />
                <Bar dataKey="activity" fill="#89b4fa" name="Activity Count" />
            </BarChart>
        </ResponsiveContainer>
    );
}

export default HeatmapChart;
