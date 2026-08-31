import { useRef, useState } from "react";
import {
  Check,
  AudioLines,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Languages,
  ListVideo,
  Settings,
  X,
} from "lucide-react";
import { useDismissableLayer } from "../../helpers";
import type {
  CaptionAppearance,
  QualityPickerOption,
  SourcePickerOption,
  SubtitlePickerOption,
} from "./playerTypes";

interface PlaybackSettingsProps {
  options: SourcePickerOption[];
  activeId?: string;
  onOpenChange: (open: boolean) => void;
  onSourceSelect: (id: string) => void;
  qualityOptions: QualityPickerOption[];
  onQualitySelect: (id: string) => void;
  subtitleOptions: SubtitlePickerOption[];
  activeSubtitleId: string;
  onSubtitleSelect: (id: string) => void;
  captionAppearance: CaptionAppearance;
  onCaptionAppearanceChange: (appearance: CaptionAppearance) => void;
}

type SettingsView = "main" | "quality" | "audio" | "subtitles" | "sources";

export default function PlaybackSettings({
  options,
  activeId,
  onOpenChange,
  onSourceSelect,
  qualityOptions,
  onQualitySelect,
  subtitleOptions,
  activeSubtitleId,
  onSubtitleSelect,
  captionAppearance,
  onCaptionAppearanceChange,
}: PlaybackSettingsProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<SettingsView>("main");
  const rootRef = useRef<HTMLDivElement>(null);
  const activeQuality = qualityOptions.find((option) => option.active)?.label ?? "—";
  const activeSource = options.find((option) => option.id === activeId);
  const compatibleAudioOptions = options.filter((option) => option.audioCompatible);
  const audioOptions = compatibleAudioOptions.filter((option) => {
    const matchingOptions = compatibleAudioOptions.filter((candidate) =>
      candidate.language === option.language
    );
    return option.id === (matchingOptions.find((candidate) => candidate.id === activeId)?.id
      ?? matchingOptions[0]?.id);
  });
  const activeSubtitle = activeSubtitleId === "off"
    ? "Kapalı"
    : subtitleOptions.find((option) => option.id === activeSubtitleId)?.label ?? "Kapalı";

  const close = () => {
    setOpen(false);
    onOpenChange(false);
    setView("main");
  };

  useDismissableLayer(rootRef, open, close, true);

  return (
    <div
      className="player-settings-wrap"
      ref={rootRef}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="player-btn"
        onClick={() => {
          setOpen(true);
          onOpenChange(true);
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Oynatma ayarları"
      >
        <Settings size={20} />
      </button>
      {open && (
        <section className="player-playback-settings" role="dialog" aria-label="Oynatma ayarları">
          <header className="player-playback-settings__header">
            {view !== "main" ? (
              <button type="button" className="player-playback-settings__back" onClick={() => setView("main")} aria-label="Ayarlar menüsüne dön">
                <ChevronLeft size={19} />
              </button>
            ) : <span />}
            <strong>
              {view === "main" && "Ayarlar"}
              {view === "quality" && "Kalite"}
              {view === "audio" && "Ses"}
              {view === "subtitles" && "Altyazılar"}
              {view === "sources" && "Kaynaklar"}
            </strong>
            <button type="button" onClick={close} aria-label="Ayarları kapat"><X size={18} /></button>
          </header>

          {view === "main" && (
            <div className="player-playback-settings__main">
              <button type="button" onClick={() => setView("quality")}><Gauge size={18} /><span><strong>Kalite</strong><small>{activeQuality}</small></span><ChevronRight size={18} /></button>
              {audioOptions.length > 0 && (
                <button type="button" onClick={() => setView("audio")}><AudioLines size={18} /><span><strong>Ses</strong><small>{activeSource?.language ?? "Otomatik"}</small></span><ChevronRight size={18} /></button>
              )}
              <button type="button" onClick={() => setView("subtitles")}><Languages size={18} /><span><strong>Altyazılar</strong><small>{activeSubtitle}</small></span><ChevronRight size={18} /></button>
              <button type="button" onClick={() => setView("sources")}><ListVideo size={18} /><span><strong>Kaynaklar</strong><small>{options.length} uygun seçenek</small></span><ChevronRight size={18} /></button>
            </div>
          )}

          {view === "audio" && (
            <div className="player-playback-settings__list">
              {audioOptions.map((option) => {
                const active = option.id === activeId;
                return (
                  <button type="button" key={option.id} className={active ? "is-active" : ""} onClick={() => onSourceSelect(option.id)}>
                    <span>{option.language}</span>{active && <Check size={18} />}
                  </button>
                );
              })}
            </div>
          )}

          {view === "quality" && (
            <div className="player-playback-settings__list">
              {qualityOptions.map((option) => (
                <button type="button" key={option.id} disabled={!option.available} className={option.active ? "is-active" : ""} onClick={() => onQualitySelect(option.id)}>
                  <span>{option.label}</span>{option.active && <Check size={18} />}
                </button>
              ))}
            </div>
          )}

          {view === "subtitles" && (
            <div className="player-playback-settings__list player-playback-settings__list--subtitles">
              <div className="player-subtitle-picker" aria-label="Altyazı kaynakları">
                <button type="button" className={activeSubtitleId === "off" ? "is-active" : ""} onClick={() => onSubtitleSelect("off")}>
                  <span>Kapalı</span>{activeSubtitleId === "off" && <Check size={18} />}
                </button>
                {subtitleOptions.map((option) => (
                  <button type="button" key={option.id} className={activeSubtitleId === option.id ? "is-active" : ""} title={option.label} onClick={() => onSubtitleSelect(option.id)}>
                    <span>{option.label}</span>{activeSubtitleId === option.id && <Check size={18} />}
                  </button>
                ))}
              </div>
              <div className={`player-caption-preview player-caption-preview--${captionAppearance.background}`}>
                <span className={`is-${captionAppearance.color}`}>Altyazı önizlemesi</span>
              </div>
              <p className="player-playback-settings__section-label">Yazı boyutu</p>
              <div className="player-caption-options">
                {(["small", "medium", "large"] as const).map((size) => (
                  <button type="button" key={size} className={captionAppearance.size === size ? "is-active" : ""} onClick={() => onCaptionAppearanceChange({ ...captionAppearance, size })}>
                    {size === "small" ? "Küçük" : size === "medium" ? "Orta" : "Büyük"}
                  </button>
                ))}
              </div>
              <p className="player-playback-settings__section-label">Yazı rengi</p>
              <div className="player-caption-options player-caption-options--colors">
                {(["white", "yellow", "cyan"] as const).map((color) => (
                  <button type="button" key={color} className={captionAppearance.color === color ? "is-active" : ""} onClick={() => onCaptionAppearanceChange({ ...captionAppearance, color })}>
                    <i className={`is-${color}`} />{color === "white" ? "Beyaz" : color === "yellow" ? "Sarı" : "Turkuaz"}
                  </button>
                ))}
              </div>
              <p className="player-playback-settings__section-label">Arka plan rengi</p>
              <div className="player-caption-options">
                {(["none", "soft", "solid"] as const).map((background) => (
                  <button type="button" key={background} className={captionAppearance.background === background ? "is-active" : ""} onClick={() => onCaptionAppearanceChange({ ...captionAppearance, background })}>
                    {background === "none" ? "Şeffaf" : background === "soft" ? "Koyu" : "Siyah"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {view === "sources" && (
            <div className="player-source-list">
              {options.map((option) => {
                const active = option.id === activeId;
                return (
                  <article key={option.id} className={`player-source-option${active ? " is-active" : ""}`}>
                    <span className="player-source-option__main">
                      <span className="player-source-option__badges">
                        <em className="is-ready">Hazır</em>
                        <em className={`is-quality is-${option.quality.toLocaleLowerCase("en-US")}`}>{option.quality}</em>
                        {option.codec !== "Bilinmiyor" && <em>{option.codec}</em>}
                        {option.audioCodec !== "Bilinmiyor" && <em>{option.audioCodec}</em>}
                        <em>{option.sizeLabel}</em><em>{option.catalog}</em>
                        {option.provider !== option.catalog && <em>{option.provider}</em>}
                      </span>
                      <strong className="player-source-option__release" title={option.release}>{option.release}</strong>
                    </span>
                    <button type="button" className="player-source-option__select" disabled={active} onClick={() => onSourceSelect(option.id)}>{active ? "Seçili" : "Seç"}</button>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
