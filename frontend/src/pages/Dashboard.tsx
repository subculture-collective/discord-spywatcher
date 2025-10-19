import { useEffect, useState } from 'react';

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

    useEffect(() => {
        api.get('/suspicion').then((res) => setData(res.data));
        api.get('/userbans').then((res) => {
            const ids = new Set<string>(
                res.data.map((u: BannedUser) => u.userId)
            );
            setBannedUsers(ids);
        });
    }, []);

    const filtered = filterBanned
        ? data.filter((u) => !bannedUsers.has(u.userId))
        : data;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Suspicion Dashboard</h1>
            <label className="flex items-center gap-2 mb-4">
                <input
                    type="checkbox"
                    checked={filterBanned}
                    onChange={(e) => setFilterBanned(e.target.checked)}
                />
                Hide banned users
            </label>

            <table className="min-w-full border">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="text-left px-2 py-1">Username</th>
                        <th>Score</th>
                        <th>Ghost</th>
                        <th>Clients</th>
                        <th>Channels</th>
                        <th>Fast RT</th>
                        <th>Age</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map((user) => {
                        const isBanned = bannedUsers.has(user.userId);
                        return (
                            <tr
                                key={user.userId}
                                className={
                                    isBanned ? 'bg-red-100 text-red-900' : ''
                                }
                            >
                                <td className="px-2 py-1">{user.username}</td>
                                <td className="text-center">
                                    {user.suspicionScore}
                                </td>
                                <td className="text-center">
                                    {user.ghostScore}
                                </td>
                                <td className="text-center">
                                    {user.multiClientCount}
                                </td>
                                <td className="text-center">
                                    {user.channelCount}
                                </td>
                                <td className="text-center">
                                    {user.fastReactionCount ?? 0}
                                </td>
                                <td className="text-center">
                                    {user.accountAgeDays}
                                </td>
                                <td className="text-center">
                                    {isBanned ? (
                                        <button
                                            className="text-sm text-blue-700 underline"
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
                                            className="text-sm text-red-700 underline"
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
    );
}

export default Dashboard;
