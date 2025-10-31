import * as Sentry from '@sentry/react';
import {
    createRoutesFromChildren,
    matchRoutes,
    useLocation,
    useNavigationType,
} from 'react-router-dom';
import { useEffect } from 'react';

// Environment configuration
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE;
const RELEASE = import.meta.env.VITE_SENTRY_RELEASE;
const TRACES_SAMPLE_RATE = parseFloat(
    import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '0.1'
);
const REPLAYS_SESSION_SAMPLE_RATE = parseFloat(
    import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE || '0.1'
);
const REPLAYS_ON_ERROR_SAMPLE_RATE = parseFloat(
    import.meta.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE || '1.0'
);

/**
 * Initialize Sentry for frontend error tracking and performance monitoring
 */
export function initSentry(): void {
    // Only initialize if DSN is provided
    if (!SENTRY_DSN) {
        console.log('⚠️  Sentry DSN not configured, skipping Sentry initialization');
        return;
    }

    Sentry.init({
        dsn: SENTRY_DSN,
        environment: ENVIRONMENT,
        release: RELEASE,

        // Integrations
        integrations: [
            // Automatically instrument React components
            Sentry.reactRouterV7BrowserTracingIntegration({
                useEffect,
                useLocation,
                useNavigationType,
                createRoutesFromChildren,
                matchRoutes,
            }),
            // Session replay for debugging
            Sentry.replayIntegration({
                maskAllText: true,
                blockAllMedia: true,
            }),
            // Breadcrumbs for console, DOM events, etc.
            Sentry.breadcrumbsIntegration({
                console: true,
                dom: true,
                fetch: true,
                history: true,
                sentry: true,
                xhr: true,
            }),
        ],

        // Performance Monitoring
        tracesSampleRate: TRACES_SAMPLE_RATE,

        // Session Replay sampling
        replaysSessionSampleRate: REPLAYS_SESSION_SAMPLE_RATE,
        replaysOnErrorSampleRate: REPLAYS_ON_ERROR_SAMPLE_RATE,

        // Maximum breadcrumbs
        maxBreadcrumbs: 50,

        // Attach stack traces to messages
        attachStacktrace: true,

        // Before send hook for data sanitization
        beforeSend(event) {
            // Remove sensitive data from the event
            if (event.request) {
                delete event.request.cookies;
                if (event.request.headers) {
                    delete event.request.headers.authorization;
                    delete event.request.headers.cookie;
                }
            }

            // Add custom fingerprinting for better error grouping
            if (event.exception?.values?.[0]) {
                const exception = event.exception.values[0];
                if (exception.type && exception.value) {
                    event.fingerprint = [
                        '{{ default }}',
                        exception.type,
                        exception.value.substring(0, 100),
                    ];
                }
            }

            return event;
        },

        // Before breadcrumb hook for filtering
        beforeBreadcrumb(breadcrumb) {
            // Filter out sensitive data from breadcrumbs
            if (breadcrumb.data) {
                delete breadcrumb.data.authorization;
                delete breadcrumb.data.password;
                delete breadcrumb.data.token;
                delete breadcrumb.data.secret;
            }

            // Filter console breadcrumbs in production
            if (ENVIRONMENT === 'production' && breadcrumb.category === 'console') {
                return null;
            }

            return breadcrumb;
        },

        // Ignore specific errors
        ignoreErrors: [
            // Browser extensions
            'top.GLOBALS',
            // Random plugins/extensions
            'originalCreateNotification',
            'canvas.contentDocument',
            'MyApp_RemoveAllHighlights',
            // Facebook
            'fb_xd_fragment',
            // Network errors
            'NetworkError',
            'Network request failed',
            'Failed to fetch',
            // Abort errors
            'AbortError',
            'Request aborted',
            // ResizeObserver errors (non-critical)
            'ResizeObserver loop limit exceeded',
            'ResizeObserver loop completed with undelivered notifications',
        ],

        // Deny URLs - don't report errors from these URLs
        denyUrls: [
            // Browser extensions
            /extensions\//i,
            /^chrome:\/\//i,
            /^moz-extension:\/\//i,
            // Facebook flakiness
            /graph\.facebook\.com/i,
            // Facebook blocked
            /connect\.facebook\.net\/en_US\/all\.js/i,
        ],
    });

    console.log(
        `✅ Sentry initialized (env: ${ENVIRONMENT}, release: ${RELEASE || 'not set'})`
    );
}

/**
 * Captures an exception with additional context
 */
export function captureException(
    error: Error,
    context?: Record<string, unknown>,
    level?: Sentry.SeverityLevel
): string | undefined {
    if (!SENTRY_DSN) {
        return undefined;
    }

    return Sentry.captureException(error, {
        level: level || 'error',
        contexts: context
            ? {
                  custom: context,
              }
            : undefined,
    });
}

/**
 * Captures a message with additional context
 */
export function captureMessage(
    message: string,
    context?: Record<string, unknown>,
    level?: Sentry.SeverityLevel
): string | undefined {
    if (!SENTRY_DSN) {
        return undefined;
    }

    return Sentry.captureMessage(message, {
        level: level || 'info',
        contexts: context
            ? {
                  custom: context,
              }
            : undefined,
    });
}

/**
 * Sets user context for error tracking
 */
export function setUser(user: {
    id: string;
    username?: string;
    email?: string;
}): void {
    if (!SENTRY_DSN) {
        return;
    }

    Sentry.setUser(user);
}

/**
 * Clears the current user context
 */
export function clearUser(): void {
    if (!SENTRY_DSN) {
        return;
    }

    Sentry.setUser(null);
}

/**
 * Adds a breadcrumb for tracking user actions
 */
export function addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: Sentry.SeverityLevel;
    data?: Record<string, unknown>;
}): void {
    if (!SENTRY_DSN) {
        return;
    }

    Sentry.addBreadcrumb(breadcrumb);
}

/**
 * Sets a tag for filtering and searching errors
 */
export function setTag(key: string, value: string): void {
    if (!SENTRY_DSN) {
        return;
    }

    Sentry.setTag(key, value);
}

/**
 * Sets multiple tags at once
 */
export function setTags(tags: Record<string, string>): void {
    if (!SENTRY_DSN) {
        return;
    }

    Sentry.setTags(tags);
}

/**
 * Sets context data that will be merged with error events
 */
export function setContext(
    name: string,
    context: Record<string, unknown> | null
): void {
    if (!SENTRY_DSN) {
        return;
    }

    Sentry.setContext(name, context);
}

// Re-export Sentry for direct access if needed
export { Sentry };
