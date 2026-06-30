import { useEffect, useRef, useState, useCallback } from "react";
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Settings,
} from "lucide-react";
import tenetLogo from "../../assets/images/tenet-logo.svg";
import { formatTime } from "../../helpers";

// youtube api tipleri
interface YTPlayer {
  destroy(): void;
  getCurrentTime(): number;
  getDuration(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  playVideo(): void;
  pauseVideo(): void;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  setVolume(volume: number): void;
  getVolume(): number;
  setPlaybackRate(rate: number): void;
}
interface YTNamespace {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string;
      playerVars?: Record<string, number | string>;
      events?: {
        onReady?: (e: { target: YTPlayer }) => void;
        onStateChange?: (e: { data: number }) => void;
      };
    },
  ) => YTPlayer;
}
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

// youtube api bir kez yukle
let apiPromise: Promise<YTNamespace> | null = null;
function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise) {
    apiPromise = new Promise<YTNamespace>((resolve) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        if (window.YT) resolve(window.YT);
      };
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    });
  }
  return apiPromise;
}

interface TrailerPlayerProps {
  youtubeKey: string;
  title?: string;
  subtitle?: string;
  startPosition?: number;
  autoPlay?: boolean;
  qualityLabel?: string;
  onUpgrade?: () => void;
  onBack?: () => void;
  onProgress?: (position: number, duration: number) => void;
}

const YT_PLAYING = 1;
const YT_PAUSED = 2;
const YT_ENDED = 0;

export default function TrailerPlayer({
  youtubeKey,
  title = "",
  subtitle = "",
  startPosition = 0,
  autoPlay = true,
  qualityLabel = "",
  onUpgrade,
  onBack,
  onProgress,
}: TrailerPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const progressRef = useRef(onProgress);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    progressRef.current = onProgress;
  });

  useEffect(() => {
    let cancelled = false;
    let poll: ReturnType<typeof setInterval> | null = null;

    loadYouTubeApi().then((YT) => {
      if (cancelled || !mountRef.current) return;
      const host = document.createElement("div");
      mountRef.current.appendChild(host);
      playerRef.current = new YT.Player(host, {
        videoId: youtubeKey,
        playerVars: {
          autoplay: autoPlay ? 1 : 0,
          start: Math.floor(startPosition) || 0,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          cc_load_policy: 0,
        },
        events: {
          onReady: (e) => {
            if (cancelled) return;
            const p = e.target;
            setReady(true);
            setDuration(p.getDuration() || 0);
            setMuted(p.isMuted());
            setVolume((p.getVolume() || 100) / 100);
            poll = setInterval(() => {
              const cur = playerRef.current;
              if (!cur) return;
              const pos = cur.getCurrentTime?.() ?? 0;
              const dur = cur.getDuration?.() ?? 0;
              setCurrentTime(pos);
              if (dur > 0) {
                setDuration(dur);
                progressRef.current?.(pos, dur);
              }
            }, 1000);
          },
          onStateChange: (e) => {
            if (cancelled) return;
            if (e.data === YT_PLAYING) setPlaying(true);
            if (e.data === YT_PAUSED || e.data === YT_ENDED) setPlaying(false);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (poll) clearInterval(poll);
      const p = playerRef.current;
      if (p) {
        const pos = p.getCurrentTime?.() ?? 0;
        const dur = p.getDuration?.() ?? 0;
        if (dur > 0) progressRef.current?.(pos, dur);
        p.destroy?.();
      }
      playerRef.current = null;
    };
  }, [youtubeKey, autoPlay, startPosition]);

  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    [],
  );

  const showControlsNow = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 3000);
  }, []);

  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (playing) {
      p.pauseVideo();
    } else {
      p.playVideo();
    }
  }, [playing]);

  const toggleMute = () => {
    const p = playerRef.current;
    if (!p) return;
    if (muted) {
      p.unMute();
      setMuted(false);
    } else {
      p.mute();
      setMuted(true);
    }
  };

  const onVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const p = playerRef.current;
    if (!p) return;
    const val = Number(e.target.value);
    p.setVolume(val * 100);
    setVolume(val);
    if (val === 0) {
      p.mute();
      setMuted(true);
    } else if (muted) {
      p.unMute();
      setMuted(false);
    }
  };

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    playerRef.current?.seekTo(Number(e.target.value), true);
  };

  const selectSpeed = (rate: number) => {
    playerRef.current?.setPlaybackRate(rate);
    setPlaybackRate(rate);
    setShowSettings(false);
  };

  const skip = (seconds: number) => {
    const p = playerRef.current;
    if (!p) return;
    p.seekTo(Math.max(0, (p.getCurrentTime() || 0) + seconds), true);
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        el.requestFullscreen({ navigationUI: "hide" }).catch(() => {
          (el as { webkitRequestFullscreen?: () => void })
            .webkitRequestFullscreen?.();
        });
      } else {
        document.exitFullscreen().catch(() => setFullscreen(false));
      }
    } catch {
      (el as { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen?.();
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volPct = (muted ? 0 : volume) * 100;
  const volIcon =
    muted || volume === 0 ? (
      <VolumeX size={20} />
    ) : volume < 0.5 ? (
      <Volume1 size={20} />
    ) : (
      <Volume2 size={20} />
    );

  return (
    <div
      ref={containerRef}
      className="player-container"
      onMouseMove={showControlsNow}
      style={{ cursor: controlsVisible ? "default" : "none" }}
    >
      <div className="trailer-player__frame" ref={mountRef} />

      <div
        className="player-click-zone"
        onClick={() => {
          togglePlay();
          showControlsNow();
        }}
        onDoubleClick={toggleFullscreen}
      />

      {!ready && (
        <div className="player-loading">
          <img src={tenetLogo} alt="" className="player-loading__logo" />
        </div>
      )}

      <div className={`player-controls${controlsVisible ? " visible" : ""}`}>
        <div className="player-controls__top">
          {onBack && (
            <button
              className="player-btn player-btn--back"
              onClick={onBack}
              aria-label="geri"
            >
              <ArrowLeft size={22} />
            </button>
          )}
          <div className="player-controls__title">
            <span>{title}</span>
            {subtitle && (
              <small className="player-controls__subtitle">{subtitle}</small>
            )}
          </div>
          {qualityLabel && (
            <span className="player-quality-badge">{qualityLabel}</span>
          )}
          {onUpgrade && (
            <button className="trailer-player__upgrade" onClick={onUpgrade}>
              Yükselt
            </button>
          )}
        </div>

        <div className="player-controls__bottom">
          <div className="player-progress-wrap">
            <div className="player-progress-track">
              <div
                className="player-progress-played"
                style={{ width: `${progress}%` }}
              />
              <div
                className="player-progress-thumb"
                style={{ left: `${progress}%` }}
              />
              <input
                type="range"
                className="player-progress-input"
                min={0}
                max={duration || 100}
                step={0.25}
                value={currentTime}
                onChange={onSeek}
                aria-label="ilerleme"
              />
            </div>
            <div className="player-time">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="player-controls__row">
            <div className="player-controls__left">
              <button
                className="player-btn"
                onClick={() => skip(-10)}
                aria-label="10 sn geri"
              >
                <SkipBack size={20} />
              </button>
              <button
                className="player-btn player-btn--play"
                onClick={togglePlay}
                aria-label={playing ? "duraklat" : "oynat"}
              >
                {playing ? (
                  <Pause size={28} fill="currentColor" />
                ) : (
                  <Play size={28} fill="currentColor" />
                )}
              </button>
              <button
                className="player-btn"
                onClick={() => skip(10)}
                aria-label="10 sn ileri"
              >
                <SkipForward size={20} />
              </button>

              <div className="player-volume">
                <button
                  className="player-btn"
                  onClick={toggleMute}
                  aria-label="ses"
                >
                  {volIcon}
                </button>
                <div className="player-volume-bar-wrap">
                  <div
                    className="player-volume-bar-fill"
                    style={{ width: `${volPct}%` }}
                  />
                  <div
                    className="player-volume-thumb"
                    style={{ left: `${volPct}%` }}
                  />
                  <input
                    type="range"
                    className="player-volume-input"
                    min={0}
                    max={1}
                    step={0.02}
                    value={muted ? 0 : volume}
                    onChange={onVolumeChange}
                    aria-label="ses seviyesi"
                  />
                </div>
                <span className="player-volume-pct">{Math.round(volPct)}%</span>
              </div>
            </div>

            <div className="player-controls__right">
              <div className="player-settings-wrap">
                <button
                  className="player-btn"
                  onClick={() => setShowSettings((p) => !p)}
                  aria-label="Ayarlar"
                >
                  <Settings size={20} />
                </button>
                {showSettings && (
                  <div className="player-settings-menu">
                    <p className="player-settings-menu__label">Kalite</p>
                    <button className="player-settings-menu__item active" disabled>
                      Otomatik (YouTube)
                    </button>
                    <p className="player-settings-menu__label">Hız</p>
                    {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        className={`player-settings-menu__item${playbackRate === rate ? " active" : ""}`}
                        onClick={() => selectSpeed(rate)}
                      >
                        {rate === 1 ? "Normal" : `${rate}×`}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                className="player-btn"
                onClick={toggleFullscreen}
                aria-label="tam ekran"
              >
                {fullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
