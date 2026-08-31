import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import Hls from "hls.js";

interface UseCinemaMediaOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  src?: string;
  streamType: "file" | "hls";
  live: boolean;
  autoplay: boolean;
  startMuted: boolean;
  startPosition: number;
  maxVideoHeight: number;
  minimumDuration: number;
  onPlaybackError?: () => boolean;
}

export function useCinemaMedia({
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
}: UseCinemaMediaOptions) {
  const errorHandler = useRef(onPlaybackError);
  const autoplayRef = useRef(autoplay);
  const startMutedRef = useRef(startMuted);
  const playbackPositionRef = useRef(startPosition);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    errorHandler.current = onPlaybackError;
    autoplayRef.current = autoplay;
    startMutedRef.current = startMuted;
  }, [autoplay, onPlaybackError, startMuted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let disposed = false;
    let hls: Hls | null = null;
    let timeout = 0;
    let bufferingTimer = 0;
    let handledFailure = false;
    let restoredPosition = false;
    let autoplayAttempted = false;
    let networkRetries = 0;
    let mediaRetries = 0;
    let mediaReady = false;

    const clearSource = () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
    const markReady = () => {
      if (disposed) return;
      window.clearTimeout(timeout);
      window.clearTimeout(bufferingTimer);
      mediaReady = true;
      setBuffering(false);
      if (!restoredPosition && !live && playbackPositionRef.current > 0 && Number.isFinite(video.duration)) {
        video.currentTime = Math.min(playbackPositionRef.current, Math.max(0, video.duration - 1));
        restoredPosition = true;
      }
      setReady(true);
      setFailed(false);
      if (!autoplayAttempted && autoplayRef.current) {
        autoplayAttempted = true;
        void video.play().catch(() => undefined);
      }
    };
    const markFailed = () => {
      if (disposed || handledFailure) return;
      handledFailure = true;
      window.clearTimeout(bufferingTimer);
      setBuffering(false);
      if (!(errorHandler.current?.() ?? false)) setFailed(true);
    };

    const scheduleBuffering = () => {
      if (disposed || video.paused || video.ended || !mediaReady) return;
      window.clearTimeout(bufferingTimer);
      bufferingTimer = window.setTimeout(() => setBuffering(true), 220);
    };
    const clearBuffering = () => {
      window.clearTimeout(bufferingTimer);
      setBuffering(false);
    };
    const rememberPosition = () => {
      if (!live) playbackPositionRef.current = video.currentTime;
    };

    setReady(false);
    setFailed(false);
    setBuffering(false);
    video.muted = startMutedRef.current;
    if (!src) {
      clearSource();
      return () => { disposed = true; };
    }

    const onLoadedMetadata = () => {
      if (!live && minimumDuration > 0 && video.duration > 0 && video.duration < minimumDuration) {
        markFailed();
        return;
      }
      markReady();
    };
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("canplay", markReady);
    video.addEventListener("error", markFailed);
    video.addEventListener("waiting", scheduleBuffering);
    video.addEventListener("stalled", scheduleBuffering);
    video.addEventListener("playing", clearBuffering);
    video.addEventListener("seeked", clearBuffering);
    video.addEventListener("timeupdate", rememberPosition);

    if (streamType === "hls" && Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 8,
        backBufferLength: live ? 600 : 120,
        maxBufferLength: 600,
        maxMaxBufferLength: 1_800,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        const allowed = data.levels
          .map((level, index) => ({ level, index }))
          .filter(({ level }) => !level.height || level.height <= maxVideoHeight);
        hls!.autoLevelCapping = allowed.length
          ? allowed.reduce((best, item) => item.level.height >= best.level.height ? item : best).index
          : 0;
        markReady();
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR && networkRetries < 3) {
          networkRetries += 1;
          hls?.startLoad();
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR && mediaRetries < 2) {
          mediaRetries += 1;
          hls?.recoverMediaError();
        } else markFailed();
      });
      hls.on(Hls.Events.FRAG_BUFFERED, () => {
        networkRetries = 0;
        mediaRetries = 0;
      });
    } else {
      video.src = src;
      video.load();
    }
    timeout = window.setTimeout(markFailed, streamType === "hls" ? 16_000 : 22_000);

    return () => {
      disposed = true;
      window.clearTimeout(timeout);
      window.clearTimeout(bufferingTimer);
      hls?.destroy();
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("canplay", markReady);
      video.removeEventListener("error", markFailed);
      video.removeEventListener("waiting", scheduleBuffering);
      video.removeEventListener("stalled", scheduleBuffering);
      video.removeEventListener("playing", clearBuffering);
      video.removeEventListener("seeked", clearBuffering);
      video.removeEventListener("timeupdate", rememberPosition);
    };
  }, [attempt, live, maxVideoHeight, minimumDuration, src, streamType, videoRef]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return { ready, buffering, failed, retry };
}
