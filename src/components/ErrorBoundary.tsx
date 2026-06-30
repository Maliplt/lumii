import { Component, type ErrorInfo, type ReactNode } from "react";

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
        <div className="error-boundary__box">
          <span className="error-boundary__icon">⚠️</span>
          <h2 className="error-boundary__title">Bir şeyler ters gitti</h2>
          <p className="error-boundary__desc">
            Bu bölüm yüklenirken bir hata oluştu. Sayfanın geri kalanı çalışmaya
            devam ediyor.
          </p>
          <div className="error-boundary__actions">
            <button
              className="error-boundary__btn error-boundary__btn--primary"
              onClick={this.handleReset}
            >
              Tekrar dene
            </button>
            <button
              className="error-boundary__btn"
              onClick={() => (window.location.href = "/")}
            >
              Ana sayfa
            </button>
          </div>
        </div>
      </div>
    );
  }
}
