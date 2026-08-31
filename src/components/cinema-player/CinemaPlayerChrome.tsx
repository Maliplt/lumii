import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ClosedCaption,
  Heart,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Settings,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useState, type CSSProperties } from "react";
import ModalCloseButton from "../modals/ModalCloseButton";
import type { CinemaNextEpisode, CinemaPlayerMode } from "./cinemaPlayerTypes";
import type { CinemaOpenPanel } from "./CinemaPlayerPanel";
import CinemaProgress from "./CinemaProgress";
import type { CinemaCaptionsController } from "./useCinemaSubtitles";

interface CinemaPlayerChromeProps {
  mode: CinemaPlayerMode;
  title: string;
  eyebrow?: string;
  controlsVisible: boolean;
  live: boolean;
  atLiveEdge: boolean;
  ended: boolean;
  showNextPrompt: boolean;
  nextEpisode?: CinemaNextEpisode;
  timelineCurrent: number;
  timelineDuration: number;
  timelineBuffered: number;
  playing: boolean;
  mediaReady: boolean;
  volume: number;
  liked: boolean;
  captions: CinemaCaptionsController;
  openPanel: CinemaOpenPanel;
  fullscreen: boolean;
  onBack?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onLike?: () => void;
  onJumpToLive: () => void;
  onDismissNext: () => void;
  onTimelineSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onSeekBy: (seconds: number) => void;
  onTogglePlayback: () => void;
  onOpenPanel: (panel: Exclude<CinemaOpenPanel, null>) => void;
  onToggleFullscreen: () => void;
}

function classes(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function CinemaPlayerChrome({
  mode,
  title,
  eyebrow,
  controlsVisible,
  live,
  atLiveEdge,
  ended,
  showNextPrompt,
  nextEpisode,
  timelineCurrent,
  timelineDuration,
  timelineBuffered,
  playing,
  mediaReady,
  volume,
  liked,
  captions,
  openPanel,
  fullscreen,
  onBack,
  onPrevious,
  onNext,
  onLike,
  onJumpToLive,
  onDismissNext,
  onTimelineSeek,
  onVolumeChange,
  onToggleMute,
  onSeekBy,
  onTogglePlayback,
  onOpenPanel,
  onToggleFullscreen,
}: CinemaPlayerChromeProps) {
  const [volumeThumbHovered, setVolumeThumbHovered] = useState(false);
  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.55 ? Volume1 : Volume2;

  return (
    <div className="cine-chrome" aria-hidden={!controlsVisible}>
      <header className="cine-chrome__top">
        <div className="cine-chrome__identity">
          {onBack && <button type="button" className="cine-icon-btn cine-icon-btn--back" onClick={onBack} aria-label="Geri dön"><ArrowLeft size={21} /></button>}
          <div>{eyebrow && <span>{eyebrow}</span>}<h1>{title}</h1></div>
        </div>
        <div className="cine-chrome__status">
          {live && <button type="button" className={classes("cine-live", atLiveEdge && "is-current")} onClick={onJumpToLive} aria-label={atLiveEdge ? "Canlı yayın" : "Canlı yayına dön"}><i /> Canlı</button>}
        </div>
      </header>

      {showNextPrompt && nextEpisode && (
        <aside className="cine-next-prompt">
          <ModalCloseButton standalone className="cine-shared-close cine-next-prompt__close" onClose={onDismissNext} />
          {nextEpisode.image && <img src={nextEpisode.image} alt="" />}
          <div><span>Sıradaki</span><strong>{nextEpisode.title}</strong><small>{nextEpisode.eyebrow}</small></div>
          <button type="button" className="cine-next-prompt__play" onClick={nextEpisode.onPlay}><Play size={15} fill="currentColor" /> Sonraki Bölüm</button>
        </aside>
      )}

      {(!ended || showNextPrompt) && (
        <footer className="cine-chrome__bottom">
          <CinemaProgress currentTime={timelineCurrent} duration={timelineDuration} buffered={timelineBuffered} playing={playing} live={live} ready={mediaReady} onSeek={onTimelineSeek} />
          <div className="cine-actions">
            <div className="cine-actions__group cine-actions__left">
              <button type="button" className={classes("cine-icon-btn", "cine-volume-toggle", volume === 0 && "is-muted")} onClick={onToggleMute} aria-label={volume ? "Sesi kapat" : "Sesi aç"} aria-pressed={volume === 0}><VolumeIcon size={21} /></button>
              <div className={classes("cine-volume-control", volumeThumbHovered && "is-thumb-hovered")} style={{ "--cine-volume": `${volume * 100}%` } as CSSProperties}>
                <input className="cine-volume" type="range" min={0} max={1} step={0.01} value={volume} aria-label="Ses düzeyi" onPointerMove={(event) => { const bounds = event.currentTarget.getBoundingClientRect(); const thumbX = bounds.left + bounds.width * volume; setVolumeThumbHovered(Math.abs(event.clientX - thumbX) <= 12); }} onPointerLeave={() => setVolumeThumbHovered(false)} onInput={(event) => onVolumeChange(Number(event.currentTarget.value))} onChange={(event) => onVolumeChange(Number(event.currentTarget.value))} />
                <output>{Math.round(volume * 100)}</output>
              </div>
              {live && onPrevious && <button type="button" className="cine-icon-btn" onClick={onPrevious} aria-label="Önceki kanal"><ChevronLeft size={20} /></button>}
              {live && onNext && <button type="button" className="cine-icon-btn" onClick={onNext} aria-label="Sonraki kanal"><ChevronRight size={20} /></button>}
            </div>
            <div className="cine-bottom-transport">
              {!live && mode === "episode" && onPrevious && <button type="button" className="cine-transport-episode" onClick={onPrevious} aria-label="Önceki bölüm"><SkipBack size={19} fill="currentColor" /></button>}
              <button type="button" className="cine-transport-seek" onClick={() => onSeekBy(-10)} aria-label="10 saniye geri"><RotateCcw size={23} /><b>10</b></button>
              <button type="button" className="cine-transport-play" onClick={onTogglePlayback} aria-label={playing ? "Duraklat" : "Oynat"}>{playing ? <Pause size={27} fill="currentColor" /> : <Play size={27} fill="currentColor" />}</button>
              <button type="button" className="cine-transport-seek" onClick={() => onSeekBy(10)} aria-label="10 saniye ileri"><RotateCw size={23} /><b>10</b></button>
              {!live && mode === "episode" && onNext && <button type="button" className="cine-transport-episode" onClick={onNext} aria-label="Sonraki bölüm"><SkipForward size={19} fill="currentColor" /></button>}
            </div>
            <div className="cine-actions__group cine-actions__right">
              {!live && onLike && <button type="button" className={classes("cine-icon-btn", "cine-like", liked && "is-liked")} onClick={onLike} aria-label={liked ? "Beğeniyi kaldır" : "Beğen"} aria-pressed={liked}><Heart size={20} fill={liked ? "currentColor" : "none"} /></button>}
              {!live && <button type="button" data-cine-panel-trigger className={classes("cine-icon-btn", "cine-cc-button", captions.selectedId !== "off" && "is-active")} onClick={() => onOpenPanel("captions")} aria-label="Altyazılar" aria-expanded={openPanel === "captions"}><ClosedCaption size={22} />{captions.loading && <i className="cine-icon-btn__busy" />}</button>}
              <button type="button" data-cine-panel-trigger className={classes("cine-icon-btn", openPanel === "settings" && "is-active")} onClick={() => onOpenPanel("settings")} aria-label="Ayarlar" aria-expanded={openPanel === "settings"}><Settings size={20} /></button>
              <button type="button" className="cine-icon-btn" onClick={onToggleFullscreen} aria-label={fullscreen ? "Tam ekrandan çık" : "Tam ekran"}>{fullscreen ? <Minimize size={20} /> : <Maximize size={20} />}</button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
