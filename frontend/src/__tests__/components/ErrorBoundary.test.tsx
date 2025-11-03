import * as Sentry from '@sentry/react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

    it('should have interactive buttons in error state', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText('Something went wrong')).toBeInTheDocument();

        const tryAgainButton = screen.getByText('Try Again');
        const reloadButton = screen.getByText('Reload Page');
        
        // Both buttons should be present and clickable
        expect(tryAgainButton).toBeInTheDocument();
        expect(reloadButton).toBeInTheDocument();
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
