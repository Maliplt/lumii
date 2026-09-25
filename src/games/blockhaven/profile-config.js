"use strict";
// kimlik ve API adaptörü oyun yüklenmeden önce verilir
window.GameSaveConfig = Object.assign(
  {
    gameId: "blockhaven",
    userId: "guest",
    profileId: "main",
    adapter: null,
    slots: {
      "blockhaven.v1.progress": "progress",
    },
  },
  window.GameSuiteConfig || {},
  window.GameSuiteConfig?.games?.["blockhaven"] || {},
  { gameId: "blockhaven", slots: { "blockhaven.v1.progress": "progress" } },
);

if (!window.GameSaveConfig.adapter && window.BlockhavenConfig?.database) {
  window.GameSaveConfig.adapter = window.BlockhavenConfig.database;
}
