/**
 * Analytics Service for Frontend
 * Tracks user events and metrics with GDPR compliance
 */

import api from './api';

export enum AnalyticsEventType {
    PAGE_VIEW = 'PAGE_VIEW',
    BUTTON_CLICK = 'BUTTON_CLICK',
    FEATURE_USED = 'FEATURE_USED',
    FORM_SUBMIT = 'FORM_SUBMIT',
    ERROR = 'ERROR',
    SEARCH = 'SEARCH',
    EXPORT = 'EXPORT',
}

interface TrackEventOptions {
    eventType: AnalyticsEventType;
    eventName: string;
    properties?: Record<string, unknown>;
    pathname?: string;
    referrer?: string;
}

/**
 * Check if analytics consent has been given
 */
export function hasAnalyticsConsent(): boolean {
    const consent = localStorage.getItem('analyticsConsent');
    return consent === 'true';
}

/**
 * Set analytics consent
 */
export function setAnalyticsConsent(granted: boolean): void {
    localStorage.setItem('analyticsConsent', granted ? 'true' : 'false');
    
    // Set cookie for backend
    document.cookie = `analyticsConsent=${granted}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
}

/**
 * Get analytics consent status
 */
export function getAnalyticsConsentStatus(): 'granted' | 'denied' | 'pending' {
    const consent = localStorage.getItem('analyticsConsent');
    if (consent === null) return 'pending';
    return consent === 'true' ? 'granted' : 'denied';
}

/**
 * Track an analytics event
 */
export async function trackEvent(options: TrackEventOptions): Promise<void> {
    // Only track if consent is given or VITE_ENABLE_ANALYTICS is true
    const enableAnalytics = import.meta.env.VITE_ENABLE_ANALYTICS === 'true';
    const hasConsent = hasAnalyticsConsent();

    if (!enableAnalytics && !hasConsent) {
        return;
    }

    try {
        await api.post('/metrics/event', {
            eventType: options.eventType,
            eventName: options.eventName,
            properties: options.properties || {},
            pathname: options.pathname || window.location.pathname,
            referrer: options.referrer || document.referrer,
        });
    } catch (error) {
        // Silently fail - analytics should never break the app
        console.debug('Analytics tracking failed:', error);
    }
}

/**
 * Track a page view
 */
export function trackPageView(pathname?: string): void {
    trackEvent({
        eventType: AnalyticsEventType.PAGE_VIEW,
        eventName: 'page_view',
        pathname: pathname || window.location.pathname,
    });
}

/**
 * Track a button click
 */
export function trackButtonClick(buttonName: string, properties?: Record<string, unknown>): void {
    trackEvent({
        eventType: AnalyticsEventType.BUTTON_CLICK,
        eventName: `button_click_${buttonName}`,
        properties,
    });
}

/**
 * Track feature usage
 */
export function trackFeatureUsage(featureName: string, properties?: Record<string, unknown>): void {
    trackEvent({
        eventType: AnalyticsEventType.FEATURE_USED,
        eventName: featureName,
        properties,
    });
}

/**
 * Track form submission
 */
export function trackFormSubmit(formName: string, properties?: Record<string, unknown>): void {
    trackEvent({
        eventType: AnalyticsEventType.FORM_SUBMIT,
        eventName: `form_submit_${formName}`,
        properties,
    });
}

/**
 * Track an error
 */
export function trackError(errorName: string, properties?: Record<string, unknown>): void {
    trackEvent({
        eventType: AnalyticsEventType.ERROR,
        eventName: errorName,
        properties,
    });
}

/**
 * Track a search
 */
export function trackSearch(query: string, results?: number): void {
    trackEvent({
        eventType: AnalyticsEventType.SEARCH,
        eventName: 'search',
        properties: {
            query,
            results,
        },
    });
}

/**
 * Track an export action
 */
export function trackExport(exportType: string, format?: string): void {
    trackEvent({
        eventType: AnalyticsEventType.EXPORT,
        eventName: 'export',
        properties: {
            exportType,
            format,
        },
    });
}

/**
 * Fetch analytics data from API
 */
export async function getAnalyticsSummary(
    startDate?: Date,
    endDate?: Date,
    metric?: string
): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());
    if (metric) params.append('metric', metric);

    const response = await api.get(`/metrics/summary?${params.toString()}`);
    return response.data;
}

/**
 * Fetch feature usage statistics
 */
export async function getFeatureUsageStats(
    startDate?: Date,
    endDate?: Date
): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());

    const response = await api.get(`/metrics/features?${params.toString()}`);
    return response.data;
}

/**
 * Fetch user activity metrics
 */
export async function getUserActivityMetrics(
    startDate?: Date,
    endDate?: Date
): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());

    const response = await api.get(`/metrics/activity?${params.toString()}`);
    return response.data;
}

/**
 * Fetch performance metrics
 */
export async function getPerformanceMetrics(
    metricType?: string,
    startDate?: Date,
    endDate?: Date
): Promise<any> {
    const params = new URLSearchParams();
    if (metricType) params.append('type', metricType);
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());

    const response = await api.get(`/metrics/performance?${params.toString()}`);
    return response.data;
}

/**
 * Fetch complete dashboard data
 */
export async function getDashboardData(): Promise<any> {
    const response = await api.get('/metrics/dashboard');
    return response.data;
}
