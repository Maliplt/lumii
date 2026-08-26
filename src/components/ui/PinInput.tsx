import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

export interface PinInputHandle {
  reset: () => void;
}

interface PinInputProps {
  length?: number;
  masked?: boolean;
  autoFocusDelay?: number;
  onChange: (pin: string) => void;
}
// pin girişi
const PinInput = forwardRef<PinInputHandle, PinInputProps>(function PinInput(
  { length = 4, masked = false, autoFocusDelay, onChange }: PinInputProps,
  ref,
) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const [digits, setDigits] = useState<string[]>(() => Array(length).fill(""));

  const focusInput = (index: number) => {
    window.setTimeout(() => inputs.current[index]?.focus(), 0);
  };

  useImperativeHandle(ref, () => ({
    reset: () => {
      setDigits(Array(length).fill(""));
      focusInput(0);
    },
  }));

  useEffect(() => {
    if (autoFocusDelay === undefined) return;
    const t = window.setTimeout(() => inputs.current[0]?.focus(), autoFocusDelay);
    return () => window.clearTimeout(t);
  }, [autoFocusDelay]);

  const updateDigit = (index: number, value: string) => {
    const nextValue = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = nextValue;
    setDigits(next);
    if (nextValue && index < length - 1) focusInput(index + 1);
    onChange(next.join(""));
  };

  return (
    <div className="lock-modal__pin" aria-label={`${length} haneli profil kilidi`}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            inputs.current[index] = node;
          }}
          value={digit}
          type={masked ? "password" : "text"}
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
  );
});

export default PinInput;
