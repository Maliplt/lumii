import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";

export const MAX_PROFILES = 5;
const DEFAULT_PROFILE_AVATAR = "default-blue";

// profil
export interface Profile {
  id: string;
  name: string;
  avatar: string;
  kids: boolean;
  locked?: boolean;
  lockPin?: string;
  playback?: "auto" | "manual";
  notifications?: "all" | "important" | "off";
}

export interface Receipt {
  planName: string;
  planId: string;
  amount: string;
  period: string;
  date: string;
  email: string;
  paymentMethod?: string;
  billingAddress?: string;
  marketingConsent?: boolean;
  termsAccepted?: boolean;
}

// giris ve kayit
interface Account {
  name: string;
  email: string;
  password: string;
  createdAt?: string;
  plan?: string;
  receipt?: Receipt | null;
  profiles: Profile[];
}

interface CurrentUser {
  name: string;
  email: string;
  createdAt?: string;
  plan?: string;
  receipt?: Receipt | null;
  profiles: Profile[];
}

export interface AuthState {
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
function makeProfile(
  name: string,
  avatar = DEFAULT_PROFILE_AVATAR,
  kids = false,
): Profile {
  return {
    id: nanoid(),
    name,
    avatar,
    kids,
    locked: false,
    playback: "auto",
    notifications: "important",
  };
}

function findAccount(state: AuthState): Account | undefined {
  if (!state.currentUser) return undefined;
  const email = normalizeEmail(state.currentUser.email);
  return state.accounts.find((a) => normalizeEmail(a.email) === email);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const auth = createSlice({
  name: "auth",
  initialState: authInitial,
  reducers: {
    register(state, action: PayloadAction<Omit<Account, "profiles">>) {
      const email = normalizeEmail(action.payload.email);
      const name = action.payload.name.trim();
      const taken = state.accounts.some(
        (a) => normalizeEmail(a.email) === email,
      );
      if (taken) {
        state.error = "Bu e-posta adresiyle daha önce bir hesap oluşturulmuş.";
        return;
      }
      const acc: Account = {
        ...action.payload,
        name,
        email,
        receipt: action.payload.receipt
          ? { ...action.payload.receipt, email }
          : action.payload.receipt,
        createdAt: new Date().toLocaleDateString("tr-TR"),
        profiles: [makeProfile(name)],
      };
      state.accounts.push(acc);
      state.currentUser = {
        name: acc.name,
        email: acc.email,
        createdAt: acc.createdAt,
        receipt: acc.receipt ?? null,
        profiles: acc.profiles,
      };
      state.activeProfileId = null;
      state.receipt = acc.receipt ?? null;
      state.error = null;
    },
    login(state, action: PayloadAction<{ email: string; password: string }>) {
      const email = normalizeEmail(action.payload.email);
      const acc = state.accounts.find(
        (a) =>
          normalizeEmail(a.email) === email &&
          a.password === action.payload.password,
      );
      if (!acc) {
        state.error =
          "E-posta adresi veya şifre hatalı. Lütfen tekrar deneyin.";
        return;
      }
      acc.email = email;
      if (acc.receipt) acc.receipt.email = email;
      if (!acc.profiles?.length) acc.profiles = [makeProfile(acc.name)];
      state.currentUser = {
        name: acc.name,
        email: acc.email,
        createdAt: acc.createdAt,
        plan: acc.plan,
        receipt: acc.receipt ?? null,
        profiles: acc.profiles,
      };
      state.activeProfileId = null;
      state.receipt = acc.receipt ?? null;
      state.error = null;
    },
    addProfile: {
      reducer(state, action: PayloadAction<Profile>) {
        if (!state.currentUser) return;
        if (state.currentUser.profiles.length >= MAX_PROFILES) return;
        state.currentUser.profiles.push(action.payload);
        const acc = findAccount(state);
        if (acc && acc.profiles.length < MAX_PROFILES) {
          acc.profiles.push(action.payload);
        }
      },
      prepare(input: { name: string; avatar?: string; kids?: boolean }) {
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
      const acc = findAccount(state);
      if (acc) apply(acc.profiles);
    },
    deleteProfile(state, action: PayloadAction<string>) {
      if (!state.currentUser) return;
      state.currentUser.profiles = state.currentUser.profiles.filter(
        (p) => p.id !== action.payload,
      );
      const acc = findAccount(state);
      if (acc) {
        acc.profiles = acc.profiles.filter((p) => p.id !== action.payload);
      }
      if (state.activeProfileId === action.payload) state.activeProfileId = null;
    },
    selectProfile(state, action: PayloadAction<string>) {
      state.activeProfileId = action.payload;
    },
    setPlan(state, action: PayloadAction<string>) {
      if (!state.currentUser) return;
      state.currentUser.plan = action.payload;
      const acc = findAccount(state);
      if (acc) acc.plan = action.payload;
    },
    setReceipt(state, action: PayloadAction<Receipt>) {
      state.receipt = action.payload;
      if (state.currentUser) state.currentUser.receipt = action.payload;
      const acc = findAccount(state);
      if (acc) acc.receipt = action.payload;
    },
    updateEmail(state, action: PayloadAction<string>) {
      if (!state.currentUser) return;
      const nextEmail = normalizeEmail(action.payload);
      if (!nextEmail) return;
      const acc = findAccount(state);
      if (acc) {
        acc.email = nextEmail;
        if (acc.receipt) acc.receipt.email = nextEmail;
      }
      state.currentUser.email = nextEmail;
      if (state.currentUser.receipt) state.currentUser.receipt.email = nextEmail;
      if (state.receipt) state.receipt.email = nextEmail;
    },
    updatePaymentMethod(
      state,
      action: PayloadAction<{
        paymentMethod: string;
        billingAddress: string;
        email?: string;
        marketingConsent?: boolean;
      }>,
    ) {
      const apply = (receipt?: Receipt | null) => {
        if (!receipt) return;
        receipt.paymentMethod = action.payload.paymentMethod;
        receipt.billingAddress = action.payload.billingAddress;
        if (action.payload.email) {
          receipt.email = normalizeEmail(action.payload.email);
        }
        if (typeof action.payload.marketingConsent === "boolean") {
          receipt.marketingConsent = action.payload.marketingConsent;
        }
      };
      apply(state.receipt);
      apply(state.currentUser?.receipt);
      const acc = findAccount(state);
      apply(acc?.receipt);
    },
    changePassword(
      state,
      action: PayloadAction<{ current: string; next: string }>,
    ) {
      if (!state.currentUser) return;
      const acc = findAccount(state);
      if (!acc) return;
      if (acc.password !== action.payload.current) {
        state.error = "Mevcut şifren hatalı.";
        return;
      }
      acc.password = action.payload.next;
      state.error = null;
    },
    logout(state) {
      state.currentUser = null;
      state.activeProfileId = null;
      state.receipt = null;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
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
  updateEmail,
  updatePaymentMethod,
  changePassword,
} = auth.actions;
