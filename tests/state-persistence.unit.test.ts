import { describe, expect, test } from "vitest";
import { auth, logout, register } from "../src/store/authSlice";
import {
  loadPersistedState,
  PERSIST_KEY,
  savePersistedState,
  type PersistedState,
  type StorageAdapter,
} from "../src/store/persistence";

class MemoryStorage implements StorageAdapter {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

function currentState(): PersistedState {
  const authState = auth.reducer(
    undefined,
    register({
      name: "Mali Polatkesen",
      email: "mali.polatkesen@tenet.test",
      password: "GuvenliSifre-2026",
    }),
  );
  const profileId = authState.currentUser!.profiles[0].id;

  return {
    auth: { ...authState, activeProfileId: profileId },
    library: {
      activeId: profileId,
      byProfile: {
        [profileId]: {
          watchlist: [],
          liked: [],
          history: [],
          continueWatching: [],
        },
      },
    },
  };
}

describe("Kalıcı oturum verileri", () => {
  test("Hesap ve kütüphane verileri kaydedilip geri yüklenebilmeli", () => {
    const storage = new MemoryStorage();
    const state = currentState();

    expect(savePersistedState(storage, state)).toBe(true);
    expect(loadPersistedState(storage)).toEqual(state);

    // yalnız auth ve library kaydedilir
    expect(JSON.parse(storage.getItem(PERSIST_KEY)!)).toEqual(state);
  });

  test("Bozuk kayıt uygulamanın açılmasını engellememeli", () => {
    const storage = new MemoryStorage();
    storage.setItem(PERSIST_KEY, "{gecersiz-json");

    expect(loadPersistedState(storage)).toBeUndefined();
    expect(storage.getItem(PERSIST_KEY)).toBeNull();
  });

  test("Eksik hesap veya profil verisi yüklenmemeli", () => {
    const profileStorage = new MemoryStorage();
    const state = currentState();
    const missingPreference = JSON.parse(JSON.stringify(state));
    delete missingPreference.auth.currentUser.profiles[0].preferences.autoplay;
    profileStorage.setItem(PERSIST_KEY, JSON.stringify(missingPreference));

    expect(loadPersistedState(profileStorage)).toBeUndefined();
    expect(profileStorage.getItem(PERSIST_KEY)).toBeNull();

    // eksik hesap yüklenmez
    const accountStorage = new MemoryStorage();
    const missingAccountEmail = JSON.parse(JSON.stringify(state));
    delete missingAccountEmail.auth.accounts[0].email;
    accountStorage.setItem(PERSIST_KEY, JSON.stringify(missingAccountEmail));

    expect(loadPersistedState(accountStorage)).toBeUndefined();
    expect(accountStorage.getItem(PERSIST_KEY)).toBeNull();
  });

  test("Çıkış yapılsa da kayıtlı hesap korunmalı", () => {
    const storage = new MemoryStorage();
    const state = currentState();
    const signedOutState: PersistedState = {
      ...state,
      auth: auth.reducer(state.auth, logout()),
    };

    expect(savePersistedState(storage, signedOutState)).toBe(true);

    const restored = loadPersistedState(storage);
    expect(restored?.auth.currentUser).toBeNull();
    expect(restored?.auth.activeProfileId).toBeNull();
    expect(restored?.auth.accounts[0].email).toBe(
      "mali.polatkesen@tenet.test",
    );
  });
});
