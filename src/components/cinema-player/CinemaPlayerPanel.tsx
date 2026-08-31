import { Check, ChevronLeft, ChevronRight, ClosedCaption, Gauge, Info, SlidersHorizontal } from "lucide-react";
import type { RefObject } from "react";
import type { SubtitleOption } from "../../services/subtitles";
import ModalCloseButton from "../modals/ModalCloseButton";
import type { CinemaQualityOption, CinemaSourceOption } from "./cinemaPlayerTypes";
import type { CinemaCaptionsController } from "./useCinemaSubtitles";

export type CinemaOpenPanel = "captions" | "settings" | null;
export type CinemaSettingsSection = "root" | "quality" | "speed" | "captions" | "info";

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

interface CinemaPlayerPanelProps {
  panelRef: RefObject<HTMLDivElement | null>;
  openPanel: Exclude<CinemaOpenPanel, null>;
  settingsSection: CinemaSettingsSection;
  live: boolean;
  qualityLabel?: string;
  qualityOptions: CinemaQualityOption[];
  sourceOptions: CinemaSourceOption[];
  activeSourceId?: string;
  subtitleOptions: SubtitleOption[];
  subtitleSourceOptions: SubtitleOption[];
  subtitleLanguages: SubtitleOption[];
  playbackRate: number;
  captions: CinemaCaptionsController;
  onClose: () => void;
  onSectionChange: (section: CinemaSettingsSection) => void;
  onRateChange: (rate: number) => void;
  onQualitySelect?: (id: string) => void;
  onSourceSelect?: (id: string) => void;
}

function classes(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function CinemaPlayerPanel({
  panelRef,
  openPanel,
  settingsSection,
  live,
  qualityLabel,
  qualityOptions,
  sourceOptions,
  activeSourceId,
  subtitleOptions,
  subtitleSourceOptions,
  subtitleLanguages,
  playbackRate,
  captions,
  onClose,
  onSectionChange,
  onRateChange,
  onQualitySelect,
  onSourceSelect,
}: CinemaPlayerPanelProps) {
  return (
    <div ref={panelRef} className="cine-panel" role="dialog" aria-label={openPanel === "captions" ? "Altyazılar" : "Oynatıcı ayarları"}>
      <div className="cine-panel__head">
        {settingsSection !== "root" && openPanel === "settings" ? (
          <button type="button" onClick={() => onSectionChange("root")}><ChevronLeft size={18} /> Geri</button>
        ) : <strong>{openPanel === "captions" ? "Altyazılar" : "Ayarlar"}</strong>}
        <span className="cine-panel__head-actions">
          {openPanel === "settings" && settingsSection === "root" && (
            <button type="button" onClick={() => onSectionChange("info")} aria-label="Kaynak bilgileri"><Info size={17} /></button>
          )}
          <ModalCloseButton standalone className="cine-shared-close" onClose={onClose} />
        </span>
      </div>

      {openPanel === "captions" && (
        <div className="cine-panel__list">
          <button type="button" className={captions.selectedId === "off" ? "is-selected" : ""} onClick={() => captions.select("off")}><span>Kapalı<small>Altyazı gösterme</small></span>{captions.selectedId === "off" && <Check size={17} />}</button>
          {subtitleLanguages.map((option) => (
            <button key={option.language} type="button" className={captions.selectedLanguage === option.language ? "is-selected" : ""} onClick={() => captions.select(option.id)}>
              <span>{option.language === "tur" ? "Türkçe" : "İngilizce"}</span>{captions.selectedLanguage === option.language && <Check size={17} />}
            </button>
          ))}
          {!subtitleOptions.length && <p className="cine-panel__empty">Bu içerik için altyazı bulunamadı.</p>}
        </div>
      )}

      {openPanel === "settings" && settingsSection === "root" && (
        <div className="cine-panel__list cine-panel__list--root">
          {live && !qualityOptions.length && (
            <div className="cine-panel__info">
              <SlidersHorizontal size={19} />
              <span><strong>Otomatik kalite</strong><small>{qualityLabel ?? "Yayına göre optimize edilir"}</small></span>
              <Check size={17} />
            </div>
          )}
          {!!qualityOptions.length && <button type="button" onClick={() => onSectionChange("quality")}><SlidersHorizontal size={19} /><span>Görüntü Kalitesi<small>{qualityLabel ?? "Otomatik"}</small></span><ChevronRight size={18} /></button>}
          {!live && <button type="button" onClick={() => onSectionChange("speed")}><Gauge size={19} /><span>Oynatma Hızı<small>{playbackRate}×</small></span><ChevronRight size={18} /></button>}
          {!live && <button type="button" onClick={() => onSectionChange("captions")}><ClosedCaption size={19} /><span>Altyazı Görünümü<small>Boyut, zemin ve renk</small></span><ChevronRight size={18} /></button>}
        </div>
      )}

      {openPanel === "settings" && settingsSection === "quality" && (
        <div className="cine-panel__list">{qualityOptions.map((option) => <button key={option.id} type="button" disabled={!option.available} className={option.active ? "is-selected" : ""} onClick={() => onQualitySelect?.(option.id)}><span>{option.label}<small>{option.active ? "Şu anda oynatılıyor" : "Kullanılabilir"}</small></span>{option.active && <Check size={17} />}</button>)}</div>
      )}
      {openPanel === "settings" && settingsSection === "speed" && (
        <div className="cine-panel__list">{SPEEDS.map((speed) => <button key={speed} type="button" className={playbackRate === speed ? "is-selected" : ""} onClick={() => onRateChange(speed)}><span>{speed === 1 ? "Normal" : `${speed}×`}</span>{playbackRate === speed && <Check size={17} />}</button>)}</div>
      )}
      {openPanel === "settings" && settingsSection === "info" && (
        <div className="cine-source-info">
          <section>
            <h3>Kaynak</h3>
            <div className="cine-panel__list cine-panel__list--sources">{sourceOptions.map((option) => <button key={option.id} type="button" className={activeSourceId === option.id ? "is-selected" : ""} onClick={() => onSourceSelect?.(option.id)}><span>{option.provider} · {option.quality}<small>{option.release} · {option.sizeLabel}</small></span>{activeSourceId === option.id && <Check size={17} />}</button>)}</div>
            {!sourceOptions.length && <p>Otomatik yayın kaynağı kullanılıyor.</p>}
          </section>
          {!live && <section>
            <h3>Altyazı Kaynağı</h3>
            <div className="cine-panel__list cine-panel__list--sources">{subtitleSourceOptions.map((option) => <button key={option.id} type="button" className={captions.selectedId === option.id ? "is-selected" : ""} onClick={() => captions.select(option.id)}><span>{option.provider}<small>{option.fileName || option.releaseName}</small></span>{captions.selectedId === option.id && <Check size={17} />}</button>)}</div>
            {!subtitleSourceOptions.length && <p>Altyazı kaynağı bulunamadı.</p>}
          </section>}
        </div>
      )}
      {openPanel === "settings" && settingsSection === "captions" && (
        <div className="cine-caption-settings">
          <div className={classes("cine-caption-preview", `is-${captions.style.size}`, `is-${captions.style.color}`, `has-${captions.style.background}-background`, captions.style.italic && "is-italic", captions.style.bold && "is-bold")}><span>Altyazı önizlemesi</span></div>
          <label>Boyut<div>{(["small", "medium", "large"] as const).map((value) => <button key={value} type="button" className={captions.style.size === value ? "is-selected" : ""} onClick={() => captions.setStyle({ ...captions.style, size: value })}>{value === "small" ? "Küçük" : value === "medium" ? "Orta" : "Büyük"}</button>)}</div></label>
          <label>Zemin<div>{(["none", "soft", "solid"] as const).map((value) => <button key={value} type="button" className={captions.style.background === value ? "is-selected" : ""} onClick={() => captions.setStyle({ ...captions.style, background: value })}>{value === "none" ? "Yok" : value === "soft" ? "Yumuşak" : "Koyu"}</button>)}</div></label>
          <label>Renk<div className="cine-color-options">{(["white", "yellow", "cyan"] as const).map((value) => <button key={value} type="button" aria-label={value === "white" ? "Beyaz" : value === "yellow" ? "Sarı" : "Camgöbeği"} className={classes(`is-${value}`, captions.style.color === value && "is-selected")} onClick={() => captions.setStyle({ ...captions.style, color: value })}><i /></button>)}</div></label>
          <label>Stil<div><button type="button" className={captions.style.italic ? "is-selected" : ""} onClick={() => captions.setStyle({ ...captions.style, italic: !captions.style.italic })}><em>İtalik</em></button><button type="button" className={captions.style.bold ? "is-selected" : ""} onClick={() => captions.setStyle({ ...captions.style, bold: !captions.style.bold })}><strong>Kalın</strong></button></div></label>
          <label>Altyazı Kayması <output>{captions.manualOffset > 0 ? "+" : ""}{captions.manualOffset.toFixed(2)} sn</output><div className="cine-offset-options"><button type="button" onClick={() => captions.adjustOffset(-0.5)}>-0.50</button><button type="button" onClick={() => captions.adjustOffset(-0.25)}>-0.25</button><button type="button" onClick={captions.resetOffset}>Sıfırla</button><button type="button" onClick={() => captions.adjustOffset(0.25)}>+0.25</button><button type="button" onClick={() => captions.adjustOffset(0.5)}>+0.50</button></div></label>
        </div>
      )}
    </div>
  );
}
