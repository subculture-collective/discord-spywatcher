// Mock Sentry before importing anything
jest.mock('@sentry/node', () => ({
    init: jest.fn(),
    captureException: jest.fn(() => 'test-event-id'),
    captureMessage: jest.fn(() => 'test-event-id'),
    setUser: jest.fn(),
    addBreadcrumb: jest.fn(),
    setTag: jest.fn(),
    setTags: jest.fn(),
    setContext: jest.fn(),
    startSpan: jest.fn((config, callback) => callback()),
    expressErrorHandler: jest.fn(() => jest.fn()),
    httpIntegration: jest.fn(() => ({})),
    expressIntegration: jest.fn(() => ({})),
    prismaIntegration: jest.fn(() => ({})),
}));

// Mock environment before importing the module
const mockEnv = {
    SENTRY_DSN: 'https://test@sentry.io/123456',
    SENTRY_ENVIRONMENT: 'test',
    SENTRY_RELEASE: 'test@1.0.0',
    SENTRY_TRACES_SAMPLE_RATE: 1.0,
    SENTRY_SAMPLE_RATE: 1.0,
    NODE_ENV: 'test' as const,
    PORT: 3001,
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    DISCORD_BOT_TOKEN: 'test-token',
    DISCORD_CLIENT_ID: 'test-client-id',
    DISCORD_CLIENT_SECRET: 'test-client-secret',
    DISCORD_REDIRECT_URI: 'http://localhost:5173/auth/callback',
    BOT_GUILD_IDS: [],
    ADMIN_DISCORD_IDS: [],
    JWT_SECRET: 'test-jwt-secret-min-32-chars',
    JWT_REFRESH_SECRET: 'test-jwt-refresh-secret-min-32-chars',
    JWT_ACCESS_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '7d',
    CORS_ORIGINS: ['http://localhost:5173'],
    ENABLE_RATE_LIMITING: true,
    ENABLE_IP_BLOCKING: true,
    ENABLE_REDIS_RATE_LIMITING: true,
    ENABLE_LOAD_SHEDDING: true,
    LOG_LEVEL: 'info' as const,
    MAX_REQUEST_SIZE_MB: 10,
};

jest.mock('../../../src/utils/env', () => ({
    env: mockEnv,
}));

import * as Sentry from '@sentry/node';
import * as sentryModule from '../../../src/monitoring/sentry';

describe('Sentry Monitoring', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('initSentry', () => {
        it('should initialize Sentry with correct configuration', () => {
            const mockApp = {} as never;
            sentryModule.initSentry(mockApp);

            expect(Sentry.init).toHaveBeenCalledWith(
                expect.objectContaining({
                    dsn: mockEnv.SENTRY_DSN,
                    environment: mockEnv.SENTRY_ENVIRONMENT,
                    release: mockEnv.SENTRY_RELEASE,
                    tracesSampleRate: mockEnv.SENTRY_TRACES_SAMPLE_RATE,
                    sampleRate: mockEnv.SENTRY_SAMPLE_RATE,
                    maxBreadcrumbs: 50,
                    attachStacktrace: true,
                })
            );
        });
    });

    describe('captureException', () => {
        it('should capture exception with context', () => {
            const error = new Error('Test error');
            const context = { userId: '123', action: 'test' };

            const eventId = sentryModule.captureException(error, context, 'error');

            expect(Sentry.captureException).toHaveBeenCalledWith(error, {
                level: 'error',
                contexts: {
                    custom: context,
                },
            });
            expect(eventId).toBe('test-event-id');
        });

        it('should capture exception without context', () => {
            const error = new Error('Test error');

            sentryModule.captureException(error);

            expect(Sentry.captureException).toHaveBeenCalledWith(error, {
                level: 'error',
                contexts: undefined,
            });
        });


    });

    describe('captureMessage', () => {
        it('should capture message with context', () => {
            const message = 'Test message';
            const context = { userId: '123' };

            const eventId = sentryModule.captureMessage(message, context, 'info');

            expect(Sentry.captureMessage).toHaveBeenCalledWith(message, {
                level: 'info',
                contexts: {
                    custom: context,
                },
            });
            expect(eventId).toBe('test-event-id');
        });

        it('should capture message without context', () => {
            const message = 'Test message';

            sentryModule.captureMessage(message);

            expect(Sentry.captureMessage).toHaveBeenCalledWith(message, {
                level: 'info',
                contexts: undefined,
            });
        });
    });

    describe('setUser', () => {
        it('should set user context', () => {
            const user = {
                id: '123',
                username: 'testuser',
                email: 'test@example.com',
            };

            sentryModule.setUser(user);

            expect(Sentry.setUser).toHaveBeenCalledWith(user);
        });


    });

    describe('clearUser', () => {
        it('should clear user context', () => {
            sentryModule.clearUser();

            expect(Sentry.setUser).toHaveBeenCalledWith(null);
        });
    });

    describe('addBreadcrumb', () => {
        it('should add breadcrumb with all properties', () => {
            const breadcrumb = {
                message: 'User action',
                category: 'ui.click',
                level: 'info' as const,
                data: { button: 'submit' },
            };

            sentryModule.addBreadcrumb(breadcrumb);

            expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(breadcrumb);
        });

        it('should add breadcrumb with minimal properties', () => {
            const breadcrumb = {
                message: 'User action',
            };

            sentryModule.addBreadcrumb(breadcrumb);

            expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(breadcrumb);
        });
    });

    describe('setTag', () => {
        it('should set a single tag', () => {
            sentryModule.setTag('environment', 'test');

            expect(Sentry.setTag).toHaveBeenCalledWith('environment', 'test');
        });
    });

    describe('setTags', () => {
        it('should set multiple tags', () => {
            const tags = {
                environment: 'test',
                version: '1.0.0',
            };

            sentryModule.setTags(tags);

            expect(Sentry.setTags).toHaveBeenCalledWith(tags);
        });
    });

    describe('setContext', () => {
        it('should set context', () => {
            const context = { feature: 'test', enabled: true };

            sentryModule.setContext('feature_flags', context);

            expect(Sentry.setContext).toHaveBeenCalledWith('feature_flags', context);
        });

        it('should clear context when null is passed', () => {
            sentryModule.setContext('feature_flags', null);

            expect(Sentry.setContext).toHaveBeenCalledWith('feature_flags', null);
        });
    });

    describe('withSpan', () => {
        it('should execute callback within a span', () => {
            const callback = jest.fn(() => 'result');

            const result = sentryModule.withSpan('test-operation', 'task', callback);

            expect(Sentry.startSpan).toHaveBeenCalledWith(
                { name: 'test-operation', op: 'task' },
                callback
            );
            expect(result).toBe('result');
        });

        it('should handle async callbacks', async () => {
            const callback = jest.fn(async () => 'async-result');

            const result = await sentryModule.withSpan('test-operation', 'task', callback);

            expect(result).toBe('async-result');
        });


    });

    describe('getSentryErrorHandler', () => {
        it('should return Sentry error handler', () => {
            const handler = sentryModule.getSentryErrorHandler();

            expect(Sentry.expressErrorHandler).toHaveBeenCalled();
            expect(handler).toBeDefined();
        });
    });
});
