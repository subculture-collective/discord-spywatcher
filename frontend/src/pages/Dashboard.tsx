import { Users, AlertTriangle, Shield, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { CardSkeleton, TableSkeleton } from '../components/ui/LoadingSkeleton';
import { StatCard } from '../components/ui/StatCard';
import { ThemeToggle } from '../components/ui/ThemeToggle';
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

type BannedUser = {
    userId: string;
};

function Dashboard() {
    const [data, setData] = useState<UserEntry[]>([]);
    const [bannedUsers, setBannedUsers] = useState<Set<string>>(new Set());
    const [filterBanned, setFilterBanned] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get('/suspicion').then((res) => setData(res.data)),
            api.get('/userbans').then((res) => {
                const ids = new Set<string>(
                    res.data.map((u: BannedUser) => u.userId)
                );
                setBannedUsers(ids);
            })
        ]).finally(() => setLoading(false));
    }, []);

    const filtered = filterBanned
        ? data.filter((u) => !bannedUsers.has(u.userId))
        : data;

    // Calculate stats
    const totalUsers = data.length;
    const highSuspicionUsers = data.filter(u => u.suspicionScore > 50).length;
    const ghostUsers = data.filter(u => u.ghostScore > 5).length;
    const bannedCount = bannedUsers.size;

    return (
        <div className="min-h-screen bg-ctp-base p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-ctp-text">Dashboard</h1>
                        <p className="text-ctp-subtext0 mt-1">User behavior and suspicion monitoring</p>
                    </div>
                    <ThemeToggle />
                </div>

                {/* Stats Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <CardSkeleton />
                        <CardSkeleton />
                        <CardSkeleton />
                        <CardSkeleton />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Total Users"
                            value={totalUsers}
                            subtitle="Tracked users"
                            icon={Users}
                        />
                        <StatCard
                            title="High Suspicion"
                            value={highSuspicionUsers}
                            subtitle="Score > 50"
                            icon={AlertTriangle}
                            trend={highSuspicionUsers > 0 ? 'up' : 'down'}
                        />
                        <StatCard
                            title="Ghost Users"
                            value={ghostUsers}
                            subtitle="Ghost score > 5"
                            icon={Shield}
                        />
                        <StatCard
                            title="Banned Users"
                            value={bannedCount}
                            subtitle="Currently banned"
                            icon={Activity}
                        />
                    </div>
                )}

                {/* Users Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>User Suspicion List</CardTitle>
                            <label className="flex items-center gap-2 text-sm text-ctp-subtext0">
                                <input
                                    type="checkbox"
                                    checked={filterBanned}
                                    onChange={(e) => setFilterBanned(e.target.checked)}
                                    className="rounded border-ctp-surface1"
                                />
                                Hide banned users
                            </label>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <TableSkeleton rows={5} />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-ctp-surface0 border-b border-ctp-surface1">
                                        <tr>
                                            <th className="text-left px-4 py-3 text-sm font-semibold text-ctp-text">Username</th>
                                            <th className="text-center px-4 py-3 text-sm font-semibold text-ctp-text">Score</th>
                                            <th className="text-center px-4 py-3 text-sm font-semibold text-ctp-text">Ghost</th>
                                            <th className="text-center px-4 py-3 text-sm font-semibold text-ctp-text">Clients</th>
                                            <th className="text-center px-4 py-3 text-sm font-semibold text-ctp-text">Channels</th>
                                            <th className="text-center px-4 py-3 text-sm font-semibold text-ctp-text">Fast RT</th>
                                            <th className="text-center px-4 py-3 text-sm font-semibold text-ctp-text">Age</th>
                                            <th className="text-center px-4 py-3 text-sm font-semibold text-ctp-text">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-ctp-surface1">
                                        {filtered.map((user) => {
                                            const isBanned = bannedUsers.has(user.userId);
                                            return (
                                                <tr
                                                    key={user.userId}
                                                    className={`hover:bg-ctp-surface0 transition-colors ${
                                                        isBanned ? 'bg-ctp-red/10' : ''
                                                    }`}
                                                >
                                                    <td className="px-4 py-3 text-ctp-text">{user.username}</td>
                                                    <td className="text-center px-4 py-3 text-ctp-text font-medium">
                                                        {user.suspicionScore}
                                                    </td>
                                                    <td className="text-center px-4 py-3 text-ctp-text">
                                                        {user.ghostScore}
                                                    </td>
                                                    <td className="text-center px-4 py-3 text-ctp-text">
                                                        {user.multiClientCount}
                                                    </td>
                                                    <td className="text-center px-4 py-3 text-ctp-text">
                                                        {user.channelCount}
                                                    </td>
                                                    <td className="text-center px-4 py-3 text-ctp-text">
                                                        {user.fastReactionCount ?? 0}
                                                    </td>
                                                    <td className="text-center px-4 py-3 text-ctp-text">
                                                        {user.accountAgeDays}
                                                    </td>
                                                    <td className="text-center px-4 py-3">
                                                        {isBanned ? (
                                                            <button
                                                                className="text-sm text-ctp-blue hover:text-ctp-blue/80 underline"
                                                                onClick={() =>
                                                                    api
                                                                        .post('/userunban', {
                                                                            userId: user.userId,
                                                                        })
                                                                        .then(() => {
                                                                            setBannedUsers(
                                                                                (prev) => {
                                                                                    const copy =
                                                                                        new Set(
                                                                                            prev
                                                                                        );
                                                                                    copy.delete(
                                                                                        user.userId
                                                                                    );
                                                                                    return copy;
                                                                                }
                                                                            );
                                                                        })
                                                                }
                                                            >
                                                                Unban
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className="text-sm text-ctp-red hover:text-ctp-red/80 underline"
                                                                onClick={() =>
                                                                    api
                                                                        .post('/userban', {
                                                                            userId: user.userId,
                                                                            username: user.username,
                                                                            reason: 'Flagged via dashboard',
                                                                        })
                                                                        .then(() =>
                                                                            setBannedUsers((prev) =>
                                                                                new Set(prev).add(
                                                                                    user.userId
                                                                                )
                                                                            )
                                                                        )
                                                                }
                                                            >
                                                                Ban
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default Dashboard;
