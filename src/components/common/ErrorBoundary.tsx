import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught runtime component exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 bg-bg-base text-text-primary">
          <div className="w-full max-w-lg p-8 rounded-2xl bg-bg-surface border border-rose-500/20 shadow-2xl backdrop-blur-md flex flex-col items-center text-center">
            {/* Visual Icon */}
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mb-6 shadow-inner">
              <AlertOctagon className="w-8 h-8" />
            </div>

            {/* Error Headers */}
            <h2 className="text-xl font-bold text-text-primary tracking-tight">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">
              An unexpected error occurred while rendering this view. Your data is safe.
            </p>

            {/* Technical Detail Preview (Collapsible) */}
            {this.state.error && (
              <details className="w-full mt-4 text-left border border-border-subtle rounded-xl p-3 bg-bg-base/60 text-xs font-mono text-text-muted cursor-pointer overflow-hidden">
                <summary className="font-semibold text-rose-600 dark:text-rose-400 select-none">
                  {this.state.error.name}: {this.state.error.message}
                </summary>
                {this.state.errorInfo && (
                  <pre className="mt-2 p-2 max-h-40 overflow-auto bg-black/20 rounded text-[11px] text-text-secondary whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap gap-3 justify-center w-full">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover shadow-md shadow-primary/20 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bg-subtle text-text-primary hover:bg-bg-subtle/80 border border-border-subtle text-sm font-medium transition-all"
              >
                <Home className="w-4 h-4" />
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
