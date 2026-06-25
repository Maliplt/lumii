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
import MediaCard from "../components/MediaCard";
import ProfileEditorModal from "../components/ProfileEditorModal";
import StateView from "../components/StateView";
import { useToast, toastText } from "../components/Toast";
import { AVATARS, PACKAGES, useTitle } from "../helpers";
import {
  addProfile,
  changePassword,
  clearHistory,
  deleteProfile,
  setSetting,
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
  {
    key: "overview",
    label: "Hesap",
    helper: "Genel durum",
    icon: UserRound,
  },
  {
    key: "profiles",
    label: "Profiller",
    helper: "Kullanıcı profilleri",
    icon: Users,
  },
  {
    key: "membership",
    label: "Üyelik",
    helper: "Abonelik",
    icon: Crown,
  },
  {
    key: "security",
    label: "Güvenlik",
    helper: "Giriş ve cihazlar",
    icon: ShieldCheck,
  },
  {
    key: "billing",
    label: "Ödeme",
    helper: "Fatura ve kart",
    icon: CreditCard,
  },
  {
    key: "settings",
    label: "Ayarlar",
    helper: "Oynatma tercihleri",
    icon: Settings,
  },
];

const LIBRARY_NAV: NavItem[] = [
  {
    key: "watchlist",
    label: "Kaydedilenler",
    helper: "Kaydedilenler",
    icon: Bookmark,
  },
  {
    key: "liked",
    label: "Beğenilenler",
    helper: "Seçilen içerikler",
    icon: ThumbsUp,
  },
  {
    key: "history",
    label: "Geçmiş",
    helper: "Son izlenenler",
    icon: History,
  },
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

export default function AccountPage() {
  useTitle("Hesap");
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [active, setActive] = useState<SectionKey>("overview");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [showDevices, setShowDevices] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    current: "",
    next: "",
    confirm: "",
  });

  const user = useAppSelector((s) => s.auth.currentUser);
  const accounts = useAppSelector((s) => s.auth.accounts);
  const receipt = useAppSelector((s) => s.auth.receipt);
  const settings = useAppSelector((s) => s.settings);
  const library = useAppSelector((s) => s.library.activeId ? s.library.byProfile[s.library.activeId] : null);
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

  const saveProfile = (data: { name: string; avatar: string; kids: boolean }) => {
    if (editor?.mode === "edit" && editor.profile) {
      dispatch(updateProfile({ ...editor.profile, ...data }));
      toast(toastText.profileUpdated);
    } else {
      dispatch(addProfile(data));
      toast(toastText.profileAdded);
    }
    setEditor(null);
  };

  const removeProfile = () => {
    if (!editor?.profile || profileCount <= 1) return;
    dispatch(deleteProfile(editor.profile.id));
    toast(toastText.profileDeleted, "info");
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

  const updateAccountSetting = (
    key: keyof typeof settings,
    value: boolean,
    message: string,
  ) => {
    dispatch(setSetting({ key, value }));
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

  const renderContent = () => {
    if (active === "overview") {
      return (
        <section className="acct-section">
          <SectionIntro>
            Hesap bilgileri ve üyelik durumu.
          </SectionIntro>

          <div className="acct-overview-grid">
            <SummaryBlock>
              <SummaryRow label="Hesap sahibi" value={user.name} />
              <SummaryRow label="E-posta" value={user.email} />
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
              <SummaryRow label="Profil sayısı" value={`${profileCount}/${MAX_PROFILES}`} />
              <SummaryRow label="Kaydedilen içerik" value={`${selectedLibrary.watchlist.length} içerik`} />
            </SummaryBlock>
          </div>
        </section>
      );
    }

    if (active === "profiles") {
      return (
        <section className="acct-section">
          <div className="acct-profile-grid">
            {user.profiles.map((profile) => (
              <article className="acct-profile-card" key={profile.id}>
                <img src={AVATARS[profile.avatar]} alt="" />
                <div>
                  <h3>{profile.name}</h3>
                  <p>{profile.kids ? "Çocuk profili" : "Standart profil"}</p>
                  <div className="acct-profile-controls">
                    <div className="acct-control-line">
                      <span>Profil kilidi</span>
                      <button
                        type="button"
                        className={`acct-toggle-btn${profile.locked ? " is-on" : ""}`}
                        onClick={() =>
                          updateProfileSettings(
                            profile,
                            { locked: !profile.locked },
                            profile.locked ? "Profil kilidi kapatıldı." : "Profil kilidi açıldı.",
                          )
                        }
                      >
                        {profile.locked ? "Açık" : "Kapalı"}
                      </button>
                    </div>
                    <div className="acct-control-line acct-control-line--stack">
                      <span>Yürütme ayarları</span>
                      <div className="acct-segmented">
                        <button
                          type="button"
                          className={(profile.playback ?? "auto") === "auto" ? "is-active" : ""}
                          onClick={() =>
                            updateProfileSettings(
                              profile,
                              { playback: "auto" },
                              "Yürütme ayarı otomatik olarak güncellendi.",
                            )
                          }
                        >
                          Otomatik
                        </button>
                        <button
                          type="button"
                          className={(profile.playback ?? "auto") === "manual" ? "is-active" : ""}
                          onClick={() =>
                            updateProfileSettings(
                              profile,
                              { playback: "manual" },
                              "Yürütme ayarı manuel olarak güncellendi.",
                            )
                          }
                        >
                          Manuel
                        </button>
                      </div>
                    </div>
                    <div className="acct-control-line acct-control-line--stack">
                      <span>Bildirimler</span>
                      <div className="acct-segmented">
                        {[
                          ["all", "Tümü"],
                          ["important", "Önemli"],
                          ["off", "Kapalı"],
                        ].map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            className={(profile.notifications ?? "important") === value ? "is-active" : ""}
                            onClick={() =>
                              updateProfileSettings(
                                profile,
                                { notifications: value as Profile["notifications"] },
                                `Bildirimler ${label.toLowerCase()} olarak güncellendi.`,
                              )
                            }
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={`${profile.name} profilini düzenle`}
                  onClick={() => setEditor({ mode: "edit", profile })}
                >
                  <Pencil size={16} />
                </button>
              </article>
            ))}

            {profileCount < MAX_PROFILES && (
              <button
                type="button"
                className="acct-profile-card acct-profile-card--add"
                onClick={() => setEditor({ mode: "create" })}
              >
                <Plus size={20} />
                <span>Yeni profil</span>
                <small>Profil adı, avatar ve çocuk modu seç</small>
              </button>
            )}
          </div>
        </section>
      );
    }

    if (active === "membership") {
      return (
        <section className="acct-section">
          <SectionIntro>
            Abonelik ve erişim bilgileri.
          </SectionIntro>

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
            {plan.features.map((feature) => (
              <SummaryRow
                key={feature}
                label="Plan kapsamı"
                value={
                  <span className="acct-check-line">
                    <Check size={15} />
                    {feature}
                  </span>
                }
              />
            ))}
          </SummaryBlock>
        </section>
      );
    }

    if (active === "security") {
      return (
        <section className="acct-section">
          <SectionIntro>
            Giriş bilgileri ve açık oturumlar.
          </SectionIntro>

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
          <SectionIntro>
            Ödeme yöntemi ve fatura bilgileri.
          </SectionIntro>

          <SummaryBlock>
            <SummaryRow
              label="Ödeme yöntemi"
              value={receipt ? "Kart ile ödeme" : "Ödeme yöntemi yok"}
              action={<Button appearance="ghost" size="sm" onClick={() => navigate("/packages")}>Güncelle</Button>}
            />
            <SummaryRow label="Son işlem" value={receipt ? `${receipt.amount} ${receipt.period}` : "Kayıt yok"} />
            <SummaryRow label="Fatura e-postası" value={receipt?.email ?? user.email} />
          </SummaryBlock>
        </section>
      );
    }

    if (active === "settings") {
      return (
        <section className="acct-section">
          <SectionIntro>
            Oynatma ve geçmiş ayarları.
          </SectionIntro>

          <SummaryBlock>
            <SummaryRow
              label="Otomatik oynatma"
              value="Sıradaki bölümü otomatik başlat"
              action={
                <Toggle
                  checked={settings.autoplay}
                  onChange={(value) =>
                    updateAccountSetting(
                      "autoplay",
                      value,
                      value ? "Otomatik oynatma açıldı." : "Otomatik oynatma kapatıldı.",
                    )
                  }
                />
              }
            />
            <SummaryRow
              label="İzlemeye devam et"
              value="Ana sayfada devam satırını göster"
              action={
                <Toggle
                  checked={settings.continueRow}
                  onChange={(value) =>
                    updateAccountSetting(
                      "continueRow",
                      value,
                      value ? "Devam satırı açıldı." : "Devam satırı kapatıldı.",
                    )
                  }
                />
              }
            />
            <SummaryRow
              label="Ön izlemeler"
              value="İçerik kartlarında kısa ön izleme davranışı"
              action={
                <Toggle
                  checked={settings.previews}
                  onChange={(value) =>
                    updateAccountSetting(
                      "previews",
                      value,
                      value ? "Ön izlemeler açıldı." : "Ön izlemeler kapatıldı.",
                    )
                  }
                />
              }
            />
            <SummaryRow
              label="E-posta bildirimleri"
              value="Hesap ve üyelik bildirimleri"
              action={
                <Toggle
                  checked={settings.emailNotifications}
                  onChange={(value) =>
                    updateAccountSetting(
                      "emailNotifications",
                      value,
                      value ? "E-posta bildirimleri açıldı." : "E-posta bildirimleri kapatıldı.",
                    )
                  }
                />
              }
            />
            <SummaryRow
              label="Veri tasarrufu"
              value="Mobil ağlarda daha düşük veri kullanımı"
              action={
                <Toggle
                  checked={settings.dataSaver}
                  onChange={(value) =>
                    updateAccountSetting(
                      "dataSaver",
                      value,
                      value ? "Veri tasarrufu açıldı." : "Veri tasarrufu kapatıldı.",
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
        </section>
      );
    }

    if (active === "watchlist") {
      return (
        <section className="acct-section">
          <SectionIntro>{null}</SectionIntro>
          <MediaGrid items={selectedLibrary.watchlist} empty="Listen henüz boş" />
        </section>
      );
    }

    if (active === "liked") {
      return (
        <section className="acct-section">
          <SectionIntro>{null}</SectionIntro>
          <MediaGrid items={selectedLibrary.liked} empty="Henüz beğeni yok" />
        </section>
      );
    }

    return (
      <section className="acct-section">
        <SectionIntro>{null}</SectionIntro>
        <MediaGrid items={selectedLibrary.history} empty="İzleme geçmişin boş" />
      </section>
    );
  };

  return (
    <PageLayout className="acct-page" mainClassName="acct-main">
      <div className="acct-shell">
        <aside className="acct-sidebar" aria-label="Hesap menüsü">
          <div className="acct-sidebar__profile">
            <img src={AVATARS[user.profiles[0]?.avatar ?? "a1"]} alt="" />
            <div>
              <strong>{user.name}</strong>
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
          canDelete={profileCount > 1}
          onSave={saveProfile}
          onDelete={removeProfile}
          onClose={() => setEditor(null)}
        />
      )}
    </PageLayout>
  );
}
