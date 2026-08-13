import type { NavigateFunction } from "react-router-dom";
import type { ContentAccessLevel } from "../types/types";
import { canUseLevel, contentAccessLevel } from "./subscription";

interface PlaybackNavigationState {
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

  try {
    if (target.requestFullscreen) {
      await target.requestFullscreen({ navigationUI: "hide" });
    } else if (target.webkitRequestFullscreen) {
      await target.webkitRequestFullscreen();
    } else {
      return false;
    }
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

// oynatma
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

  const state: PlaybackNavigationState = { title };
  if (season != null) state.season = season;
  if (episode != null) state.episode = episode;

  const openPlayer = () => navigate(`/${type}/${id}/player`, { state });

  if (autoFullscreen && isMobilePlaybackDevice()) {
    void requestMobilePlaybackFullscreen().finally(openPlayer);
    return;
  }

  openPlayer();
}
