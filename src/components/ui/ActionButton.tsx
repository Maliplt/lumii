import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface ActionButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> {
  label: string;
  tooltipLabel?: string;
  active?: boolean;
  children: ReactNode;
}

export default function ActionButton({
  label,
  tooltipLabel,
  active,
  className = "",
  children,
  ...buttonProps
}: ActionButtonProps) {
  return (
    <button
      {...buttonProps}
      type={buttonProps.type ?? "button"}
      className={`action-button${active ? " active" : ""}${className ? ` ${className}` : ""}`}
      aria-label={label}
      aria-pressed={active}
      data-action-label={tooltipLabel}
    >
      {children}
    </button>
  );
}
