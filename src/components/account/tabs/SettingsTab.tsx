import { Button, Toggle } from "rsuite";
import { SectionIntro, SummaryBlock, SummaryRow } from "../AccountUI";
import { avatarFor } from "../../../helpers";
import type { Profile, ProfilePreferences } from "../../../store/store";
import OptimizedImage from "../../ui/OptimizedImage";

export default function SettingsTab({
  profile,
  fallbackName,
  historyCount,
  onPreference,
  onClearHistory,
}: {
  profile: Profile | null;
  fallbackName: string;
  historyCount: number;
  onPreference: (changes: Partial<ProfilePreferences>, message: string) => void;
  onClearHistory: () => void;
}) {
  return (
    <section className="acct-section">
      <SectionIntro>
        Ayarlar şu anda aktif olan profile uygulanır. Aktif profil:{" "}
        {profile?.name ?? fallbackName}.
      </SectionIntro>
      {profile && (
        <SummaryBlock>
          <SummaryRow
            label="Aktif profil"
            value={
              <span className="acct-settings-profile">
                <OptimizedImage src={avatarFor(profile)} alt="" />
                {profile.name}
              </span>
            }
          />
          <SummaryRow
            label="Otomatik oynatma"
            value="İçerik açıldığında video kendiliğinden başlasın"
            action={
              <Toggle
                checked={profile.preferences.autoplay}
                className="profile-rsuite-toggle"
                aria-label="Otomatik oynatma"
                onChange={(checked) =>
                  onPreference(
                    { autoplay: checked },
                    checked
                      ? "Otomatik oynatma açıldı."
                      : "Otomatik oynatma kapatıldı.",
                  )
                }
              />
            }
          />
          <SummaryRow
            label="Fragman önizlemeleri"
            value="İçerik kartlarında fragman önizleme seçeneğini göster"
            action={
              <Toggle
                checked={profile.preferences.previews}
                className="profile-rsuite-toggle"
                aria-label="Fragman önizlemeleri"
                onChange={(checked) =>
                  onPreference(
                    { previews: checked },
                    checked
                      ? "Fragman önizlemeleri açıldı."
                      : "Fragman önizlemeleri kapatıldı.",
                  )
                }
              />
            }
          />
          <SummaryRow
            label="İzlemeye devam et"
            value="Ana sayfada izlemeye devam et satırını göster"
            action={
              <Toggle
                checked={profile.preferences.showContinueWatching}
                className="profile-rsuite-toggle"
                aria-label="İzlemeye devam et satırı"
                onChange={(checked) =>
                  onPreference(
                    { showContinueWatching: checked },
                    checked
                      ? "İzlemeye devam et satırı açıldı."
                      : "İzlemeye devam et satırı kapatıldı.",
                  )
                }
              />
            }
          />
          <SummaryRow
            label="Bildirimler"
            value="E-posta bildirimlerini al"
            action={
              <Toggle
                checked={profile.preferences.emailNotifications}
                className="profile-rsuite-toggle"
                aria-label="E-posta bildirimleri"
                onChange={(checked) =>
                  onPreference(
                    { emailNotifications: checked },
                    checked ? "Bildirimler açıldı." : "Bildirimler kapatıldı.",
                  )
                }
              />
            }
          />
          <SummaryRow
            label="İzleme geçmişi"
            value={`${historyCount} içerik`}
            action={
              <Button appearance="ghost" size="sm" onClick={onClearHistory}>
                Temizle
              </Button>
            }
          />
        </SummaryBlock>
      )}
    </section>
  );
}
