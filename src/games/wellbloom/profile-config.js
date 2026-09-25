"use strict";
// kimlik ve API adaptörü oyun yüklenmeden önce verilir
window.GameSaveConfig = Object.assign(
  {
    gameId: "wellbloom",
    userId: "guest",
    profileId: "main",
    adapter: null,
    slots: {
      "wellbloom.save": "progress",
    },
  },
  window.GameSuiteConfig || {},
  window.GameSuiteConfig?.games?.["wellbloom"] || {},
  { gameId: "wellbloom", slots: { "wellbloom.save": "progress" } },
);

if (!window.GameSaveConfig.adapter && window.WellbloomConfig?.database) {
  window.GameSaveConfig.adapter = window.WellbloomConfig.database;
}
