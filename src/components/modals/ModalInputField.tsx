import type { HTMLInputTypeAttribute } from "react";
import { Input } from "rsuite";

interface ModalInputFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: HTMLInputTypeAttribute;
  placeholder?: string;
  inputMode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
  maxLength?: number;
  error?: string;
  className?: string;
}

export default function ModalInputField({
  id,
  label,
  value,
  onChange,
  type,
  placeholder,
  inputMode,
  maxLength,
  error,
  className = "",
}: ModalInputFieldProps) {
  return (
    <label
      className={`profile-edit__field${className ? ` ${className}` : ""}`}
      htmlFor={id}
    >
      <span>{label}</span>
      <Input
        id={id}
        value={value}
        onChange={onChange}
        type={type}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && <small id={`${id}-error`}>{error}</small>}
    </label>
  );
}
