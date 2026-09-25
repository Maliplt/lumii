"use strict";
// kimlik ve API adaptörü oyun yüklenmeden önce verilir
window.GameSaveConfig = Object.assign(
  {
    gameId: "purrfit",
    userId: "guest",
    profileId: "main",
    adapter: null,
    slots: {
      "purrfit.v1.progress": "progress",
    },
  },
  window.GameSuiteConfig || {},
  window.GameSuiteConfig?.games?.["purrfit"] || {},
  { gameId: "purrfit", slots: { "purrfit.v1.progress": "progress" } },
);

if (!window.GameSaveConfig.adapter && window.PurrfitConfig?.database) {
  window.GameSaveConfig.adapter = window.PurrfitConfig.database;
}
