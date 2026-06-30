import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Movie, TVShow } from "../types/types";
import { auth } from "./authSlice";

// kitaplik
export interface WatchProgress {
  position: number; // saniye
  duration: number; // saniye
  season?: number;
  episode?: number;
  updatedAt: number;
}

export function canResumeProgress(progress?: WatchProgress): progress is WatchProgress {
  if (!progress || progress.duration <= 0) return false;
  return progress.position > 30 && progress.position < progress.duration - 15;
}

export function resumeLabel(
  mediaType: "movie" | "tv",
  progress?: WatchProgress,
  format?: (seconds: number) => string,
): string | null {
  if (!canResumeProgress(progress)) return null;
  if (mediaType === "movie") {
    return `İzlemeye Devam Et · ${format ? format(progress.position) : ""}`.trim();
  }
  return `İzlemeye Devam Et S.${progress.season ?? 1} · B.${progress.episode ?? 1}`;
}

export type SavedItem = (Movie | TVShow) & {
  media_type: "movie" | "tv";
  watchProgress?: WatchProgress;
};

export const savedItemKey = (
  item: Pick<SavedItem, "id" | "media_type">,
): string => `${item.media_type}-${item.id}`;

export const sameSavedItem = (
  a: Pick<SavedItem, "id" | "media_type">,
  b: Pick<SavedItem, "id" | "media_type">,
): boolean => savedItemKey(a) === savedItemKey(b);

export interface LibraryData {
  watchlist: SavedItem[];
  liked: SavedItem[];
  history: SavedItem[];
  continueWatching: SavedItem[];
}

export interface LibraryState {
  activeId: string | null;
  byProfile: Record<string, LibraryData>;
}

export const emptyLibrary: LibraryData = {
  watchlist: [],
  liked: [],
  history: [],
  continueWatching: [],
};

const libraryInitial: LibraryState = {
  activeId: null,
  byProfile: {},
};

// aktif profil kovasi
function bucket(state: LibraryState): LibraryData | null {
  if (!state.activeId) return null;
  if (!state.byProfile[state.activeId]) {
    state.byProfile[state.activeId] = { ...emptyLibrary };
  }
  return state.byProfile[state.activeId];
}

// toggle helper
function toggle(list: SavedItem[], item: SavedItem): SavedItem[] {
  return list.some((x) => sameSavedItem(x, item))
    ? list.filter((x) => !sameSavedItem(x, item))
    : [item, ...list];
}

export const library = createSlice({
  name: "library",
  initialState: libraryInitial,
  reducers: {
    toggleWatchlist(state, action: PayloadAction<SavedItem>) {
      const b = bucket(state);
      if (b) b.watchlist = toggle(b.watchlist, action.payload);
    },
    toggleLiked(state, action: PayloadAction<SavedItem>) {
      const b = bucket(state);
      if (b) b.liked = toggle(b.liked, action.payload);
    },
    startWatching(state, action: PayloadAction<SavedItem>) {
      const b = bucket(state);
      if (!b) return;
      const prev = b.continueWatching.find((x) =>
        sameSavedItem(x, action.payload),
      );
      const item = {
        ...action.payload,
        watchProgress: action.payload.watchProgress ?? prev?.watchProgress,
      };
      b.continueWatching = [
        item,
        ...b.continueWatching.filter((x) => !sameSavedItem(x, item)),
      ];
      b.history = [item, ...b.history.filter((x) => !sameSavedItem(x, item))];
    },
    updateWatchProgress(
      state,
      action: PayloadAction<{
        id: number;
        media_type: "movie" | "tv";
        position: number;
        duration: number;
        season?: number;
        episode?: number;
      }>,
    ) {
      const b = bucket(state);
      if (!b) return;
      const { id, media_type, position, duration, season, episode } =
        action.payload;
      const progress: WatchProgress = {
        position,
        duration,
        season,
        episode,
        updatedAt: Date.now(),
      };
      for (const list of [b.continueWatching, b.history]) {
        const it = list.find((x) => x.id === id && x.media_type === media_type);
        if (it) it.watchProgress = progress;
      }
    },
    clearHistory(state) {
      const b = bucket(state);
      if (b) {
        b.history = [];
        b.continueWatching = [];
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(auth.actions.selectProfile, (state, action) => {
        state.activeId = action.payload;
        if (!state.byProfile[action.payload]) {
          state.byProfile[action.payload] = { ...emptyLibrary };
        }
      })
      .addCase(auth.actions.addProfile, (state, action) => {
        state.byProfile[action.payload.id] = { ...emptyLibrary };
      })
      .addCase(auth.actions.deleteProfile, (state, action) => {
        delete state.byProfile[action.payload];
        if (state.activeId === action.payload) state.activeId = null;
      })
      .addCase(auth.actions.logout, (state) => {
        state.activeId = null;
      });
  },
});

export const {
  toggleWatchlist,
  toggleLiked,
  startWatching,
  updateWatchProgress,
  clearHistory,
} = library.actions;
