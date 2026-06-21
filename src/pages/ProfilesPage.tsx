import { useEffect, useState, useRef, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { animate } from "animejs";
import { Button } from "rsuite";
import { Plus, Pencil } from "lucide-react";
import Logo from "../components/Logo";
import ProfileEditorModal from "../components/ProfileEditorModal";
import { useToast } from "../components/Toast";
import { AVATARS, useTitle, prefersReducedMotion } from "../helpers";
import {
  useAppSelector,
  useAppDispatch,
  selectProfile,
  addProfile,
  updateProfile,
  deleteProfile,
  type Profile,
} from "../store/store";

const MAX_PROFILES = 5;

type EditorState =
  | { mode: "create" }
  | { mode: "edit"; profile: Profile }
  | null;

export default function ProfilesPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const currentUser = useAppSelector((s) => s.auth.currentUser);
  const profiles = currentUser?.profiles ?? [];

  const [manage, setManage] = useState(false);
  const [editor, setEditor] = useState<EditorState>(null);
  const [leaving, setLeaving] = useState(false);
  const centerRef = useRef<HTMLDivElement>(null);
  useTitle(manage ? "Profilleri Yönet" : "Kim izliyor?");

  useEffect(() => {
    if (!currentUser) navigate("/login", { replace: true });
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  // profil sec: avatar zoom + ekran fade sonra gir
  const enter = (p: Profile, el: HTMLElement) => {
    if (manage) {
      setEditor({ mode: "edit", profile: p });
      return;
    }
    if (leaving) return;

    // azaltilmis harekette dogrudan gir
    if (prefersReducedMotion()) {
      dispatch(selectProfile(p.id));
      navigate("/");
      return;
    }

    setLeaving(true);

    const avatar = el.querySelector(".profile-card__avatar");
    if (avatar) animate(avatar, { scale: 1.3, duration: 460, ease: "out(2)" });
    if (centerRef.current)
      animate(centerRef.current, {
        opacity: 0,
        scale: 1.05,
        duration: 480,
        ease: "inOut(2)",
      });

    window.setTimeout(() => {
      dispatch(selectProfile(p.id));
      navigate("/");
    }, 470);
  };

  return (
    <div className="profiles-page">
      <header className="profiles-page__top">
        <Logo />
      </header>

      <div className="profiles-page__center" ref={centerRef}>
        <div className="profiles-head">
          <h1 className="profiles-title">
            {manage ? "Profilleri Yönet" : "Kim izliyor?"}
          </h1>
          <p className="profiles-subtitle">
            {manage
              ? "Düzenlemek istediğin profile dokun."
              : "Devam etmek için profilini seç."}
          </p>
        </div>

        <div className="profiles-grid">
          {profiles.map((p, i) => (
            <button
              key={p.id}
              type="button"
              className={`profile-card${manage ? " is-managing" : ""}`}
              style={{ "--i": i } as CSSProperties}
              onClick={(e) => enter(p, e.currentTarget)}
            >
              <span className="profile-card__avatar">
                <img src={AVATARS[p.avatar]} alt="" />
                {manage && (
                  <span className="profile-card__overlay">
                    <Pencil size={22} />
                  </span>
                )}
                {p.kids && <span className="profile-card__kids">KIDS</span>}
              </span>
              <span className="profile-card__name">{p.name}</span>
            </button>
          ))}

          {!manage && profiles.length < MAX_PROFILES && (
            <button
              type="button"
              className="profile-card profile-card--add"
              style={{ "--i": profiles.length } as CSSProperties}
              onClick={() => setEditor({ mode: "create" })}
            >
              <span className="profile-card__avatar profile-card__avatar--add">
                <Plus size={42} />
              </span>
              <span className="profile-card__name">Profil Ekle</span>
            </button>
          )}
        </div>

        <Button
          appearance="ghost"
          className="profiles-manage-btn"
          onClick={() => setManage((m) => !m)}
        >
          {manage ? "Bitti" : "Profilleri Yönet"}
        </Button>
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
    </div>
  );
}
