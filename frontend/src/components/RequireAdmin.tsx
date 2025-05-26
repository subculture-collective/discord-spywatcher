import toast from 'react-hot-toast';
import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from '../hooks/useSession';

export default function RequireAdmin() {
    const { session, loading } = useSession();

    if (loading) return <p>Loading...</p>;
    if (!session || session.role !== 'ADMIN') {
        toast.error('You do not have permission to view this page');
        return (
            <Navigate
                to='/'
                replace
            />
        );
    }
    return <Outlet />;
}
