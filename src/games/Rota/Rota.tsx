import { useRef } from "react";
import "./Rota.scss";

export default function Rota() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <div className="rota-game-container">
      <iframe
        ref={iframeRef}
        src="/games/rota/index.html"
        title="Rota Oyunu"
        className="rota-game-frame"
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
