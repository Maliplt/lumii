import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Nav, Button, Toggle, Tag, Panel } from "rsuite";
import { Check, Plus, Pencil, Bookmark, ThumbsUp, History } from "lucide-react";
import { MotionIcon } from "motion-icons-react";
import PageLayout from "../components/PageLayout";
import MediaCard from "../components/MediaCard";
import ProfileEditorModal from "../components/ProfileEditorModal";
import { useToast } from "../components/Toast";
import { AVATARS, PACKAGES } from "../helpers";
import {
  useAppSelector,
  useAppDispatch,
  toggleWatchlist,
  toggleLiked,
  clearHistory,
  logout,
  setSetting,
  selectProfile,
  addProfile,
  updateProfile,
  deleteProfile,
  selectLibrary,
  selectActiveProfile,
  type SavedItem,
  type Profile,
} from "../store/store";

const ACCOUNT_SECTIONS = [
  { key: "genel", label: "Genel Bakış", icon: "LayoutDashboard" },
  { key: "profiller", label: "Profiller", icon: "Users" },
  { key: "plan", label: "Üyelik", icon: "Crown" },
  { key: "makbuz", label: "Makbuzlarım", icon: "Receipt" },
  { key: "ayarlar", label: "Ayarlar", icon: "Settings" },
] as const;

const LIBRARY_SECTIONS = [
  { key: "watchlist", label: "İzleme Listem", icon: "Bookmark" },
  { key: "liked", label: "Beğendiklerim", icon: "ThumbsUp" },
  { key: "history", label: "İzleme Geçmişi", icon: "History" },
] as const;

const PLAN_FEATURES = [
  "SD Kalite (480p)",
  "Reklamlı İzleme",
  "1 Cihaz",
  "Temel Oyunlar",
];

const SETTING_ROWS = [
  {
    key: "autoplay",
    label: "Otomatik Oynatma",
    desc: "Oynatıcı açılınca video kendiliğinden başlasın.",
  },
  {
    key: "continueRow",
    label: '"İzlemeye Devam Et" Satırı',
    desc: "Yarım kalan içerikleri anasayfada göster.",
  },
] as const;

const MAX_PROFILES = 5;

type EditorState =
  | { mode: "create" }
  | { mode: "edit"; profile: Profile }
  | null;

function MediaGrid({
  items,
  empty,
  onRemove,
}: {
  items: SavedItem[];
  empty: string;
  onRemove?: (it: SavedItem) => void;
}) {
  if (items.length === 0) return <p className="account-empty">{empty}</p>;
  return (
    <div className="search-grid">
      {items.map((it) => (
        <MediaCard
          key={`${it.media_type}-${it.id}`}
          item={it}
          type={it.media_type}
          onRemove={onRemove ? () => onRemove(it) : undefined}
        />
      ))}
    </div>
  );
}

export default function AccountPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const dispatch = useAppDispatch();

  const currentUser = useAppSelector((s) => s.auth.currentUser);
  const activeProfile = useAppSelector(selectActiveProfile);
  const { watchlist, liked, history } = useAppSelector(selectLibrary);
  const settings = useAppSelector((s) => s.settings);
  const receipt = useAppSelector((s) => s.auth.receipt);

  const [active, setActive] = useState("genel");
  const [editor, setEditor] = useState<EditorState>(null);

  // koruma
  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  const profiles = currentUser.profiles;
  const activePlan = PACKAGES.find((p) => p.id === currentUser.plan);

  const removeWatchlist = (it: SavedItem) => {
    dispatch(toggleWatchlist(it));
    toast("İzleme listesinden çıkarıldı.");
  };

  const removeLiked = (it: SavedItem) => {
    dispatch(toggleLiked(it));
    toast("Beğeni geri alındı.");
  };

  const handlePassword = () => {
    toast(
      `Sıfırlama bağlantısı ${currentUser.email} adresine gönderildi.`,
      "info",
    );
  };

  const handleLogout = () => {
    dispatch(logout());
    toast("Çıkış yapıldı.", "info");
    navigate("/");
  };

  const STATS = [
    { key: "watchlist", label: "İzleme Listem", count: watchlist.length, Icon: Bookmark },
    { key: "liked", label: "Beğendiklerim", count: liked.length, Icon: ThumbsUp },
    { key: "history", label: "İzleme Geçmişi", count: history.length, Icon: History },
  ];

  const renderSection = () => {
    switch (active) {
      case "genel":
        return (
          <section className="account-section">
            <h2 className="account-section__title">Genel Bakış</h2>

            <div className="account-overview-card">
              <span className="account-overview-card__avatar">
                {activeProfile?.avatar ? (
                  <img src={AVATARS[activeProfile.avatar]} alt="" />
                ) : (
                  currentUser.name.charAt(0).toUpperCase()
                )}
              </span>
              <div className="account-overview-card__info">
                <span className="account-overview-card__eyebrow">
                  İzlenen profil
                </span>
                <strong>{activeProfile?.name ?? currentUser.name}</strong>
                <span className="account-overview-card__mail">
                  {currentUser.email}
                </span>
              </div>
              <Tag
                className={`account-plan-tag account-plan-tag--${currentUser.plan || "free"}`}
              >
                {activePlan?.name ?? "Ücretsiz"} Plan
              </Tag>
              <Button
                appearance="ghost"
                className="account-overview-card__switch"
                onClick={() => navigate("/profiles")}
                startIcon={
                  <MotionIcon name="Users" size={16} trigger="hover" animation="pop" />
                }
              >
                Profil Değiştir
              </Button>
            </div>

            <div className="account-stats">
              {STATS.map(({ key, label, count, Icon }) => (
                <button
                  key={key}
                  type="button"
                  className="account-stat"
                  onClick={() => setActive(key)}
                >
                  <span className="account-stat__icon">
                    <Icon size={20} />
                  </span>
                  <span className="account-stat__count">{count}</span>
                  <span className="account-stat__label">{label}</span>
                </button>
              ))}
            </div>

            <div className="account-detail-grid">
              <div className="account-info-row">
                <span>Hesap Sahibi</span>
                <strong>{currentUser.name}</strong>
              </div>
              <div className="account-info-row">
                <span>E-posta</span>
                <strong>{currentUser.email}</strong>
              </div>
              {currentUser.createdAt && (
                <div className="account-info-row">
                  <span>Üyelik Tarihi</span>
                  <strong>{currentUser.createdAt}</strong>
                </div>
              )}
              <div className="account-info-row">
                <span>Profiller</span>
                <strong>{profiles.length} profil</strong>
              </div>
            </div>

            <div className="account-overview-actions">
              <Button appearance="ghost" onClick={handlePassword}>
                Şifre Değiştir
              </Button>
              <Button
                appearance="subtle"
                className="account-logout-btn"
                onClick={handleLogout}
              >
                Çıkış Yap
              </Button>
            </div>
          </section>
        );

      case "profiller":
        return (
          <section className="account-section">
            <h2 className="account-section__title">Profiller</h2>
            <p className="account-section__sub">
              Her profil kendi izleme listesi, beğenileri ve geçmişine sahiptir.
            </p>
            <div className="account-profiles">
              {profiles.map((p) => (
                <div
                  key={p.id}
                  className={`account-profile-card${p.id === activeProfile?.id ? " active" : ""}`}
                >
                  <button
                    type="button"
                    className="account-profile-card__main"
                    onClick={() => {
                      dispatch(selectProfile(p.id));
                      toast(`${p.name} olarak izliyorsun.`);
                    }}
                  >
                    <span className="account-profile-card__avatar">
                      <img src={AVATARS[p.avatar]} alt="" />
                    </span>
                    <span className="account-profile-card__name">{p.name}</span>
                    {p.kids && (
                      <span className="account-profile-card__kids">KIDS</span>
                    )}
                    {p.id === activeProfile?.id && (
                      <span className="account-profile-card__active">Aktif</span>
                    )}
                  </button>
                  <button
                    type="button"
                    className="account-profile-card__edit"
                    aria-label="Profili düzenle"
                    onClick={() => setEditor({ mode: "edit", profile: p })}
                  >
                    <Pencil size={15} />
                  </button>
                </div>
              ))}

              {profiles.length < MAX_PROFILES && (
                <button
                  type="button"
                  className="account-profile-card account-profile-card--add"
                  onClick={() => setEditor({ mode: "create" })}
                >
                  <span className="account-profile-card__avatar account-profile-card__avatar--add">
                    <Plus size={26} />
                  </span>
                  <span className="account-profile-card__name">Profil Ekle</span>
                </button>
              )}
            </div>
          </section>
        );

      case "plan":
        return (
          <section className="account-section">
            <h2 className="account-section__title">Üyelik</h2>
            <Panel className="account-plan" bordered>
              <div className="account-plan__info">
                <Tag
                  className={`account-plan-tag account-plan-tag--${currentUser.plan || "free"}`}
                >
                  {activePlan?.name ?? "Ücretsiz"} Plan
                </Tag>
                <ul>
                  {(activePlan?.features ?? PLAN_FEATURES).map((f) => (
                    <li key={f}>
                      <Check size={14} /> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="account-plan__cta">
                <p>
                  {currentUser.plan
                    ? "Planın aktif, iyi seyirler!"
                    : "Reklamsız ve 4K izlemek için planını yükselt."}
                </p>
                <Button appearance="primary" onClick={() => navigate("/packages")}>
                  Paketleri Gör
                </Button>
              </div>
            </Panel>
          </section>
        );

      case "makbuz":
        return (
          <section className="account-section">
            <h2 className="account-section__title">Makbuzlarım</h2>
            {receipt ? (
              <Panel className="account-receipt" bordered>
                <div className="account-receipt__header">
                  <span className="account-receipt__badge">Ödeme Makbuzu</span>
                  <span className="account-receipt__date">{receipt.date}</span>
                </div>
                <div className="account-receipt__body">
                  <div className="account-receipt__row">
                    <span>Plan</span>
                    <strong>{receipt.planName}</strong>
                  </div>
                  <div className="account-receipt__row">
                    <span>Tutar</span>
                    <strong className="account-receipt__amount">
                      {receipt.amount}
                      {receipt.period}
                    </strong>
                  </div>
                  <div className="account-receipt__row">
                    <span>Hesap</span>
                    <strong>{receipt.email}</strong>
                  </div>
                  <div className="account-receipt__row">
                    <span>Durum</span>
                    <strong className="account-receipt__status">
                      <Check size={13} /> Ödendi
                    </strong>
                  </div>
                </div>
              </Panel>
            ) : (
              <p className="account-empty">Henüz bir ödeme makbuzun yok.</p>
            )}
          </section>
        );

      case "ayarlar":
        return (
          <section className="account-section">
            <h2 className="account-section__title">Ayarlar</h2>
            <div className="account-settings">
              {SETTING_ROWS.map(({ key, label, desc }) => (
                <div key={key} className="account-setting-row">
                  <div>
                    <strong>{label}</strong>
                    <p>{desc}</p>
                  </div>
                  <Toggle
                    checked={settings[key]}
                    onChange={(value) => dispatch(setSetting({ key, value }))}
                    aria-label={label}
                  />
                </div>
              ))}
            </div>
          </section>
        );

      case "watchlist":
        return (
          <section className="account-section">
            <h2 className="account-section__title">
              İzleme Listem {watchlist.length > 0 && <em>({watchlist.length})</em>}
            </h2>
            <MediaGrid
              items={watchlist}
              empty="İzleme listen henüz boş."
              onRemove={removeWatchlist}
            />
          </section>
        );

      case "liked":
        return (
          <section className="account-section">
            <h2 className="account-section__title">
              Beğendiklerim {liked.length > 0 && <em>({liked.length})</em>}
            </h2>
            <MediaGrid
              items={liked}
              empty="Henüz beğendiğin bir içerik yok."
              onRemove={removeLiked}
            />
          </section>
        );

      case "history":
        return (
          <section className="account-section">
            <div className="account-section__head">
              <h2 className="account-section__title">
                İzleme Geçmişi {history.length > 0 && <em>({history.length})</em>}
              </h2>
              {history.length > 0 && (
                <Button
                  appearance="subtle"
                  size="sm"
                  onClick={() => {
                    dispatch(clearHistory());
                    toast("İzleme geçmişi temizlendi.", "info");
                  }}
                >
                  Geçmişi Temizle
                </Button>
              )}
            </div>
            <MediaGrid items={history} empty="İzleme geçmişin henüz boş." />
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <PageLayout className="account-page" mainClassName="account-main">
      <div className="account-layout">
        <aside className="account-side">
          <div className="account-side__profile">
            <span className="account-side__avatar">
              {activeProfile?.avatar ? (
                <img src={AVATARS[activeProfile.avatar]} alt="" />
              ) : (
                currentUser.name.charAt(0).toUpperCase()
              )}
            </span>
            <div className="account-side__profile-info">
              <strong>{activeProfile?.name ?? currentUser.name}</strong>
              <span>{activePlan?.name ?? "Ücretsiz"} Plan</span>
            </div>
          </div>

          <div className="account-side__group">
            <span className="account-side__label">Hesap</span>
            <Nav
              vertical
              appearance="subtle"
              className="account-nav"
              activeKey={active}
              onSelect={(key) => key && setActive(key as string)}
            >
              {ACCOUNT_SECTIONS.map(({ key, label, icon }) => (
                <Nav.Item key={key} eventKey={key}>
                  <MotionIcon
                    name={icon}
                    size={16}
                    trigger="hover"
                    animation="pop"
                  />
                  <span>{label}</span>
                </Nav.Item>
              ))}
            </Nav>
          </div>

          <div className="account-side__group">
            <span className="account-side__label">Kitaplık</span>
            <Nav
              vertical
              appearance="subtle"
              className="account-nav"
              activeKey={active}
              onSelect={(key) => key && setActive(key as string)}
            >
              {LIBRARY_SECTIONS.map(({ key, label, icon }) => (
                <Nav.Item key={key} eventKey={key}>
                  <MotionIcon
                    name={icon}
                    size={16}
                    trigger="hover"
                    animation="pop"
                  />
                  <span>{label}</span>
                </Nav.Item>
              ))}
            </Nav>
          </div>
        </aside>

        <div className="account-content">{renderSection()}</div>
      </div>

      {editor && (
        <ProfileEditorModal
          mode={editor.mode}
          profile={editor.mode === "edit" ? editor.profile : undefined}
          canDelete={profiles.length > 1}
          onClose={() => setEditor(null)}
          onSave={(data) => {
            if (editor.mode === "create") {
              dispatch(addProfile(data));
              toast(`${data.name} profili oluşturuldu.`);
            } else {
              dispatch(updateProfile({ ...editor.profile, ...data }));
              toast("Profil güncellendi.");
            }
            setEditor(null);
          }}
          onDelete={() => {
            if (editor.mode !== "edit") return;
            dispatch(deleteProfile(editor.profile.id));
            toast("Profil silindi.", "info");
            setEditor(null);
          }}
        />
      )}
    </PageLayout>
  );
}
