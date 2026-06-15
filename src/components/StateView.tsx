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
        <Icon size={48} className="state-view__icon" strokeWidth={1.5} />
      )}
      <h3 className="state-view__title">{title}</h3>
      {description && <p className="state-view__desc">{description}</p>}
      {action && <div className="state-view__action">{action}</div>}
    </div>
  );
}
