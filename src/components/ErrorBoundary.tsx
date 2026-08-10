import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import StateView from "./StateView";

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
    // rota degisince hatadan cik
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
      <div className="error-boundary" role="alert">
        <StateView
          Icon={AlertTriangle}
          eyebrow="Uygulama hatası"
          title="Sayfa görüntülenemedi"
          description="Beklenmeyen bir sorun oluştu. Yeniden deneyebilir veya ana sayfaya dönebilirsiniz."
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
