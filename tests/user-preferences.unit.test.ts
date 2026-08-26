import { describe, expect, test } from "vitest";
import {
  addProfile,
  auth,
  deleteProfile,
  MAX_PROFILES,
  register,
  selectProfile,
  updateProfilePreferences,
} from "../src/store/authSlice";

function registeredUser() {
  return auth.reducer(
    undefined,
    register({
      name: "Mali Polatkesen",
      email: "mali.polatkesen@tenet.test",
      password: "GuvenliSifre-2026",
    }),
  );
}

describe("Profil tercihleri", () => {
  test("Yeni profil varsayılan tercihleriyle açılmalı", () => {
    const state = registeredUser();

    expect(state.currentUser?.profiles[0].preferences).toEqual({
      autoplay: true,
      previews: true,
      showContinueWatching: true,
      emailNotifications: true,
    });
  });

  test("Autoplay değişikliği hesaba da kaydedilmeli", () => {
    const registered = registeredUser();
    const profileId = registered.currentUser?.profiles[0].id;
    expect(profileId).toBeDefined();

    const updated = auth.reducer(
      registered,
      updateProfilePreferences({
        profileId: profileId!,
        changes: { autoplay: false, previews: false },
      }),
    );

    expect(updated.currentUser?.profiles[0].preferences.autoplay).toBe(false);
    expect(updated.currentUser?.profiles[0].preferences.previews).toBe(false);
    expect(updated.accounts[0].profiles[0].preferences).toEqual(
      updated.currentUser?.profiles[0].preferences,
    );
  });

  test("Geçersiz profil değişikliği diğer profilleri bozmamalı", () => {
    const registered = registeredUser();
    const before = registered.currentUser?.profiles[0].preferences;
    const updated = auth.reducer(
      registered,
      updateProfilePreferences({
        profileId: "olmayan-profil",
        changes: { autoplay: false },
      }),
    );

    expect(updated.currentUser?.profiles[0].preferences).toEqual(before);
  });

  test(`Bir hesapta en fazla ${MAX_PROFILES} profil olmalı`, () => {
    let state = registeredUser();

    for (let index = 1; index <= MAX_PROFILES + 2; index += 1) {
      state = auth.reducer(state, addProfile({ name: `Ev Profili ${index}` }));
    }

    expect(state.currentUser?.profiles).toHaveLength(MAX_PROFILES);
    expect(state.accounts[0].profiles).toHaveLength(MAX_PROFILES);
  });

  test("Aktif profil silinince seçim de temizlenmeli", () => {
    const registered = registeredUser();
    const profileId = registered.currentUser!.profiles[0].id;
    const selected = auth.reducer(registered, selectProfile(profileId));
    const deleted = auth.reducer(selected, deleteProfile(profileId));

    expect(deleted.activeProfileId).toBeNull();
    expect(deleted.currentUser?.profiles).toHaveLength(0);
    expect(deleted.accounts[0].profiles).toHaveLength(0);
  });
});
