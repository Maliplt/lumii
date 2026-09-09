import { useRef } from "react";
import "./BambooHop.scss";

export default function BambooHop() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <div className="bamboo-hop-game-container">
      <iframe
        ref={iframeRef}
        src="/games/bamboo-hop/index.html"
        title="Bamboo Hop Oyunu"
        className="bamboo-hop-game-frame"
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
