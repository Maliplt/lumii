import type { ReactNode } from "react";
import ActionButton, { type ActionButtonProps } from "./ActionButton";

interface IconActionButtonProps
  extends Omit<ActionButtonProps, "children"> {
  icon: ReactNode;
}

export default function IconActionButton({
  icon,
  className = "",
  ...buttonProps
}: IconActionButtonProps) {
  return (
    <ActionButton
      {...buttonProps}
      className={`icon-action-button${className ? ` ${className}` : ""}`}
    >
      <span className="icon-action-button__icon" aria-hidden="true">
        {icon}
      </span>
    </ActionButton>
  );
}
