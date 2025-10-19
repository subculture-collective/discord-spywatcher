import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useSession } from '../../hooks/useSession';
import api from '../../lib/api';

// Mock the API module
vi.mock('../../lib/api', () => ({
    default: {
        get: vi.fn(),
    },
}));

describe('useSession hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch session successfully', async () => {
        const mockSession = {
            discordId: '123456789',
            username: 'testuser',
            avatar: 'avatar_hash',
            email: 'test@example.com',
            role: 'USER',
        };

        vi.mocked(api.get).mockResolvedValue({ data: mockSession });

        const { result } = renderHook(() => useSession());

        // Initially loading
        expect(result.current.loading).toBe(true);
        expect(result.current.session).toBeNull();
        expect(result.current.error).toBeNull();

        // Wait for the session to load
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.session).toEqual(mockSession);
        expect(result.current.error).toBeNull();
        expect(api.get).toHaveBeenCalledWith('/auth/me');
    });

    it('should handle fetch error', async () => {
        const mockError = {
            response: {
                data: {
                    error: 'Unauthorized',
                },
            },
        };

        vi.mocked(api.get).mockRejectedValue(mockError);

        const { result } = renderHook(() => useSession());

        expect(result.current.loading).toBe(true);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.session).toBeNull();
        expect(result.current.error).toBe('Unauthorized');
    });

    it('should handle fetch error without response', async () => {
        vi.mocked(api.get).mockRejectedValue(new Error('Network error'));

        const { result } = renderHook(() => useSession());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.session).toBeNull();
        expect(result.current.error).toBe('Failed to fetch session');
    });

    it('should set loading to false after fetch completes', async () => {
        const mockSession = {
            discordId: '123',
            username: 'test',
            role: 'ADMIN' as const,
        };

        vi.mocked(api.get).mockResolvedValue({ data: mockSession });

        const { result } = renderHook(() => useSession());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.loading).toBe(false);
    });
});
