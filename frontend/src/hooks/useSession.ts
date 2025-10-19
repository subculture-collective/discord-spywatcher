import { useEffect, useState } from 'react';

import api from '../lib/api';

type Guild = {
    id: string;
    name: string;
    icon?: string;
    owner?: boolean;
    permissions?: string;
};

type Session = {
    discordId: string;
    username: string;
    avatar?: string;
    email?: string;
    locale?: string;
    verified?: boolean;
    role: 'ADMIN' | 'USER' | 'MODERATOR' | 'BANNED';
    guilds?: Guild[];
};

export function useSession() {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.get('/auth/me')
            .then((res) => {
                setSession(res.data);
            })
            .catch((err) => {
                setError(
                    err.response?.data?.error || 'Failed to fetch session'
                );
                setSession(null);
            })
            .finally(() => setLoading(false));
    }, []);

    return { session, loading, error };
}
