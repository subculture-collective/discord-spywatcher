/**
 * React Hook for Analytics Tracking
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import {
    trackPageView,
    trackButtonClick,
    trackFeatureUsage,
    trackFormSubmit,
    trackError,
    trackSearch,
    trackExport,
    hasAnalyticsConsent,
    setAnalyticsConsent,
    getAnalyticsConsentStatus,
} from '../lib/analytics';

/**
 * Hook to track page views automatically
 */
export function usePageTracking(): void {
    const location = useLocation();

    useEffect(() => {
        trackPageView(location.pathname);
    }, [location.pathname]);
}

/**
 * Hook to provide analytics tracking functions
 */
export function useAnalytics() {
    return {
        trackPageView,
        trackButtonClick,
        trackFeatureUsage,
        trackFormSubmit,
        trackError,
        trackSearch,
        trackExport,
        hasConsent: hasAnalyticsConsent(),
        consentStatus: getAnalyticsConsentStatus(),
        grantConsent: () => setAnalyticsConsent(true),
        denyConsent: () => setAnalyticsConsent(false),
    };
}
