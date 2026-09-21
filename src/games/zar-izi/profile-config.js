"use strict";
// Kimlik ve API adaptörü oyun yüklenmeden önce verilir.
window.GameSaveConfig = Object.assign(
  {
    gameId: "zar-izi",
    userId: "guest",
    profileId: "main",
    adapter: null,
    slots: {
      "puzzle-suite.v1.zar-izi.chains": "progress",
    },
  },
  window.GameSuiteConfig || {},
  window.GameSuiteConfig?.games?.["zar-izi"] || {},
  {
    gameId: "zar-izi",
    slots: { "puzzle-suite.v1.zar-izi.chains": "progress" },
  },
);
