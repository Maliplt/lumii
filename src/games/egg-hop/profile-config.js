"use strict";
// Kimlik ve API adaptörü oyun yüklenmeden önce verilir.
window.GameSaveConfig = Object.assign({
  "gameId": "egg-hop",
  "userId": "guest",
  "profileId": "main",
  "adapter": null,
  "slots": {
    "egg-hop-v1": "progress"
  }
}, window.GameSuiteConfig || {}, window.GameSuiteConfig?.games?.["egg-hop"] || {}, { gameId: "egg-hop", slots: {"egg-hop-v1":"progress"} });
