"use strict";
// gerçek hesap ve profil uygulama tarafından verilir
(function () {
  const local = {
    userId: window.Mines98Config?.id ?? "guest",
    profileId: window.Mines98Config?.subId ?? "main",
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
  const own = shared.games?.["mines98"] || {};
  window.GameSuiteConfig = {
    ...local,
    ...shared,
    ...own,
    api: { ...local.api, ...shared.api, ...own.api },
  };
})();
