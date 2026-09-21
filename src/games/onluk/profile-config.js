"use strict";
// Kimlik ve API adaptörü oyun yüklenmeden önce verilir.
window.GameSaveConfig = Object.assign(
  {
    gameId: "onluk",
    userId: "guest",
    profileId: "main",
    adapter: null,
    slots: {
      "puzzle-suite.v1.onluk.arcade": "progress",
    },
  },
  window.GameSuiteConfig || {},
  window.GameSuiteConfig?.games?.["onluk"] || {},
  { gameId: "onluk", slots: { "puzzle-suite.v1.onluk.arcade": "progress" } },
);
