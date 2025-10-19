import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import RequireAdmin from './components/RequireAdmin';
import RequireAuth from './components/RequireAuth';
import { AuthCallback, Bans, Dashboard, Login, Suspicion } from './pages';
import { useAuth } from './store/auth';

function App() {
    const setToken = useAuth((s) => s.setToken);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) setToken(token);
    }, [setToken]);

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/auth/callback" element={<AuthCallback />} />

                <Route element={<RequireAuth />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/suspicion" element={<Suspicion />} />

                    <Route element={<RequireAdmin />}>
                        <Route path="/bans" element={<Bans />} />
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
