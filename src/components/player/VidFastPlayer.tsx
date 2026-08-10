import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import tenetLogo from "../../assets/images/tenet-logo.svg";

const VIDFAST_ORIGINS = new Set([
  "https://vidfast.pro",
  "https://vidfast.in",
  "https://vidfast.io",
  "https://vidfast.me",
  "https://vidfast.net",
  "https://vidfast.pm",
  "https://vidfast.xyz",
  "https://vidfast.vc",
  "https://vidfast.bz",
]);

const PROGRESS_INTERVAL_MS = 5_000;

export interface VidFastProgressContext {
  season?: number;
  episode?: number;
}

interface VidFastPlayerProps {
  src: string;
  title: string;
  startPosition?: number;
  onBack?: () => void;
  onProgress?: (
    position: number,
    duration: number,
    context?: VidFastProgressContext,
  ) => void;
}

interface VidFastEventData extends VidFastProgressContext {
  event?: string;
  currentTime?: number;
  duration?: number;
}

interface VidFastMessage {
  type?: string;
  data?: VidFastEventData;
}

function isValidTime(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export default function VidFastPlayer({
  src,
  title,
  startPosition = 0,
  onBack,
  onProgress,
}: VidFastPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressCallbackRef = useRef(onProgress);
  const lastReportAtRef = useRef(0);
  const resumeAppliedRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastProgressRef = useRef<{
    position: number;
    duration: number;
    context?: VidFastProgressContext;
  }>({ position: 0, duration: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    progressCallbackRef.current = onProgress;
  }, [onProgress]);

  const sendCommand = useCallback(
    (command: Record<string, unknown>) => {
      iframeRef.current?.contentWindow?.postMessage(command, new URL(src).origin);
    },
    [src],
  );

  const reportProgress = useCallback(() => {
    const { position, duration, context } = lastProgressRef.current;
    if (duration > 0) {
      progressCallbackRef.current?.(position, duration, context);
      lastReportAtRef.current = Date.now();
    }
  }, []);

  useEffect(() => {
    const handleMessage = (messageEvent: MessageEvent<VidFastMessage>) => {
      if (
        !VIDFAST_ORIGINS.has(messageEvent.origin) ||
        messageEvent.source !== iframeRef.current?.contentWindow ||
        messageEvent.data?.type !== "PLAYER_EVENT"
      ) {
        return;
      }

      const playerData = messageEvent.data.data;
      if (
        !playerData ||
        !isValidTime(playerData.currentTime) ||
        !isValidTime(playerData.duration) ||
        playerData.duration === 0
      ) {
        return;
      }

      lastProgressRef.current = {
        position: Math.min(playerData.currentTime, playerData.duration),
        duration: playerData.duration,
        context: {
          season: playerData.season,
          episode: playerData.episode,
        },
      };

      // The iframe may finish its own media lookup after its load event. Apply
      // the saved position again on the first real player event in that case.
      if (startPosition > 0 && !resumeAppliedRef.current) {
        if (Math.abs(playerData.currentTime - startPosition) > 5) {
          sendCommand({ command: "seek", time: Math.floor(startPosition) });
        }
        resumeAppliedRef.current = true;
      }

      const shouldReportImmediately = [
        "pause",
        "seeked",
        "ended",
        "playerstatus",
      ].includes(playerData.event ?? "");
      if (
        shouldReportImmediately ||
        Date.now() - lastReportAtRef.current >= PROGRESS_INTERVAL_MS
      ) {
        reportProgress();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [reportProgress, sendCommand, startPosition]);

  useEffect(
    () => () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      reportProgress();
    },
    [reportProgress],
  );

  const handleLoad = () => {
    setLoading(false);
    sendCommand({ command: "getStatus" });

    if (startPosition > 0 && !resumeAppliedRef.current) {
      resumeTimerRef.current = setTimeout(() => {
        sendCommand({ command: "seek", time: Math.floor(startPosition) });
      }, 750);
    }
  };

  return (
    <div className="vidfast-player">
      <iframe
        ref={iframeRef}
        className="vidfast-player__frame"
        src={src}
        title={title}
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture; screen-wake-lock"
        allowFullScreen
        referrerPolicy="origin"
        onLoad={handleLoad}
      />

      {loading && (
        <div className="vidfast-player__loading" aria-label="İçerik yükleniyor">
          <img src={tenetLogo} alt="" />
        </div>
      )}

      {onBack && (
        <button
          type="button"
          className="vidfast-player__back"
          onClick={onBack}
          aria-label="Geri"
          title="Geri"
        >
          <ArrowLeft size={24} />
        </button>
      )}
    </div>
  );
}
