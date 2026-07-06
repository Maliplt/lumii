import { Fragment, useState, type ChangeEvent, type ReactNode } from "react";
import { Settings, Volume2, VolumeX, Volume1 } from "lucide-react";
import { formatTime } from "../../helpers";

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  buffered?: number;
  onSeek: (e: ChangeEvent<HTMLInputElement>) => void;
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
  const bufferedPct =
    buffered !== undefined && duration > 0 ? (buffered / duration) * 100 : undefined;

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
  onVolumeChange: (e: ChangeEvent<HTMLInputElement>) => void;
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
  const volPct = (muted ? 0 : volume) * 100;
  const VolIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="player-volume">
      <button className="player-btn" onClick={onToggleMute} aria-label={muteButtonLabel}>
        <VolIcon size={20} />
      </button>
      <div className="player-volume-bar-wrap">
        <div className="player-volume-bar-fill" style={{ width: `${volPct}%` }} />
        <div className="player-volume-thumb" style={{ left: `${volPct}%` }} />
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
      <span className="player-volume-pct">{Math.round(volPct)}%</span>
    </div>
  );
}

export interface SettingsItem {
  key: string | number;
  label: ReactNode;
  active: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export interface SettingsSection {
  label: string;
  items: SettingsItem[];
}

interface SettingsDropdownProps {
  ariaLabel: string;
  sections: SettingsSection[];
}

export function SettingsDropdown({ ariaLabel, sections }: SettingsDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="player-settings-wrap">
      <button
        className="player-btn"
        onClick={() => setOpen((p) => !p)}
        aria-label={ariaLabel}
      >
        <Settings size={20} />
      </button>
      {open && (
        <div className="player-settings-menu">
          {sections.map((section) => (
            <Fragment key={section.label}>
              <p className="player-settings-menu__label">{section.label}</p>
              {section.items.map((item) => (
                <button
                  key={item.key}
                  className={`player-settings-menu__item${item.active ? " active" : ""}`}
                  disabled={item.disabled}
                  onClick={() => {
                    item.onClick?.();
                    setOpen(false);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
