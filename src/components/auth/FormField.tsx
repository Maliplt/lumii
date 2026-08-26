import type { ReactNode } from "react";
import { Input } from "rsuite";
import { AlertCircle } from "lucide-react";

interface AuthFieldShellProps {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}

export function AuthFieldShell({
  id,
  label,
  error,
  children,
}: AuthFieldShellProps) {
  return (
    <div className="login-field">
      <label className="login-field__label" htmlFor={id}>
        {label}
      </label>
      {children}
      {error && (
        <span className="login-field__error">
          <AlertCircle size={13} /> {error}
        </span>
      )}
    </div>
  );
}

interface FormFieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
}

export default function FormField({
  id,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  autoComplete,
}: FormFieldProps) {
  return (
    <AuthFieldShell id={id} label={label} error={error}>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
      />
    </AuthFieldShell>
  );
}
