/**
 * React Hook for Analytics Tracking
 */

import { useEffect, useState, useCallback } from 'react';
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
    const [hasConsent, setHasConsent] = useState(hasAnalyticsConsent());
    const [consentStatus, setConsentStatus] = useState(getAnalyticsConsentStatus());

    const grantConsent = useCallback(() => {
        setAnalyticsConsent(true);
        setHasConsent(true);
        setConsentStatus('granted');
    }, []);

    const denyConsent = useCallback(() => {
        setAnalyticsConsent(false);
        setHasConsent(false);
        setConsentStatus('denied');
    }, []);

    return {
        trackPageView,
        trackButtonClick,
        trackFeatureUsage,
        trackFormSubmit,
        trackError,
        trackSearch,
        trackExport,
        hasConsent,
        consentStatus,
        grantConsent,
        denyConsent,
    };
}
