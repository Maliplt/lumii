import { useState } from "react";
import { Button, Modal } from "rsuite";
import { avatarFor } from "../../helpers";
import PinInput from "../PinInput";
import ModalCloseButton from "./ModalCloseButton";
import ModalHero from "./ModalHero";
import type { Profile } from "../../store/store";

interface Props {
  profile: Profile;
  onClose: () => void;
  onSave: (pin: string) => void;
}

export default function ProfileLockModal({ profile, onClose, onSave }: Props) {
  const [started, setStarted] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const avatar = avatarFor(profile);

  const submit = () => {
    if (!started) {
      setStarted(true);
      return;
    }

    if (pin.length !== 4) {
      setError("4 haneli bir profil kilidi girmelisin.");
      return;
    }

    onSave(pin);
  };

  return (
    <Modal open onClose={onClose} size="sm" className="profile-modal lock-modal">
      <ModalCloseButton onClose={onClose} />

      <Modal.Body>
        <ModalHero
          className="lock-modal__hero"
          avatar={avatar}
          title={<>Profil Kilidi <span>{profile.name}</span></>}
          description={[
            "Bu profil için 4 haneli bir kilit oluşturabilirsin.",
            "Kilit aktif olduğunda profile geçiş yaparken bu kod istenir.",
          ]}
        />

        {started && (
          <PinInput
            autoFocusDelay={0}
            onChange={(next) => {
              setPin(next);
              if (error) setError("");
            }}
          />
        )}

        {error && <small className="lock-modal__error">{error}</small>}
      </Modal.Body>

      <Modal.Footer>
        <div className="profile-edit__footer">
          <Button appearance="primary" onClick={submit} block>
            {started ? "Kilit Kodunu Kaydet" : "Profil Kilidini Oluştur"}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
