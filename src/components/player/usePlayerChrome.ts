import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

const AUTO_HIDE_MS = 3000;

export function usePlayerChrome(containerRef: RefObject<HTMLDivElement | null>) {
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

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
    hideTimer.current = setTimeout(() => setControlsVisible(false), AUTO_HIDE_MS);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        el.requestFullscreen({ navigationUI: "hide" }).catch(() => {
          (el as { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen?.();
        });
      } else {
        document.exitFullscreen().catch(() => setFullscreen(false));
      }
    } catch {
      (el as { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen?.();
    }
  }, [containerRef]);

  return { fullscreen, controlsVisible, showControlsNow, toggleFullscreen };
}
