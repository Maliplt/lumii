"use strict";
// Kimlik ve API adaptörü oyun yüklenmeden önce verilir.
window.GameSaveConfig = Object.assign({
  "gameId": "rota",
  "userId": "guest",
  "profileId": "main",
  "adapter": null,
  "slots": {
    "rota.lang": "lang",
    "rota.muted": "muted",
    "rota.progress": "progress",
    "rota.session": "session",
    "rota.learned": "learned"
  }
}, window.GameSuiteConfig || {}, window.GameSuiteConfig?.games?.["rota"] || {}, { gameId: "rota", slots: {"rota.lang":"lang","rota.muted":"muted","rota.progress":"progress","rota.session":"session","rota.learned":"learned"} });
