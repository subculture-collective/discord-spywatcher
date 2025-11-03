import * as Sentry from '@sentry/node';
import { Express, Request, Response, NextFunction } from 'express';

import { env } from '../utils/env';

export function initSentry(_app: Express): void {
    // Only initialize if DSN is provided
    if (!env.SENTRY_DSN) {
        console.log(
            '⚠️  Sentry DSN not configured, skipping Sentry initialization'
        );
        return;
    }

    Sentry.init({
        dsn: env.SENTRY_DSN,
        environment: env.SENTRY_ENVIRONMENT || env.NODE_ENV,
        release: env.SENTRY_RELEASE,
        integrations: [
            Sentry.httpIntegration(),
            Sentry.expressIntegration(),
            Sentry.prismaIntegration(),
        ],
        // Performance Monitoring
        tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,

        // Error sampling
        sampleRate: env.SENTRY_SAMPLE_RATE,

        // Maximum number of breadcrumbs
        maxBreadcrumbs: 50,

        // Attach stack traces to messages
        attachStacktrace: true,

        /**
         * Before send hook for data sanitization, filtering, and error enrichment.
         *
         * @param event - The Sentry event to be sent
         * @param hint - Additional context about the original exception or event.
         *   The hint object is provided by Sentry and may contain:
         *   - originalException: The original Error object (if available)
         *   - syntheticException: A synthetic Error object for stack traces
         *   - other context depending on the event source
         *
         * Used here to access the original exception and add its name and message
         * to the event's extra context for improved error reporting.
         */
        beforeSend(event, hint) {
            // Filter out sensitive data
            if (event.request) {
                delete event.request.cookies;
                if (event.request.headers) {
                    delete event.request.headers.authorization;
                    delete event.request.headers.cookie;
                    delete event.request.headers['x-auth-token'];
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

            // Enrich error with additional context
            if (hint.originalException instanceof Error) {
                event.extra = event.extra || {};
                event.extra.errorName = hint.originalException.name;
                event.extra.errorMessage = hint.originalException.message;
            }

            return event;
        },

        // Before breadcrumb hook for filtering and sanitization
        beforeBreadcrumb(breadcrumb, hint) {
            // Filter out sensitive data from breadcrumbs
            if (breadcrumb.data) {
                delete breadcrumb.data.authorization;
                delete breadcrumb.data.password;
                delete breadcrumb.data.token;
                delete breadcrumb.data.secret;
            }

            // Filter console breadcrumbs in production
            if (
                env.NODE_ENV === 'production' &&
                breadcrumb.category === 'console'
            ) {
                return null;
            }

            return breadcrumb;
        },

        // Ignore specific errors
        ignoreErrors: [
            // Ignore network errors
            'NetworkError',
            'Network request failed',
            // Ignore abort errors
            'AbortError',
            'Request aborted',
            // Ignore expected validation errors
            'ValidationError',
        ],

        // Deny URLs - don't report errors from these URLs
        denyUrls: [
            // Ignore errors from browser extensions
            /extensions\//i,
            /^chrome:\/\//i,
            /^moz-extension:\/\//i,
        ],
    });

    console.log(
        `✅ Sentry initialized (env: ${env.SENTRY_ENVIRONMENT || env.NODE_ENV}, release: ${env.SENTRY_RELEASE || 'not set'})`
    );
}

export function getSentryRequestHandler() {
    // In Sentry v10, request handling is done automatically by expressIntegration()
    // This is a no-op for backwards compatibility
    return (req: Request, res: Response, next: NextFunction) => next();
}

export function getSentryTracingHandler() {
    // In Sentry v10, tracing is handled automatically by the integrations
    return (req: Request, res: Response, next: NextFunction) => next();
}

export function getSentryErrorHandler() {
    return Sentry.expressErrorHandler();
}

/**
 * Captures an exception with additional context
 * @param error - The error to capture
 * @param context - Additional context to attach to the error
 * @param level - The severity level (optional)
 */
export function captureException(
    error: Error,
    context?: Record<string, unknown>,
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug'
): string | undefined {
    if (!env.SENTRY_DSN) {
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
 * @param message - The message to capture
 * @param context - Additional context to attach to the message
 * @param level - The severity level (optional)
 */
export function captureMessage(
    message: string,
    context?: Record<string, unknown>,
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug'
): string | undefined {
    if (!env.SENTRY_DSN) {
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
 * @param user - User information to set
 */
export function setUser(user: {
    id: string;
    username?: string;
    email?: string;
    ip_address?: string;
}): void {
    if (!env.SENTRY_DSN) {
        return;
    }

    Sentry.setUser(user);
}

/**
 * Clears the current user context
 */
export function clearUser(): void {
    if (!env.SENTRY_DSN) {
        return;
    }

    Sentry.setUser(null);
}

/**
 * Adds a breadcrumb for tracking user actions
 * @param breadcrumb - Breadcrumb information
 */
export function addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
    data?: Record<string, unknown>;
}): void {
    if (!env.SENTRY_DSN) {
        return;
    }

    Sentry.addBreadcrumb(breadcrumb);
}

/**
 * Sets a tag for filtering and searching errors
 * @param key - Tag key
 * @param value - Tag value
 */
export function setTag(key: string, value: string): void {
    if (!env.SENTRY_DSN) {
        return;
    }

    Sentry.setTag(key, value);
}

/**
 * Sets multiple tags at once
 * @param tags - Object with tag key-value pairs
 */
export function setTags(tags: Record<string, string>): void {
    if (!env.SENTRY_DSN) {
        return;
    }

    Sentry.setTags(tags);
}

/**
 * Sets context data that will be merged with error events
 * @param name - Context name
 * @param context - Context data
 */
export function setContext(
    name: string,
    context: Record<string, unknown> | null
): void {
    if (!env.SENTRY_DSN) {
        return;
    }

    Sentry.setContext(name, context);
}

/**
 * Starts a new span for performance monitoring
 * @param name - Span name
 * @param op - Operation name
 * @param callback - Function to execute within the span
 */
export function withSpan<T>(
    name: string,
    op: string,
    callback: () => T | Promise<T>
): T | Promise<T> {
    if (!env.SENTRY_DSN) {
        return callback();
    }

    return Sentry.startSpan({ name, op }, callback);
}

export { Sentry };
