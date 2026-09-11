"use strict";
// Kimlik ve API adaptörü oyun yüklenmeden önce verilir.
window.GameSaveConfig = Object.assign({
  "gameId": "2048",
  "userId": "guest",
  "profileId": "main",
  "adapter": null,
  "slots": {
    "puzzle-suite.v1.2048": "progress"
  }
}, window.GameSuiteConfig || {}, window.GameSuiteConfig?.games?.["2048"] || {}, { gameId: "2048", slots: {"puzzle-suite.v1.2048":"progress"} });
