import { useEffect, useRef, type RefObject } from "react";

interface PlaybackProgressOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  src?: string;
  live: boolean;
  startPosition: number;
  onProgress?: (position: number, duration: number) => void;
}

export function usePlaybackProgress({
  videoRef,
  src,
  live,
  startPosition,
  onProgress,
}: PlaybackProgressOptions) {
  const startPositionRef = useRef(startPosition);
  const resumePositionRef = useRef(startPosition);
  const onProgressRef = useRef(onProgress);

  useEffect(() => {
    startPositionRef.current = startPosition;
    if (resumePositionRef.current <= 0) resumePositionRef.current = startPosition;
  }, [startPosition]);

  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || live || !src) return;

    let seeked = false;
    const trySeek = () => {
      const resumeAt = Math.max(startPositionRef.current, resumePositionRef.current);
      if (seeked || resumeAt <= 0) return;
      if (Number.isFinite(video.duration) && resumeAt < video.duration - 5) {
        video.currentTime = resumeAt;
      }
      seeked = true;
    };
    const rememberPosition = () => {
      if (Number.isFinite(video.currentTime)) resumePositionRef.current = video.currentTime;
    };
    const report = () => {
      const duration = video.duration;
      if (Number.isFinite(duration) && duration > 0) {
        onProgressRef.current?.(video.currentTime, duration);
      }
    };

    video.addEventListener("loadedmetadata", trySeek);
    video.addEventListener("timeupdate", rememberPosition);
    if (video.readyState >= 1) trySeek();
    const poll = window.setInterval(report, 5_000);
    return () => {
      video.removeEventListener("loadedmetadata", trySeek);
      video.removeEventListener("timeupdate", rememberPosition);
      window.clearInterval(poll);
      report();
    };
  }, [live, src, videoRef]);
}
