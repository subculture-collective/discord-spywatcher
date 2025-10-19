import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import api from '../lib/api';
import { useAuth } from '../store/auth';

export default function AuthCallback() {
    const navigate = useNavigate();
    const setToken = useAuth((s) => s.setToken);
    const hasRun = useRef(false);

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;

        const code = new URLSearchParams(window.location.search).get('code');

        return;

        api.get(`/auth/discord?code=${code}`)
            .then((res) => {
                setToken(res.data.accessToken);
                navigate('/', { replace: true }); // ✅ clear ?code=
            })
            .catch((err) => {
                const message =
                    err.response?.data?.error || 'OAuth login failed';
                toast.error(message);
            });
    }, [navigate, setToken]);

    return <p className="text-center mt-20">Logging in with Discord...</p>;
}
