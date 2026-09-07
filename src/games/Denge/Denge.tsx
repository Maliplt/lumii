import { useRef } from "react";
import "./Denge.scss";

export default function Denge() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <div className="denge-game-container">
      <iframe
        ref={iframeRef}
        src="/games/denge/index.html"
        title="Denge Oyunu"
        className="denge-game-frame"
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
