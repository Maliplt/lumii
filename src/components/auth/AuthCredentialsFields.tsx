import FormField from "./FormField";
import PasswordField from "./PasswordField";

interface AuthCredentialsFieldsProps {
  idPrefix: "login" | "reg";
  email: string;
  password: string;
  emailError?: string;
  passwordError?: string;
  passwordPlaceholder: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
}

export default function AuthCredentialsFields({
  idPrefix,
  email,
  password,
  emailError,
  passwordError,
  passwordPlaceholder,
  onEmailChange,
  onPasswordChange,
}: AuthCredentialsFieldsProps) {
  return (
    <>
      <FormField
        id={`${idPrefix}-email`}
        label="E-posta"
        type="email"
        placeholder="ornek@mail.com"
        value={email}
        onChange={onEmailChange}
        error={emailError}
        autoComplete="email"
      />
      <PasswordField
        id={`${idPrefix}-password`}
        label="Şifre"
        placeholder={passwordPlaceholder}
        value={password}
        onChange={onPasswordChange}
        error={passwordError}
        autoComplete={idPrefix === "login" ? "current-password" : "new-password"}
      />
    </>
  );
}
