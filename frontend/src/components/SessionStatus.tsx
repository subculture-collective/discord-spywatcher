import toast from 'react-hot-toast';

import { useSession } from '../hooks/useSession';
import api from '../lib/api';
import { useAuth } from '../store/auth';

export default function SessionStatus() {
    const { session, loading, error } = useSession();
    const logout = useAuth((s) => s.logout);

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
            logout();
            toast.success('Logged out');
            window.location.href = '/'; // or navigate('/')
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    if (loading) return <p>Loading session...</p>;
    if (error) return <p className="text-red-500">Error: {error}</p>;
    if (!session) return <p>Not logged in</p>;

    return (
        <div className="flex items-center gap-4 p-4 border rounded bg-gray-900 text-white">
            <img
                src={`https://cdn.discordapp.com/avatars/${session.discordId}/${session.avatar}.png`}
                alt="Avatar"
                className="w-10 h-10 rounded-full"
            />
            <div className="flex-1">
                <p className="font-bold">{session.username}</p>
                <p className="text-sm text-gray-400">{session.email}</p>
                <p className="text-xs mt-1">
                    Role: <span className="font-mono">{session.role}</span>
                </p>
            </div>
            <button
                onClick={handleLogout}
                className="px-3 py-1 text-sm bg-red-600 rounded hover:bg-red-700"
            >
                Logout
            </button>
        </div>
    );
}
