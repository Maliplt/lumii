import { describe, expect, test } from "vitest";
import {
  auth,
  changePassword,
  login,
  logout,
  register,
  setReceipt,
  updateEmail,
} from "../src/store/authSlice";

describe("Kullanıcı hesabı", () => {
  const account = {
    name: "Mali Polatkesen",
    email: "mali.polatkesen@tenet.test",
    password: "GuvenliSifre-2026",
  };

  test("Kayıt bilgileri temizlenerek saklanmalı", () => {
    const state = auth.reducer(
      undefined,
      register({
        ...account,
        name: `  ${account.name}  `,
        email: "  MALI.POLATKESEN@TENET.TEST ",
      }),
    );

    expect(state.currentUser?.name).toBe(account.name);
    expect(state.currentUser?.email).toBe(account.email);
    expect(state.currentUser?.profiles).toHaveLength(1);
  });

  test("Aynı e-postayla ikinci hesap açılmamalı", () => {
    const registered = auth.reducer(undefined, register(account));
    const duplicate = auth.reducer(
      registered,
      register({
        name: "Polat Y.",
        email: " MALI.POLATKESEN@TENET.TEST ",
        password: "BaskaBirSifre-2026",
      }),
    );

    expect(duplicate.accounts).toHaveLength(1);
    expect(duplicate.error).toContain("daha önce bir hesap");
  });

  test("Yanlış şifreyle oturum açılmamalı", () => {
    const registered = auth.reducer(undefined, register(account));
    const signedOut = auth.reducer(registered, logout());
    const failed = auth.reducer(
      signedOut,
      login({ email: account.email, password: "YanlisSifre-2026" }),
    );

    expect(failed.currentUser).toBeNull();
    expect(failed.error).toContain("şifre hatalı");
  });

  test("Doğru bilgilerle giriş yapılabilmeli", () => {
    const registered = auth.reducer(undefined, register(account));
    const signedOut = auth.reducer(registered, logout());
    const signedIn = auth.reducer(
      signedOut,
      login({ email: " MALI.POLATKESEN@TENET.TEST ", password: account.password }),
    );

    expect(signedIn.currentUser?.email).toBe(account.email);
    expect(signedIn.error).toBeNull();
    expect(signedIn.accounts).toHaveLength(1);
  });

  test("Yönetici hesabı Premium olarak açılmalı", () => {
    const signedIn = auth.reducer(
      undefined,
      login({ email: "admin@admin.com", password: "admin123" }),
    );

    expect(signedIn.currentUser?.name).toBe("Admin");
    expect(signedIn.currentUser?.plan).toBe("premium");
    expect(signedIn.currentUser?.profiles[0]?.name).toBe("Admin");
    expect(signedIn.error).toBeNull();
  });

  test("Çıkışta hesap silinmemeli", () => {
    const registered = auth.reducer(undefined, register(account));
    const signedOut = auth.reducer(registered, logout());

    expect(signedOut.currentUser).toBeNull();
    expect(signedOut.activeProfileId).toBeNull();
    expect(signedOut.receipt).toBeNull();
    expect(signedOut.accounts).toHaveLength(1);
  });

  test("E-posta her yerde birlikte güncellenmeli", () => {
    const registered = auth.reducer(undefined, register(account));
    const withReceipt = auth.reducer(
      registered,
      setReceipt({
        planName: "Temel",
        planId: "standard",
        amount: "₺139",
        period: "/ay",
        date: "25.08.2026",
        email: account.email,
      }),
    );
    const updated = auth.reducer(
      withReceipt,
      updateEmail("  MALI.POLATKESEN.YENI@TENET.TEST "),
    );

    expect(updated.currentUser?.email).toBe("mali.polatkesen.yeni@tenet.test");
    expect(updated.currentUser?.receipt?.email).toBe("mali.polatkesen.yeni@tenet.test");
    expect(updated.accounts[0].receipt?.email).toBe("mali.polatkesen.yeni@tenet.test");
    expect(updated.receipt?.email).toBe("mali.polatkesen.yeni@tenet.test");
  });

  test("Şifre değişince sadece yeni şifre çalışmalı", () => {
    const registered = auth.reducer(undefined, register(account));
    const passwordChanged = auth.reducer(
      registered,
      changePassword({ current: account.password, next: "YeniSifre-2026" }),
    );
    const signedOut = auth.reducer(passwordChanged, logout());
    const oldPasswordAttempt = auth.reducer(
      signedOut,
      login({ email: account.email, password: account.password }),
    );
    const newPasswordAttempt = auth.reducer(
      oldPasswordAttempt,
      login({ email: account.email, password: "YeniSifre-2026" }),
    );

    // eski şifre artık çalışmaz
    expect(oldPasswordAttempt.currentUser).toBeNull();
    expect(newPasswordAttempt.currentUser?.email).toBe(account.email);
    expect(newPasswordAttempt.error).toBeNull();
  });
});
