import { useState } from "react";
import { Button, Input, Modal, Toggle } from "rsuite";
import { X } from "lucide-react";
import { AVATAR_CATEGORIES, AVATARS, DEFAULT_AVATAR } from "../../helpers";
import type { Profile } from "../../store/store";

interface Props {
  mode: "create" | "edit";
  profile?: Profile;
  canDelete?: boolean;
  onSave: (data: { name: string; kids: boolean; avatar: string }) => void;
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
  const [kids, setKids] = useState(profile?.kids ?? false);
  const [avatar, setAvatar] = useState(profile?.avatar ?? DEFAULT_AVATAR);
  const [error, setError] = useState("");
  const isEdit = mode === "edit";

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Lütfen bir profil adı girin.");
      return;
    }
    onSave({ name: trimmed, kids, avatar });
  };

  return (
    <Modal
      open
      onClose={onClose}
      size={isEdit ? "lg" : "sm"}
      className={`profile-modal profile-edit-modal${isEdit ? " profile-edit-modal--full" : ""}`}
    >
      <div className="profile-modal__head">
        <button
          type="button"
          className="profile-modal__close"
          onClick={onClose}
          aria-label="Kapat"
        >
          <X size={22} />
        </button>
      </div>

      <Modal.Body>
        <div className="profile-edit__hero">
          <h2>{isEdit ? "Profili düzenle" : "Profil ekle"}</h2>
          <p>Bu hesabı izleyecek kişi için profil bilgilerini düzenle.</p>
        </div>

        <div className="profile-edit__identity">
          <img src={AVATARS[avatar]} alt="" />
          <label className="profile-edit__field" htmlFor="profile-name">
            <span>Profil adı</span>
            <Input
              id="profile-name"
              value={name}
              maxLength={20}
              placeholder="Ad"
              onChange={(value) => {
                setName(value);
                if (error) setError("");
              }}
            />
            {error && <small>{error}</small>}
          </label>
        </div>

        <div className="profile-edit__kid-toggle">
          <div>
            <strong>Çocuk Profili</strong>
            <span>Sadece çocuklara uygun dizileri ve filmleri göster</span>
          </div>
          <Toggle
            checked={kids}
            onChange={setKids}
            className="profile-rsuite-toggle"
            aria-label="Çocuk Profili"
          />
        </div>

        {isEdit && (
          <div className="profile-edit__avatars">
            <h3 className="profile-edit__avatars-title">Profil resmi</h3>
            <div className="avatar-modal__list">
              {AVATAR_CATEGORIES.map((group) => (
                <section className="avatar-modal__group" key={group.id}>
                  <h3>{group.label}</h3>
                  <div>
                    {group.avatars.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        className={avatar === item.key ? "is-active" : ""}
                        onClick={() => setAvatar(item.key)}
                        aria-label={`${item.name} avatarı`}
                      >
                        <img src={item.src} alt="" />
                        <span>{item.name}</span>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <div className="profile-edit__footer">
          <Button appearance="primary" onClick={save} block>
            Profili Kaydet
          </Button>
          {isEdit && canDelete && onDelete && (
            <button
              type="button"
              className="profile-edit__delete"
              onClick={onDelete}
            >
              Profili sil
            </button>
          )}
        </div>
      </Modal.Footer>
    </Modal>
  );
}
