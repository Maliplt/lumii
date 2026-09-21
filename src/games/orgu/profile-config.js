"use strict";
// Kimlik ve API adaptörü oyun yüklenmeden önce verilir.
window.GameSaveConfig = Object.assign(
  {
    gameId: "orgu",
    userId: "guest",
    profileId: "main",
    adapter: null,
    slots: {
      "puzzle-suite.v1.orgu.weave": "progress",
    },
  },
  window.GameSuiteConfig || {},
  window.GameSuiteConfig?.games?.["orgu"] || {},
  { gameId: "orgu", slots: { "puzzle-suite.v1.orgu.weave": "progress" } },
);
