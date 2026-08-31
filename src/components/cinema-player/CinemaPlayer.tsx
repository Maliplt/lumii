import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { serviceErrorPresentation } from "../../services/serviceError";
import CinemaPlayerChrome from "./CinemaPlayerChrome";
import CinemaPlayerPanel, { type CinemaOpenPanel, type CinemaSettingsSection } from "./CinemaPlayerPanel";
import CinemaPlayerStage from "./CinemaPlayerStage";
import type { CinemaPlayerProps } from "./cinemaPlayerTypes";
import { useCinemaMedia } from "./useCinemaMedia";
import { useCinemaPlaybackState } from "./useCinemaPlaybackState";
import { useCinemaSubtitles } from "./useCinemaSubtitles";
import { useCinemaVideoGestures, type CinemaPulse } from "./useCinemaVideoGestures";

const CONTROL_HIDE_DELAY = 3_200;

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function CinemaPlayer({
  src,
  streamType = "file",
  mode,
  title,
  eyebrow,
  poster,
  autoplay = true,
  startMuted = false,
  startPosition = 0,
  maxVideoHeight = 1080,
  minimumDuration = 0,
  qualityLabel,
  sourceOptions = [],
  qualityOptions = [],
  activeSourceId,
  subtitleOptions = [],
  subtitleSourceOptions = subtitleOptions,
  preferredSubtitleId,
  subtitleSelectionKey,
  liked = false,
  loading = false,
  error,
  nextEpisode,
  recommendations = [],
  className,
  onBack,
  onLike,
  onRetry,
  onProgress,
  onPrevious,
  onNext,
  onSourceSelect,
  onQualitySelect,
  onPlaybackError,
}: CinemaPlayerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimer = useRef(0);
  const pulseTimer = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const live = mode === "live";
  const [volume, setVolume] = useState(startMuted ? 0 : 1);
  const [previousVolume, setPreviousVolume] = useState(1);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [openPanel, setOpenPanel] = useState<CinemaOpenPanel>(null);
  const [settingsSection, setSettingsSection] = useState<CinemaSettingsSection>("root");
  const [nearEndDismissed, setNearEndDismissed] = useState(false);
  const [recommendationsDismissed, setRecommendationsDismissed] = useState(false);
  const [centerPulse, setCenterPulse] = useState<CinemaPulse | null>(null);
  const handleEnded = useCallback(() => setControlsVisible(true), []);
  const playback = useCinemaPlaybackState({ videoRef, src, live, startPosition, onProgress, onEnded: handleEnded });
  const { playing, ended, currentTime, duration, buffered, playbackRate, seekableStart, seekableEnd, setCurrentTime, changeRate } = playback;

  const media = useCinemaMedia({
    videoRef,
    src,
    streamType,
    live,
    autoplay,
    startMuted,
    startPosition,
    maxVideoHeight,
    minimumDuration,
    onPlaybackError,
  });
  const captions = useCinemaSubtitles({
    videoRef,
    options: subtitleSourceOptions,
    preferredId: preferredSubtitleId,
    selectionKey: subtitleSelectionKey,
  });

  const showBufferSpinner = !error && !media.failed && (loading || (!!src && !media.ready) || media.buffering);
  const remaining = Math.max(0, duration - currentTime);
  const showNextPrompt = !live && !!nextEpisode && duration > 0 && remaining <= 90 && !nearEndDismissed;
  const endRecommendations = useMemo(() => recommendations.slice(0, 3), [recommendations]);
  const showRecommendations = !live && !nextEpisode && !!endRecommendations.length && duration > 0 && remaining <= 180 && !recommendationsDismissed;
  const subtitleLanguages = useMemo(() => {
    const seen = new Set<string>();
    return subtitleOptions.filter((option) => {
      if (option.language !== "tur" && option.language !== "eng") return false;
      if (seen.has(option.language)) return false;
      seen.add(option.language);
      return true;
    });
  }, [subtitleOptions]);
  const liveWindowDuration = Math.max(0, seekableEnd - seekableStart);
  const timelineCurrent = live ? Math.max(0, currentTime - seekableStart) : currentTime;
  const timelineDuration = live ? liveWindowDuration : duration;
  const timelineBuffered = live ? Math.max(0, buffered - seekableStart) : buffered;
  const atLiveEdge = !live || seekableEnd - currentTime < 4;

  const showControls = useCallback(() => {
    window.clearTimeout(controlsTimer.current);
    setControlsVisible(true);
    if (playing && !openPanel && !ended) {
      controlsTimer.current = window.setTimeout(() => setControlsVisible(false), CONTROL_HIDE_DELAY);
    }
  }, [ended, openPanel, playing]);

  useEffect(() => {
    window.clearTimeout(controlsTimer.current);
    if (playing && !openPanel && !ended) {
      controlsTimer.current = window.setTimeout(() => setControlsVisible(false), CONTROL_HIDE_DELAY);
    }
    return () => window.clearTimeout(controlsTimer.current);
  }, [ended, openPanel, playing]);

  const showCenterPulse = useCallback((kind: CinemaPulse) => {
    setCenterPulse(kind);
    window.clearTimeout(pulseTimer.current);
    pulseTimer.current = window.setTimeout(() => setCenterPulse(null), 520);
  }, []);

  const togglePlayback = useCallback((withFeedback = false) => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      if (video.ended) video.currentTime = 0;
      void video.play();
      if (withFeedback) showCenterPulse("play");
    } else {
      video.pause();
      if (withFeedback) showCenterPulse("pause");
    }
  }, [showCenterPulse]);

  const seekBy = useCallback((amount: number) => {
    const video = videoRef.current;
    if (!video) return;
    const minimum = live && video.seekable.length ? video.seekable.start(0) : 0;
    const maximum = live && video.seekable.length
      ? video.seekable.end(video.seekable.length - 1)
      : video.duration || 0;
    video.currentTime = Math.max(minimum, Math.min(maximum, video.currentTime + amount));
    setCurrentTime(video.currentTime);
    showControls();
  }, [live, setCurrentTime, showControls]);

  const videoGestures = useCinemaVideoGestures({
    onTogglePlayback: () => togglePlayback(true),
    onSeek: seekBy,
    onPulse: showCenterPulse,
    onShowControls: showControls,
  });

  const jumpToLive = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const liveEdge = video.seekable.length
      ? video.seekable.end(video.seekable.length - 1)
      : seekableEnd;
    if (liveEdge > 0) {
      video.currentTime = liveEdge;
      setCurrentTime(liveEdge);
    }
    showControls();
  }, [seekableEnd, setCurrentTime, showControls]);

  const setVideoVolume = useCallback((next: number) => {
    const video = videoRef.current;
    const normalized = Math.max(0, Math.min(1, next));
    if (!video) return;
    video.volume = normalized;
    video.muted = normalized === 0;
    if (normalized > 0) setPreviousVolume(normalized);
    setVolume(normalized);
  }, []);

  const toggleMute = useCallback(() => {
    setVideoVolume(volume > 0 ? 0 : previousVolume || 1);
  }, [previousVolume, setVideoVolume, volume]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (rootRef.current) {
        await rootRef.current.requestFullscreen();
        const orientation = screen.orientation as ScreenOrientation & { lock?: (value: "landscape") => Promise<void> };
        if (window.innerWidth < 768 && orientation.lock) void orientation.lock("landscape").catch(() => undefined);
      }
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => setFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => () => {
    window.clearTimeout(pulseTimer.current);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, select, textarea")) return;
      if (!rootRef.current?.contains(document.activeElement) && !fullscreen) return;
      if ([" ", "k", "K"].includes(event.key)) { event.preventDefault(); togglePlayback(true); }
      else if (event.key === "ArrowLeft") seekBy(-10);
      else if (event.key === "ArrowRight") seekBy(10);
      else if (event.key.toLowerCase() === "m") toggleMute();
      else if (event.key.toLowerCase() === "f") void toggleFullscreen();
      else if (event.key.toLowerCase() === "c" && !live) captions.toggle();
      showControls();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [captions, fullscreen, live, seekBy, showControls, toggleFullscreen, toggleMute, togglePlayback]);

  const open = (panel: CinemaOpenPanel) => {
    setOpenPanel((current) => current === panel ? null : panel);
    setSettingsSection("root");
    setControlsVisible(true);
  };
  const closePanel = useCallback(() => { setOpenPanel(null); setSettingsSection("root"); }, []);

  useEffect(() => {
    if (!openPanel) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if ((target as Element).closest?.("[data-cine-panel-trigger]")) return;
      closePanel();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [closePanel, openPanel]);

  const errorPresentation = error
    ? serviceErrorPresentation(error.code, error.status)
    : media.failed
      ? serviceErrorPresentation("playback")
      : null;
  return (
    <div
      ref={rootRef}
      className={cx(
        "cine-player",
        `cine-player--${mode}`,
        controlsVisible && "has-controls",
        playing && "is-playing",
        media.ready && "is-media-ready",
        ended && "is-ended",
        className,
      )}
      style={poster ? { "--cine-poster": `url("${poster}")` } as React.CSSProperties : undefined}
      tabIndex={0}
      aria-label={`${title} medya oynatıcı`}
      onMouseMove={showControls}
      onTouchStart={showControls}
      onMouseLeave={() => { if (playing && !openPanel) setControlsVisible(false); }}
    >
      <CinemaPlayerStage
        videoRef={videoRef}
        title={title}
        ended={ended}
        centerPulse={centerPulse}
        captions={captions}
        showBufferSpinner={showBufferSpinner}
        errorPresentation={errorPresentation}
        retry={onRetry ?? (media.failed ? media.retry : undefined)}
        showRecommendations={showRecommendations}
        recommendations={endRecommendations}
        gestures={videoGestures}
        onDismissRecommendations={() => setRecommendationsDismissed(true)}
      />

      <CinemaPlayerChrome
        mode={mode}
        title={title}
        eyebrow={eyebrow}
        controlsVisible={controlsVisible}
        live={live}
        atLiveEdge={atLiveEdge}
        ended={ended}
        showNextPrompt={showNextPrompt}
        nextEpisode={nextEpisode}
        timelineCurrent={timelineCurrent}
        timelineDuration={timelineDuration}
        timelineBuffered={timelineBuffered}
        playing={playing}
        mediaReady={media.ready}
        volume={volume}
        liked={liked}
        captions={captions}
        openPanel={openPanel}
        fullscreen={fullscreen}
        onBack={onBack}
        onPrevious={onPrevious}
        onNext={onNext}
        onLike={onLike}
        onJumpToLive={jumpToLive}
        onDismissNext={() => setNearEndDismissed(true)}
        onTimelineSeek={(time) => {
          const target = live ? seekableStart + time : time;
          if (videoRef.current) videoRef.current.currentTime = target;
          setCurrentTime(target);
        }}
        onVolumeChange={setVideoVolume}
        onToggleMute={toggleMute}
        onSeekBy={seekBy}
        onTogglePlayback={() => togglePlayback(true)}
        onOpenPanel={open}
        onToggleFullscreen={() => void toggleFullscreen()}
      />

      {openPanel && !ended && (
        <CinemaPlayerPanel
          panelRef={panelRef}
          openPanel={openPanel}
          settingsSection={settingsSection}
          live={live}
          qualityLabel={qualityLabel}
          qualityOptions={qualityOptions}
          sourceOptions={sourceOptions}
          activeSourceId={activeSourceId}
          subtitleOptions={subtitleOptions}
          subtitleSourceOptions={subtitleSourceOptions}
          subtitleLanguages={subtitleLanguages}
          playbackRate={playbackRate}
          captions={captions}
          onClose={closePanel}
          onSectionChange={setSettingsSection}
          onRateChange={changeRate}
          onQualitySelect={onQualitySelect}
          onSourceSelect={onSourceSelect}
        />
      )}
    </div>
  );
}
