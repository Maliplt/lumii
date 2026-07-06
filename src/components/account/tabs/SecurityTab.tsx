import { useState } from "react";
import { Button } from "rsuite";
import { Laptop, Mail, Smartphone } from "lucide-react";
import { SectionIntro, SummaryBlock, SummaryRow } from "../AccountUI";
import type { PasswordForm } from "../accountData";

interface SecurityTabProps {
  email: string;
  onToggleDevices: (shown: boolean) => void;
  onSubmitPassword: (current: string, next: string, confirm: string) => boolean;
}

// şifre güncelleme
export default function SecurityTab({
  email,
  onToggleDevices,
  onSubmitPassword,
}: SecurityTabProps) {
  const [showDevices, setShowDevices] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    current: "",
    next: "",
    confirm: "",
  });

  const toggleDevices = () => {
    const next = !showDevices;
    setShowDevices(next);
    onToggleDevices(next);
  };

  const onPasswordField = (key: keyof PasswordForm, value: string) => {
    setPasswordForm((prev) => ({ ...prev, [key]: value }));
  };

  const submitPassword = () => {
    const success = onSubmitPassword(
      passwordForm.current.trim(),
      passwordForm.next.trim(),
      passwordForm.confirm.trim(),
    );
    if (success) setPasswordForm({ current: "", next: "", confirm: "" });
  };

  return (
    <section className="acct-section">
      <SectionIntro>Giriş bilgileri ve açık oturumlar.</SectionIntro>

      <SummaryBlock>
        <SummaryRow
          label="E-posta adresi"
          value={email}
          action={
            <span className="acct-status">
              <Mail size={14} />
              Doğrulanmış
            </span>
          }
        />
        <SummaryRow
          label="Oturum cihazları"
          value={showDevices ? "Web tarayıcı, mobil erişim" : "2 kayıt"}
          action={
            <Button appearance="ghost" size="sm" onClick={toggleDevices}>
              {showDevices ? "Cihazları Gizle" : "Cihazları Göster"}
            </Button>
          }
        >
          {showDevices && (
            <div className="acct-device-list">
              <span>
                <Laptop size={15} />
                Windows Chrome, aktif oturum
              </span>
              <span>
                <Smartphone size={15} />
                Mobil tarayıcı, son erişim bugün
              </span>
            </div>
          )}
        </SummaryRow>
      </SummaryBlock>

      <form
        className="acct-password-form"
        onSubmit={(event) => {
          event.preventDefault();
          submitPassword();
        }}
      >
        <h3>Şifreyi değiştir</h3>
        <label>
          <span>Mevcut şifre</span>
          <input
            type="password"
            value={passwordForm.current}
            onChange={(event) => onPasswordField("current", event.target.value)}
            autoComplete="current-password"
          />
        </label>
        <label>
          <span>Yeni şifre</span>
          <input
            type="password"
            value={passwordForm.next}
            onChange={(event) => onPasswordField("next", event.target.value)}
            autoComplete="new-password"
          />
        </label>
        <label>
          <span>Yeni şifre tekrar</span>
          <input
            type="password"
            value={passwordForm.confirm}
            onChange={(event) => onPasswordField("confirm", event.target.value)}
            autoComplete="new-password"
          />
        </label>
        <div className="acct-password-form__actions">
          <Button appearance="primary" type="submit">
            Güncelle
          </Button>
        </div>
      </form>
    </section>
  );
}
