import { Pause, Play, RotateCcw, RotateCw } from "lucide-react";
import type { RefObject } from "react";
import type { ServiceErrorPresentation } from "../../services/serviceError";
import CinemaEndScreen from "./CinemaEndScreen";
import type { CinemaRecommendation } from "./cinemaPlayerTypes";
import type { CinemaCaptionsController } from "./useCinemaSubtitles";
import type { CinemaPulse, CinemaVideoGestures } from "./useCinemaVideoGestures";

interface CinemaPlayerStageProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  title: string;
  ended: boolean;
  centerPulse: CinemaPulse | null;
  captions: CinemaCaptionsController;
  showBufferSpinner: boolean;
  errorPresentation: ServiceErrorPresentation | null;
  retry?: () => void;
  showRecommendations: boolean;
  recommendations: CinemaRecommendation[];
  gestures: CinemaVideoGestures;
  onDismissRecommendations: () => void;
}

function classes(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function CinemaPlayerStage({
  videoRef,
  title,
  ended,
  centerPulse,
  captions,
  showBufferSpinner,
  errorPresentation,
  retry,
  showRecommendations,
  recommendations,
  gestures,
  onDismissRecommendations,
}: CinemaPlayerStageProps) {
  return (
    <>
      <video ref={videoRef} className="cine-player__video" playsInline preload="auto" aria-label={title} {...gestures} />
      <div className="cine-player__ambient" aria-hidden="true" />

      {centerPulse && (
        <span className={classes("cine-player__pulse", centerPulse === "rewind" && "is-rewind", centerPulse === "forward" && "is-forward")} aria-hidden="true">
          {centerPulse === "play" && <Play size={31} fill="currentColor" />}
          {centerPulse === "pause" && <Pause size={31} fill="currentColor" />}
          {centerPulse === "rewind" && <><RotateCcw size={27} /><b>10</b></>}
          {centerPulse === "forward" && <><RotateCw size={27} /><b>10</b></>}
        </span>
      )}

      {captions.text && !ended && (
        <div className={classes("cine-captions", `is-${captions.style.size}`, `has-${captions.style.background}-background`, `is-${captions.style.color}`, captions.style.italic && "is-italic", captions.style.bold && "is-bold")}>
          {captions.text.split("\n").map((line, index) => <span style={{ fontWeight: captions.style.bold ? 900 : 620, WebkitTextStroke: captions.style.bold ? ".35px currentColor" : undefined }} key={`${index}-${line}`}>{line}</span>)}
        </div>
      )}

      {showBufferSpinner && (
        <div className="cine-buffering" aria-label="Yükleniyor" role="status">
          <div className="cine-buffering__spinner" />
        </div>
      )}

      {errorPresentation && (
        <div className="cine-state cine-state--error" role="alert">
          <span className="cine-state__code">Bağlantı / 01</span>
          <strong>{errorPresentation.title}</strong>
          <small>{errorPresentation.message}</small>
          {retry && <button type="button" onClick={retry}>Tekrar Dene</button>}
        </div>
      )}

      {showRecommendations && !errorPresentation && <CinemaEndScreen recommendations={recommendations} onClose={onDismissRecommendations} />}
    </>
  );
}
