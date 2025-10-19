import { Navigate, Outlet } from 'react-router-dom';

import { useSession } from '../hooks/useSession';

export default function RequireAuth() {
    const { session, loading } = useSession();

    if (loading) return null; // or <LoadingScreen />
    return session ? <Outlet /> : <Navigate to="/login" replace />;
}
