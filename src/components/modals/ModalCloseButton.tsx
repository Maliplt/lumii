import { X } from "lucide-react";

export default function ModalCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <div className="profile-modal__head">
      <button
        type="button"
        className="profile-modal__close"
        onClick={onClose}
        aria-label="Kapat"
      >
        <X size={22} />
      </button>
    </div>
  );
}
