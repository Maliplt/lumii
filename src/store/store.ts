import {
  configureStore,
  createSlice,
  nanoid,
  type PayloadAction,
} from "@reduxjs/toolkit";
import {
  useDispatch,
  useSelector,
  type TypedUseSelectorHook,
} from "react-redux";
import type { Movie, TVShow } from "../types/types";

// profil
export interface Profile {
  id: string;
  name: string;
  avatar: string;
  kids: boolean;
}

// giris / kayit
interface Account {
  name: string;
  email: string;
  password: string;
  createdAt?: string;
  plan?: string;
  profiles: Profile[];
}

interface CurrentUser {
  name: string;
  email: string;
  createdAt?: string;
  plan?: string;
  profiles: Profile[];
}

export interface Receipt {
  planName: string;
  planId: string;
  amount: string;
  period: string;
  date: string;
  email: string;
}

interface AuthState {
  currentUser: CurrentUser | null;
  accounts: Account[];
  activeProfileId: string | null;
  error: string | null;
  receipt: Receipt | null;
}

const authInitial: AuthState = {
  currentUser: null,
  accounts: [],
  activeProfileId: null,
  error: null,
  receipt: null,
};

// varsayilan profil
function makeProfile(name: string, avatar = "a1", kids = false): Profile {
  return { id: nanoid(), name, avatar, kids };
}

const auth = createSlice({
  name: "auth",
  initialState: authInitial,
  reducers: {
    register(state, action: PayloadAction<Omit<Account, "profiles">>) {
      const taken = state.accounts.some(
        (a) => a.email === action.payload.email,
      );
      if (taken) {
        state.error = "Bu e-posta adresiyle daha önce bir hesap oluşturulmuş.";
        return;
      }
      const acc: Account = {
        ...action.payload,
        createdAt: new Date().toLocaleDateString("tr-TR"),
        profiles: [makeProfile(action.payload.name)],
      };
      state.accounts.push(acc);
      state.currentUser = {
        name: acc.name,
        email: acc.email,
        createdAt: acc.createdAt,
        profiles: acc.profiles,
      };
      state.activeProfileId = null;
      state.error = null;
    },
    login(state, action: PayloadAction<{ email: string; password: string }>) {
      const acc = state.accounts.find(
        (a) =>
          a.email === action.payload.email &&
          a.password === action.payload.password,
      );
      if (!acc) {
        state.error =
          "E-posta adresi veya şifre hatalı. Lütfen tekrar deneyin.";
        return;
      }
      if (!acc.profiles?.length) acc.profiles = [makeProfile(acc.name)];
      state.currentUser = {
        name: acc.name,
        email: acc.email,
        createdAt: acc.createdAt,
        plan: acc.plan,
        profiles: acc.profiles,
      };
      state.activeProfileId = null;
      state.error = null;
    },
    addProfile: {
      reducer(state, action: PayloadAction<Profile>) {
        if (!state.currentUser) return;
        state.currentUser.profiles.push(action.payload);
        const acc = state.accounts.find(
          (a) => a.email === state.currentUser!.email,
        );
        if (acc) acc.profiles.push(action.payload);
      },
      prepare(input: { name: string; avatar: string; kids?: boolean }) {
        return {
          payload: makeProfile(input.name, input.avatar, !!input.kids),
        };
      },
    },
    updateProfile(state, action: PayloadAction<Profile>) {
      if (!state.currentUser) return;
      const apply = (list: Profile[]) => {
        const i = list.findIndex((p) => p.id === action.payload.id);
        if (i !== -1) list[i] = action.payload;
      };
      apply(state.currentUser.profiles);
      const acc = state.accounts.find(
        (a) => a.email === state.currentUser!.email,
      );
      if (acc) apply(acc.profiles);
    },
    deleteProfile(state, action: PayloadAction<string>) {
      if (!state.currentUser) return;
      state.currentUser.profiles = state.currentUser.profiles.filter(
        (p) => p.id !== action.payload,
      );
      const acc = state.accounts.find(
        (a) => a.email === state.currentUser!.email,
      );
      if (acc) acc.profiles = acc.profiles.filter((p) => p.id !== action.payload);
      if (state.activeProfileId === action.payload) state.activeProfileId = null;
    },
    selectProfile(state, action: PayloadAction<string>) {
      state.activeProfileId = action.payload;
    },
    setPlan(state, action: PayloadAction<string>) {
      if (!state.currentUser) return;
      state.currentUser.plan = action.payload;
      const acc = state.accounts.find(
        (a) => a.email === state.currentUser!.email,
      );
      if (acc) acc.plan = action.payload;
    },
    setReceipt(state, action: PayloadAction<Receipt>) {
      state.receipt = action.payload;
    },
    logout(state) {
      state.currentUser = null;
      state.activeProfileId = null;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
});

// kitaplik
export type SavedItem = (Movie | TVShow) & { media_type: "movie" | "tv" };

interface LibraryData {
  watchlist: SavedItem[];
  liked: SavedItem[];
  history: SavedItem[];
  continueWatching: SavedItem[];
}

interface LibraryState {
  activeId: string | null;
  byProfile: Record<string, LibraryData>;
}

const emptyLibrary: LibraryData = {
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
  return list.some((x) => x.id === item.id)
    ? list.filter((x) => x.id !== item.id)
    : [item, ...list];
}

const library = createSlice({
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
      const item = action.payload;
      b.continueWatching = [
        item,
        ...b.continueWatching.filter((x) => x.id !== item.id),
      ];
      b.history = [item, ...b.history.filter((x) => x.id !== item.id)];
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

// ayarlar
interface SettingsState {
  autoplay: boolean;
  continueRow: boolean;
}

const settingsInitial: SettingsState = {
  autoplay: true,
  continueRow: true,
};

const settings = createSlice({
  name: "settings",
  initialState: settingsInitial,
  reducers: {
    setSetting(
      state,
      action: PayloadAction<{ key: keyof SettingsState; value: boolean }>,
    ) {
      state[action.payload.key] = action.payload.value;
    },
  },
});

interface PersistedState {
  auth: AuthState;
  library: LibraryState;
  settings: SettingsState;
}

//state geri yukle
function loadState(): PersistedState | undefined {
  try {
    const raw = localStorage.getItem("lumii-state");
    if (!raw) return undefined;
    return JSON.parse(raw) as PersistedState;
  } catch {
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

// state kaydet
store.subscribe(() => {
  localStorage.setItem("lumii-state", JSON.stringify(store.getState()));
});

export const {
  register,
  login,
  logout,
  clearAuthError,
  addProfile,
  updateProfile,
  deleteProfile,
  selectProfile,
  setPlan,
  setReceipt,
} = auth.actions;
export const { toggleWatchlist, toggleLiked, startWatching, clearHistory } =
  library.actions;
export const { setSetting } = settings.actions;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// secimler
const EMPTY: LibraryData = emptyLibrary;

export const selectActiveProfile = (s: RootState): Profile | null =>
  s.auth.currentUser?.profiles.find((p) => p.id === s.auth.activeProfileId) ??
  null;

export const selectLibrary = (s: RootState): LibraryData =>
  (s.library.activeId && s.library.byProfile[s.library.activeId]) || EMPTY;
