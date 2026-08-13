import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import StateView from "./StateView";
import NotFoundPage from "../pages/NotFoundPage";
import {
  normalizeServiceError,
  serviceErrorPresentation,
  serviceErrorStatus,
} from "../services/serviceError";

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

    const error = normalizeServiceError(this.state.error);
    const status = serviceErrorStatus(error);
    const presentation = serviceErrorPresentation(error.code);

    if (status === 404) return <NotFoundPage standalone />;

    return (
      <div className="error-boundary" role="alert">
        <StateView
          Icon={AlertTriangle}
          eyebrow={String(status)}
          title={presentation.title}
          description={presentation.message}
          variant="error"
          role="alert"
          action={
            <div className="state-view__actions">
              <button
                type="button"
                className="state-view__retry"
                onClick={this.handleReset}
              >
                Tekrar Dene
              </button>
              <button
                type="button"
                className="state-view__retry is-secondary"
                onClick={() => (window.location.href = "/")}
              >
                Ana Sayfa
              </button>
            </div>
          }
        />
      </div>
    );
  }
}
