import { useState } from "react";
import { Button } from "rsuite";
import { isValidEmail } from "../../lib/utils";
import ModalHero from "./ModalHero";
import ModalInputField from "./ModalInputField";
import ProfileModalShell from "./ProfileModalShell";

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
    <ProfileModalShell
      className="email-modal"
      size="sm"
      onClose={onClose}
      footer={
        <Button appearance="primary" onClick={save} block>
          E-postayı Kaydet
        </Button>
      }
    >
        <ModalHero
          className="email-modal__hero"
          title="E-posta adresi"
          description="Hesabınla ilgili bildirimler ve faturalar bu adrese gönderilir."
        />
        <ModalInputField
          id="account-email"
          label="Yeni e-posta"
          value={value}
          type="email"
          error={error}
          onChange={(next) => {
            setValue(next);
            if (error) setError("");
          }}
        />
    </ProfileModalShell>
  );
}
