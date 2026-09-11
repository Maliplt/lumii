import { useRef } from "react";
import "./EggHop.scss";

export default function EggHop() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <div className="egg-hop-game-container">
      <iframe
        ref={iframeRef}
        src="/games/egg-hop/index.html"
        title="Egg Hop Oyunu"
        className="egg-hop-game-frame"
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
