import { useRef, useState } from "react";
import { Button, Modal } from "rsuite";
import { X } from "lucide-react";
import { AVATARS, DEFAULT_AVATAR } from "../helpers";
import type { Profile } from "../store/store";

interface Props {
  profile: Profile;
  onClose: () => void;
  onSave: (pin: string) => void;
}

export default function ProfileLockModal({ profile, onClose, onSave }: Props) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const [started, setStarted] = useState(false);
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const avatar = AVATARS[profile.avatar] ?? AVATARS[DEFAULT_AVATAR];
  const pin = digits.join("");

  const focusInput = (index: number) => {
    window.setTimeout(() => inputs.current[index]?.focus(), 0);
  };

  const updateDigit = (index: number, value: string) => {
    const nextValue = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = nextValue;
      return next;
    });
    if (error) setError("");
    if (nextValue && index < 3) focusInput(index + 1);
  };

  const submit = () => {
    if (!started) {
      setStarted(true);
      focusInput(0);
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
        <div className="lock-modal__hero">
          <img src={avatar} alt="" />
          <h2>
            Profil Kilidi <span>{profile.name}</span>
          </h2>
          <p>Bu profil için 4 haneli bir kilit oluşturabilirsin.</p>
          <p>Kilit aktif olduğunda profile geçiş yaparken bu kod istenir.</p>
        </div>

        {started && (
          <div className="lock-modal__pin" aria-label="4 haneli profil kilidi">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(node) => {
                  inputs.current[index] = node;
                }}
                value={digit}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                aria-label={`${index + 1}. hane`}
                onChange={(event) => updateDigit(index, event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Backspace" && !digits[index] && index > 0)
                    focusInput(index - 1);
                }}
              />
            ))}
          </div>
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
