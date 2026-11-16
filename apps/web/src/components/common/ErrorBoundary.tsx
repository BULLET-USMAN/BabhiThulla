import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from '../ui/Button.js';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[REACT UNCAUGHT ERROR]', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-ruby-950/80 border-2 border-ruby-500/50 flex items-center justify-center mb-4 text-ruby-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold font-display text-cream-100 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-gray-400 max-w-md mb-6">
            An unexpected error occurred while rendering this game screen. Don't worry, your match progress is safe on the server.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button
              variant="gold"
              onClick={this.handleReset}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = '/';
              }}
              leftIcon={<Home className="w-4 h-4" />}
            >
              Back to Home
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
