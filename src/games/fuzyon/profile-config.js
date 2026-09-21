"use strict";
// Kimlik ve API adaptörü oyun yüklenmeden önce verilir.
window.GameSaveConfig = Object.assign(
  {
    gameId: "fuzyon",
    userId: "guest",
    profileId: "main",
    adapter: null,
    slots: {
      "puzzle-suite.v1.fuzyon.reactor": "progress",
    },
  },
  window.GameSuiteConfig || {},
  window.GameSuiteConfig?.games?.["fuzyon"] || {},
  { gameId: "fuzyon", slots: { "puzzle-suite.v1.fuzyon.reactor": "progress" } },
);
