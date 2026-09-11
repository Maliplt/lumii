"use strict";
// Kimlik ve API adaptörü oyun yüklenmeden önce verilir.
window.GameSaveConfig = Object.assign({
  "gameId": "prizma",
  "userId": "guest",
  "profileId": "main",
  "adapter": null,
  "slots": {
    "puzzle-suite.v1.prizma": "progress",
    "prizma.journey": "legacy.journey",
    "prizma.journey.v2": "legacy.journey.v2",
    "prizma.session.v2": "legacy.session.v2",
    "prizma.lang.v2": "legacy.lang.v2",
    "prizma.mute.v2": "legacy.mute.v2",
    "prizma.learned.v2": "legacy.learned.v2"
  }
}, window.GameSuiteConfig || {}, window.GameSuiteConfig?.games?.["prizma"] || {}, { gameId: "prizma", slots: {"puzzle-suite.v1.prizma":"progress","prizma.journey":"legacy.journey","prizma.journey.v2":"legacy.journey.v2","prizma.session.v2":"legacy.session.v2","prizma.lang.v2":"legacy.lang.v2","prizma.mute.v2":"legacy.mute.v2","prizma.learned.v2":"legacy.learned.v2"} });
