import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Receipt } from "lucide-react";
import PageLayout from "../components/PageLayout";
import EmailChangeModal from "../components/modals/EmailChangeModal";
import PaymentMethodModal from "../components/modals/PaymentMethodModal";
import ProfileEditorModal from "../components/modals/ProfileEditorModal";
import ProfileLockModal from "../components/modals/ProfileLockModal";
import { useToast, toastText } from "../components/Toast";
import {
  ACCOUNT_NAV,
  LIBRARY_NAV,
  PLAN_FALLBACK,
  formatPlan,
  avatarFor,
  type SectionKey,
  type NavItem,
  type EditorState,
  type PasswordForm,
} from "../components/account/accountData";
import {
  OverviewTab,
  ProfilesTab,
  MembershipTab,
  SecurityTab,
  BillingTab,
  SettingsTab,
  LibraryTab,
} from "../components/account/AccountTabs";
import { PACKAGES, useTitle } from "../helpers";
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
  type Profile,
} from "../store/store";

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
    () =>
      [...ACCOUNT_NAV, ...LIBRARY_NAV].find((item) => item.key === active) ??
      ACCOUNT_NAV[0],
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
      toast(
        "Yeni şifre en az 8 karakter olmalı ve eskisinden farklı olmalı.",
        "warning",
      );
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
    return (
      <button
        type="button"
        className={`acct-nav__item${active === item.key ? " is-active" : ""}`}
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

  const renderActiveTab = () => {
    switch (active) {
      case "overview":
        return (
          <OverviewTab
            user={user}
            plan={plan}
            shownProfileName={shownProfile?.name ?? user.name}
            profileCount={profileCount}
            onChangeEmail={() => setEmailOpen(true)}
            onManagePlan={() => setActive("membership")}
          />
        );
      case "profiles":
        return (
          <ProfilesTab
            profiles={user.profiles}
            profileCount={profileCount}
            onEdit={(profile) => setEditor({ mode: "edit", profile })}
            onCreate={() => setEditor({ mode: "create" })}
            onDisableLock={(profile) =>
              updateProfileSettings(
                profile,
                { locked: false, lockPin: undefined },
                "Profil kilidi kapatıldı.",
              )
            }
            onCreateLock={(profile) => setLockProfile(profile)}
          />
        );
      case "membership":
        return (
          <MembershipTab
            user={user}
            plan={plan}
            paymentMethod={receipt?.paymentMethod}
            billingAddress={receipt?.billingAddress}
            billingEmail={receipt?.email}
            onSeePlans={() => navigate("/packages")}
            onUpdatePayment={() => setPaymentOpen(true)}
          />
        );
      case "security":
        return (
          <SecurityTab
            email={user.email}
            showDevices={showDevices}
            onToggleDevices={() => {
              setShowDevices((prev) => !prev);
              toast(
                showDevices ? "Cihaz listesi kapatıldı." : "Cihaz listesi açıldı.",
                "info",
              );
            }}
            passwordForm={passwordForm}
            onPasswordField={updatePasswordField}
            onSubmitPassword={submitPassword}
          />
        );
      case "billing":
        return (
          <BillingTab
            user={user}
            paymentMethod={receipt?.paymentMethod}
            billingAddress={receipt?.billingAddress}
            billingEmail={receipt?.email}
            lastAmount={receipt ? `${receipt.amount}${receipt.period}` : undefined}
            lastDate={receipt?.date}
            marketingConsent={receipt?.marketingConsent}
            onUpdatePayment={() => setPaymentOpen(true)}
          />
        );
      case "settings":
        return (
          <SettingsTab
            profile={shownProfile}
            fallbackName={user.name}
            historyCount={selectedLibrary.history.length}
            onSetting={(changes, message) => {
              if (shownProfile)
                updateProfileSettings(shownProfile, changes, message);
            }}
            onClearHistory={() => {
              dispatch(clearHistory());
              toast("İzleme geçmişi temizlendi.", "info");
            }}
          />
        );
      case "watchlist":
        return (
          <LibraryTab items={selectedLibrary.watchlist} empty="Listen henüz boş" />
        );
      case "liked":
        return (
          <LibraryTab items={selectedLibrary.liked} empty="Henüz beğeni yok" />
        );
      default:
        return (
          <LibraryTab items={selectedLibrary.history} empty="İzleme geçmişin boş" />
        );
    }
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
              <span>
                {receipt.planName} planı {receipt.date} tarihinde aktif edildi.
              </span>
            </div>
          )}

          {renderActiveTab()}
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
            dispatch(
              updateProfile({ ...lockProfile, locked: true, lockPin: pin }),
            );
            toast("Profil kilidi oluşturuldu.");
            setLockProfile(null);
          }}
        />
      )}
    </PageLayout>
  );
}
