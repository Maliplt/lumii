import { Button, Toggle } from "rsuite";
import {
  Check,
  Laptop,
  Mail,
  Pencil,
  Plus,
  Smartphone,
} from "lucide-react";
import { SectionIntro, SummaryBlock, SummaryRow, MediaGrid } from "./AccountUI";
import { formatPlan, avatarFor, type PasswordForm } from "./accountData";
import { MAX_PROFILES, type Profile, type SavedItem } from "../../store/store";
import { PACKAGES } from "../../helpers";

type Plan = (typeof PACKAGES)[number];

interface BasicUser {
  name: string;
  email: string;
  createdAt?: string;
}

// genel bakis
export function OverviewTab({
  user,
  plan,
  shownProfileName,
  profileCount,
  onChangeEmail,
  onManagePlan,
}: {
  user: BasicUser;
  plan: Plan;
  shownProfileName: string;
  profileCount: number;
  onChangeEmail: () => void;
  onManagePlan: () => void;
}) {
  return (
    <section className="acct-section">
      <SectionIntro>Hesap bilgileri ve üyelik durumu.</SectionIntro>
      <div className="acct-overview-grid">
        <SummaryBlock>
          <SummaryRow label="Hesap sahibi" value={user.name} />
          <SummaryRow
            label="E-posta"
            value={user.email}
            action={
              <Button appearance="ghost" size="sm" onClick={onChangeEmail}>
                Değiştir
              </Button>
            }
          />
          <SummaryRow label="Üyelik başlangıcı" value={user.createdAt ?? "Bugün"} />
        </SummaryBlock>

        <SummaryBlock>
          <SummaryRow
            label="Plan"
            value={formatPlan(plan)}
            action={
              <Button appearance="ghost" size="sm" onClick={onManagePlan}>
                Yönet
              </Button>
            }
          />
          <SummaryRow label="Aktif profil" value={shownProfileName} />
          <SummaryRow
            label="Profil sayısı"
            value={`${profileCount}/${MAX_PROFILES}`}
          />
        </SummaryBlock>
      </div>
    </section>
  );
}

// profiller
export function ProfilesTab({
  profiles,
  profileCount,
  onEdit,
  onCreate,
  onDisableLock,
  onCreateLock,
}: {
  profiles: Profile[];
  profileCount: number;
  onEdit: (profile: Profile) => void;
  onCreate: () => void;
  onDisableLock: (profile: Profile) => void;
  onCreateLock: (profile: Profile) => void;
}) {
  return (
    <section className="acct-section">
      <SectionIntro>
        Profil oluşturma sade kalır; avatar ve kilit gibi ayrıntıları buradan
        yönetebilirsin.
      </SectionIntro>

      <div className="acct-profile-grid">
        {profiles.map((profile) => (
          <article className="acct-profile-card" key={profile.id}>
            <div className="acct-profile-card__head">
              <img src={avatarFor(profile)} alt="" />
              <div>
                <h3>{profile.name}</h3>
                <p>{profile.kids ? "Çocuk" : "Standart profil"}</p>
              </div>
              <button
                type="button"
                aria-label={`${profile.name} profilini düzenle`}
                onClick={() => onEdit(profile)}
              >
                <Pencil size={16} />
              </button>
            </div>

            <div className="acct-profile-controls">
              <div className="acct-control-line">
                <span>Profil kilidi</span>
                <button
                  type="button"
                  className={`acct-toggle-btn${profile.locked ? " is-on" : ""}`}
                  onClick={() =>
                    profile.locked
                      ? onDisableLock(profile)
                      : onCreateLock(profile)
                  }
                >
                  {profile.locked ? "Kilidi Kaldır" : "Kilit Oluştur"}
                </button>
              </div>
            </div>
          </article>
        ))}

        {profileCount < MAX_PROFILES && (
          <button
            type="button"
            className="acct-profile-card acct-profile-card--add"
            onClick={onCreate}
          >
            <span className="acct-profile-add__icon">
              <Plus size={22} />
            </span>
            <span className="acct-profile-add__text">
              <strong>Profil ekle</strong>
              <small>Profil adı ve türünü seç</small>
            </span>
          </button>
        )}
      </div>
    </section>
  );
}

// uyelik
export function MembershipTab({
  user,
  plan,
  paymentMethod,
  billingAddress,
  billingEmail,
  onSeePlans,
  onUpdatePayment,
}: {
  user: BasicUser;
  plan: Plan;
  paymentMethod?: string;
  billingAddress?: string;
  billingEmail?: string;
  onSeePlans: () => void;
  onUpdatePayment: () => void;
}) {
  const renewal = plan.free
    ? "Ücretsiz — yenileme yok"
    : `${plan.price}${plan.period} · otomatik yenilenir`;
  return (
    <section className="acct-section">
      <SectionIntro>Abonelik, faturalandırma ve erişim bilgileri.</SectionIntro>

      <div className="acct-overview-grid">
        <SummaryBlock>
          <SummaryRow
            label="Aktif plan"
            value={formatPlan(plan)}
            action={
              <Button appearance="primary" size="sm" onClick={onSeePlans}>
                Planları Gör
              </Button>
            }
          />
          <SummaryRow label="Üyelik başlangıcı" value={user.createdAt ?? "Bugün"} />
          <SummaryRow label="Sonraki yenileme" value={renewal} />
          <SummaryRow label="Görüntü kalitesi" value={plan.quality ?? "SD 480p"} />
          <SummaryRow label="Eş zamanlı ekran" value={plan.screens ?? "1 ekran"} />
        </SummaryBlock>

        <SummaryBlock>
          <SummaryRow
            label="Ödeme yöntemi"
            value={paymentMethod ?? "Tanımlı değil"}
            action={
              <Button appearance="ghost" size="sm" onClick={onUpdatePayment}>
                {paymentMethod ? "Güncelle" : "Ekle"}
              </Button>
            }
          />
          <SummaryRow label="Fatura adresi" value={billingAddress ?? "Eklenmedi"} />
          <SummaryRow label="Fatura e-postası" value={billingEmail ?? user.email} />
        </SummaryBlock>
      </div>

      <div className="acct-feature-block">
        <h3>Plan kapsamı</h3>
        <ul>
          {plan.features.map((feature) => (
            <li key={feature}>
              <Check size={16} />
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// guvenlik
export function SecurityTab({
  email,
  showDevices,
  onToggleDevices,
  passwordForm,
  onPasswordField,
  onSubmitPassword,
}: {
  email: string;
  showDevices: boolean;
  onToggleDevices: () => void;
  passwordForm: PasswordForm;
  onPasswordField: (key: keyof PasswordForm, value: string) => void;
  onSubmitPassword: () => void;
}) {
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
            <Button appearance="ghost" size="sm" onClick={onToggleDevices}>
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
          onSubmitPassword();
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

// odeme ve fatura
export function BillingTab({
  user,
  paymentMethod,
  billingAddress,
  billingEmail,
  lastAmount,
  lastDate,
  marketingConsent,
  onUpdatePayment,
}: {
  user: BasicUser;
  paymentMethod?: string;
  billingAddress?: string;
  billingEmail?: string;
  lastAmount?: string;
  lastDate?: string;
  marketingConsent?: boolean;
  onUpdatePayment: () => void;
}) {
  const hasReceipt = !!(paymentMethod || lastAmount || billingAddress);
  return (
    <section className="acct-section">
      <SectionIntro>Ödeme yöntemi ve fatura bilgileri.</SectionIntro>

      <SummaryBlock>
        <SummaryRow
          label="Ödeme yöntemi"
          value={paymentMethod ?? (hasReceipt ? "Kart ile ödeme" : "Ödeme yöntemi yok")}
          action={
            <Button appearance="primary" size="sm" onClick={onUpdatePayment}>
              {paymentMethod ? "Güncelle" : "Kart Ekle"}
            </Button>
          }
        />
        <SummaryRow label="Fatura adresi" value={billingAddress ?? "Eklenmedi"} />
        <SummaryRow
          label="Son işlem"
          value={lastAmount ? lastAmount : "Kayıt yok"}
        >
          {lastDate && <small className="acct-row__note">{lastDate}</small>}
        </SummaryRow>
        <SummaryRow label="Fatura e-postası" value={billingEmail ?? user.email} />
        <SummaryRow
          label="Pazarlama bildirimleri"
          value={marketingConsent ? "Açık" : "Kapalı"}
        />
      </SummaryBlock>
    </section>
  );
}

// ayarlar aktif profil
export function SettingsTab({
  profile,
  fallbackName,
  historyCount,
  onSetting,
  onClearHistory,
}: {
  profile: Profile | null;
  fallbackName: string;
  historyCount: number;
  onSetting: (changes: Partial<Profile>, message: string) => void;
  onClearHistory: () => void;
}) {
  return (
    <section className="acct-section">
      <SectionIntro>
        Ayarlar şu anda aktif olan profile uygulanır. Aktif profil:{" "}
        {profile?.name ?? fallbackName}.
      </SectionIntro>
      {profile && (
        <SummaryBlock>
          <SummaryRow
            label="Aktif profil"
            value={
              <span className="acct-settings-profile">
                <img src={avatarFor(profile)} alt="" />
                {profile.name}
              </span>
            }
          />
          <SummaryRow
            label="Otomatik oynatma"
            value="Sonraki bölüm ve önizlemeler kendiliğinden başlasın"
            action={
              <Toggle
                checked={(profile.playback ?? "auto") === "auto"}
                className="profile-rsuite-toggle"
                aria-label="Otomatik oynatma"
                onChange={(checked) =>
                  onSetting(
                    { playback: checked ? "auto" : "manual" },
                    checked
                      ? "Otomatik oynatma açıldı."
                      : "Otomatik oynatma kapatıldı.",
                  )
                }
              />
            }
          />
          <SummaryRow
            label="Bildirimler"
            value="E-posta bildirimlerini al"
            action={
              <Toggle
                checked={(profile.notifications ?? "important") !== "off"}
                className="profile-rsuite-toggle"
                aria-label="E-posta bildirimleri"
                onChange={(checked) =>
                  onSetting(
                    { notifications: checked ? "all" : "off" },
                    checked ? "Bildirimler açıldı." : "Bildirimler kapatıldı.",
                  )
                }
              />
            }
          />
          <SummaryRow
            label="İzleme geçmişi"
            value={`${historyCount} içerik`}
            action={
              <Button appearance="ghost" size="sm" onClick={onClearHistory}>
                Temizle
              </Button>
            }
          />
        </SummaryBlock>
      )}
    </section>
  );
}

// kutuphane
export function LibraryTab({ items, empty }: { items: SavedItem[]; empty: string }) {
  return (
    <section className="acct-section">
      <MediaGrid items={items} empty={empty} />
    </section>
  );
}
