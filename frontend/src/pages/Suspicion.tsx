import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import api from '../lib/api';

type UserEntry = {
    userId: string;
    username: string;
    suspicionScore: number;
    ghostScore: number;
    multiClientCount: number;
    channelCount: number;
    accountAgeDays: number;
    avgReactionTime?: number;
    fastReactionCount?: number;
};

function Suspicion() {
    const [data, setData] = useState<UserEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/suspicion')
            .then((res) => {
                setData(res.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Error fetching suspicion data:', err);
                setLoading(false);
            });
    }, []);

    const getScoreColor = (score: number) => {
        if (score > 75) return 'text-red-600 font-bold';
        if (score > 50) return 'text-yellow-600 font-semibold';
        return 'text-green-600';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading suspicion data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Suspicion Analysis</h1>

            <div className="mb-4 flex items-center justify-end">
                <p className="text-gray-600">
                    {data.length} users monitored
                </p>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Username
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Suspicion Score
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Ghost Score
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Multi-Client
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Channels
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Account Age
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-6 py-8 text-center text-gray-500"
                                >
                                    No suspicious users detected
                                </td>
                            </tr>
                        ) : (
                            data.map((user) => (
                                <tr
                                    key={user.userId}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {user.username}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {user.userId.substring(0, 8)}...
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span
                                            className={`text-lg ${getScoreColor(user.suspicionScore)}`}
                                        >
                                            {Math.round(user.suspicionScore)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                                        {Math.round(user.ghostScore)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                                        {user.multiClientCount}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                                        {user.channelCount}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                                        {user.accountAgeDays} days
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <Link
                                            to={`/suspicion/${user.userId}`}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                        >
                                            View Details →
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Suspicion;
