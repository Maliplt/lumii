import { useState } from "react";
import { Button, Input, Modal } from "rsuite";
import { isValidEmail } from "../../lib/utils";
import ModalCloseButton from "./ModalCloseButton";
import ModalHero from "./ModalHero";

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
    if (!isValidEmail(next)) {
      setError("Geçerli bir e-posta adresi gir.");
      return;
    }
    onSave(next);
  };

  return (
    <Modal open onClose={onClose} size="sm" className="profile-modal email-modal">
      <ModalCloseButton onClose={onClose} />

      <Modal.Body>
        <ModalHero
          className="email-modal__hero"
          title="E-posta adresi"
          description="Hesabınla ilgili bildirimler ve faturalar bu adrese gönderilir."
        />
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
