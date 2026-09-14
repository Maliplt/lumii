"use strict";
// Kimlik ve API adaptörü oyun yüklenmeden önce verilir.
window.GameSaveConfig = Object.assign({
  "gameId": "denge",
  "userId": "guest",
  "profileId": "main",
  "adapter": null,
  "slots": {
    "puzzle-suite.v1.denge": "progress",
    "denge.journey.v3.0": "legacy.journey.v3.0",
    "denge.journey.v3.1": "legacy.journey.v3.1",
    "denge.journey.v2.0": "legacy.journey.v2.0",
    "denge.chaos.v1": "legacy.chaos.v1",
    "denge.hints.v1": "legacy.hints.v1",
    "denge.language": "legacy.language",
    "denge.theme": "legacy.theme",
    "denge.sound": "legacy.sound",
    "denge.tutorial.v1": "legacy.tutorial.v1"
  }
}, window.GameSuiteConfig || {}, window.GameSuiteConfig?.games?.["denge"] || {}, { gameId: "denge", slots: {"puzzle-suite.v1.denge":"progress","denge.journey.v3.0":"legacy.journey.v3.0","denge.journey.v3.1":"legacy.journey.v3.1","denge.journey.v2.0":"legacy.journey.v2.0","denge.chaos.v1":"legacy.chaos.v1","denge.hints.v1":"legacy.hints.v1","denge.language":"legacy.language","denge.theme":"legacy.theme","denge.sound":"legacy.sound","denge.tutorial.v1":"legacy.tutorial.v1"} });
