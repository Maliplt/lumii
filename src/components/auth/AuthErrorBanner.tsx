import { AlertCircle } from "lucide-react";

export default function AuthErrorBanner({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <span className="login-field__error login-form__error">
      <AlertCircle size={14} /> {message}
    </span>
  );
}
