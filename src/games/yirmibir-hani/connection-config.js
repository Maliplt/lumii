"use strict";
// gerçek hesap ve profil uygulama tarafından verilir
(function () {
  const local = {
    userId: window.YirmibirHaniConfig?.id ?? "guest",
    profileId: window.YirmibirHaniConfig?.subId ?? "main",
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
  const own = shared.games?.["yirmibir-hani"] || {};
  window.GameSuiteConfig = {
    ...local,
    ...shared,
    ...own,
    api: { ...local.api, ...shared.api, ...own.api },
  };
})();
