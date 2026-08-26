import type { ReactNode } from "react";
import { Modal } from "rsuite";
import ModalCloseButton from "./ModalCloseButton";

interface ProfileModalShellProps {
  className: string;
  size: "sm" | "md" | "lg";
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export default function ProfileModalShell({
  className,
  size,
  onClose,
  children,
  footer,
}: ProfileModalShellProps) {
  return (
    <Modal
      open
      onClose={onClose}
      size={size}
      className={`profile-modal ${className}`}
    >
      <ModalCloseButton onClose={onClose} />
      <Modal.Body>{children}</Modal.Body>
      {footer && (
        <Modal.Footer>
          <div className="profile-edit__footer">{footer}</div>
        </Modal.Footer>
      )}
    </Modal>
  );
}
