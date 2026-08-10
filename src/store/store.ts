import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import { auth, type AuthState, type Profile } from "./authSlice";
import { library, emptyLibrary, type LibraryState, type LibraryData } from "./librarySlice";
import { settings, settingsInitial, type SettingsState } from "./settingsSlice";
export * from "./authSlice";
export * from "./librarySlice";
export * from "./settingsSlice";

interface PersistedState {
  auth: AuthState;
  library: LibraryState;
  settings: SettingsState;
}

// durum yükleme
function loadState(): PersistedState | undefined {
  try {
    const raw = localStorage.getItem("tenet-state");
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as PersistedState & {
      settings?: SettingsState & { autoplay?: boolean };
    };

    // eski autoplay ayarini profillere tasi
    const legacyAutoplay = parsed.settings?.autoplay;
    const fallbackPlayback = legacyAutoplay === false ? "manual" : "auto";
    const migrateProfiles = (profiles?: Profile[]) => {
      profiles?.forEach((profile) => {
        if (!profile.playback) profile.playback = fallbackPlayback;
      });
    };
    migrateProfiles(parsed.auth?.currentUser?.profiles);
    parsed.auth?.accounts?.forEach((account) => migrateProfiles(account.profiles));

    if (parsed.settings) {
      const currentSettings = { ...parsed.settings };
      delete currentSettings.autoplay;
      parsed.settings = { ...settingsInitial, ...currentSettings };
    }

    return parsed;
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

// durum kaydetme
const SAVE_THROTTLE_MS = 1000;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function persistState() {
  localStorage.setItem("tenet-state", JSON.stringify(store.getState()));
}

store.subscribe(() => {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    persistState();
  }, SAVE_THROTTLE_MS);
});

window.addEventListener("beforeunload", () => {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  persistState();
});

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

// profil otomatik oynatma ayari
export const selectAutoplayEnabled = (s: RootState): boolean =>
  (selectShownProfile(s)?.playback ?? "auto") === "auto";

// kütüphane seçici
export const selectLibrary = (s: RootState): LibraryData =>
  (s.library.activeId && s.library.byProfile[s.library.activeId]) ||
  emptyLibrary;
