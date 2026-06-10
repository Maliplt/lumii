import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux'
import type { Movie, TVShow } from '../types/types'

// giris / kayit
interface Account {
  name: string
  email: string
  password: string
}

interface CurrentUser {
  name: string
  email: string
}

interface AuthState {
  currentUser: CurrentUser | null
  accounts: Account[]
  error: string | null
}

const authInitial: AuthState = {
  currentUser: null,
  accounts: [],
  error: null,
}

const auth = createSlice({
  name: 'auth',
  initialState: authInitial,
  reducers: {
    register(state, action: PayloadAction<Account>) {
      const taken = state.accounts.some((a) => a.email === action.payload.email)
      if (taken) {
        state.error = 'Bu e-posta zaten kayıtlı.'
        return
      }
      state.accounts.push(action.payload)
      state.currentUser = { name: action.payload.name, email: action.payload.email }
      state.error = null
    },
    login(state, action: PayloadAction<{ email: string; password: string }>) {
      const acc = state.accounts.find(
        (a) => a.email === action.payload.email && a.password === action.payload.password
      )
      if (!acc) {
        state.error = 'E-posta veya şifre hatalı.'
        return
      }
      state.currentUser = { name: acc.name, email: acc.email }
      state.error = null
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

// store
// kayitli oturumu geri yukle
function loadState(): { auth: AuthState; library: LibraryState } | undefined {
  try {
    const raw = localStorage.getItem('lumii-state')
    return raw ? JSON.parse(raw) : undefined
  } catch {
    return undefined
  }
}

export const store = configureStore({
  reducer: {
    auth: auth.reducer,
    library: library.reducer,
  },
  preloadedState: loadState(),
})

// her degisiklikte kaydet
store.subscribe(() => {
  localStorage.setItem('lumii-state', JSON.stringify(store.getState()))
})

export const { register, login, logout, clearAuthError } = auth.actions
export const { toggleWatchlist, toggleLiked, startWatching, clearLibrary } = library.actions

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// tipli hook'lar
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
