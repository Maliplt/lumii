import { useState } from "react";
import { Button, Input, SelectPicker, Toggle } from "rsuite";
import { CheckCircle2, Key, Eye, EyeOff, Sparkles, AlertCircle } from "lucide-react";
import { SectionIntro, SummaryBlock, SummaryRow } from "../AccountUI";
import { avatarFor } from "../../../helpers";
import type { Profile, ProfilePreferences } from "../../../store/store";
import OptimizedImage from "../../ui/OptimizedImage";
import { validateRealDebridToken } from "../../../services/realdebrid";

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
  const currentRdKey =
    profile?.preferences.realDebridApiKey ||
    import.meta.env.VITE_REALDEBRID_API_KEY?.trim() ||
    "";
  const [rdInputKey, setRdInputKey] = useState(currentRdKey);
  const [showKey, setShowKey] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    status: "idle" | "success" | "error";
    message: string;
  }>({ status: "idle", message: "" });

  const handleSaveRdKey = async () => {
    const trimmed = rdInputKey.trim();
    if (!trimmed) {
      onPreference({ realDebridApiKey: "" }, "Real-Debrid API anahtarı kaldırıldı.");
      setVerificationResult({ status: "idle", message: "" });
      return;
    }

    setIsVerifying(true);
    setVerificationResult({ status: "idle", message: "" });

    try {
      const result = await validateRealDebridToken(trimmed);
      if (result.valid) {
        onPreference({ realDebridApiKey: trimmed }, "Real-Debrid API anahtarı başarıyla kaydedildi.");
        setVerificationResult({
          status: "success",
          message: result.isPremium
            ? `Premium Aktif (${result.daysRemaining} gün kaldı) · Kullanıcı: ${result.user?.username}`
            : `Hesap Geçerli (Ücretsiz/Süresi Dolmuş) · Kullanıcı: ${result.user?.username}`,
        });
      } else {
        setVerificationResult({
          status: "error",
          message: result.error || "API anahtarı doğrulanamadı.",
        });
      }
    } catch {
      setVerificationResult({
        status: "error",
        message: "Doğrulama sırasında sunucuya ulaşılamadı.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const providerOptions = [
    {
      label: "Otomatik (Torrentio + Real-Debrid, yoksa VidFast)",
      value: "auto",
    },
    {
      label: "Torrentio + Real-Debrid (Öncelikli Kendi Player'ınız)",
      value: "torrentio",
    },
    {
      label: "VidFast (Harici Embed Player)",
      value: "vidfast",
    },
  ];

  return (
    <section className="acct-section">
      <SectionIntro>
        Ayarlar şu anda aktif olan profile uygulanır. Aktif profil:{" "}
        {profile?.name ?? fallbackName}.
      </SectionIntro>

      {profile && (
        <>
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

          <h3 className="acct-section-heading" style={{ marginTop: "2rem", marginBottom: "0.75rem" }}>
            <Sparkles size={18} style={{ display: "inline", verticalAlign: "middle", marginRight: "6px", color: "var(--accent)" }} />
            Akış & Oynatıcı Tercihleri (Torrentio + Real-Debrid)
          </h3>
          <SectionIntro>
            Real-Debrid API anahtarınızı tanımlayarak VidFast iframe yerine doğrudan 4K/1080p yüksek hızlı, reklamsız video akışlarını Tenet'in kendi video oynatıcısında izleyebilirsiniz.
          </SectionIntro>

          <SummaryBlock>
            <SummaryRow
              label="Oynatıcı Sağlayıcısı"
              value="Film ve dizilerin hangi kaynaktan açılacağını belirleyin"
              action={
                <SelectPicker
                  cleanable={false}
                  searchable={false}
                  data={providerOptions}
                  value={profile.preferences.preferredStreamProvider ?? "auto"}
                  style={{ width: 280 }}
                  onChange={(val) => {
                    if (val) {
                      onPreference(
                        { preferredStreamProvider: val as ProfilePreferences["preferredStreamProvider"] },
                        "Oynatıcı sağlayıcı tercihi güncellendi.",
                      );
                    }
                  }}
                />
              }
            />
            <SummaryRow
              label="Real-Debrid API Key"
              value={
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ position: "relative", width: "100%", maxWidth: "340px" }}>
                      <Input
                        type={showKey ? "text" : "password"}
                        placeholder="Real-Debrid API Token yapıştırın..."
                        value={rdInputKey}
                        onChange={setRdInputKey}
                        style={{ paddingRight: "40px" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        style={{
                          position: "absolute",
                          right: "8px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          color: "var(--text-secondary)",
                          cursor: "pointer",
                        }}
                        aria-label={showKey ? "Gizle" : "Göster"}
                      >
                        {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <Button
                      appearance="primary"
                      loading={isVerifying}
                      onClick={handleSaveRdKey}
                      style={{ minWidth: "90px" }}
                    >
                      Kaydet
                    </Button>
                  </div>

                  {verificationResult.status === "success" && (
                    <span style={{ color: "#4ade80", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "4px" }}>
                      <CheckCircle2 size={14} /> {verificationResult.message}
                    </span>
                  )}
                  {verificationResult.status === "error" && (
                    <span style={{ color: "#f87171", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "4px" }}>
                      <AlertCircle size={14} /> {verificationResult.message}
                    </span>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    <Key size={13} />
                    <span>API anahtarınızı almak için:</span>
                    <a
                      href="https://real-debrid.com/apitoken"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--accent)", textDecoration: "underline" }}
                    >
                      real-debrid.com/apitoken
                    </a>
                  </div>
                </div>
              }
            />
          </SummaryBlock>
        </>
      )}
    </section>
  );
}
