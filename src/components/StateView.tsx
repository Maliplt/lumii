import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface StateViewProps {
  Icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function StateView({
  Icon,
  title,
  description,
  action,
}: StateViewProps) {
  return (
    <div className="state-view">
      {Icon && (
        <span className="state-view__icon">
          <Icon size={32} strokeWidth={1.75} />
        </span>
      )}
      <h3 className="state-view__title">{title}</h3>
      {description && <p className="state-view__desc">{description}</p>}
      {action && <div className="state-view__action">{action}</div>}
    </div>
  );
}
