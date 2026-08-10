import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import { ArrowLeft, Play, Pause, Maximize, Minimize, SkipBack, SkipForward } from "lucide-react";
import { ProgressBar, VolumeControl, SettingsDropdown } from "./PlayerControls";
import { usePlayerChrome } from "./usePlayerChrome";
import ServiceErrorView from "../ServiceErrorView";
import { playbackError } from "../../services/serviceError";
import tenetLogo from "../../assets/images/tenet-logo.svg";

const LIVE_AUTO_SYNC_GAP = 18;
const LIVE_BEHIND_GAP = 45;

function getLiveEdge(video: HTMLVideoElement, hls: Hls | null): number {
  const pos = hls?.liveSyncPosition;
  if (pos != null && isFinite(pos)) return pos;
  if (video.seekable.length) {
    const edge = video.seekable.end(video.seekable.length - 1);
    if (isFinite(edge)) return edge;
  }
  return video.currentTime;
}

interface MediaPlayerProps {
  src: string;
  title?: string;
  live?: boolean;
  startMuted?: boolean;
  autoPlay?: boolean;
  startPosition?: number;
  qualityLabel?: string;
  maxVideoHeight?: number;
  onBack?: () => void;
  onUpgrade?: () => void;
  onProgress?: (position: number, duration: number) => void;
  className?: string;
}

export default function MediaPlayer({
  src,
  title = "",
  live = false,
  startMuted = false,
  autoPlay = true,
  startPosition = 0,
  qualityLabel = "",
  maxVideoHeight = 1080,
  onBack,
  onUpgrade,
  onProgress,
  className = "",
}: MediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(startMuted);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const { fullscreen, controlsVisible, showControlsNow, toggleFullscreen } =
    usePlayerChrome(containerRef);
  const [levels, setLevels] = useState<{ height: number; bitrate: number }[]>(
    [],
  );
  const [currentLevel, setCurrentLevel] = useState(-1);
  const [streamReady, setStreamReady] = useState(false);
  const [streamError, setStreamError] = useState(false);
  const [streamAttempt, setStreamAttempt] = useState(0);
  const [atLive, setAtLive] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    let hls: Hls | null = null;
    let snapped = false;
    let readyTimer: ReturnType<typeof setTimeout> | null = null;

    setStreamReady(false);
    setStreamError(false);
    setPlaying(false);
    setLevels([]);
    setCurrentLevel(-1);
    setCurrentTime(0);
    setDuration(0);
    setBuffered(0);
    video.muted = startMuted;
    setMuted(startMuted);

    const tryPlay = () => {
      if (!autoPlay) return;
      const playback = video.play();
      if (playback) {
        playback.catch(() => {
          video.muted = true;
          setMuted(true);
          video.play().catch(() => setPlaying(false));
        });
      }
    };

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: live,
        liveSyncDurationCount: 2,
        liveMaxLatencyDurationCount: 4,
        backBufferLength: 90,
        maxBufferLength: 60,
        debug: false,
      });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      // zaman aşımı
      readyTimer = setTimeout(() => {
        if (!cancelled) setStreamError(true);
      }, 15000);

      hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
        if (cancelled) return;
        if (readyTimer) {
          clearTimeout(readyTimer);
          readyTimer = null;
        }
        setLevels(
          data.levels.map((l) => ({ height: l.height, bitrate: l.bitrate })),
        );
        const allowed = data.levels
          .map((level, index) => ({ level, index }))
          .filter(({ level }) => !level.height || level.height <= maxVideoHeight);
        const cap = allowed.length
          ? allowed.reduce((best, item) => item.level.height >= best.level.height ? item : best).index
          : 0;
        if (hls) hls.autoLevelCapping = cap;
        setStreamReady(true);
        tryPlay();
      });
      hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) =>
        setCurrentLevel(data.level),
      );
      hls.on(Hls.Events.LEVEL_LOADED, (_e, data) => {
        if (cancelled || !live || snapped || !data.details.live) return;
        snapped = true;
        video.currentTime = getLiveEdge(video, hlsRef.current);
        setAtLive(true);
      });
      // yeniden deneme
      let networkRetries = 0;
      let mediaRetries = 0;
      hls.on(Hls.Events.FRAG_BUFFERED, () => {
        networkRetries = 0;
        mediaRetries = 0;
      });
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR && networkRetries < 3) {
          networkRetries += 1;
          hls?.startLoad();
        } else if (
          data.type === Hls.ErrorTypes.MEDIA_ERROR &&
          mediaRetries < 2
        ) {
          mediaRetries += 1;
          hls?.recoverMediaError();
        } else {
          setStreamError(true);
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      setStreamReady(true);
      tryPlay();
    } else {
      setStreamError(true);
    }

    return () => {
      cancelled = true;
      if (readyTimer) clearTimeout(readyTimer);
      hls?.destroy();
      hlsRef.current = null;
    };
  }, [src, startMuted, autoPlay, live, maxVideoHeight, streamAttempt]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.buffered.length)
        setBuffered(video.buffered.end(video.buffered.length - 1));
      if (live) {
        const edge = getLiveEdge(video, hlsRef.current);
        const drift = Math.max(0, edge - video.currentTime);
        if (!video.paused && drift > LIVE_AUTO_SYNC_GAP) {
          video.currentTime = edge;
          setAtLive(true);
          return;
        }
        setAtLive(drift < LIVE_BEHIND_GAP);
      }
    };
    const onDurationChange = () => setDuration(video.duration);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onVolume = () => {
      setMuted(video.muted);
      setVolume(video.volume);
    };
    const onStalled = () => hlsRef.current?.startLoad();

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("volumechange", onVolume);
    video.addEventListener("stalled", onStalled);
    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("volumechange", onVolume);
      video.removeEventListener("stalled", onStalled);
    };
  }, [live]);

  const onProgressRef = useRef(onProgress);
  useEffect(() => {
    onProgressRef.current = onProgress;
  });
  useEffect(() => {
    const video = videoRef.current;
    if (!video || live) return;

    let seeked = false;
    const trySeek = () => {
      if (seeked || startPosition <= 0) return;
      if (isFinite(video.duration) && startPosition < video.duration - 5) {
        video.currentTime = startPosition;
      }
      seeked = true;
    };
    video.addEventListener("loadedmetadata", trySeek);
    if (video.readyState >= 1) trySeek();

    const report = () => {
      const dur = video.duration;
      if (isFinite(dur) && dur > 0) onProgressRef.current?.(video.currentTime, dur);
    };
    const poll = setInterval(report, 5000);
    return () => {
      video.removeEventListener("loadedmetadata", trySeek);
      clearInterval(poll);
      report(); // son pozisyonu kaydet
    };
  }, [src, startPosition, live]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => setPlaying(false));
    } else {
      video.pause();
    }
  }, []);

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) video.muted = !video.muted;
  };

  const adjustVolume = (delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = Math.max(0, Math.min(1, video.volume + delta));
    video.muted = video.volume === 0;
  };

  const onVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const value = Number(e.target.value);
    video.volume = value;
    video.muted = value === 0;
    setVolume(value);
  };

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (video) video.currentTime = Number(e.target.value);
  };

  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(
      0,
      Math.min(video.duration || 0, video.currentTime + seconds),
    );
  };

  const goLive = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = getLiveEdge(video, hlsRef.current);
    setAtLive(true);
    video.play().catch(() => setPlaying(false));
  }, []);

  const selectLevel = (idx: number) => {
    if (idx >= 0 && levels[idx]?.height > maxVideoHeight) {
      onUpgrade?.();
      return;
    }
    if (hlsRef.current) hlsRef.current.currentLevel = idx;
    setCurrentLevel(idx);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      switch (e.key) {
        case " ":
        case "k":
        case "K":
          e.preventDefault();
          togglePlay();
          showControlsNow();
          break;
        case "ArrowLeft":
          e.preventDefault();
          skip(-10);
          showControlsNow();
          break;
        case "ArrowRight":
          e.preventDefault();
          skip(10);
          showControlsNow();
          break;
        case "ArrowUp":
          e.preventDefault();
          adjustVolume(0.1);
          showControlsNow();
          break;
        case "ArrowDown":
          e.preventDefault();
          adjustVolume(-0.1);
          showControlsNow();
          break;
        case "m":
        case "M":
          toggleMute();
          showControlsNow();
          break;
        case "f":
        case "F":
          toggleFullscreen();
          break;
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [togglePlay, showControlsNow, toggleFullscreen]);

  const currentLevelInfo =
    currentLevel >= 0 && levels[currentLevel]
      ? `${levels[currentLevel].height}p`
      : "Oto";

  return (
    <div
      ref={containerRef}
      className={`player-container ${className}`.trim()}
      onMouseMove={showControlsNow}
      style={{ cursor: controlsVisible ? "default" : "none" }}
    >
      <video
        ref={videoRef}
        className="player-video"
        playsInline
        preload="auto"
      />

      <div
        className="player-click-zone"
        onClick={() => {
          togglePlay();
          showControlsNow();
        }}
        onDoubleClick={toggleFullscreen}
      />

      {!streamReady && !streamError && (
        <div className="player-loading">
          <img src={tenetLogo} alt="" className="player-loading__logo" />
        </div>
      )}

      {streamError && (
        <div className="player-error">
          <ServiceErrorView
            error={playbackError()}
            title={live ? "Canlı yayın açılamadı" : "İçerik oynatılamadı"}
            onRetry={() => setStreamAttempt((value) => value + 1)}
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
              aria-label="Geri"
            >
              <ArrowLeft size={22} />
            </button>
          )}
          <div className="player-controls__title">
            <span>{title}</span>
          </div>
        </div>

        <div className="player-controls__bottom">
          {live ? (
            <div className="player-live-rail" aria-label="Canlı yayın">
              <div className="player-live-rail__track">
                <span className="player-live-rail__fill" />
                <span className="player-live-rail__edge" />
              </div>
              <div className="player-live-rail__meta">
                <span>CANLI YAYIN</span>
                {!atLive && <span>GERİDESİN</span>}
              </div>
            </div>
          ) : (
            <ProgressBar
              currentTime={currentTime}
              duration={duration}
              buffered={buffered}
              onSeek={onSeek}
              ariaLabel="İlerleme"
            />
          )}

          <div className="player-controls__row">
            <div className="player-controls__left">
              {!live && (
                <button
                  className="player-btn"
                  onClick={() => skip(-10)}
                  aria-label="10 sn geri"
                >
                  <SkipBack size={20} />
                </button>
              )}
              <button
                className="player-btn player-btn--play"
                onClick={togglePlay}
                aria-label={playing ? "Duraklat" : "Oynat"}
              >
                {playing ? (
                  <Pause size={28} fill="currentColor" />
                ) : (
                  <Play size={28} fill="currentColor" />
                )}
              </button>
              {!live && (
                <button
                  className="player-btn"
                  onClick={() => skip(10)}
                  aria-label="10 sn ileri"
                >
                  <SkipForward size={20} />
                </button>
              )}

              <VolumeControl
                muted={muted}
                volume={volume}
                onToggleMute={toggleMute}
                onVolumeChange={onVolumeChange}
                muteButtonLabel="Ses"
                sliderLabel="Ses seviyesi"
              />
            </div>

            <div className="player-controls__right">
              {live ? (
                <button
                  type="button"
                  className={`player-live-pill${atLive ? "" : " is-behind"}`}
                  onClick={goLive}
                  title={atLive ? "Canlı yayındasın" : "Canlı yayına dön"}
                >
                  <span className="player-live-dot" />
                  {atLive ? "Canlı" : "Canlıya Dön"}
                </button>
              ) : (
                <>
                  <span className="player-quality-badge">{currentLevel >= 0 ? currentLevelInfo : qualityLabel}</span>
                  {onUpgrade && (
                    <button className="player-upgrade-btn" onClick={onUpgrade} title="Planını yükselt">
                      Yükselt
                    </button>
                  )}
                </>
              )}
              {!live && (
                <SettingsDropdown
                  ariaLabel="Kalite"
                  sections={[
                    {
                      label: "Kalite",
                      items: [
                        {
                          key: -1,
                          label: `Otomatik · ${qualityLabel || `${maxVideoHeight}p`}`,
                          active: currentLevel === -1,
                          onClick: () => selectLevel(-1),
                        },
                        ...levels.map((l, i) => ({
                          key: i,
                          label: `${l.height}p - ${Math.round(l.bitrate / 1000)} kbps`,
                          active: currentLevel === i,
                          disabled: l.height > maxVideoHeight,
                          onClick: () => selectLevel(i),
                        })),
                      ],
                    },
                  ]}
                />
              )}
              <button
                className="player-btn"
                onClick={toggleFullscreen}
                aria-label="Tam ekran"
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
