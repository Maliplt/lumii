import type { ReactNode } from "react";

interface AccessGateProps {
  className: string;
  title: string;
  description: string;
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
  headingLevel?: 1 | 2;
  icon?: ReactNode;
  role?: "status" | "dialog";
}

export default function AccessGate({
  className,
  title,
  description,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  headingLevel = 2,
  icon,
  role,
}: AccessGateProps) {
  const Heading = headingLevel === 1 ? "h1" : "h2";

  return (
    <div className={className} role={role}>
      {icon}
      <Heading>{title}</Heading>
      <p>{description}</p>
      <button type="button" onClick={onPrimary}>
        {primaryLabel}
      </button>
      <button type="button" className="is-secondary" onClick={onSecondary}>
        {secondaryLabel}
      </button>
    </div>
  );
}
