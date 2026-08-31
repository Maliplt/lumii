import { useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";

interface CinemaProgressProps {
  currentTime: number;
  duration: number;
  buffered: number;
  playing: boolean;
  live?: boolean;
  ready?: boolean;
  onSeek: (time: number) => void;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export default function CinemaProgress({ currentTime, duration, buffered, playing, live = false, ready = false, onSeek }: CinemaProgressProps) {
  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);
  const [dragTime, setDragTime] = useState(currentTime);
  const [hover, setHover] = useState<{ time: number; percent: number; locked: boolean } | null>(null);
  const displayedTime = dragging ? dragTime : currentTime;
  const progress = duration > 0 ? Math.min(100, (displayedTime / duration) * 100) : 0;
  const bufferedProgress = duration > 0 ? Math.min(100, (buffered / duration) * 100) : 0;
  const label = useMemo(() => `${formatTime(displayedTime)} / ${formatTime(duration)}`, [displayedTime, duration]);

  const timeFromPointer = (event: ReactPointerEvent<HTMLInputElement>) => {
    if (duration <= 0) return { percent: 0, time: 0, locked: false };
    const bounds = event.currentTarget.getBoundingClientRect();
    const rawPercent = Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100));
    const thumbX = bounds.left + bounds.width * progress / 100;
    const locked = draggingRef.current || Math.abs(event.clientX - thumbX) <= 12;
    const percent = locked ? progress : rawPercent;
    return { percent, time: duration * percent / 100, locked };
  };
  const updateHover = (event: ReactPointerEvent<HTMLInputElement>) => {
    if (duration <= 0) return;
    const point = timeFromPointer(event);
    setHover(point);
    if (draggingRef.current) updateDrag(point.time);
  };
  const updateDrag = (value: number) => {
    setDragTime(value);
    onSeek(value);
  };

  return (
    <div
      className={`cine-progress${playing ? " is-playing" : " is-paused"}${dragging ? " is-dragging" : ""}${hover?.locked ? " is-thumb-hovered" : ""}`}
      style={{
        "--cine-progress": `${progress}%`,
        "--cine-buffered": `${bufferedProgress}%`,
        "--cine-hover": `${hover?.locked ? progress : hover?.percent ?? 0}%`,
      } as CSSProperties}
    >
      <div className="cine-progress__track" aria-hidden="true">
        <span className="cine-progress__buffer" />
        <span className="cine-progress__fill" />
        {ready && duration > 0 && <span className="cine-progress__head" />}
        {hover && <span className="cine-progress__tooltip">{formatTime(hover.locked ? displayedTime : hover.time)}</span>}
      </div>
      <input
        className="cine-progress__input"
        type="range"
        min={0}
        max={Math.max(duration, 0)}
        step={0.1}
        value={Math.min(displayedTime, Math.max(duration, 0))}
        aria-label={`Oynatma konumu, ${label}`}
        onPointerMove={updateHover}
        onPointerEnter={updateHover}
        onPointerLeave={() => setHover(null)}
        onPointerDown={(event) => {
          const point = timeFromPointer(event);
          draggingRef.current = true;
          setDragging(true);
          setHover(point);
          updateDrag(point.time);
          event.currentTarget.setPointerCapture?.(event.pointerId);
        }}
        onPointerUp={(event) => {
          const point = timeFromPointer(event);
          updateDrag(point.time);
          setHover(point);
          draggingRef.current = false;
          setDragging(false);
          event.currentTarget.releasePointerCapture?.(event.pointerId);
        }}
        onPointerCancel={() => { draggingRef.current = false; setDragging(false); }}
        onInput={(event) => updateDrag(Number(event.currentTarget.value))}
        onChange={(event) => updateDrag(Number(event.currentTarget.value))}
      />
      <span className="cine-progress__time">{live ? `-${formatTime(Math.max(0, duration - displayedTime))} / CANLI` : label}</span>
    </div>
  );
}
