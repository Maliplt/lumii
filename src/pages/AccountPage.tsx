import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Receipt } from "lucide-react";
import PageLayout from "../components/PageLayout";
import NavButton from "../components/account/NavButton";
import EmailChangeModal from "../components/modals/EmailChangeModal";
import PaymentMethodModal from "../components/modals/PaymentMethodModal";
import ProfileEditorModal from "../components/modals/ProfileEditorModal";
import ProfileLockModal from "../components/modals/ProfileLockModal";
import OverviewTab from "../components/account/tabs/OverviewTab";
import ProfilesTab from "../components/account/tabs/ProfilesTab";
import MembershipTab from "../components/account/tabs/MembershipTab";
import SecurityTab from "../components/account/tabs/SecurityTab";
import BillingTab from "../components/account/tabs/BillingTab";
import SettingsTab from "../components/account/tabs/SettingsTab";
import LibraryTab from "../components/account/tabs/LibraryTab";
import { ACCOUNT_NAV, LIBRARY_NAV, PLAN_FALLBACK, formatPlan, validatePassword, type SectionKey, type EditorState } from "../components/account/accountData";
import { findPackage, avatarFor, useTitle, useToast, toastText } from "../helpers";
import { addProfile, changePassword, clearHistory, selectLibrary, selectShownProfile, setReceipt, updateEmail, updatePaymentMethod, updateProfile, useAppDispatch, useAppSelector, type Profile } from "../store/store";

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

  const currentUser = useAppSelector((s) => s.auth.currentUser);
  const shownProfile = useAppSelector(selectShownProfile);
  const accounts = useAppSelector((s) => s.auth.accounts);
  const receipt = useAppSelector((s) => s.auth.receipt);
  const selectedLibrary = useAppSelector(selectLibrary);
  const account = accounts.find((item) => item.email === currentUser?.email);

  const plan = useMemo(
    () => findPackage(currentUser?.plan) ?? PLAN_FALLBACK,
    [currentUser?.plan],
  );

  const navMeta = useMemo(
    () =>
      [...ACCOUNT_NAV, ...LIBRARY_NAV].find((item) => item.key === active) ??
      ACCOUNT_NAV[0],
    [active],
  );

  const profileCount = currentUser?.profiles.length ?? 0;

  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [navigate, currentUser]);

  if (!currentUser) return null;

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

  const updateProfileSettings = (
    profile: Profile,
    changes: Partial<Profile>,
    message: string,
  ) => {
    dispatch(updateProfile({ ...profile, ...changes }));
    toast(message, "info");
  };

  const renderActiveTab = () => {
    switch (active) {
      case "overview":
        return (
          <OverviewTab
            user={currentUser}
            plan={plan}
            shownProfileName={shownProfile?.name ?? currentUser.name}
            profileCount={profileCount}
            onChangeEmail={() => setEmailOpen(true)}
            onManagePlan={() => setActive("membership")}
          />
        );
      case "profiles":
        return (
          <ProfilesTab
            profiles={currentUser.profiles}
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
            user={currentUser}
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
            email={currentUser.email}
            onToggleDevices={(shown) =>
              toast(
                shown ? "Cihaz listesi açıldı." : "Cihaz listesi kapatıldı.",
                "info",
              )
            }
            onSubmitPassword={(current, next, confirm) => {
              const error = validatePassword(
                current,
                next,
                confirm,
                account?.password ?? "",
              );
              if (error) {
                toast(error.message, error.type);
                return false;
              }
              dispatch(changePassword({ current, next }));
              toast("Şifre güncellendi.");
              return true;
            }}
          />
        );
      case "billing":
        return (
          <BillingTab
            user={currentUser}
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
            fallbackName={currentUser.name}
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
              <strong>{shownProfile?.name ?? currentUser.name}</strong>
              <span>{formatPlan(plan)}</span>
            </div>
          </div>

          <nav className="acct-nav" aria-label="Hesap ayarları">
            <span className="acct-nav__title">Hesap</span>
            {ACCOUNT_NAV.map((item) => (
              <NavButton
                key={item.key}
                item={item}
                active={active === item.key}
                onSelect={setActive}
              />
            ))}
            <span className="acct-nav__title">Kitaplık</span>
            {LIBRARY_NAV.map((item) => (
              <NavButton
                key={item.key}
                item={item}
                active={active === item.key}
                onSelect={setActive}
              />
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
          email={currentUser.email}
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
          email={currentUser.email}
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
                  date:
                    currentUser.createdAt ?? new Date().toLocaleDateString("tr-TR"),
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
