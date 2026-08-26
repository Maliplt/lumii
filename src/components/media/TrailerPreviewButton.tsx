import type { MouseEventHandler } from "react";
import { Clapperboard } from "lucide-react";
import type { TrailerPreviewStatus } from "../../lib/useTrailerPreview";
import ActionButton from "../ui/ActionButton";
import IconActionButton from "../ui/IconActionButton";

interface TrailerPreviewButtonProps {
  status: TrailerPreviewStatus;
  active?: boolean;
  iconOnly?: boolean;
  className?: string;
  ariaLabel: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
  tabIndex?: number;
}

export default function TrailerPreviewButton({
  status,
  active = false,
  iconOnly = false,
  className = "",
  ariaLabel,
  onClick,
  tabIndex,
}: TrailerPreviewButtonProps) {
  const label = active
    ? "Fragmanı Durdur"
    : status === "unavailable"
      ? "Fragman Yok"
      : "Fragmanı İzle";
  const tooltipLabel = active
    ? "Fragmanı durdur"
    : status === "unavailable"
      ? "Fragman bulunamadı"
      : "Fragmanı oynat";

  if (iconOnly) {
    return (
      <IconActionButton
        className={className}
        label={ariaLabel}
        tooltipLabel={tooltipLabel}
        active={active}
        icon={<Clapperboard />}
        onClick={onClick}
        disabled={status === "loading" || status === "unavailable"}
        aria-busy={status === "loading"}
        tabIndex={tabIndex}
      />
    );
  }

  return (
    <ActionButton
      className={`cc-item__preview-trigger cc-item__preview-trigger--${status}${className ? ` ${className}` : ""}`}
      label={ariaLabel}
      active={active}
      onClick={onClick}
      disabled={status === "loading" || status === "unavailable"}
      aria-busy={status === "loading"}
      tabIndex={tabIndex}
    >
      <span className="cc-item__preview-icon" aria-hidden="true">
        <Clapperboard size={15} />
      </span>
      <span className="cc-item__preview-label">{label}</span>
    </ActionButton>
  );
}
