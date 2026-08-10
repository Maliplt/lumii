import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface StateViewProps {
  Icon?: LucideIcon;
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
  variant?: "default" | "error";
  role?: "alert" | "status";
}

export default function StateView({
  Icon,
  eyebrow,
  title,
  description,
  action,
  compact = false,
  variant = "default",
  role,
}: StateViewProps) {
  return (
    <div
      className={`state-view state-view--${variant}${compact ? " state-view--compact" : ""}`}
      role={role}
    >
      {Icon && (
        <span className="state-view__icon">
          <Icon size={32} strokeWidth={1.75} />
        </span>
      )}
      {eyebrow && <span className="state-view__eyebrow">{eyebrow}</span>}
      <h3 className="state-view__title">{title}</h3>
      {description && <p className="state-view__desc">{description}</p>}
      {action && <div className="state-view__action">{action}</div>}
    </div>
  );
}
