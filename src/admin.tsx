// geçici geliştirme yöneticisi girişi
// prod geçerken bu dosyayı ve authSlice içindeki tryAdminLogin  kaldır

import type { AuthState } from "./store/authSlice";

const ADMIN_EMAIL = "admin@admin.com";
const ADMIN_PASSWORD = "admin123";
const ADMIN_PLAN = "premium";

export function tryAdminLogin(
  state: AuthState,
  email: string,
  password: string,
): boolean {
  if (email.trim().toLowerCase() !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return false;
  }

  let account = state.accounts.find(
    (item) => item.email.trim().toLowerCase() === ADMIN_EMAIL,
  );

  if (!account) {
    account = {
      name: "Admin",
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      createdAt: new Date().toLocaleDateString("tr-TR"),
      plan: ADMIN_PLAN,
      receipt: null,
      profiles: [
        {
          id: "tenet-admin-profile",
          name: "Admin",
          avatar: "default-blue",
          kids: false,
          locked: false,
          playback: "auto",
          notifications: "important",
        },
      ],
    };
    state.accounts.push(account);
  }

  account.password = ADMIN_PASSWORD;
  account.plan = ADMIN_PLAN;
  if (!account.profiles.length) {
    account.profiles.push({
      id: "tenet-admin-profile",
      name: "Admin",
      avatar: "default-blue",
      kids: false,
      locked: false,
      playback: "auto",
      notifications: "important",
    });
  }

  state.currentUser = {
    name: account.name,
    email: account.email,
    createdAt: account.createdAt,
    plan: ADMIN_PLAN,
    receipt: null,
    profiles: account.profiles,
  };
  state.activeProfileId = null;
  state.receipt = null;
  state.error = null;
  return true;
}
