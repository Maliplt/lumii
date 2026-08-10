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
  normalizeServiceError,
  serviceErrorPresentation,
  type ServiceErrorCode,
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
}

export default function ServiceErrorView({
  error,
  title,
  onRetry,
  retryLabel = "Tekrar Dene",
  onBack,
  compact = false,
}: ServiceErrorViewProps) {
  const navigate = useNavigate();
  const serviceError = normalizeServiceError(error);
  const presentation = serviceErrorPresentation(serviceError.code);
  const notFound = serviceError.code === "not-found";
  const Icon = notFound ? undefined : ERROR_ICONS[serviceError.code];
  const canRetry = presentation.retryable && onRetry;

  return (
    <StateView
      Icon={Icon}
      eyebrow={notFound ? "404" : undefined}
      title={title ?? presentation.title}
      description={serviceError.message}
      compact={compact}
      variant="error"
      role="alert"
      action={
        canRetry || onBack || notFound ? (
          <div className="state-view__actions">
            {notFound && (
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
