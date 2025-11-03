import { Users, AlertTriangle, Shield, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { CardSkeleton, TableSkeleton } from '../components/ui/LoadingSkeleton';
import { LanguageSwitcher } from '../components/ui/LanguageSwitcher';
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
    const { t } = useTranslation();
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
                <header className="flex items-center justify-between">
                    <div>
                        <h1 id="main-content" className="text-3xl font-bold text-ctp-text">{t('dashboard.title')}</h1>
                        <p className="text-ctp-subtext0 mt-1">{t('dashboard.subtitle')}</p>
                    </div>
                    <div className="flex gap-2">
                        <LanguageSwitcher />
                        <ThemeToggle />
                    </div>
                </header>

                {/* Stats Grid */}
                <section aria-labelledby="stats-heading">
                    <h2 id="stats-heading" className="sr-only">Statistics Overview</h2>
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
                                title={t('dashboard.stats.totalUsers')}
                                value={totalUsers}
                                subtitle={t('dashboard.stats.trackedUsers')}
                                icon={Users}
                            />
                            <StatCard
                                title={t('dashboard.stats.highSuspicion')}
                                value={highSuspicionUsers}
                                subtitle={t('dashboard.stats.scoreThreshold', { threshold: 50 })}
                                icon={AlertTriangle}
                                trend={highSuspicionUsers > 0 ? 'up' : 'down'}
                            />
                            <StatCard
                                title={t('dashboard.stats.ghostUsers')}
                                value={ghostUsers}
                                subtitle={t('dashboard.stats.ghostScoreThreshold', { threshold: 5 })}
                                icon={Shield}
                            />
                            <StatCard
                                title={t('dashboard.stats.bannedUsers')}
                                value={bannedCount}
                                subtitle={t('dashboard.stats.currentlyBanned')}
                                icon={Activity}
                            />
                        </div>
                    )}
                </section>

                {/* Users Table */}
                <section aria-labelledby="users-heading">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle id="users-heading">{t('dashboard.userSuspicionList')}</CardTitle>
                                <div>
                                    <label htmlFor="filter-banned" className="flex items-center gap-2 text-sm text-ctp-subtext0">
                                        <input
                                            id="filter-banned"
                                            type="checkbox"
                                            checked={filterBanned}
                                            onChange={(e) => setFilterBanned(e.target.checked)}
                                            className="rounded border-ctp-surface1"
                                            aria-describedby="filter-help"
                                        />
                                        {t('dashboard.filters.hideBanned')}
                                    </label>
                                    <span id="filter-help" className="sr-only">{t('dashboard.filters.hideBannedHelp')}</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <TableSkeleton rows={5} />
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full" aria-labelledby="users-heading">
                                        <caption className="sr-only">User suspicion scores and actions</caption>
                                        <thead className="bg-ctp-surface0 border-b border-ctp-surface1">
                                            <tr>
                                                <th scope="col" className="text-left px-4 py-3 text-sm font-semibold text-ctp-text">{t('dashboard.table.user')}</th>
                                                <th scope="col" className="text-center px-4 py-3 text-sm font-semibold text-ctp-text">{t('dashboard.table.suspicionScore')}</th>
                                                <th scope="col" className="text-center px-4 py-3 text-sm font-semibold text-ctp-text">{t('dashboard.table.ghostScore')}</th>
                                                <th scope="col" className="text-center px-4 py-3 text-sm font-semibold text-ctp-text">{t('dashboard.table.clients')}</th>
                                                <th scope="col" className="text-center px-4 py-3 text-sm font-semibold text-ctp-text">{t('dashboard.table.channels')}</th>
                                                <th scope="col" className="text-center px-4 py-3 text-sm font-semibold text-ctp-text"><abbr title={t('dashboard.table.fastReactions')}>{t('dashboard.table.fastReactionsAbbr')}</abbr></th>
                                                <th scope="col" className="text-center px-4 py-3 text-sm font-semibold text-ctp-text"><abbr title={t('dashboard.table.accountAge')}>{t('dashboard.table.accountAgeAbbr')}</abbr></th>
                                                <th scope="col" className="text-center px-4 py-3 text-sm font-semibold text-ctp-text">{t('common.actions')}</th>
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
                                                                className="text-sm text-ctp-blue hover:text-ctp-blue/80 underline focus:outline-none focus:ring-2 focus:ring-ctp-blue rounded"
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
                                                                aria-label={`${t('bans.unbanUser')} ${user.username}`}
                                                            >
                                                                {t('bans.unbanUser')}
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className="text-sm text-ctp-red hover:text-ctp-red/80 underline focus:outline-none focus:ring-2 focus:ring-ctp-red rounded"
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
                                                                aria-label={`${t('bans.banUser')} ${user.username}`}
                                                            >
                                                                {t('bans.banUser')}
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
                </section>
            </div>
        </div>
    );
}

export default Dashboard;
