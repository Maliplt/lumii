import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

interface CinemaPlaybackStateOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  src?: string;
  live: boolean;
  startPosition: number;
  onProgress?: (position: number, duration: number) => void;
  onEnded: () => void;
}

export function useCinemaPlaybackState({ videoRef, src, live, startPosition, onProgress, onEnded }: CinemaPlaybackStateOptions) {
  const progressTimer = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [currentTime, setCurrentTime] = useState(live ? 0 : startPosition);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [seekableStart, setSeekableStart] = useState(0);
  const [seekableEnd, setSeekableEnd] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const syncTime = () => {
      setCurrentTime(video.currentTime || 0);
      setDuration(Number.isFinite(video.duration) ? video.duration : 0);
      const ranges = video.buffered;
      setBuffered(ranges.length ? ranges.end(ranges.length - 1) : 0);
      const seekable = video.seekable;
      if (seekable.length) {
        setSeekableStart(seekable.start(0));
        setSeekableEnd(seekable.end(seekable.length - 1));
      }
    };
    const handlePlay = () => { setPlaying(true); setEnded(false); };
    const handlePause = () => setPlaying(false);
    const handleEnded = () => { setPlaying(false); setEnded(true); onEnded(); };
    const handleRateChange = () => setPlaybackRate(video.playbackRate);
    const syncEvents = ["timeupdate", "progress", "durationchange", "loadedmetadata", "seeked"];
    syncEvents.forEach((event) => video.addEventListener(event, syncTime));
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("ratechange", handleRateChange);
    return () => {
      syncEvents.forEach((event) => video.removeEventListener(event, syncTime));
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("ratechange", handleRateChange);
    };
  }, [onEnded, src, videoRef]);

  useEffect(() => {
    window.clearInterval(progressTimer.current);
    if (!onProgress || live) return;
    progressTimer.current = window.setInterval(() => {
      const video = videoRef.current;
      if (video && video.duration > 0) onProgress(video.currentTime, video.duration);
    }, 5_000);
    return () => window.clearInterval(progressTimer.current);
  }, [live, onProgress, videoRef]);

  const changeRate = useCallback((rate: number) => {
    if (videoRef.current) videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  }, [videoRef]);

  return {
    playing,
    ended,
    currentTime,
    duration,
    buffered,
    playbackRate,
    seekableStart,
    seekableEnd,
    setCurrentTime,
    changeRate,
  };
}
