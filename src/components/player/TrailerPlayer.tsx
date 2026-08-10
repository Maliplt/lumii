import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowLeft, Play, Pause, Maximize, Minimize, SkipBack, SkipForward } from "lucide-react";
import { ProgressBar, VolumeControl, SettingsDropdown } from "./PlayerControls";
import { usePlayerChrome } from "./usePlayerChrome";
import ServiceErrorView from "../ServiceErrorView";
import { playbackError, type ServiceError } from "../../services/serviceError";
import tenetLogo from "../../assets/images/tenet-logo.svg";

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
        onError?: () => void;
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
// youtube api
let apiPromise: Promise<YTNamespace> | null = null;
function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise) {
    apiPromise = new Promise<YTNamespace>((resolve, reject) => {
      const timer = window.setTimeout(
        () => reject(new Error("YouTube API zaman aşımına uğradı.")),
        12000,
      );
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        if (window.YT) {
          window.clearTimeout(timer);
          resolve(window.YT);
        }
      };
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.onerror = () => {
        window.clearTimeout(timer);
        reject(new Error("YouTube API yüklenemedi."));
      };
      document.head.appendChild(tag);
    }).catch((error) => {
      apiPromise = null;
      throw error;
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

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<ServiceError | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const { fullscreen, controlsVisible, showControlsNow, toggleFullscreen } =
    usePlayerChrome(containerRef);

  useEffect(() => {
    progressRef.current = onProgress;
  });

  useEffect(() => {
    let cancelled = false;
    let poll: ReturnType<typeof setInterval> | null = null;

    loadYouTubeApi()
      .then((YT) => {
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
              if (e.data === YT_PAUSED || e.data === YT_ENDED)
                setPlaying(false);
            },
            onError: () => {
              if (!cancelled) setLoadError(playbackError());
            },
          },
        });
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(playbackError(error));
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
  }, [youtubeKey, autoPlay, startPosition, attempt]);

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
  };

  const skip = (seconds: number) => {
    const p = playerRef.current;
    if (!p) return;
    p.seekTo(Math.max(0, (p.getCurrentTime() || 0) + seconds), true);
  };

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

      {!ready && !loadError && (
        <div className="player-loading">
          <img src={tenetLogo} alt="" className="player-loading__logo" />
        </div>
      )}

      {loadError && (
        <div className="player-error">
          <ServiceErrorView
            error={loadError}
            title="İçerik oynatılamadı"
            onRetry={() => {
              setLoadError(null);
              setReady(false);
              setAttempt((value) => value + 1);
            }}
            onBack={onBack}
            compact
          />
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
          <ProgressBar
            currentTime={currentTime}
            duration={duration}
            onSeek={onSeek}
            ariaLabel="ilerleme"
          />

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

              <VolumeControl
                muted={muted}
                volume={volume}
                onToggleMute={toggleMute}
                onVolumeChange={onVolumeChange}
                muteButtonLabel="ses"
                sliderLabel="ses seviyesi"
              />
            </div>

            <div className="player-controls__right">
              <SettingsDropdown
                ariaLabel="Ayarlar"
                sections={[
                  {
                    label: "Kalite",
                    items: [
                      {
                        key: "auto",
                        label: "Otomatik (YouTube)",
                        active: true,
                        disabled: true,
                      },
                    ],
                  },
                  {
                    label: "Hız",
                    items: [0.75, 1, 1.25, 1.5, 2].map((rate) => ({
                      key: rate,
                      label: rate === 1 ? "Normal" : `${rate}×`,
                      active: playbackRate === rate,
                      // eslint-disable-next-line react-hooks/refs
                      onClick: () => selectSpeed(rate),
                    })),
                  },
                ]}
              />
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
