import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import Hls from "hls.js";
import { getLiveEdge } from "./playbackMedia";

interface MediaSourceOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  src?: string;
  hlsEnabled: boolean;
  live: boolean;
  startMuted: boolean;
  autoplay: boolean;
  maxVideoHeight: number;
  minimumDuration: number;
  onPlaybackError?: () => boolean;
}

export function useMediaSource({
  videoRef,
  src,
  hlsEnabled,
  live,
  startMuted,
  autoplay,
  maxVideoHeight,
  minimumDuration,
  onPlaybackError,
}: MediaSourceOptions) {
  const hlsRef = useRef<Hls | null>(null);
  const errorHandlerRef = useRef(onPlaybackError);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    errorHandlerRef.current = onPlaybackError;
  }, [onPlaybackError]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;
    if (!src) {
      video.removeAttribute("src");
      video.load();
      queueMicrotask(() => {
        if (!cancelled) {
          setReady(false);
          setError(false);
        }
      });
      return () => { cancelled = true; };
    }

    let hls: Hls | null = null;
    let snappedToLive = false;
    let failureHandled = false;
    let readyTimer: ReturnType<typeof setTimeout> | null = null;
    video.muted = startMuted;
    queueMicrotask(() => {
      if (!cancelled) {
        setReady(false);
        setError(false);
      }
    });

    const tryPlay = () => {
      if (autoplay) video.play().catch(() => undefined);
    };
    const fail = () => {
      if (cancelled || failureHandled) return;
      failureHandled = true;
      if (!(errorHandlerRef.current?.() ?? false)) setError(true);
    };

    if (hlsEnabled && Hls.isSupported()) {
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
      readyTimer = setTimeout(fail, 15_000);
      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        if (cancelled) return;
        if (readyTimer) clearTimeout(readyTimer);
        readyTimer = null;
        const allowed = data.levels
          .map((level, index) => ({ level, index }))
          .filter(({ level }) => !level.height || level.height <= maxVideoHeight);
        hls!.autoLevelCapping = allowed.length
          ? allowed.reduce((best, item) => item.level.height >= best.level.height ? item : best).index
          : 0;
        setReady(true);
        tryPlay();
      });
      hls.on(Hls.Events.LEVEL_LOADED, (_event, data) => {
        if (cancelled || !live || snappedToLive || !data.details.live) return;
        snappedToLive = true;
        video.currentTime = getLiveEdge(video, hlsRef.current);
      });
      let networkRetries = 0;
      let mediaRetries = 0;
      hls.on(Hls.Events.FRAG_BUFFERED, () => {
        networkRetries = 0;
        mediaRetries = 0;
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR && networkRetries < 3) {
          networkRetries += 1;
          hls?.startLoad();
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR && mediaRetries < 2) {
          mediaRetries += 1;
          hls?.recoverMediaError();
        } else {
          fail();
        }
      });
    } else if (hlsEnabled && video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      setReady(true);
      tryPlay();
    } else if (!hlsEnabled) {
      const onReady = () => {
        if (cancelled || failureHandled) return;
        if (minimumDuration > 0 && Number.isFinite(video.duration) &&
          video.duration > 0 && video.duration < minimumDuration) {
          fail();
          return;
        }
        if (readyTimer) clearTimeout(readyTimer);
        readyTimer = null;
        setReady(true);
        tryPlay();
      };
      video.addEventListener("loadedmetadata", onReady);
      video.addEventListener("canplay", onReady);
      video.addEventListener("error", fail);
      video.src = src;
      video.load();
      readyTimer = setTimeout(fail, 20_000);

      return () => {
        cancelled = true;
        if (readyTimer) clearTimeout(readyTimer);
        video.removeEventListener("loadedmetadata", onReady);
        video.removeEventListener("canplay", onReady);
        video.removeEventListener("error", fail);
      };
    } else {
      readyTimer = setTimeout(fail, 0);
    }

    return () => {
      cancelled = true;
      if (readyTimer) clearTimeout(readyTimer);
      hls?.destroy();
      hlsRef.current = null;
    };
  }, [attempt, autoplay, hlsEnabled, live, maxVideoHeight, minimumDuration, src, startMuted, videoRef]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return {
    hlsRef,
    ready,
    error,
    retry,
  };
}
