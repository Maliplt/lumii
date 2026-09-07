import { useRef } from "react";
import "./Prizma.scss";

export default function Prizma() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <div className="prizma-game-container">
      <iframe
        ref={iframeRef}
        src="/games/prizma/index.html"
        title="Prizma Oyunu"
        className="prizma-game-frame"
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
