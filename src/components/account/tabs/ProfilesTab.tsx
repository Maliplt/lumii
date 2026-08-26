import { Pencil, Plus } from "lucide-react";
import { SectionIntro } from "../AccountUI";
import { avatarFor } from "../../../helpers";
import { MAX_PROFILES, type Profile } from "../../../store/store";
import OptimizedImage from "../../ui/OptimizedImage";

export default function ProfilesTab({
  profiles,
  profileCount,
  onEdit,
  onCreate,
  onDisableLock,
  onCreateLock,
}: {
  profiles: Profile[];
  profileCount: number;
  onEdit: (profile: Profile) => void;
  onCreate: () => void;
  onDisableLock: (profile: Profile) => void;
  onCreateLock: (profile: Profile) => void;
}) {
  return (
    <section className="acct-section">
      <SectionIntro>
        Profil oluşturma sade kalır; avatar ve kilit gibi ayrıntıları buradan
        yönetebilirsin.
      </SectionIntro>

      <div className="acct-profile-grid">
        {profiles.map((profile) => (
          <article className="acct-profile-card" key={profile.id}>
            <div className="acct-profile-card__head">
              <OptimizedImage src={avatarFor(profile)} alt="" />
              <div>
                <h3>{profile.name}</h3>
                <p>{profile.kids ? "Çocuk" : "Standart profil"}</p>
              </div>
              <button
                type="button"
                aria-label={`${profile.name} profilini düzenle`}
                onClick={() => onEdit(profile)}
              >
                <Pencil size={16} />
              </button>
            </div>

            <div className="acct-profile-controls">
              <div className="acct-control-line">
                <span>Profil kilidi</span>
                <button
                  type="button"
                  className={`acct-toggle-btn${profile.locked ? " is-on" : ""}`}
                  onClick={() =>
                    profile.locked
                      ? onDisableLock(profile)
                      : onCreateLock(profile)
                  }
                >
                  {profile.locked ? "Kilidi Kaldır" : "Kilit Oluştur"}
                </button>
              </div>
            </div>
          </article>
        ))}

        {profileCount < MAX_PROFILES && (
          <button
            type="button"
            className="acct-profile-card acct-profile-card--add"
            onClick={onCreate}
          >
            <span className="acct-profile-add__icon">
              <Plus size={22} />
            </span>
            <span className="acct-profile-add__text">
              <strong>Profil ekle</strong>
              <small>Profil adı ve türünü seç</small>
            </span>
          </button>
        )}
      </div>
    </section>
  );
}
