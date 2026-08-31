import type { ChangeEvent } from "react";
import { Captions, Volume1, Volume2, VolumeX } from "lucide-react";
import { formatTime } from "../../helpers";

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  buffered?: number;
  onSeek: (event: ChangeEvent<HTMLInputElement>) => void;
  ariaLabel: string;
}

export function ProgressBar({
  currentTime,
  duration,
  buffered,
  onSeek,
  ariaLabel,
}: ProgressBarProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = buffered !== undefined && duration > 0
    ? (buffered / duration) * 100
    : undefined;

  return (
    <div className="player-progress-wrap">
      <div className="player-progress-track">
        {bufferedPct !== undefined && (
          <div className="player-progress-buffered" style={{ width: `${bufferedPct}%` }} />
        )}
        <div className="player-progress-played" style={{ width: `${progress}%` }} />
        <div className="player-progress-thumb" style={{ left: `${progress}%` }} />
        <input
          type="range"
          className="player-progress-input"
          min={0}
          max={duration || 100}
          step={0.25}
          value={currentTime}
          onChange={onSeek}
          aria-label={ariaLabel}
        />
      </div>
      <div className="player-time">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}

interface VolumeControlProps {
  muted: boolean;
  volume: number;
  onToggleMute: () => void;
  onVolumeChange: (event: ChangeEvent<HTMLInputElement>) => void;
  muteButtonLabel: string;
  sliderLabel: string;
}

export function VolumeControl({
  muted,
  volume,
  onToggleMute,
  onVolumeChange,
  muteButtonLabel,
  sliderLabel,
}: VolumeControlProps) {
  const volumePercent = (muted ? 0 : volume) * 100;
  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="player-volume">
      <button className="player-btn" onClick={onToggleMute} aria-label={muteButtonLabel}>
        <VolumeIcon size={20} />
      </button>
      <div className="player-volume-bar-wrap">
        <div className="player-volume-bar-fill" style={{ width: `${volumePercent}%` }} />
        <div className="player-volume-thumb" style={{ left: `${volumePercent}%` }} />
        <input
          type="range"
          className="player-volume-input"
          min={0}
          max={1}
          step={0.02}
          value={muted ? 0 : volume}
          onChange={onVolumeChange}
          aria-label={sliderLabel}
        />
      </div>
      <span className="player-volume-pct">{Math.round(volumePercent)}%</span>
    </div>
  );
}

interface CaptionsButtonProps {
  enabled: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

export function CaptionsButton({ enabled, disabled, onToggle }: CaptionsButtonProps) {
  return (
    <button
      type="button"
      className={`player-btn player-captions-btn${enabled ? " is-active" : ""}`}
      onClick={onToggle}
      disabled={disabled}
      aria-label={enabled ? "Altyazıyı kapat" : "Altyazıyı aç"}
      aria-pressed={enabled}
      title={enabled ? "Altyazıyı kapat" : "Altyazıyı aç"}
    >
      <Captions size={21} />
      <span>{enabled ? "CC Açık" : "CC"}</span>
    </button>
  );
}
