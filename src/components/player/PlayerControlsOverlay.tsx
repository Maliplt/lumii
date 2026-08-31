import type { ChangeEvent } from "react";
import {
  ArrowLeft,
  Maximize,
  Minimize,
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from "lucide-react";
import type { SubtitleOption } from "../../services/subtitles";
import PlaybackSettings from "./PlaybackSettings";
import { CaptionsButton, ProgressBar, VolumeControl } from "./PlayerControls";
import type { QualityPickerOption, SourcePickerOption } from "./playerTypes";
import type { SubtitleTrackController } from "./useSubtitleTrack";

interface PlayerControlsOverlayProps {
  visible: boolean;
  live: boolean;
  title: string;
  playing: boolean;
  muted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  buffered: number;
  atLive: boolean;
  fullscreen: boolean;
  qualityLabel: string;
  subtitles: SubtitleTrackController;
  subtitleOptions: SubtitleOption[];
  sourceOptions: SourcePickerOption[];
  qualityOptions: QualityPickerOption[];
  activeSourceId?: string;
  onBack?: () => void;
  onUpgrade?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onSourceSelect?: (id: string) => void;
  onQualitySelect?: (id: string) => void;
  onSettingsOpen: (open: boolean) => void;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onVolumeChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSeek: (event: ChangeEvent<HTMLInputElement>) => void;
  onSkip: (seconds: number) => void;
  onGoLive: () => void;
  onToggleFullscreen: () => void;
}

export default function PlayerControlsOverlay({
  visible,
  live,
  title,
  playing,
  muted,
  volume,
  currentTime,
  duration,
  buffered,
  atLive,
  fullscreen,
  qualityLabel,
  subtitles,
  subtitleOptions,
  sourceOptions,
  qualityOptions,
  activeSourceId,
  onBack,
  onUpgrade,
  onPrevious,
  onNext,
  onSourceSelect,
  onQualitySelect,
  onSettingsOpen,
  onTogglePlay,
  onToggleMute,
  onVolumeChange,
  onSeek,
  onSkip,
  onGoLive,
  onToggleFullscreen,
}: PlayerControlsOverlayProps) {
  return (
    <div className={`player-controls${visible ? " visible" : ""}`}>
      <div className="player-controls__top">
        <button className="player-btn" onClick={onBack ?? (() => window.history.back())} aria-label="Geri dön">
          <ArrowLeft size={22} />
        </button>
        <h1 className="player-controls__title">{title}</h1>
      </div>

      <div className="player-controls__bottom">
        {live ? (
          <div className="player-live-rail" aria-label="Canlı yayın">
            <div className="player-live-rail__track"><span className="player-live-rail__fill" /><span className="player-live-rail__edge" /></div>
            <div className="player-live-rail__meta"><span>CANLI YAYIN</span>{!atLive && <span>GERİDESİN</span>}</div>
          </div>
        ) : (
          <ProgressBar currentTime={currentTime} duration={duration} buffered={buffered} onSeek={onSeek} ariaLabel="İlerleme" />
        )}

        <div className="player-controls__row">
          <div className="player-controls__left">
            {live && onPrevious && <button className="player-btn player-btn--channel" onClick={onPrevious} aria-label="Önceki kanal" title="Önceki kanal"><SkipBack size={21} /></button>}
            {!live && <button className="player-btn" onClick={() => onSkip(-10)} aria-label="10 sn geri"><SkipBack size={20} /></button>}
            <button className="player-btn player-btn--play" onClick={onTogglePlay} aria-label={playing ? "Duraklat" : "Oynat"}>
              {playing ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
            </button>
            {!live && <button className="player-btn" onClick={() => onSkip(10)} aria-label="10 sn ileri"><SkipForward size={20} /></button>}
            <VolumeControl muted={muted} volume={volume} onToggleMute={onToggleMute} onVolumeChange={onVolumeChange} muteButtonLabel="Ses" sliderLabel="Ses seviyesi" />
            {live && onNext && <button className="player-btn player-btn--channel" onClick={onNext} aria-label="Sonraki kanal" title="Sonraki kanal"><SkipForward size={21} /></button>}
          </div>

          <div className="player-controls__right">
            {live ? (
              <button type="button" className={`player-live-pill${atLive ? "" : " is-behind"}`} onClick={onGoLive} title={atLive ? "Canlı yayındasın" : "Canlı yayına dön"}>
                <span className="player-live-dot" />{atLive ? "Canlı" : "Canlıya Dön"}
              </button>
            ) : (
              <><span className="player-quality-badge">{qualityLabel}</span>{onUpgrade && <button className="player-upgrade-btn" onClick={onUpgrade} title="Planını yükselt">Yükselt</button>}</>
            )}
            {!live && subtitleOptions.length > 0 && <CaptionsButton enabled={subtitles.selectedId !== "off"} onToggle={subtitles.toggle} />}
            {!live && sourceOptions.length > 0 && onSourceSelect && onQualitySelect && (
              <PlaybackSettings
                options={sourceOptions}
                activeId={activeSourceId}
                onOpenChange={onSettingsOpen}
                onSourceSelect={onSourceSelect}
                qualityOptions={qualityOptions}
                onQualitySelect={onQualitySelect}
                subtitleOptions={subtitleOptions}
                activeSubtitleId={subtitles.selectedId}
                onSubtitleSelect={subtitles.select}
                captionAppearance={subtitles.appearance}
                onCaptionAppearanceChange={subtitles.setAppearance}
              />
            )}
            <button className="player-btn" onClick={onToggleFullscreen} aria-label={fullscreen ? "Ekranı küçült" : "Ekranı büyüt"}>
              {fullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
