import type { NavigateFunction } from "react-router-dom";
import type { ContentAccessLevel } from "../types/types";
import { canUseLevel, contentAccessLevel } from "./subscription";

export interface PlaybackNavigationState {
  title?: string;
  season?: number;
  episode?: number;
}

type WebkitFullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type WebkitFullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
};

export function isPlaybackFullscreenActive(): boolean {
  if (typeof document === "undefined") return false;
  return Boolean(
    document.fullscreenElement ||
      (document as WebkitFullscreenDocument).webkitFullscreenElement,
  );
}

export function isMobilePlaybackDevice(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(pointer: coarse)").matches &&
    Math.min(window.innerWidth, window.innerHeight) <= 820
  );
}

export async function requestMobilePlaybackFullscreen(): Promise<boolean> {
  if (typeof document === "undefined" || !isMobilePlaybackDevice()) {
    return false;
  }
  if (isPlaybackFullscreenActive()) return true;

  const target = document.documentElement as WebkitFullscreenElement;
  const request =
    target.requestFullscreen?.bind(target) ??
    target.webkitRequestFullscreen?.bind(target);
  if (!request) return false;

  try {
    await request();
    return isPlaybackFullscreenActive();
  } catch {
    return false;
  }
}

interface NavigateToPlaybackOptions extends PlaybackNavigationState {
  navigate: NavigateFunction;
  type: "movie" | "tv";
  id: string | number;
  planId?: string | null;
  accessLevel?: ContentAccessLevel;
  autoFullscreen?: boolean;
}

// oynatma yönlendirmesi
export function navigateToPlayback({
  navigate,
  type,
  id,
  planId,
  accessLevel,
  autoFullscreen = false,
  title,
  season,
  episode,
}: NavigateToPlaybackOptions): void {
  const requiredLevel = contentAccessLevel(type, id, accessLevel);
  if (!canUseLevel(planId, requiredLevel)) {
    navigate("/packages");
    return;
  }

  if (autoFullscreen) {
    void requestMobilePlaybackFullscreen();
  }

  const state: PlaybackNavigationState = { title };
  if (season != null) state.season = season;
  if (episode != null) state.episode = episode;

  navigate(`/${type}/${id}/player`, { state });
}
