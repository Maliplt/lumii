import { useState } from "react";
import { Input, InputGroup } from "rsuite";
import { MotionIcon } from "../ui/MotionIcon";
import { AuthFieldShell } from "./FormField";

interface PasswordFieldProps {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
}

export default function PasswordField({
  id,
  label,
  placeholder,
  value,
  onChange,
  error,
  autoComplete,
}: PasswordFieldProps) {
  const [show, setShow] = useState(false);

  return (
    <AuthFieldShell id={id} label={label} error={error}>
      <InputGroup inside>
        <Input
          id={id}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
        />
        <InputGroup.Button
          onClick={() => setShow((p) => !p)}
          aria-label={show ? "Şifreyi gizle" : "Şifreyi göster"}
        >
          <MotionIcon
            name={show ? "EyeOff" : "Eye"}
            size={18}
            trigger="hover"
            animation="pop"
          />
        </InputGroup.Button>
      </InputGroup>
    </AuthFieldShell>
  );
}
