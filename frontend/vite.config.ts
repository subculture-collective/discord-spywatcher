import react from '@vitejs/plugin-react-swc';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/
// Check if Sentry source map upload should be enabled
const shouldEnableSentryPlugin =
    process.env.VITE_SENTRY_AUTH_TOKEN &&
    process.env.VITE_SENTRY_ORG &&
    process.env.VITE_SENTRY_PROJECT;

// Build plugins array conditionally
const plugins = [react()];

if (shouldEnableSentryPlugin) {
    plugins.push(
        sentryVitePlugin({
            org: process.env.VITE_SENTRY_ORG!,
            project: process.env.VITE_SENTRY_PROJECT!,
            authToken: process.env.VITE_SENTRY_AUTH_TOKEN!,
            telemetry: false,
            sourcemaps: {
                assets: './dist/**',
                filesToDeleteAfterUpload: ['**/*.map'],
            },
            release: {
                name: process.env.VITE_SENTRY_RELEASE,
                deploy: {
                    env: process.env.VITE_ENVIRONMENT || 'production',
                },
            },
        })
    );
}

export default defineConfig({
    plugins,
    build: {
        // Generate source maps for error tracking
        sourcemap: true,
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/__tests__/setup.ts'],
        exclude: ['**/node_modules/**', '**/e2e/**', '**/dist/**'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            exclude: [
                'node_modules/',
                'src/__tests__/',
                'e2e/',
                '**/*.d.ts',
                '**/*.config.*',
                '**/mockData',
            ],
        },
    },
});
