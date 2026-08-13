interface SpinnerProps {
  inline?: boolean;
  variant?: "page" | "inline" | "compact" | "player";
}

export default function Spinner({
  inline = false,
  variant,
}: SpinnerProps) {
  const label = "Yükleniyor";
  const resolvedVariant = variant ?? (inline ? "inline" : "page");

  return (
    <div
      className={`spinner-overlay spinner-overlay--${resolvedVariant}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="spinner-lockup" aria-hidden="true">
        <svg className="spinner-mark" viewBox="0 0 64 64" focusable="false">
          <rect className="spinner-film__tile" x="8" y="6" width="48" height="52" rx="1" />
          <rect
            className="spinner-film__progress"
            x="8"
            y="6"
            width="48"
            height="52"
            rx="1"
            pathLength="100"
          />
          <rect className="spinner-film__frame" x="19" y="11" width="26" height="42" />
          <path
            className="spinner-film__sprocket"
            d="M11 11h4v6h-4zM11 22h4v6h-4zM11 33h4v6h-4zM11 44h4v6h-4zM49 11h4v6h-4zM49 22h4v6h-4zM49 33h4v6h-4zM49 44h4v6h-4z"
          />
        </svg>
        <span className="spinner-wordmark">TENET</span>
      </div>
      <span className="spinner-label">{label}...</span>
    </div>
  );
}
