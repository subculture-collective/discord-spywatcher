import * as Sentry from '@sentry/react';
import { Component, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary component that catches React errors and reports them to Sentry
 * Provides a fallback UI when an error occurs
 */
class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        // Report to Sentry
        Sentry.captureException(error, {
            contexts: {
                react: {
                    componentStack: errorInfo.componentStack,
                },
            },
        });

        console.error('Error caught by boundary:', error, errorInfo);
    }

    handleReset = (): void => {
        this.setState({
            hasError: false,
            error: null,
        });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className="flex min-h-screen items-center justify-center bg-ctp-base p-4">
                    <div className="w-full max-w-md rounded-lg border border-ctp-surface0 bg-ctp-mantle p-6 shadow-lg">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="rounded-full bg-ctp-red/10 p-3">
                                <svg
                                    className="h-6 w-6 text-ctp-red"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-ctp-text">
                                Something went wrong
                            </h2>
                        </div>

                        <p className="mb-4 text-sm text-ctp-subtext0">
                            We're sorry, but something unexpected happened. The error has been
                            reported and we'll look into it.
                        </p>

                        {this.state.error && (
                            <div className="mb-4 rounded bg-ctp-surface0 p-3">
                                <p className="text-xs font-mono text-ctp-subtext1 break-words">
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 rounded bg-ctp-blue px-4 py-2 text-sm font-medium text-ctp-base transition-colors hover:bg-ctp-blue/90"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 rounded border border-ctp-surface0 bg-ctp-surface0 px-4 py-2 text-sm font-medium text-ctp-text transition-colors hover:bg-ctp-surface1"
                            >
                                Reload Page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Also export a functional component version using Sentry's error boundary
export const SentryErrorBoundary = Sentry.ErrorBoundary;

export default ErrorBoundary;
