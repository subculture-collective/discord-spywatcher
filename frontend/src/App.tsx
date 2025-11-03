import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import AnalyticsConsentBanner from './components/AnalyticsConsentBanner';
import RequireAdmin from './components/RequireAdmin';
import RequireAuth from './components/RequireAuth';
import SuspicionDetail from './components/suspicion/SuspicionDetail';
import { usePageTracking } from './hooks/useAnalytics';
import { useRTL } from './hooks/useRTL';
import { Analytics, AdvancedAnalytics, AuthCallback, Bans, Dashboard, Login, Status, Suspicion, UserTimeline } from './pages';
import MetricsDashboard from './pages/MetricsDashboard';
import RuleEditor from './pages/RuleEditor';
import Rules from './pages/Rules';
import { useAuth } from './store/auth';

function AppContent() {
    const { t } = useTranslation();
    usePageTracking();
    useRTL();

    return (
        <>
            {/* Skip to main content link for keyboard navigation */}
            <a
                href="#main-content"
                className="sr-only sr-only-focusable fixed top-4 left-4 z-50 bg-ctp-blue text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-ctp-blue focus:ring-offset-2"
            >
                {t('navigation.skipToContent')}
            </a>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/status" element={<Status />} />

                <Route element={<RequireAuth />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/advanced-analytics" element={<AdvancedAnalytics />} />
                    <Route path="/metrics" element={<MetricsDashboard />} />
                    <Route path="/rules" element={<Rules />} />
                    <Route path="/rules/new" element={<RuleEditor />} />
                    <Route path="/rules/:id/edit" element={<RuleEditor />} />
                    <Route path="/suspicion" element={<Suspicion />} />
                    <Route path="/suspicion/:userId" element={<SuspicionDetail />} />
                    <Route path="/timeline/:userId" element={<UserTimeline />} />

                    <Route element={<RequireAdmin />}>
                        <Route path="/bans" element={<Bans />} />
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            <AnalyticsConsentBanner />
        </>
    );
}

function App() {
    const setToken = useAuth((s) => s.setToken);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) setToken(token);
    }, [setToken]);

    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    );
}

export default App;
