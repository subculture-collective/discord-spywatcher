import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as Sentry from '@sentry/react';

import ErrorBoundary from '../../components/ErrorBoundary';

// Mock Sentry
vi.mock('@sentry/react', () => ({
    captureException: vi.fn(),
    ErrorBoundary: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
        throw new Error('Test error');
    }
    return <div>No error</div>;
};

describe('ErrorBoundary', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Suppress console errors in tests
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should render children when there is no error', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={false} />
            </ErrorBoundary>
        );

        expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should render fallback UI when an error occurs', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        expect(screen.getByText(/we're sorry/i)).toBeInTheDocument();
        expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('should capture error to Sentry when an error occurs', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('should render custom fallback when provided', () => {
        const customFallback = <div>Custom error message</div>;

        render(
            <ErrorBoundary fallback={customFallback}>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText('Custom error message')).toBeInTheDocument();
        expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('should have a try again button', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should have a reload page button', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText('Reload Page')).toBeInTheDocument();
    });

    it('should reset error state when try again is clicked', async () => {
        const user = userEvent.setup();
        const { rerender } = render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText('Something went wrong')).toBeInTheDocument();

        const tryAgainButton = screen.getByText('Try Again');
        await user.click(tryAgainButton);

        // Re-render with no error
        rerender(
            <ErrorBoundary>
                <ThrowError shouldThrow={false} />
            </ErrorBoundary>
        );

        expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should reload page when reload button is clicked', async () => {
        const user = userEvent.setup();
        const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {});

        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        const reloadButton = screen.getByText('Reload Page');
        await user.click(reloadButton);

        expect(reloadSpy).toHaveBeenCalled();

        reloadSpy.mockRestore();
    });

    it('should display error message', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('should apply correct styling classes', () => {
        const { container } = render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        // Check for key styling classes
        expect(container.querySelector('.bg-ctp-base')).toBeInTheDocument();
        expect(container.querySelector('.border-ctp-surface0')).toBeInTheDocument();
        expect(container.querySelector('.bg-ctp-mantle')).toBeInTheDocument();
    });
});
