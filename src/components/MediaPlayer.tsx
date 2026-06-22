import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  Settings,
  SkipBack,
  SkipForward,
  Wifi,
} from "lucide-react";

function formatTime(s: number): string {
  if (!isFinite(s) || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

interface MediaPlayerProps {
  src: string;
  title?: string;
  live?: boolean;
  startMuted?: boolean;
  autoPlay?: boolean;
  onBack?: () => void;
  className?: string;
}

export default function MediaPlayer({
  src,
  title = "",
  live = false,
  startMuted = false,
  autoPlay = true,
  onBack,
  className = "",
}: MediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(startMuted);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [centerAction, setCenterAction] = useState<{
    type: "play" | "pause";
    id: number;
  } | null>(null);
  const [levels, setLevels] = useState<{ height: number; bitrate: number }[]>(
    [],
  );
  const [currentLevel, setCurrentLevel] = useState(-1);
  const [streamReady, setStreamReady] = useState(false);
  const [streamError, setStreamError] = useState(false);
  const [atLive, setAtLive] = useState(true);

  // baslat
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    let hls: Hls | null = null;
    let snapped = false;

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

    // autoplay kapali
    const tryPlay = () => {
      if (!autoPlay) return;
      const playback = video.play();
      if (playback) {
        playback.catch(() => {
          video.muted = true;
          setMuted(true);
          video.play().catch(() => {});
        });
      }
    };

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
        maxBufferLength: 60,
        debug: false,
      });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
        if (cancelled) return;
        setLevels(
          data.levels.map((l) => ({ height: l.height, bitrate: l.bitrate })),
        );
        setStreamReady(true);
        tryPlay();
      });
      hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) =>
        setCurrentLevel(data.level),
      );
      // canli yayinda en guncel noktadan basla
      hls.on(Hls.Events.LEVEL_LOADED, (_e, data) => {
        if (cancelled || !live || snapped || !data.details.live) return;
        snapped = true;
        const pos = hlsRef.current?.liveSyncPosition;
        if (pos != null && isFinite(pos)) video.currentTime = pos;
      });
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls?.startLoad();
        else if (data.type === Hls.ErrorTypes.MEDIA_ERROR)
          hls?.recoverMediaError();
        else setStreamError(true);
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
      hls?.destroy();
      hlsRef.current = null;
    };
  }, [src, startMuted, autoPlay, live]);

  // olaylar
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.buffered.length)
        setBuffered(video.buffered.end(video.buffered.length - 1));
      if (live) {
        const pos = hlsRef.current?.liveSyncPosition;
        const edge =
          pos != null && isFinite(pos)
            ? pos
            : video.seekable.length
              ? video.seekable.end(video.seekable.length - 1)
              : video.currentTime;
        setAtLive(edge - video.currentTime < 12);
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

  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (flashTimer.current) clearTimeout(flashTimer.current);
    },
    [],
  );

  const showControlsNow = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 3000);
  }, []);

  const flashCenter = useCallback((type: "play" | "pause") => {
    setCenterAction({ type, id: Date.now() });
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setCenterAction(null), 600);
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      flashCenter("play");
    } else {
      video.pause();
      flashCenter("pause");
    }
  }, [flashCenter]);

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

  // canli yayinin en guncel noktasina don
  const goLive = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const pos = hlsRef.current?.liveSyncPosition;
    const edge =
      pos != null && isFinite(pos)
        ? pos
        : video.seekable.length
          ? video.seekable.end(video.seekable.length - 1)
          : video.currentTime;
    video.currentTime = edge;
    video.play().catch(() => {});
  }, []);

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    try {
      if (!document.fullscreenElement)
        container.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
      else document.exitFullscreen();
    } catch {
      // safari
      const legacy = container as { webkitRequestFullscreen?: () => void };
      legacy.webkitRequestFullscreen?.();
    }
  };

  const selectLevel = (idx: number) => {
    if (hlsRef.current) hlsRef.current.currentLevel = idx;
    setCurrentLevel(idx);
    setShowSettings(false);
  };

  // klavye
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
  }, [togglePlay, showControlsNow]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;
  const volPct = (muted ? 0 : volume) * 100;
  const currentLevelInfo =
    currentLevel >= 0 && levels[currentLevel]
      ? `${levels[currentLevel].height}p`
      : "Oto";
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

      <div className="player-gradient-top" />
      <div className="player-gradient-bottom" />

      <div
        className="player-click-zone"
        onClick={() => {
          togglePlay();
          showControlsNow();
        }}
        onDoubleClick={toggleFullscreen}
      />

      {live && (
        <button
          type="button"
          className={`player-live-badge${atLive ? "" : " is-behind"}`}
          onClick={goLive}
          title={atLive ? "Canlı yayındasın" : "Canlı yayına dön"}
        >
          <span className="player-live-dot" />
          CANLI
        </button>
      )}

      {centerAction && (
        <div className="player-center-action" key={centerAction.id}>
          {centerAction.type === "play" ? (
            <Play size={40} fill="currentColor" />
          ) : (
            <Pause size={40} fill="currentColor" />
          )}
        </div>
      )}

      {!streamReady && !streamError && (
        <div className="player-loading">
          <div className="spinner-stage">
            <span className="spinner-pulse" />
            <span className="spinner-pulse" />
            <span className="spinner-pulse" />
            <span className="spinner-core" />
          </div>
          <p>Akış yükleniyor…</p>
        </div>
      )}

      {streamError && (
        <div className="player-error">
          <Wifi size={48} />
          <p>Yayın şu anda oynatılamıyor. Lütfen daha sonra tekrar deneyin.</p>
          {onBack && <button onClick={onBack}>Geri Dön</button>}
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
          <div className="player-progress-wrap">
            <div className="player-progress-track">
              <div
                className="player-progress-buffered"
                style={{ width: `${bufferedPct}%` }}
              />
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
                aria-label="İlerleme"
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
                aria-label={playing ? "Duraklat" : "Oynat"}
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
                  aria-label="Ses"
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
                    aria-label="Ses seviyesi"
                  />
                </div>
                <span className="player-volume-pct">{Math.round(volPct)}%</span>
              </div>
            </div>

            <div className="player-controls__right">
              <span className="player-quality-badge">{currentLevelInfo}</span>
              <div className="player-settings-wrap">
                <button
                  className="player-btn"
                  onClick={() => setShowSettings((p) => !p)}
                  aria-label="Kalite"
                >
                  <Settings size={20} />
                </button>
                {showSettings && (
                  <div className="player-settings-menu">
                    <p className="player-settings-menu__label">Kalite</p>
                    <button
                      className={`player-settings-menu__item${currentLevel === -1 ? " active" : ""}`}
                      onClick={() => selectLevel(-1)}
                    >
                      Otomatik (ABR)
                    </button>
                    {levels.map((l, i) => (
                      <button
                        key={i}
                        className={`player-settings-menu__item${currentLevel === i ? " active" : ""}`}
                        onClick={() => selectLevel(i)}
                      >
                        {l.height}p — {Math.round(l.bitrate / 1000)} kbps
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
