import { describe, it, expect, beforeEach } from 'vitest';

import { useAuth } from '../../store/auth';

describe('Auth Store', () => {
    beforeEach(() => {
        // Reset store state before each test
        useAuth.setState({ accessToken: null });
    });

    it('should initialize with null token', () => {
        const { accessToken } = useAuth.getState();
        expect(accessToken).toBeNull();
    });

    it('should set access token', () => {
        const token = 'test-access-token';

        useAuth.getState().setToken(token);

        const { accessToken } = useAuth.getState();
        expect(accessToken).toBe(token);
    });

    it('should update token multiple times', () => {
        const token1 = 'token-1';
        const token2 = 'token-2';

        useAuth.getState().setToken(token1);
        expect(useAuth.getState().accessToken).toBe(token1);

        useAuth.getState().setToken(token2);
        expect(useAuth.getState().accessToken).toBe(token2);
    });

    it('should logout and clear token', () => {
        const token = 'test-token';

        useAuth.getState().setToken(token);
        expect(useAuth.getState().accessToken).toBe(token);

        useAuth.getState().logout();
        expect(useAuth.getState().accessToken).toBeNull();
    });

    it('should handle logout when no token is set', () => {
        expect(useAuth.getState().accessToken).toBeNull();

        useAuth.getState().logout();
        expect(useAuth.getState().accessToken).toBeNull();
    });
});
