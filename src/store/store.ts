import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import {
  auth,
  applyDuePlanChanges,
  type Profile,
} from "./authSlice";
import {
  DEFAULT_PROFILE_PREFERENCES,
  type ProfilePreferences,
} from "./profilePreferences";
import { library, emptyLibrary, type LibraryData } from "./librarySlice";
import {
  loadPersistedState,
  PERSIST_SAVE_THROTTLE_MS,
  savePersistedState,
  type PersistedState,
  type StorageAdapter,
} from "./persistence";
export * from "./authSlice";
export * from "./librarySlice";
export * from "./profilePreferences";

function getBrowserStorage(): StorageAdapter | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const browserStorage = getBrowserStorage();

export const store = configureStore({
  reducer: {
    auth: auth.reducer,
    library: library.reducer,
  },
  preloadedState: browserStorage
    ? loadPersistedState(browserStorage)
    : undefined,
});

// tarihi gelen planı uygula
store.dispatch(applyDuePlanChanges());

// state'i kaydet
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function persistCurrentState() {
  if (!browserStorage) return;
  const state = store.getState();
  const persistedState: PersistedState = {
    auth: state.auth,
    library: state.library,
  };
  if (!savePersistedState(browserStorage, persistedState)) {
    console.warn("Durum kaydedilemedi.");
  }
}

store.subscribe(() => {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    persistCurrentState();
  }, PERSIST_SAVE_THROTTLE_MS);
});

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    persistCurrentState();
  });
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// dispatch kancaları
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// profil seçiciler
export const selectActiveProfile = (s: RootState): Profile | null =>
  s.auth.currentUser?.profiles.find((p) => p.id === s.auth.activeProfileId) ??
  null;

export const selectShownProfile = (s: RootState): Profile | null =>
  selectActiveProfile(s) ?? s.auth.currentUser?.profiles[0] ?? null;

export const selectProfilePreferences = (s: RootState): ProfilePreferences =>
  selectShownProfile(s)?.preferences ?? DEFAULT_PROFILE_PREFERENCES;

export const selectAutoplayEnabled = (s: RootState): boolean =>
  selectProfilePreferences(s).autoplay;

export const selectPreviewsEnabled = (s: RootState): boolean =>
  selectProfilePreferences(s).previews;

export const selectContinueWatchingRowEnabled = (s: RootState): boolean =>
  selectProfilePreferences(s).showContinueWatching;

// kütüphane seçici
export const selectLibrary = (s: RootState): LibraryData =>
  (s.library.activeId && s.library.byProfile[s.library.activeId]) ||
  emptyLibrary;
