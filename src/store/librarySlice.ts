import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Movie, TVShow } from "../types/types";
import { auth } from "./authSlice";

// kütüphane tanımı
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

const MAX_HISTORY_ITEMS = 100;
const MAX_CONTINUE_WATCHING_ITEMS = 40;

export function toSavedItem(item: SavedItem): SavedItem {
  if (item.media_type === "movie") {
    const movie = item as Movie & SavedItem;
    return {
      id: movie.id,
      title: movie.title ?? "",
      original_title: movie.original_title ?? movie.title ?? "",
      overview: movie.overview ?? "",
      poster_path: movie.poster_path ?? null,
      backdrop_path: movie.backdrop_path ?? null,
      release_date: movie.release_date ?? "",
      genre_ids: Array.isArray(movie.genre_ids) ? movie.genre_ids : [],
      adult: Boolean(movie.adult),
      original_language: movie.original_language ?? "",
      popularity: movie.popularity ?? 0,
      vote_average: movie.vote_average ?? 0,
      vote_count: movie.vote_count ?? 0,
      video: Boolean(movie.video),
      media_type: "movie",
      watchProgress: movie.watchProgress,
    };
  }

  const show = item as TVShow & SavedItem;
  return {
    id: show.id,
    name: show.name ?? "",
    original_name: show.original_name ?? show.name ?? "",
    overview: show.overview ?? "",
    poster_path: show.poster_path ?? null,
    backdrop_path: show.backdrop_path ?? null,
    first_air_date: show.first_air_date ?? "",
    genre_ids: Array.isArray(show.genre_ids) ? show.genre_ids : [],
    origin_country: Array.isArray(show.origin_country) ? show.origin_country : [],
    original_language: show.original_language ?? "",
    popularity: show.popularity ?? 0,
    vote_average: show.vote_average ?? 0,
    vote_count: show.vote_count ?? 0,
    media_type: "tv",
    watchProgress: show.watchProgress,
  };
}

export function normalizeLibraryState(state: LibraryState): LibraryState {
  return {
    activeId: state.activeId,
    byProfile: Object.fromEntries(
      Object.entries(state.byProfile).map(([profileId, data]) => [
        profileId,
        {
          watchlist: data.watchlist.map(toSavedItem),
          liked: data.liked.map(toSavedItem),
          history: data.history.slice(0, MAX_HISTORY_ITEMS).map(toSavedItem),
          continueWatching: data.continueWatching
            .slice(0, MAX_CONTINUE_WATCHING_ITEMS)
            .map(toSavedItem),
        },
      ]),
    ),
  };
}

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

// profil kütüphanesi
function bucket(state: LibraryState): LibraryData | null {
  if (!state.activeId) return null;
  if (!state.byProfile[state.activeId]) {
    state.byProfile[state.activeId] = { ...emptyLibrary };
  }
  return state.byProfile[state.activeId];
}

// liste düzenleme
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
      if (b) b.watchlist = toggle(b.watchlist, toSavedItem(action.payload));
    },
    toggleLiked(state, action: PayloadAction<SavedItem>) {
      const b = bucket(state);
      if (b) b.liked = toggle(b.liked, toSavedItem(action.payload));
    },
    startWatching(state, action: PayloadAction<SavedItem>) {
      const b = bucket(state);
      if (!b) return;
      const savedItem = toSavedItem(action.payload);
      const prev = b.continueWatching.find((x) =>
        sameSavedItem(x, savedItem),
      );
      const item = {
        ...savedItem,
        watchProgress: savedItem.watchProgress ?? prev?.watchProgress,
      };
      b.continueWatching = [
        item,
        ...b.continueWatching.filter((x) => !sameSavedItem(x, item)),
      ].slice(0, MAX_CONTINUE_WATCHING_ITEMS);
      b.history = [
        item,
        ...b.history.filter((x) => !sameSavedItem(x, item)),
      ].slice(0, MAX_HISTORY_ITEMS);
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
