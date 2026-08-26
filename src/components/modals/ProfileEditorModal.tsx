import { useState } from "react";
import { Button, Toggle } from "rsuite";
import { AVATAR_CATEGORIES, AVATARS, DEFAULT_AVATAR } from "../../helpers";
import ModalHero from "./ModalHero";
import type { Profile } from "../../store/store";
import OptimizedImage from "../ui/OptimizedImage";
import ModalInputField from "./ModalInputField";
import ProfileModalShell from "./ProfileModalShell";

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
    <ProfileModalShell
      onClose={onClose}
      size={isEdit ? "lg" : "sm"}
      className={`profile-edit-modal${isEdit ? " profile-edit-modal--full" : ""}`}
      footer={
        <>
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
        </>
      }
    >
        <ModalHero
          className="profile-edit__hero"
          title={isEdit ? "Profili düzenle" : "Profil ekle"}
          description="Bu hesabı izleyecek kişi için profil bilgilerini düzenle."
        />

        <div className="profile-edit__identity">
          <OptimizedImage src={AVATARS[avatar]} alt="" priority />
          <ModalInputField
            id="profile-name"
            label="Profil adı"
            value={name}
            maxLength={20}
            placeholder="Ad"
            error={error}
            onChange={(value) => {
              setName(value);
              if (error) setError("");
            }}
          />
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
                        <OptimizedImage src={item.src} alt="" />
                        <span>{item.name}</span>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}
    </ProfileModalShell>
  );
}
