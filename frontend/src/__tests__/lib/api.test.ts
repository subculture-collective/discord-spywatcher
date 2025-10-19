import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useAuth } from '../../store/auth';

describe('API Client', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useAuth.setState({ accessToken: null });
    });

    it('should export an axios instance', async () => {
        const api = await import('../../lib/api');
        expect(api.default).toBeDefined();
        expect(api.default.defaults).toBeDefined();
    });

    it('should have baseURL configured', async () => {
        const api = await import('../../lib/api');
        expect(api.default.defaults.baseURL).toBe('http://localhost:3001/api');
    });

    it('should have withCredentials enabled', async () => {
        const api = await import('../../lib/api');
        expect(api.default.defaults.withCredentials).toBe(true);
    });
});
