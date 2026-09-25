"use strict";
// kimlik ve API adaptörü oyun yüklenmeden önce verilir
window.GameSaveConfig = Object.assign(
  {
    gameId: "knotwise",
    userId: "guest",
    profileId: "main",
    adapter: null,
    slots: {
      "knotwise.v1.progress": "progress",
    },
  },
  window.GameSuiteConfig || {},
  window.GameSuiteConfig?.games?.["knotwise"] || {},
  { gameId: "knotwise", slots: { "knotwise.v1.progress": "progress" } },
);

if (!window.GameSaveConfig.adapter && window.KnotwiseConfig?.database) {
  window.GameSaveConfig.adapter = window.KnotwiseConfig.database;
}
