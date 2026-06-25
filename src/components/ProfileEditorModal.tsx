import { useState } from "react";
import { Button, Input, Modal, Toggle } from "rsuite";
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
    <Modal open onClose={onClose} size="sm" className="profile-modal">
      <Modal.Header>
        <Modal.Title>{mode === "create" ? "Yeni Profil" : "Profili Düzenle"}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="profile-edit">
          <div className="profile-edit__preview">
            <img src={AVATARS[avatar]} alt="" />
            <div>
              <strong>{name.trim() || "Profil adı"}</strong>
              <span>{kids ? "Çocuk profili" : "Standart profil"}</span>
            </div>
          </div>

          <label className="profile-edit__field" htmlFor="profile-name">
            <span>Profil adı</span>
            <Input
              id="profile-name"
              value={name}
              maxLength={20}
              placeholder="Örn. Salon"
              onChange={(value) => {
                setName(value);
                if (error) setError("");
              }}
            />
            {error && <small>{error}</small>}
          </label>

          <div className="profile-edit__field">
            <span>Avatar</span>
            <div className="profile-edit__avatars">
              {AVATAR_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={avatar === key ? "is-active" : ""}
                  onClick={() => setAvatar(key)}
                  aria-label={`Avatar ${key}`}
                >
                  <img src={AVATARS[key]} alt="" />
                </button>
              ))}
            </div>
          </div>

          <div className="profile-edit__kids">
            <div>
              <strong>Çocuk profili</strong>
              <span>Yalnızca çocuklara uygun içerikler gösterilir.</span>
            </div>
            <Toggle checked={kids} onChange={setKids} aria-label="Çocuk profili" />
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <div className="profile-edit__footer">
          <div>
            {mode === "edit" && canDelete && onDelete && (
              <Button
                appearance="subtle"
                className="profile-edit__delete"
                onClick={onDelete}
                startIcon={<Trash2 size={16} />}
              >
                Sil
              </Button>
            )}
          </div>
          <div>
            <Button appearance="ghost" onClick={onClose}>
              Vazgeç
            </Button>
            <Button appearance="primary" onClick={save}>
              Kaydet
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
