"use strict";
// gerçek hesap ve profil uygulama tarafından verilir
(function () {
  const local = {
    userId: window.PurrfitConfig?.id ?? "guest",
    profileId: window.PurrfitConfig?.subId ?? "main",
    api: {
      enabled: false,
      baseUrl: "/api",
      path: "/profiles/{profileId}/games/{gameId}/save",
      credentials: "include",
      timeoutMs: 10000,
      getHeaders: null,
    },
  };
  const shared = window.GameSuiteConfig || {};
  const own = shared.games?.["purrfit"] || {};
  window.GameSuiteConfig = {
    ...local,
    ...shared,
    ...own,
    api: { ...local.api, ...shared.api, ...own.api },
  };
})();
