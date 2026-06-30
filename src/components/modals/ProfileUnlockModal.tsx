import { useRef, useState, useEffect } from "react";
import { Modal } from "rsuite";
import { X } from "lucide-react";
import { AVATARS, DEFAULT_AVATAR } from "../../helpers";
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
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const avatar = AVATARS[profile.avatar] ?? AVATARS[DEFAULT_AVATAR];

  useEffect(() => {
    const t = window.setTimeout(() => inputs.current[0]?.focus(), 80);
    return () => window.clearTimeout(t);
  }, []);

  const focusInput = (index: number) => {
    window.setTimeout(() => inputs.current[index]?.focus(), 0);
  };

  const verify = (pin: string) => {
    if (pin === profile.lockPin) {
      onSuccess();
    } else {
      setError("Yanlış kod, tekrar dene.");
      setDigits(["", "", "", ""]);
      focusInput(0);
    }
  };

  const updateDigit = (index: number, value: string) => {
    const nextValue = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = nextValue;
      const pin = next.join("");
      if (pin.length === 4) verify(pin);
      return next;
    });
    if (error) setError("");
    if (nextValue && index < 3) focusInput(index + 1);
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
            Profil Kilitli <span>{profile.name}</span>
          </h2>
          <p>Bu profile geçmek için 4 haneli kilit kodunu gir.</p>
        </div>

        <div className="lock-modal__pin" aria-label="4 haneli profil kilidi">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(node) => {
                inputs.current[index] = node;
              }}
              value={digit}
              type="password"
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

        {error && <small className="lock-modal__error">{error}</small>}
      </Modal.Body>
    </Modal>
  );
}
