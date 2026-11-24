import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let message = error.message || 'An unexpected error occurred.';
    try {
      const parsed = JSON.parse(message);
      if (parsed && typeof parsed === 'object' && 'operationType' in parsed) {
        message = `Database access error during ${parsed.operationType} on ${parsed.path || 'record'}: ${parsed.error}`;
      }
    } catch {
      // Plain error string
    }
    return { hasError: true, errorMessage: message };
  }

  public componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Application error caught by ErrorBoundary:', error, info);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 p-6">
          <div className="max-w-md w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h2 className="text-lg font-semibold">Something interrupted FITTRACK AI</h2>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed break-words">
              {this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
