import { configureStore } from "@reduxjs/toolkit";
import {
  useDispatch,
  useSelector,
  type TypedUseSelectorHook,
} from "react-redux";

import { auth, type AuthState, type Profile } from "./authSlice";
import {
  library,
  emptyLibrary,
  type LibraryState,
  type LibraryData,
} from "./librarySlice";
import { settings, type SettingsState } from "./settingsSlice";

export * from "./authSlice";
export * from "./librarySlice";
export * from "./settingsSlice";

interface PersistedState {
  auth: AuthState;
  library: LibraryState;
  settings: SettingsState;
}

// durumu yukle
function loadState(): PersistedState | undefined {
  try {
    const raw = localStorage.getItem("tenet-state");
    if (!raw) return undefined;
    return JSON.parse(raw) as PersistedState;
  } catch (err) {
    console.warn("Kaydedilmiş durum okunamadı, sıfırdan başlanıyor:", err);
    return undefined;
  }
}

export const store = configureStore({
  reducer: {
    auth: auth.reducer,
    library: library.reducer,
    settings: settings.reducer,
  },
  preloadedState: loadState(),
});

// durumu kaydet
store.subscribe(() => {
  localStorage.setItem("tenet-state", JSON.stringify(store.getState()));
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// secimler
export const selectActiveProfile = (s: RootState): Profile | null =>
  s.auth.currentUser?.profiles.find((p) => p.id === s.auth.activeProfileId) ??
  null;

export const selectLibrary = (s: RootState): LibraryData =>
  (s.library.activeId && s.library.byProfile[s.library.activeId]) ||
  emptyLibrary;
