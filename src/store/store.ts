import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux'
import type { Movie, TVShow } from '../types/types'

// giris / kayit
interface Account {
  name: string
  email: string
  password: string
  createdAt?: string
  avatar?: string
  plan?: string
}

interface CurrentUser {
  name: string
  email: string
  createdAt?: string
  avatar?: string
  plan?: string
}

export interface Receipt {
  planName: string
  planId: string
  amount: string
  period: string
  date: string
  email: string
}

interface AuthState {
  currentUser: CurrentUser | null
  accounts: Account[]
  error: string | null
  receipt: Receipt | null
}

const authInitial: AuthState = {
  currentUser: null,
  accounts: [],
  error: null,
  receipt: null,
}

const auth = createSlice({
  name: 'auth',
  initialState: authInitial,
  reducers: {
    register(state, action: PayloadAction<Account>) {
      const taken = state.accounts.some((a) => a.email === action.payload.email)
      if (taken) {
        state.error = 'Bu e-posta adresiyle daha önce bir hesap oluşturulmuş.'
        return
      }
      const acc = { ...action.payload, createdAt: new Date().toLocaleDateString('tr-TR') }
      state.accounts.push(acc)
      state.currentUser = { name: acc.name, email: acc.email, createdAt: acc.createdAt }
      state.error = null
    },
    login(state, action: PayloadAction<{ email: string; password: string }>) {
      const acc = state.accounts.find(
        (a) => a.email === action.payload.email && a.password === action.payload.password
      )
      if (!acc) {
        state.error = 'E-posta adresi veya şifre hatalı. Lütfen tekrar deneyin.'
        return
      }
      state.currentUser = { name: acc.name,  email: acc.email, createdAt: acc.createdAt, avatar: acc.avatar, plan: acc.plan }
      state.error = null
    },
    setAvatar(state, action: PayloadAction<string>) {
      if (!state.currentUser) return
      state.currentUser.avatar = action.payload
      const acc = state.accounts.find((a) => a.email === state.currentUser!.email)
      if (acc) acc.avatar = action.payload
    },
    setPlan(state, action: PayloadAction<string>) {
      if (!state.currentUser) return
      state.currentUser.plan = action.payload
      const acc = state.accounts.find((a) => a.email === state.currentUser!.email)
      if (acc) acc.plan = action.payload
    },
    setReceipt(state, action: PayloadAction<Receipt>) {
      state.receipt = action.payload
    },
    logout(state) {
      state.currentUser = null
    },
    clearAuthError(state) {
      state.error = null
    },
  },
})

// kitaplik
export type SavedItem = (Movie | TVShow) & { media_type: 'movie' | 'tv' }

interface LibraryState {
  watchlist: SavedItem[]
  liked: SavedItem[]
  history: SavedItem[]
  continueWatching: SavedItem[]
}

const libraryInitial: LibraryState = {
  watchlist: [],
  liked: [],
  history: [],
  continueWatching: [],
}

// varsa cikar, yoksa basa ekle
function toggle(list: SavedItem[], item: SavedItem): SavedItem[] {
  return list.some((x) => x.id === item.id)
    ? list.filter((x) => x.id !== item.id)
    : [item, ...list]
}

const library = createSlice({
  name: 'library',
  initialState: libraryInitial,
  reducers: {
    toggleWatchlist(state, action: PayloadAction<SavedItem>) {
      state.watchlist = toggle(state.watchlist, action.payload)
    },
    toggleLiked(state, action: PayloadAction<SavedItem>) {
      state.liked = toggle(state.liked, action.payload)
    },
    startWatching(state, action: PayloadAction<SavedItem>) {
      const item = action.payload
      state.continueWatching = [item, ...state.continueWatching.filter((x) => x.id !== item.id)]
      state.history = [item, ...state.history.filter((x) => x.id !== item.id)]
    },
    clearLibrary() {
      return libraryInitial
    },
  },
})

// ayarlar
interface SettingsState {
  autoplay: boolean
  continueRow: boolean
}

const settingsInitial: SettingsState = {
  autoplay: true,
  continueRow: true,
}

const settings = createSlice({
  name: 'settings',
  initialState: settingsInitial,
  reducers: {
    setSetting(state, action: PayloadAction<{ key: keyof SettingsState; value: boolean }>) {
      state[action.payload.key] = action.payload.value
    },
  },
})

// store
interface PersistedState {
  auth: AuthState
  library: LibraryState
  settings: SettingsState
}

// kayitli oturumu geri yukle, ayarlardan sadece bilinen anahtarlar alinir
function loadState(): PersistedState | undefined {
  try {
    const raw = localStorage.getItem('lumii-state')
    if (!raw) return undefined
    const saved = JSON.parse(raw)
    return {
      ...saved,
      settings: {
        autoplay: saved.settings?.autoplay ?? settingsInitial.autoplay,
        continueRow: saved.settings?.continueRow ?? settingsInitial.continueRow,
      },
    }
  } catch {
    return undefined
  }
}

export const store = configureStore({
  reducer: {
    auth: auth.reducer,
    library: library.reducer,
    settings: settings.reducer,
  },
  preloadedState: loadState(),
})

// her degisiklikte kaydet
store.subscribe(() => {
  localStorage.setItem('lumii-state', JSON.stringify(store.getState()))
})

export const { register, login, logout, clearAuthError, setAvatar, setPlan, setReceipt } = auth.actions
export const { toggleWatchlist, toggleLiked, startWatching, clearLibrary } = library.actions
export const { setSetting } = settings.actions

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// tipli hook'lar
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
