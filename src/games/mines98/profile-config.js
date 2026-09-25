"use strict";
// kimlik ve API adaptörü oyun yüklenmeden önce verilir
window.GameSaveConfig = Object.assign(
  {
    gameId: "mines98",
    userId: "guest",
    profileId: "main",
    adapter: null,
    slots: {
      "mines98.v1.progress": "progress",
    },
  },
  window.GameSuiteConfig || {},
  window.GameSuiteConfig?.games?.["mines98"] || {},
  { gameId: "mines98", slots: { "mines98.v1.progress": "progress" } },
);

if (!window.GameSaveConfig.adapter && window.Mines98Config?.database) {
  window.GameSaveConfig.adapter = window.Mines98Config.database;
}
