"use strict";
// Gerçek hesap ve profil uygulama tarafından verilir.
(function () {
  const local = {
    userId: "guest",
    profileId: "main",
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
  const own = shared.games?.["egg-hop"] || {};
  window.GameSuiteConfig = {
    ...local,
    ...shared,
    ...own,
    api: { ...local.api, ...shared.api, ...own.api },
  };
})();
