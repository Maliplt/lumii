import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import PlayerControlsOverlay from "./PlayerControlsOverlay";
import type { MediaPlayerProps } from "./playerTypes";
import { useSubtitleTrack } from "./useSubtitleTrack";
import { usePlaybackProgress } from "./usePlaybackProgress";
import { useMediaSource } from "./useMediaSource";
import { getLiveEdge, LIVE_AUTO_SYNC_GAP, LIVE_BEHIND_GAP } from "./playbackMedia";
import { usePlayerChrome } from "./usePlayerChrome";
import ServiceErrorView from "../feedback/ServiceErrorView";
import Spinner from "../ui/Spinner";
import { playbackError } from "../../services/serviceError";

export default function MediaPlayer({
  src,
  streamType = "file",
  title = "",
  live = false,
  startMuted = false,
  autoplayEnabled,
  startPosition = 0,
  qualityLabel = "",
  maxVideoHeight = 1080,
  onBack,
  onUpgrade,
  onProgress,
  onPrevious,
  onNext,
  sourceOptions = [],
  qualityOptions = [],
  activeSourceId,
  onSourceSelect,
  onQualitySelect,
  onPlaybackError,
  subtitleOptions = [],
  preferredSubtitleId,
  subtitleSelectionKey,
  loading = false,
  error = null,
  onRetry,
  minimumDuration = 0,
  className = "",
}: MediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(startMuted);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [atLive, setAtLive] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { fullscreen, controlsVisible, showControlsNow, toggleFullscreen } =
    usePlayerChrome(containerRef);
  const useHls = live && streamType === "hls";
  const subtitles = useSubtitleTrack({
    videoRef,
    subtitles: subtitleOptions,
    preferredId: preferredSubtitleId,
    selectionKey: subtitleSelectionKey,
    mediaKey: src,
  });

  usePlaybackProgress({ videoRef, src, live, startPosition, onProgress });
  const {
    hlsRef,
    ready: streamReady,
    error: streamError,
    retry: retryStream,
  } = useMediaSource({
    videoRef,
    src,
    hlsEnabled: useHls,
    live,
    startMuted,
    autoplay: autoplayEnabled,
    maxVideoHeight,
    minimumDuration,
    onPlaybackError,
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const syncState = () => {
      setPlaying(!video.paused);
      setMuted(video.muted);
      setVolume(video.volume);
      setCurrentTime(Number.isFinite(video.currentTime) ? video.currentTime : 0);
      setDuration(Number.isFinite(video.duration) ? video.duration : 0);
      if (video.buffered.length) setBuffered(video.buffered.end(video.buffered.length - 1));
      if (live) {
        setAtLive(getLiveEdge(video, hlsRef.current) - video.currentTime < LIVE_AUTO_SYNC_GAP);
      }
    };
    const events = ["play", "pause", "timeupdate", "durationchange", "progress", "volumechange", "loadedmetadata"];
    events.forEach((event) => video.addEventListener(event, syncState));
    syncState();
    return () => events.forEach((event) => video.removeEventListener(event, syncState));
  }, [hlsRef, live, src]);

  useEffect(() => {
    if (!live) return;
    const timer = window.setInterval(() => {
      const video = videoRef.current;
      if (!video || video.paused || video.seeking) return;
      const edge = getLiveEdge(video, hlsRef.current);
      const gap = edge - video.currentTime;
      setAtLive(gap < LIVE_AUTO_SYNC_GAP);
      if (gap > LIVE_BEHIND_GAP) video.currentTime = edge;
    }, 4_000);
    return () => window.clearInterval(timer);
  }, [hlsRef, live]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => undefined);
    else video.pause();
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }, []);

  const changeVolume = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const nextVolume = Number(event.target.value);
    video.volume = nextVolume;
    video.muted = nextVolume === 0;
    setVolume(nextVolume);
    setMuted(video.muted);
  }, []);

  const seek = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Number(event.target.value);
    setCurrentTime(video.currentTime);
  }, []);

  const skip = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration || Infinity, video.currentTime + seconds));
  }, []);

  const goLive = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = getLiveEdge(video, hlsRef.current);
    setAtLive(true);
  }, [hlsRef]);

  const playerError = error ?? (streamError ? playbackError() : null);
  const retry = () => {
    retryStream();
    onRetry?.();
  };

  return (
    <div
      ref={containerRef}
      className={`player-container player-captions--${subtitles.appearance.size} player-captions-bg--${subtitles.appearance.background} player-captions-color--${subtitles.appearance.color} ${className}`.trim()}
      onPointerMove={showControlsNow}
      onPointerDown={showControlsNow}
      onDoubleClick={toggleFullscreen}
    >
      <video ref={videoRef} className="player-video" playsInline controls={false} preload="auto" onClick={togglePlay} />

      {subtitles.text && subtitles.selectedId !== "off" && (
        <div className={`player-subtitle-overlay${controlsVisible || settingsOpen ? " is-controls-visible" : ""}`}>
          <span>{subtitles.text}</span>
        </div>
      )}

      {playerError && (
        <div className="player-error">
          <ServiceErrorView error={playerError} onRetry={retry} onBack={onBack} />
        </div>
      )}

      {!playerError && (loading || (!!src && !streamReady)) && (
        <div className={`player-loading${live ? " player-loading--live" : ""}`}>
          <Spinner variant="player" />
        </div>
      )}

      {!playerError && (
        <PlayerControlsOverlay
          visible={controlsVisible || settingsOpen || !playing}
          live={live}
          title={title}
          playing={playing}
          muted={muted}
          volume={volume}
          currentTime={currentTime}
          duration={duration}
          buffered={buffered}
          atLive={atLive}
          fullscreen={fullscreen}
          qualityLabel={qualityLabel}
          subtitles={subtitles}
          subtitleOptions={subtitleOptions}
          sourceOptions={sourceOptions}
          qualityOptions={qualityOptions}
          activeSourceId={activeSourceId}
          onBack={onBack}
          onUpgrade={onUpgrade}
          onPrevious={onPrevious}
          onNext={onNext}
          onSourceSelect={onSourceSelect}
          onQualitySelect={onQualitySelect}
          onSettingsOpen={setSettingsOpen}
          onTogglePlay={togglePlay}
          onToggleMute={toggleMute}
          onVolumeChange={changeVolume}
          onSeek={seek}
          onSkip={skip}
          onGoLive={goLive}
          onToggleFullscreen={toggleFullscreen}
        />
      )}
    </div>
  );
}
