import {
  AlertTriangle,
  CircleAlert,
  Clock,
  PlayCircle,
  Server,
  Settings,
  ShieldAlert,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import StateView from "./StateView";
import {
  resolveServiceError,
  serviceErrorPresentation,
  serviceErrorStatus,
  type ServiceErrorCode,
  type ServiceErrorContext,
} from "../services/serviceError";

const ERROR_ICONS: Record<Exclude<ServiceErrorCode, "not-found">, LucideIcon> = {
  configuration: Settings,
  unauthorized: ShieldAlert,
  request: CircleAlert,
  "rate-limit": Clock,
  network: WifiOff,
  server: Server,
  playback: PlayCircle,
  unknown: AlertTriangle,
};

interface ServiceErrorViewProps {
  error: unknown;
  title?: string;
  onRetry?: () => void;
  retryLabel?: string;
  onBack?: () => void;
  compact?: boolean;
  context?: Extract<ServiceErrorContext, "page" | "section">;
}

export default function ServiceErrorView({
  error,
  title,
  onRetry,
  retryLabel = "Tekrar Dene",
  onBack,
  compact,
  context = "page",
}: ServiceErrorViewProps) {
  const navigate = useNavigate();
  const failure = resolveServiceError(error, context);
  if (failure.surface !== "screen") return null;

  const serviceError = failure.error;
  const presentation = serviceErrorPresentation(serviceError.code);
  const status = serviceErrorStatus(serviceError);
  const pageNotFound = serviceError.code === "not-found" && context === "page";
  const Icon = pageNotFound
    ? undefined
    : serviceError.code === "not-found"
      ? CircleAlert
      : ERROR_ICONS[serviceError.code];
  const canRetry = presentation.retryable && onRetry;
  const isCompact = compact ?? context === "section";

  return (
    <StateView
      Icon={Icon}
      eyebrow={String(status)}
      title={title ?? presentation.title}
      description={serviceError.message}
      compact={isCompact}
      variant="error"
      role="alert"
      action={
        canRetry || onBack || pageNotFound ? (
          <div className="state-view__actions">
            {pageNotFound && (
              <button
                type="button"
                className="state-view__retry"
                onClick={() => navigate("/")}
              >
                Ana Sayfa
              </button>
            )}
            {canRetry && (
              <button type="button" className="state-view__retry" onClick={onRetry}>
                {retryLabel}
              </button>
            )}
            {onBack && (
              <button
                type="button"
                className="state-view__retry is-secondary"
                onClick={onBack}
              >
                Geri Dön
              </button>
            )}
          </div>
        ) : undefined
      }
    />
  );
}
