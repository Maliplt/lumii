import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "rsuite";
import { Plus, Pencil } from "lucide-react";
import Logo from "../components/Logo";
import ProfileEditorModal from "../components/ProfileEditorModal";
import { useToast } from "../components/Toast";
import { AVATARS } from "../helpers";
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

  useEffect(() => {
    if (!currentUser) navigate("/login", { replace: true });
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  const enter = (p: Profile) => {
    if (manage) {
      setEditor({ mode: "edit", profile: p });
      return;
    }
    dispatch(selectProfile(p.id));
    navigate("/");
  };

  return (
    <div className="profiles-page">
      <header className="profiles-page__top">
        <Logo />
      </header>

      <div className="profiles-page__center">
        <h1 className="profiles-title">
          {manage ? "Profilleri Yönet" : "Kim izliyor?"}
        </h1>

        <div className="profiles-grid">
          {profiles.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`profile-card${manage ? " is-managing" : ""}`}
              onClick={() => enter(p)}
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
