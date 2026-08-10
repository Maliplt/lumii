import type { NavigateFunction } from "react-router-dom";
import type { ContentAccessLevel } from "../types/types";
import { canUseLevel, contentAccessLevel } from "./subscription";

export interface PlaybackNavigationState {
  title?: string;
  season?: number;
  episode?: number;
}

interface NavigateToPlaybackOptions extends PlaybackNavigationState {
  navigate: NavigateFunction;
  type: "movie" | "tv";
  id: string | number;
  planId?: string | null;
  accessLevel?: ContentAccessLevel;
}

// oynatma yönlendirmesi
export function navigateToPlayback({
  navigate,
  type,
  id,
  planId,
  accessLevel,
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

  navigate(`/${type}/${id}/player`, { state });
}
