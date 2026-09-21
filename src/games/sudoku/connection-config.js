"use strict";
(() => {
  const defaults = { userId: "guest", profileId: "main", api: { enabled: false, baseUrl: "/api", path: "/profiles/{profileId}/games/{gameId}/save", credentials: "include", timeoutMs: 10000 } };
  const shared = window.GameSuiteConfig || {}, own = shared.games?.sudoku || {};
  window.GameSuiteConfig = { ...defaults, ...shared, ...own, api: { ...defaults.api, ...shared.api, ...own.api } };
})();
