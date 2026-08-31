import { useCallback, useEffect, useRef, type MouseEventHandler, type PointerEventHandler } from "react";

export type CinemaPulse = "play" | "pause" | "rewind" | "forward";

interface CinemaVideoGestureOptions {
  onTogglePlayback: () => void;
  onSeek: (seconds: number) => void;
  onPulse: (pulse: CinemaPulse) => void;
  onShowControls: () => void;
}

export interface CinemaVideoGestures {
  onClick: MouseEventHandler<HTMLVideoElement>;
  onPointerUp: PointerEventHandler<HTMLVideoElement>;
  onDoubleClick: MouseEventHandler<HTMLVideoElement>;
}

export function useCinemaVideoGestures({ onTogglePlayback, onSeek, onPulse, onShowControls }: CinemaVideoGestureOptions): CinemaVideoGestures {
  const clickTimer = useRef(0);
  const lastTouchTap = useRef<{ time: number; side: "left" | "right" } | null>(null);
  const suppressClickUntil = useRef(0);

  useEffect(() => () => window.clearTimeout(clickTimer.current), []);

  const onClick = useCallback<MouseEventHandler<HTMLVideoElement>>(() => {
    if (performance.now() < suppressClickUntil.current) return;
    window.clearTimeout(clickTimer.current);
    const delay = window.matchMedia("(pointer: coarse)").matches ? 310 : 220;
    clickTimer.current = window.setTimeout(onTogglePlayback, delay);
    onShowControls();
  }, [onShowControls, onTogglePlayback]);

  const onPointerUp = useCallback<PointerEventHandler<HTMLVideoElement>>((event) => {
    if (event.pointerType !== "touch" && event.pointerType !== "pen") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const side = event.clientX < bounds.left + bounds.width / 2 ? "left" : "right";
    const now = performance.now();
    const previous = lastTouchTap.current;
    if (previous && previous.side === side && now - previous.time <= 330) {
      window.clearTimeout(clickTimer.current);
      suppressClickUntil.current = now + 420;
      lastTouchTap.current = null;
      onSeek(side === "left" ? -10 : 10);
      onPulse(side === "left" ? "rewind" : "forward");
      return;
    }
    lastTouchTap.current = { time: now, side };
  }, [onPulse, onSeek]);

  const onDoubleClick = useCallback<MouseEventHandler<HTMLVideoElement>>((event) => {
    window.clearTimeout(clickTimer.current);
    const bounds = event.currentTarget.getBoundingClientRect();
    const backwards = event.clientX < bounds.left + bounds.width / 2;
    onSeek(backwards ? -10 : 10);
    onPulse(backwards ? "rewind" : "forward");
  }, [onPulse, onSeek]);

  return { onClick, onPointerUp, onDoubleClick };
}
