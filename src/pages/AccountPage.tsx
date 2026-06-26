import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Toggle } from "rsuite";
import {
  Bookmark,
  Check,
  CreditCard,
  Crown,
  History,
  Laptop,
  Mail,
  Pencil,
  Plus,
  Receipt,
  Settings,
  ShieldCheck,
  Smartphone,
  ThumbsUp,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import PageLayout from "../components/PageLayout";
import EmailChangeModal from "../components/EmailChangeModal";
import MediaCard from "../components/MediaCard";
import PaymentMethodModal from "../components/PaymentMethodModal";
import ProfileEditorModal from "../components/ProfileEditorModal";
import ProfileLockModal from "../components/ProfileLockModal";
import StateView from "../components/StateView";
import { useToast, toastText } from "../components/Toast";
import {
  AVATARS,
  DEFAULT_AVATAR,
  PACKAGES,
  useTitle,
} from "../helpers";
import {
  addProfile,
  changePassword,
  clearHistory,
  selectActiveProfile,
  setReceipt,
  updateEmail,
  updatePaymentMethod,
  updateProfile,
  useAppDispatch,
  useAppSelector,
  MAX_PROFILES,
  type Profile,
  type SavedItem,
} from "../store/store";

type SectionKey =
  | "overview"
  | "profiles"
  | "membership"
  | "security"
  | "billing"
  | "settings"
  | "watchlist"
  | "liked"
  | "history";

interface NavItem {
  key: SectionKey;
  label: string;
  helper: string;
  icon: LucideIcon;
}

interface EditorState {
  mode: "create" | "edit";
  profile?: Profile;
}

interface PasswordForm {
  current: string;
  next: string;
  confirm: string;
}

const ACCOUNT_NAV: NavItem[] = [
  { key: "overview", label: "Hesap", helper: "Genel durum", icon: UserRound },
  { key: "profiles", label: "Profiller", helper: "Kullanıcı profilleri", icon: Users },
  { key: "membership", label: "Üyelik", helper: "Abonelik", icon: Crown },
  { key: "security", label: "Güvenlik", helper: "Giriş ve cihazlar", icon: ShieldCheck },
  { key: "billing", label: "Ödeme", helper: "Fatura ve kart", icon: CreditCard },
  { key: "settings", label: "Ayarlar", helper: "Aktif profil", icon: Settings },
];

const LIBRARY_NAV: NavItem[] = [
  { key: "watchlist", label: "Kaydedilenler", helper: "Kaydedilenler", icon: Bookmark },
  { key: "liked", label: "Beğenilenler", helper: "Seçilen içerikler", icon: ThumbsUp },
  { key: "history", label: "Geçmiş", helper: "Son izlenenler", icon: History },
];

const PLAN_FALLBACK = PACKAGES.find((pkg) => pkg.id === "free") ?? PACKAGES[0];

function SectionIntro({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p className="acct-section__intro">{children}</p>;
}

function SummaryBlock({ children }: { children: ReactNode }) {
  return <div className="acct-summary">{children}</div>;
}

function SummaryRow({
  label,
  value,
  action,
  children,
}: {
  label: string;
  value: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="acct-row">
      <div className="acct-row__copy">
        <span>{label}</span>
        <strong>{value}</strong>
        {children}
      </div>
      {action && <div className="acct-row__action">{action}</div>}
    </div>
  );
}

function MediaGrid({ items, empty }: { items: SavedItem[]; empty: string }) {
  if (!items.length) {
    return (
      <StateView
        title={empty}
        description="İçerik eklediğinde burada düzenli bir liste olarak görünür."
      />
    );
  }

  return (
    <div className="acct-media-grid">
      {items.map((item) => (
        <MediaCard key={`${item.media_type}-${item.id}`} item={item} type={item.media_type} />
      ))}
    </div>
  );
}

function formatPlan(plan: (typeof PACKAGES)[number]) {
  if (plan.free || plan.price === "₺0") return plan.name;
  return `${plan.name} ${plan.price}${plan.period}`;
}

function avatarFor(profile?: Profile | null) {
  return AVATARS[profile?.avatar ?? DEFAULT_AVATAR] ?? AVATARS[DEFAULT_AVATAR];
}

export default function AccountPage() {
  useTitle("Hesap");
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [active, setActive] = useState<SectionKey>("overview");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [lockProfile, setLockProfile] = useState<Profile | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [showDevices, setShowDevices] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    current: "",
    next: "",
    confirm: "",
  });

  const user = useAppSelector((s) => s.auth.currentUser);
  const activeProfile = useAppSelector(selectActiveProfile);
  const accounts = useAppSelector((s) => s.auth.accounts);
  const receipt = useAppSelector((s) => s.auth.receipt);
  const library = useAppSelector((s) =>
    s.library.activeId ? s.library.byProfile[s.library.activeId] : null,
  );
  const account = accounts.find((item) => item.email === user?.email);

  const plan = useMemo(
    () => PACKAGES.find((pkg) => pkg.id === user?.plan) ?? PLAN_FALLBACK,
    [user?.plan],
  );

  const navMeta = useMemo(
    () => [...ACCOUNT_NAV, ...LIBRARY_NAV].find((item) => item.key === active) ?? ACCOUNT_NAV[0],
    [active],
  );

  const profileCount = user?.profiles.length ?? 0;
  const shownProfile = activeProfile ?? user?.profiles[0] ?? null;
  const selectedLibrary = library ?? {
    watchlist: [],
    liked: [],
    history: [],
    continueWatching: [],
  };

  useEffect(() => {
    if (!user) navigate("/login");
  }, [navigate, user]);

  if (!user) return null;

  const saveProfile = (data: { name: string; kids: boolean; avatar: string }) => {
    if (editor?.mode === "edit" && editor.profile) {
      dispatch(updateProfile({ ...editor.profile, ...data }));
      toast(toastText.profileUpdated);
    } else {
      dispatch(addProfile(data));
      toast(toastText.profileAdded);
    }
    setEditor(null);
  };

  const updatePasswordField = (key: keyof PasswordForm, value: string) => {
    setPasswordForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateProfileSettings = (
    profile: Profile,
    changes: Partial<Profile>,
    message: string,
  ) => {
    dispatch(updateProfile({ ...profile, ...changes }));
    toast(message, "info");
  };

  const submitPassword = () => {
    const current = passwordForm.current.trim();
    const next = passwordForm.next.trim();
    const confirm = passwordForm.confirm.trim();

    if (!current || !next || !confirm) {
      toast("Tüm şifre alanlarını doldurmalısın.", "warning");
      return;
    }

    if (account?.password !== current) {
      toast("Mevcut şifre hatalı.", "error");
      return;
    }

    if (next.length < 8 || next === current) {
      toast("Yeni şifre en az 8 karakter olmalı ve eskisinden farklı olmalı.", "warning");
      return;
    }

    if (next !== confirm) {
      toast("Yeni şifreler eşleşmiyor.", "warning");
      return;
    }

    dispatch(changePassword({ current, next }));
    setPasswordForm({ current: "", next: "", confirm: "" });
    toast("Şifre güncellendi.");
  };

  const NavButton = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const selected = active === item.key;

    return (
      <button
        type="button"
        className={`acct-nav__item${selected ? " is-active" : ""}`}
        onClick={() => setActive(item.key)}
      >
        <Icon size={18} />
        <span>
          <strong>{item.label}</strong>
          <small>{item.helper}</small>
        </span>
      </button>
    );
  };

  const renderProfileSettings = (profile: Profile) => (
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
              updateProfileSettings(
                profile,
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
              updateProfileSettings(
                profile,
                { notifications: checked ? "all" : "off" },
                checked ? "Bildirimler açıldı." : "Bildirimler kapatıldı.",
              )
            }
          />
        }
      />
      <SummaryRow
        label="İzleme geçmişi"
        value={`${selectedLibrary.history.length} içerik`}
        action={
          <Button
            appearance="ghost"
            size="sm"
            onClick={() => {
              dispatch(clearHistory());
              toast("İzleme geçmişi temizlendi.", "info");
            }}
          >
            Temizle
          </Button>
        }
      />
    </SummaryBlock>
  );

  const renderContent = () => {
    if (active === "overview") {
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
                  <Button appearance="ghost" size="sm" onClick={() => setEmailOpen(true)}>
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
                  <Button appearance="ghost" size="sm" onClick={() => setActive("membership")}>
                    Yönet
                  </Button>
                }
              />
              <SummaryRow label="Aktif profil" value={shownProfile?.name ?? user.name} />
              <SummaryRow label="Profil sayısı" value={`${profileCount}/${MAX_PROFILES}`} />
            </SummaryBlock>
          </div>
        </section>
      );
    }

    if (active === "profiles") {
      return (
        <section className="acct-section">
          <SectionIntro>
            Profil oluşturma sade kalır; avatar ve kilit gibi ayrıntıları buradan yönetebilirsin.
          </SectionIntro>

          <div className="acct-profile-grid">
            {user.profiles.map((profile) => (
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
                    onClick={() => setEditor({ mode: "edit", profile })}
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
                      onClick={() => {
                        if (profile.locked) {
                          updateProfileSettings(
                            profile,
                            { locked: false, lockPin: undefined },
                            "Profil kilidi kapatıldı.",
                          );
                          return;
                        }
                        setLockProfile(profile);
                      }}
                    >
                      {profile.locked ? "Açık" : "Kilit oluştur"}
                    </button>
                  </div>
                </div>
              </article>
            ))}

            {profileCount < MAX_PROFILES && (
              <button
                type="button"
                className="acct-profile-card acct-profile-card--add"
                onClick={() => setEditor({ mode: "create" })}
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

    if (active === "membership") {
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
                  <Button appearance="primary" size="sm" onClick={() => navigate("/packages")}>
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
                value={receipt?.paymentMethod ?? "Tanımlı değil"}
                action={
                  <Button appearance="ghost" size="sm" onClick={() => setPaymentOpen(true)}>
                    {receipt?.paymentMethod ? "Güncelle" : "Ekle"}
                  </Button>
                }
              />
              <SummaryRow label="Fatura adresi" value={receipt?.billingAddress ?? "Eklenmedi"} />
              <SummaryRow label="Fatura e-postası" value={receipt?.email ?? user.email} />
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

    if (active === "security") {
      return (
        <section className="acct-section">
          <SectionIntro>Giriş bilgileri ve açık oturumlar.</SectionIntro>

          <SummaryBlock>
            <SummaryRow
              label="E-posta adresi"
              value={user.email}
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
                <Button
                  appearance="ghost"
                  size="sm"
                  onClick={() => {
                    setShowDevices((prev) => !prev);
                    toast(showDevices ? "Cihaz listesi kapatıldı." : "Cihaz listesi açıldı.", "info");
                  }}
                >
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
                onChange={(event) => updatePasswordField("current", event.target.value)}
                autoComplete="current-password"
              />
            </label>
            <label>
              <span>Yeni şifre</span>
              <input
                type="password"
                value={passwordForm.next}
                onChange={(event) => updatePasswordField("next", event.target.value)}
                autoComplete="new-password"
              />
            </label>
            <label>
              <span>Yeni şifre tekrar</span>
              <input
                type="password"
                value={passwordForm.confirm}
                onChange={(event) => updatePasswordField("confirm", event.target.value)}
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

    if (active === "billing") {
      return (
        <section className="acct-section">
          <SectionIntro>Ödeme yöntemi ve fatura bilgileri.</SectionIntro>

          <SummaryBlock>
            <SummaryRow
              label="Ödeme yöntemi"
              value={receipt?.paymentMethod ?? (receipt ? "Kart ile ödeme" : "Ödeme yöntemi yok")}
              action={
                <Button appearance="primary" size="sm" onClick={() => setPaymentOpen(true)}>
                  {receipt?.paymentMethod ? "Güncelle" : "Kart Ekle"}
                </Button>
              }
            />
            <SummaryRow label="Fatura adresi" value={receipt?.billingAddress ?? "Eklenmedi"} />
            <SummaryRow
              label="Son işlem"
              value={receipt ? `${receipt.amount}${receipt.period}` : "Kayıt yok"}
            >
              {receipt?.date && <small className="acct-row__note">{receipt.date}</small>}
            </SummaryRow>
            <SummaryRow label="Fatura e-postası" value={receipt?.email ?? user.email} />
            <SummaryRow
              label="Pazarlama bildirimleri"
              value={receipt?.marketingConsent ? "Açık" : "Kapalı"}
            />
          </SummaryBlock>
        </section>
      );
    }

    if (active === "settings") {
      return (
        <section className="acct-section">
          <SectionIntro>
            Ayarlar şu anda aktif olan profile uygulanır. Aktif profil: {shownProfile?.name ?? user.name}.
          </SectionIntro>
          {shownProfile ? renderProfileSettings(shownProfile) : null}
        </section>
      );
    }

    if (active === "watchlist") {
      return (
        <section className="acct-section">
          <MediaGrid items={selectedLibrary.watchlist} empty="Listen henüz boş" />
        </section>
      );
    }

    if (active === "liked") {
      return (
        <section className="acct-section">
          <MediaGrid items={selectedLibrary.liked} empty="Henüz beğeni yok" />
        </section>
      );
    }

    return (
      <section className="acct-section">
        <MediaGrid items={selectedLibrary.history} empty="İzleme geçmişin boş" />
      </section>
    );
  };

  return (
    <PageLayout className="acct-page" mainClassName="acct-main">
      <div className="acct-shell">
        <aside className="acct-sidebar" aria-label="Hesap menüsü">
          <div className="acct-sidebar__profile">
            <img src={avatarFor(shownProfile)} alt="" />
            <div>
              <strong>{shownProfile?.name ?? user.name}</strong>
              <span>{formatPlan(plan)}</span>
            </div>
          </div>

          <nav className="acct-nav" aria-label="Hesap ayarları">
            <span className="acct-nav__title">Hesap</span>
            {ACCOUNT_NAV.map((item) => (
              <NavButton key={item.key} item={item} />
            ))}
            <span className="acct-nav__title">Kitaplık</span>
            {LIBRARY_NAV.map((item) => (
              <NavButton key={item.key} item={item} />
            ))}
          </nav>
        </aside>

        <div className="acct-content">
          <header className="acct-topbar">
            <div>
              <span>{navMeta.helper}</span>
              <h1>{navMeta.label}</h1>
            </div>
          </header>

          {receipt && (
            <div className="acct-receipt">
              <Receipt size={17} />
              <span>{receipt.planName} planı {receipt.date} tarihinde aktif edildi.</span>
            </div>
          )}

          {renderContent()}
        </div>
      </div>

      {editor && (
        <ProfileEditorModal
          mode={editor.mode}
          profile={editor.profile}
          onSave={saveProfile}
          onClose={() => setEditor(null)}
        />
      )}

      {emailOpen && (
        <EmailChangeModal
          email={user.email}
          onClose={() => setEmailOpen(false)}
          onSave={(email) => {
            dispatch(updateEmail(email));
            toast("E-posta adresi güncellendi.");
            setEmailOpen(false);
          }}
        />
      )}

      {paymentOpen && (
        <PaymentMethodModal
          email={user.email}
          receipt={receipt}
          onClose={() => setPaymentOpen(false)}
          onSave={(data) => {
            if (receipt) {
              dispatch(updatePaymentMethod(data));
            } else {
              dispatch(
                setReceipt({
                  planName: plan.name,
                  planId: plan.id,
                  amount: plan.price,
                  period: plan.period,
                  date: user.createdAt ?? new Date().toLocaleDateString("tr-TR"),
                  email: data.email,
                  paymentMethod: data.paymentMethod,
                  billingAddress: data.billingAddress,
                  marketingConsent: data.marketingConsent,
                }),
              );
            }
            toast("Ödeme yöntemi güncellendi.");
            setPaymentOpen(false);
          }}
        />
      )}

      {lockProfile && (
        <ProfileLockModal
          profile={lockProfile}
          onClose={() => setLockProfile(null)}
          onSave={(pin) => {
            dispatch(updateProfile({ ...lockProfile, locked: true, lockPin: pin }));
            toast("Profil kilidi oluşturuldu.");
            setLockProfile(null);
          }}
        />
      )}
    </PageLayout>
  );
}

