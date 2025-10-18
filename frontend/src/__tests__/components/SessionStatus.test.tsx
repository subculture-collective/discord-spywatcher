import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SessionStatus from '../../components/SessionStatus';
import { useSession } from '../../hooks/useSession';

// Mock the hooks and dependencies
vi.mock('../../hooks/useSession');
vi.mock('../../lib/api');
vi.mock('../../store/auth', () => ({
    useAuth: vi.fn((selector) => {
        const state = { logout: vi.fn() };
        return selector ? selector(state) : state;
    }),
}));

// Mock toast (if used, seems to be missing import in actual component)
global.toast = {
    success: vi.fn(),
    error: vi.fn(),
} as any;

describe('SessionStatus Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should display loading state', () => {
        vi.mocked(useSession).mockReturnValue({
            session: null,
            loading: true,
            error: null,
        });

        render(<SessionStatus />);
        expect(screen.getByText('Loading session...')).toBeInTheDocument();
    });

    it('should display error state', () => {
        vi.mocked(useSession).mockReturnValue({
            session: null,
            loading: false,
            error: 'Failed to load session',
        });

        render(<SessionStatus />);
        expect(screen.getByText(/Error: Failed to load session/)).toBeInTheDocument();
    });

    it('should display not logged in state', () => {
        vi.mocked(useSession).mockReturnValue({
            session: null,
            loading: false,
            error: null,
        });

        render(<SessionStatus />);
        expect(screen.getByText('Not logged in')).toBeInTheDocument();
    });

    it('should display user session info', () => {
        const mockSession = {
            discordId: '123456789',
            username: 'TestUser',
            avatar: 'avatar_hash',
            email: 'test@example.com',
            role: 'USER' as const,
        };

        vi.mocked(useSession).mockReturnValue({
            session: mockSession,
            loading: false,
            error: null,
        });

        render(<SessionStatus />);
        
        expect(screen.getByText('TestUser')).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
        expect(screen.getByText('USER')).toBeInTheDocument();
    });

    it('should display logout button when logged in', () => {
        const mockSession = {
            discordId: '123',
            username: 'Test',
            avatar: 'avatar',
            email: 'test@test.com',
            role: 'USER' as const,
        };

        vi.mocked(useSession).mockReturnValue({
            session: mockSession,
            loading: false,
            error: null,
        });

        render(<SessionStatus />);
        
        const logoutButton = screen.getByRole('button', { name: /logout/i });
        expect(logoutButton).toBeInTheDocument();
    });

    it('should display user avatar', () => {
        const mockSession = {
            discordId: '123456789',
            username: 'TestUser',
            avatar: 'avatar_hash',
            email: 'test@example.com',
            role: 'ADMIN' as const,
        };

        vi.mocked(useSession).mockReturnValue({
            session: mockSession,
            loading: false,
            error: null,
        });

        render(<SessionStatus />);
        
        const avatar = screen.getByAltText('Avatar');
        expect(avatar).toBeInTheDocument();
        expect(avatar).toHaveAttribute(
            'src',
            'https://cdn.discordapp.com/avatars/123456789/avatar_hash.png'
        );
    });

    it('should display different user roles', () => {
        const roles = ['USER', 'ADMIN', 'MODERATOR', 'BANNED'] as const;

        roles.forEach((role) => {
            const mockSession = {
                discordId: '123',
                username: 'Test',
                avatar: 'avatar',
                email: 'test@test.com',
                role,
            };

            vi.mocked(useSession).mockReturnValue({
                session: mockSession,
                loading: false,
                error: null,
            });

            const { unmount } = render(<SessionStatus />);
            expect(screen.getByText(role)).toBeInTheDocument();
            unmount();
        });
    });
});
