import * as Sentry from '@sentry/node';
import { Express, Request, Response, NextFunction } from 'express';

import { env } from '../utils/env';

export function initSentry(app: Express): void {
    // Only initialize if DSN is provided
    if (!env.SENTRY_DSN) {
        console.log('⚠️  Sentry DSN not configured, skipping Sentry initialization');
        return;
    }

    Sentry.init({
        dsn: env.SENTRY_DSN,
        environment: env.NODE_ENV,
        integrations: [
            Sentry.httpIntegration(),
            Sentry.expressIntegration(),
            Sentry.prismaIntegration(),
        ],
        tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
        beforeSend(event) {
            // Filter out sensitive data
            if (event.request) {
                delete event.request.cookies;
                if (event.request.headers) {
                    delete event.request.headers.authorization;
                }
            }
            return event;
        },
    });

    console.log('✅ Sentry initialized');
}

export function getSentryRequestHandler() {
    return Sentry.expressErrorHandler();
}

export function getSentryTracingHandler() {
    // In Sentry v10, tracing is handled automatically by the integrations
    return (req: Request, res: Response, next: NextFunction) => next();
}

export function getSentryErrorHandler() {
    return Sentry.expressErrorHandler();
}

export { Sentry };
