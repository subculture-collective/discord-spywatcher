import { describe, it, expect } from 'vitest';

describe('Sentry Configuration', () => {
    describe('module exports', () => {
        it('should export initSentry function', async () => {
            const sentry = await import('../../config/sentry');
            expect(sentry.initSentry).toBeDefined();
            expect(typeof sentry.initSentry).toBe('function');
        });

        it('should export captureException function', async () => {
            const sentry = await import('../../config/sentry');
            expect(sentry.captureException).toBeDefined();
            expect(typeof sentry.captureException).toBe('function');
        });

        it('should export captureMessage function', async () => {
            const sentry = await import('../../config/sentry');
            expect(sentry.captureMessage).toBeDefined();
            expect(typeof sentry.captureMessage).toBe('function');
        });

        it('should export setUser function', async () => {
            const sentry = await import('../../config/sentry');
            expect(sentry.setUser).toBeDefined();
            expect(typeof sentry.setUser).toBe('function');
        });

        it('should export clearUser function', async () => {
            const sentry = await import('../../config/sentry');
            expect(sentry.clearUser).toBeDefined();
            expect(typeof sentry.clearUser).toBe('function');
        });

        it('should export addBreadcrumb function', async () => {
            const sentry = await import('../../config/sentry');
            expect(sentry.addBreadcrumb).toBeDefined();
            expect(typeof sentry.addBreadcrumb).toBe('function');
        });

        it('should export setTag function', async () => {
            const sentry = await import('../../config/sentry');
            expect(sentry.setTag).toBeDefined();
            expect(typeof sentry.setTag).toBe('function');
        });

        it('should export setTags function', async () => {
            const sentry = await import('../../config/sentry');
            expect(sentry.setTags).toBeDefined();
            expect(typeof sentry.setTags).toBe('function');
        });

        it('should export setContext function', async () => {
            const sentry = await import('../../config/sentry');
            expect(sentry.setContext).toBeDefined();
            expect(typeof sentry.setContext).toBe('function');
        });

        it('should export Sentry object', async () => {
            const sentry = await import('../../config/sentry');
            expect(sentry.Sentry).toBeDefined();
        });
    });

    describe('function behavior', () => {
        it('initSentry should be callable', async () => {
            const { initSentry } = await import('../../config/sentry');
            expect(() => initSentry()).not.toThrow();
        });

        it('captureException should be callable', async () => {
            const { captureException } = await import('../../config/sentry');
            const error = new Error('Test error');
            expect(() => captureException(error)).not.toThrow();
        });

        it('captureMessage should be callable', async () => {
            const { captureMessage } = await import('../../config/sentry');
            expect(() => captureMessage('Test message')).not.toThrow();
        });

        it('setUser should be callable', async () => {
            const { setUser } = await import('../../config/sentry');
            expect(() => setUser({ id: '123' })).not.toThrow();
        });

        it('clearUser should be callable', async () => {
            const { clearUser } = await import('../../config/sentry');
            expect(() => clearUser()).not.toThrow();
        });

        it('addBreadcrumb should be callable', async () => {
            const { addBreadcrumb } = await import('../../config/sentry');
            expect(() => addBreadcrumb({ message: 'test' })).not.toThrow();
        });

        it('setTag should be callable', async () => {
            const { setTag } = await import('../../config/sentry');
            expect(() => setTag('key', 'value')).not.toThrow();
        });

        it('setTags should be callable', async () => {
            const { setTags } = await import('../../config/sentry');
            expect(() => setTags({ key: 'value' })).not.toThrow();
        });

        it('setContext should be callable', async () => {
            const { setContext } = await import('../../config/sentry');
            expect(() => setContext('name', { data: 'value' })).not.toThrow();
        });
    });
});
