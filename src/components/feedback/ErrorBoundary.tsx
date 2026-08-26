import { Component, type ErrorInfo, type ReactNode } from "react";
import ServiceErrorView from "./ServiceErrorView";

interface ErrorBoundaryProps {
  children: ReactNode;
  resetKey?: string;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidUpdate(prev: ErrorBoundaryProps) {
    // rota sıfırlama
    if (this.state.hasError && prev.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary yakaladı:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="error-boundary">
        <ServiceErrorView
          error={this.state.error}
          onRetry={this.handleReset}
          onHome={() => window.location.assign("/")}
        />
      </div>
    );
  }
}
