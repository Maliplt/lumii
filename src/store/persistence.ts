import type { AuthState } from "./authSlice";
import {
  normalizeLibraryState,
  type LibraryData,
  type LibraryState,
} from "./librarySlice";
import type { ProfilePreferences } from "./profilePreferences";

export interface PersistedState {
  auth: AuthState;
  library: LibraryState;
}

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const PERSIST_KEY = "tenet-state";
export const PERSIST_SAVE_THROTTLE_MS = 1_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasCurrentPreferences(value: unknown): value is ProfilePreferences {
  if (!isRecord(value)) return false;
  return (
    typeof value.autoplay === "boolean" &&
    typeof value.previews === "boolean" &&
    typeof value.showContinueWatching === "boolean" &&
    typeof value.emailNotifications === "boolean"
  );
}

function hasCurrentProfiles(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (profile) => isRecord(profile) && hasCurrentPreferences(profile.preferences),
    )
  );
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === "string";
}

function isOptionalBoolean(value: unknown): boolean {
  return value === undefined || typeof value === "boolean";
}

function hasReceipt(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (!isRecord(value)) return false;
  return (
    typeof value.planName === "string" &&
    typeof value.planId === "string" &&
    typeof value.amount === "string" &&
    typeof value.period === "string" &&
    typeof value.date === "string" &&
    typeof value.email === "string" &&
    isOptionalString(value.paymentMethod) &&
    isOptionalString(value.billingAddress) &&
    isOptionalBoolean(value.marketingConsent) &&
    isOptionalBoolean(value.termsAccepted)
  );
}

function hasPendingPlanChange(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (!isRecord(value)) return false;
  return (
    typeof value.planId === "string" &&
    typeof value.planName === "string" &&
    typeof value.amount === "string" &&
    typeof value.period === "string" &&
    typeof value.effectiveAt === "string"
  );
}

function hasAccount(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    typeof value.name === "string" &&
    typeof value.email === "string" &&
    typeof value.password === "string" &&
    isOptionalString(value.createdAt) &&
    isOptionalString(value.plan) &&
    hasReceipt(value.receipt) &&
    hasPendingPlanChange(value.pendingPlanChange) &&
    hasCurrentProfiles(value.profiles)
  );
}

function hasCurrentUser(value: unknown): boolean {
  if (value === null) return true;
  if (!isRecord(value)) return false;
  return (
    typeof value.name === "string" &&
    typeof value.email === "string" &&
    isOptionalString(value.createdAt) &&
    isOptionalString(value.plan) &&
    hasReceipt(value.receipt) &&
    hasPendingPlanChange(value.pendingPlanChange) &&
    hasCurrentProfiles(value.profiles)
  );
}

function hasLibraryData(value: unknown): value is LibraryData {
  if (!isRecord(value)) return false;
  return (
    Array.isArray(value.watchlist) &&
    Array.isArray(value.liked) &&
    Array.isArray(value.history) &&
    Array.isArray(value.continueWatching)
  );
}

function hasLibraryState(value: unknown): value is LibraryState {
  if (!isRecord(value) || !isRecord(value.byProfile)) return false;
  return (
    (value.activeId === null || typeof value.activeId === "string") &&
    Object.values(value.byProfile).every(hasLibraryData)
  );
}

export function isPersistedState(value: unknown): value is PersistedState {
  if (!isRecord(value) || !isRecord(value.auth)) return false;

  const persistedAuth = value.auth;
  return (
    Array.isArray(persistedAuth.accounts) &&
    persistedAuth.accounts.every(hasAccount) &&
    hasCurrentUser(persistedAuth.currentUser) &&
    (persistedAuth.activeProfileId === null ||
      typeof persistedAuth.activeProfileId === "string") &&
    (persistedAuth.error === null || typeof persistedAuth.error === "string") &&
    persistedAuth.receipt !== undefined &&
    hasReceipt(persistedAuth.receipt) &&
    hasLibraryState(value.library)
  );
}

export function parsePersistedState(raw: string): PersistedState | undefined {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isPersistedState(parsed)) return undefined;
    return {
      auth: parsed.auth,
      library: normalizeLibraryState(parsed.library),
    };
  } catch {
    return undefined;
  }
}

function removeInvalidState(storage: StorageAdapter): void {
  try {
    storage.removeItem(PERSIST_KEY);
  } catch {
    // depolama yoksa devam et
  }
}

export function loadPersistedState(
  storage: StorageAdapter,
): PersistedState | undefined {
  try {
    const raw = storage.getItem(PERSIST_KEY);
    if (!raw) return undefined;
    const state = parsePersistedState(raw);
    if (state) return state;
    removeInvalidState(storage);
    return undefined;
  } catch {
    removeInvalidState(storage);
    return undefined;
  }
}

export function savePersistedState(
  storage: StorageAdapter,
  state: PersistedState,
): boolean {
  try {
    storage.setItem(PERSIST_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
