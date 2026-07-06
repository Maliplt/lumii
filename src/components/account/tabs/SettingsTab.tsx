import { Button, Toggle } from "rsuite";
import { SectionIntro, SummaryBlock, SummaryRow } from "../AccountUI";
import { avatarFor } from "../../../helpers";
import type { Profile } from "../../../store/store";

export default function SettingsTab({
  profile,
  fallbackName,
  historyCount,
  onSetting,
  onClearHistory,
}: {
  profile: Profile | null;
  fallbackName: string;
  historyCount: number;
  onSetting: (changes: Partial<Profile>, message: string) => void;
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
                <img src={avatarFor(profile)} alt="" />
                {profile.name}
              </span>
            }
          />
          <SummaryRow
            label="Otomatik oynatma"
            value="Sonraki bölüm ve önizlemeler kendiliğinden başlasın"
            action={
              <Toggle
                checked={(profile.playback ?? "auto") === "auto"}
                className="profile-rsuite-toggle"
                aria-label="Otomatik oynatma"
                onChange={(checked) =>
                  onSetting(
                    { playback: checked ? "auto" : "manual" },
                    checked
                      ? "Otomatik oynatma açıldı."
                      : "Otomatik oynatma kapatıldı.",
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
                checked={(profile.notifications ?? "important") !== "off"}
                className="profile-rsuite-toggle"
                aria-label="E-posta bildirimleri"
                onChange={(checked) =>
                  onSetting(
                    { notifications: checked ? "all" : "off" },
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
