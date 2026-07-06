import type { InputHTMLAttributes } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  className?: string;
}

export default function Field({ label, error, className, ...input }: FieldProps) {
  return (
    <label className={`checkout-field${className ? ` ${className}` : ""}`}>
      <span>{label}</span>
      <input
        className={`checkout-text-input${error ? " checkout-text-input--error" : ""}`}
        {...input}
      />
      {error && <small className="checkout-field__error">{error}</small>}
    </label>
  );
}
