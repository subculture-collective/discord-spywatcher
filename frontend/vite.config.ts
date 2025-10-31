import react from '@vitejs/plugin-react-swc';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        // Sentry plugin for source map uploads
        // Only enable in production builds with auth token
        process.env.VITE_SENTRY_AUTH_TOKEN &&
        process.env.VITE_SENTRY_ORG &&
        process.env.VITE_SENTRY_PROJECT
            ? sentryVitePlugin({
                  org: process.env.VITE_SENTRY_ORG,
                  project: process.env.VITE_SENTRY_PROJECT,
                  authToken: process.env.VITE_SENTRY_AUTH_TOKEN,
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
            : null,
    ].filter(Boolean),
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
