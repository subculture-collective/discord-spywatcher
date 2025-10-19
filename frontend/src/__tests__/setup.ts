import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
    cleanup();
});

// Mock environment variables for tests
// These must be set before any imports that use config
import.meta.env.VITE_API_URL = 'http://localhost:3001/api';
import.meta.env.VITE_DISCORD_CLIENT_ID = 'test-discord-client-id';
import.meta.env.VITE_ENVIRONMENT = 'test';
import.meta.env.VITE_ENABLE_ANALYTICS = 'false';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {},
    }),
});
