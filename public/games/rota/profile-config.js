"use strict";
// Kimlik ve API adaptörü oyun yüklenmeden önce verilir.
window.GameSaveConfig = Object.assign({
  "gameId": "katman",
  "userId": "guest",
  "profileId": "main",
  "adapter": null,
  "slots": {
    "puzzle-suite.v1.katman.connect": "progress"
  }
}, window.GameSuiteConfig || {}, window.GameSuiteConfig?.games?.["katman"] || {}, { gameId: "katman", slots: {"puzzle-suite.v1.katman.connect":"progress"} });
