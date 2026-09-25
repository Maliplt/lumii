"use strict";
// kimlik ve API adaptörü oyun yüklenmeden önce verilir
window.GameSaveConfig = Object.assign(
  {
    gameId: "yirmibir-hani",
    userId: "guest",
    profileId: "main",
    adapter: null,
    slots: {
      "yirmibir-hani.v1.progress": "progress",
    },
  },
  window.GameSuiteConfig || {},
  window.GameSuiteConfig?.games?.["yirmibir-hani"] || {},
  { gameId: "yirmibir-hani", slots: { "yirmibir-hani.v1.progress": "progress" } },
);

if (!window.GameSaveConfig.adapter && window.YirmibirHaniConfig?.database) {
  window.GameSaveConfig.adapter = window.YirmibirHaniConfig.database;
}
