import { useState } from "react";
import { Button, Input, Modal } from "rsuite";
import { X } from "lucide-react";

interface Props {
  email: string;
  onClose: () => void;
  onSave: (email: string) => void;
}

export default function EmailChangeModal({ email, onClose, onSave }: Props) {
  const [value, setValue] = useState(email);
  const [error, setError] = useState("");

  const save = () => {
    const next = value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next)) {
      setError("Geçerli bir e-posta adresi gir.");
      return;
    }
    onSave(next);
  };

  return (
    <Modal open onClose={onClose} size="sm" className="profile-modal email-modal">
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

      <Modal.Body>
        <div className="email-modal__hero">
          <h2>E-posta adresi</h2>
          <p>Hesabınla ilgili bildirimler ve faturalar bu adrese gönderilir.</p>
        </div>
        <label className="profile-edit__field" htmlFor="account-email">
          <span>Yeni e-posta</span>
          <Input
            id="account-email"
            value={value}
            type="email"
            onChange={(next) => {
              setValue(next);
              if (error) setError("");
            }}
          />
          {error && <small>{error}</small>}
        </label>
      </Modal.Body>

      <Modal.Footer>
        <div className="profile-edit__footer">
          <Button appearance="primary" onClick={save} block>
            E-postayı Kaydet
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
