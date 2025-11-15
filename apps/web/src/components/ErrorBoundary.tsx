'use client';

import { Component, type ReactNode } from 'react';
import { logError } from '@/lib/error-logger';
import { shouldShowDetailedErrors, getEnvironmentName } from '@/lib/env';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: { componentStack?: string } | null;
}

/**
 * Error Boundary Component
 *
 * Catches React rendering errors and displays appropriate error UI
 * based on the environment.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack?: string }): void {
    // Log the error (intentionally not awaited to avoid blocking)
    void logError('React Error Boundary caught an error', error, {
      componentStack: errorInfo.componentStack,
      errorType: 'react_rendering',
    });

    this.setState({
      errorInfo,
    });
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      const isDetailed = shouldShowDetailedErrors();
      const { error, errorInfo } = this.state;

      // Production: Simple error message
      if (!isDetailed) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <div className="w-full max-w-md mx-auto p-8">
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-red-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-200">
                      Something went wrong
                    </h3>
                    <p className="mt-2 text-sm text-red-100">
                      We encountered an unexpected error. Please try refreshing the page.
                    </p>
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={this.resetError}
                        className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500"
                      >
                        Try Again
                      </button>
                      <a
                        href="/"
                        className="inline-flex items-center rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20"
                      >
                        Go Home
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      // Development/Preview: Detailed error information
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4">
          <div className="w-full max-w-4xl mx-auto space-y-4">
            {/* Environment Badge */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center rounded-md bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-400 ring-1 ring-inset ring-yellow-500/20">
                {getEnvironmentName()} Environment - Error Boundary
              </span>
            </div>

            {/* Main Error Card */}
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-8 w-8 text-red-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-red-200">
                      React Rendering Error
                    </h3>
                    <p className="mt-3 text-base text-red-100">
                      An error occurred during component rendering
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Details */}
              {error && (
                <div className="border-t border-red-500/20 bg-red-500/5 p-6">
                  <h4 className="text-sm font-semibold text-red-200 mb-2">
                    Error Message
                  </h4>
                  <pre className="text-sm text-red-100 font-mono overflow-x-auto bg-black/20 p-4 rounded">
                    {error.toString()}
                  </pre>

                  {error.stack && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-red-200 mb-2">
                        Stack Trace
                      </h4>
                      <pre className="text-xs text-red-100 font-mono overflow-x-auto bg-black/20 p-4 rounded max-h-96">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Component Stack */}
              {errorInfo?.componentStack && (
                <div className="border-t border-red-500/20 bg-red-500/5 p-6">
                  <h4 className="text-sm font-semibold text-red-200 mb-2">
                    Component Stack
                  </h4>
                  <pre className="text-xs text-red-100 font-mono overflow-x-auto bg-black/20 p-4 rounded max-h-96">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>

            {/* Troubleshooting */}
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-6">
              <h4 className="text-sm font-semibold text-blue-200 flex items-center gap-2 mb-3">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
                  />
                </svg>
                Troubleshooting Steps
              </h4>
              <ol className="space-y-2">
                <li className="flex items-start gap-3 text-sm text-blue-100">
                  <span className="flex-shrink-0 font-semibold text-blue-400">1.</span>
                  <span>Check the component stack above to identify which component threw the error</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-blue-100">
                  <span className="flex-shrink-0 font-semibold text-blue-400">2.</span>
                  <span>Review the error message and stack trace for clues</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-blue-100">
                  <span className="flex-shrink-0 font-semibold text-blue-400">3.</span>
                  <span>Check for null/undefined values or missing props</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-blue-100">
                  <span className="flex-shrink-0 font-semibold text-blue-400">4.</span>
                  <span>Look for async data that might not be loaded yet</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-blue-100">
                  <span className="flex-shrink-0 font-semibold text-blue-400">5.</span>
                  <span>Check browser console for additional errors or warnings</span>
                </li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={this.resetError}
                className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
              >
                Try Again
              </button>
              <a
                href="/"
                className="inline-flex items-center rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-600"
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
