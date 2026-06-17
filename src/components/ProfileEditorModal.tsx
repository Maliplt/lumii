import { useState } from "react";
import { Modal, Input, Toggle, Button } from "rsuite";
import { Trash2 } from "lucide-react";
import { AVATARS } from "../helpers";
import type { Profile } from "../store/store";

const AVATAR_KEYS = Object.keys(AVATARS);

interface Props {
  mode: "create" | "edit";
  profile?: Profile;
  canDelete?: boolean;
  onSave: (data: { name: string; avatar: string; kids: boolean }) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export default function ProfileEditorModal({
  mode,
  profile,
  canDelete = false,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const [name, setName] = useState(profile?.name ?? "");
  const [avatar, setAvatar] = useState(profile?.avatar ?? AVATAR_KEYS[0]);
  const [kids, setKids] = useState(profile?.kids ?? false);
  const [error, setError] = useState("");

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Lütfen bir profil adı girin.");
      return;
    }
    onSave({ name: trimmed, avatar, kids });
  };

  return (
    <Modal open onClose={onClose} size="sm" className="profile-editor-modal">
      <Modal.Header>
        <Modal.Title>
          {mode === "create" ? "Yeni Profil" : "Profili Düzenle"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="profile-editor">
          <div className="profile-editor__preview">
            <img src={AVATARS[avatar]} alt="" />
          </div>

          <div className="profile-editor__field">
            <label htmlFor="profile-name">Profil Adı</label>
            <Input
              id="profile-name"
              value={name}
              maxLength={20}
              placeholder="Örn. Salon, Çocuklar"
              onChange={(v) => {
                setName(v);
                if (error) setError("");
              }}
            />
            {error && <span className="profile-editor__error">{error}</span>}
          </div>

          <div className="profile-editor__field">
            <label>Avatar Seç</label>
            <div className="profile-editor__avatars">
              {AVATAR_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`profile-editor__avatar${avatar === key ? " active" : ""}`}
                  onClick={() => setAvatar(key)}
                  aria-label={`Avatar ${key}`}
                >
                  <img src={AVATARS[key]} alt="" />
                </button>
              ))}
            </div>
          </div>

          <div className="profile-editor__kids">
            <div>
              <strong>Çocuk Profili</strong>
              <p>Yalnızca çocuklara uygun içerikler gösterilir.</p>
            </div>
            <Toggle checked={kids} onChange={setKids} aria-label="Çocuk profili" />
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        {mode === "edit" && canDelete && onDelete && (
          <Button
            appearance="subtle"
            className="profile-editor__delete"
            onClick={onDelete}
            startIcon={<Trash2 size={16} />}
          >
            Sil
          </Button>
        )}
        <Button appearance="ghost" onClick={onClose}>
          Vazgeç
        </Button>
        <Button appearance="primary" onClick={save}>
          Kaydet
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
