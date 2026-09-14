"use strict";
// Kimlik ve API adaptörü oyun yüklenmeden önce verilir.
window.GameSaveConfig = Object.assign({
  "gameId": "bamboo-hop",
  "userId": "guest",
  "profileId": "main",
  "adapter": null,
  "slots": {
    "bamboo-hop:guest:main": "progress"
  }
}, window.GameSuiteConfig || {}, window.GameSuiteConfig?.games?.["bamboo-hop"] || {}, { gameId: "bamboo-hop", slots: {"bamboo-hop:guest:main":"progress"} });

// Önceki Bamboo Hop profil ayarını koru.
if (!window.GameSuiteConfig) {
  GameSaveConfig.userId = window.BambooHopConfig?.id ?? "guest";
  GameSaveConfig.profileId = window.BambooHopConfig?.subId ?? "main";
}
