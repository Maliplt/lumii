import { useRef, useState } from "react";
import { Modal } from "rsuite";
import { avatarFor } from "../../helpers";
import PinInput, { type PinInputHandle } from "../PinInput";
import ModalCloseButton from "./ModalCloseButton";
import ModalHero from "./ModalHero";
import type { Profile } from "../../store/store";

interface Props {
  profile: Profile;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProfileUnlockModal({
  profile,
  onClose,
  onSuccess,
}: Props) {
  const pinRef = useRef<PinInputHandle>(null);
  const [error, setError] = useState("");
  const avatar = avatarFor(profile);

  const handleChange = (pin: string) => {
    if (error) setError("");
    if (pin.length !== 4) return;
    if (pin === profile.lockPin) {
      onSuccess();
    } else {
      setError("Yanlış kod, tekrar dene.");
      pinRef.current?.reset();
    }
  };

  return (
    <Modal open onClose={onClose} size="sm" className="profile-modal lock-modal">
      <ModalCloseButton onClose={onClose} />

      <Modal.Body>
        <ModalHero
          className="lock-modal__hero"
          avatar={avatar}
          title={<>Profil Kilitli <span>{profile.name}</span></>}
          description="Bu profile geçmek için 4 haneli kilit kodunu gir."
        />

        <PinInput ref={pinRef} masked autoFocusDelay={80} onChange={handleChange} />

        {error && <small className="lock-modal__error">{error}</small>}
      </Modal.Body>
    </Modal>
  );
}
