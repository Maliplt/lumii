import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { optionalServiceRequest } from "../services/serviceError";
import { pickTrailer, tmdbApi } from "../services/tmdb";
import {
  TrailerPreviewContext,
  type TrailerPreviewPriority,
} from "./trailerPreviewContext";

export type TrailerPreviewStatus =
  | "idle"
  | "loading"
  | "ready"
  | "unavailable";

interface UseTrailerPreviewOptions {
  mediaType: "movie" | "tv" | null;
  mediaId: number | null;
  enabled: boolean;
  priority: TrailerPreviewPriority;
  autoStart?: boolean;
  delayMs?: number;
  inlineVideoKey?: string | null;
}

interface PreviewState {
  targetKey: string | null;
  status: TrailerPreviewStatus;
  videoKey: string | null;
}

const IDLE_PREVIEW: PreviewState = {
  targetKey: null,
  status: "idle",
  videoKey: null,
};

export function useTrailerPreview({
  mediaType,
  mediaId,
  enabled,
  priority,
  autoStart = false,
  delayMs = 0,
  inlineVideoKey,
}: UseTrailerPreviewOptions) {
  const coordinator = useContext(TrailerPreviewContext);
  if (!coordinator) {
    throw new Error("useTrailerPreview, TrailerPreviewProvider içinde kullanılmalıdır.");
  }

  const owner = useRef(Symbol("trailer-preview"));
  const requestController = useRef<AbortController | null>(null);
  const requestVersion = useRef(0);
  const timer = useRef<number | null>(null);
  const stateRef = useRef<PreviewState>(IDLE_PREVIEW);
  const [state, setState] = useState<PreviewState>(IDLE_PREVIEW);
  const targetKey =
    mediaType && mediaId != null
      ? `${mediaType}:${mediaId}:${inlineVideoKey === undefined ? "remote" : inlineVideoKey ?? "none"}`
      : null;

  const updateState = useCallback((next: PreviewState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const cancelLocal = useCallback(() => {
    if (timer.current != null) window.clearTimeout(timer.current);
    timer.current = null;
    requestController.current?.abort();
    requestController.current = null;
    requestVersion.current += 1;
    if (stateRef.current.status !== "idle") updateState(IDLE_PREVIEW);
  }, [updateState]);

  const stop = useCallback(() => {
    cancelLocal();
    coordinator.release(owner.current);
  }, [cancelLocal, coordinator]);

  const start = useCallback(async (): Promise<boolean> => {
    if (!enabled || !mediaType || mediaId == null || !targetKey) return false;
    const currentState = stateRef.current;
    if (
      currentState.targetKey === targetKey &&
      (currentState.status === "loading" || currentState.status === "ready")
    ) {
      return true;
    }
    if (!coordinator.claim({ owner: owner.current, priority, cancel: cancelLocal })) {
      return false;
    }

    requestController.current?.abort();
    const version = requestVersion.current + 1;
    requestVersion.current = version;
    updateState({ targetKey, status: "loading", videoKey: null });

    let videoKey = inlineVideoKey ?? null;
    if (inlineVideoKey === undefined) {
      const controller = new AbortController();
      requestController.current = controller;
      const videos = await optionalServiceRequest(
        tmdbApi.getVideos(mediaType, mediaId, controller.signal),
      );
      if (requestController.current === controller) requestController.current = null;
      videoKey = videos ? pickTrailer(videos.results ?? []) : null;
    }

    if (
      requestVersion.current !== version ||
      !coordinator.owns(owner.current)
    ) {
      return false;
    }
    if (!videoKey) {
      updateState({ targetKey, status: "unavailable", videoKey: null });
      coordinator.release(owner.current);
      return false;
    }

    updateState({ targetKey, status: "ready", videoKey });
    return true;
  }, [
    cancelLocal,
    coordinator,
    enabled,
    inlineVideoKey,
    mediaId,
    mediaType,
    priority,
    targetKey,
    updateState,
  ]);

  useEffect(() => {
    if (!enabled || !targetKey) stop();
    return stop;
  }, [enabled, stop, targetKey]);

  useEffect(() => {
    if (!autoStart || !enabled || !targetKey) return;
    timer.current = window.setTimeout(() => {
      timer.current = null;
      void start();
    }, delayMs);
    return () => {
      if (timer.current != null) window.clearTimeout(timer.current);
      timer.current = null;
    };
  }, [autoStart, delayMs, enabled, start, targetKey]);

  const belongsToCurrentTarget = state.targetKey === targetKey;
  return {
    status: belongsToCurrentTarget ? state.status : "idle",
    videoKey: belongsToCurrentTarget ? state.videoKey : null,
    start,
    stop,
  } as const;
}
