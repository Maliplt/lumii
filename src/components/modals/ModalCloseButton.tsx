import { X } from "lucide-react";

interface ModalCloseButtonProps {
  onClose: () => void;
  standalone?: boolean;
  className?: string;
}

export default function ModalCloseButton({ onClose, standalone = false, className = "" }: ModalCloseButtonProps) {
  const button = (
    <button
      type="button"
      className={`profile-modal__close ${className}`.trim()}
      onClick={onClose}
      aria-label="Kapat"
    >
      <X size={22} />
    </button>
  );
  return standalone ? button : <div className="profile-modal__head">{button}</div>;
}
