import { useRef } from "react";
import "./Game2048.scss";

export default function Game2048() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <div className="game2048-game-container">
      <iframe
        ref={iframeRef}
        src="/games/2048/index.html"
        title="2048 Oyunu"
        className="game2048-game-frame"
        allow="autoplay; fullscreen"
        onLoad={() => {
          try {
            iframeRef.current?.focus();
          } catch {
            // ignore
          }
        }}
      />
    </div>
  );
}
