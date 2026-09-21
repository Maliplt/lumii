"use strict";
window.GameSaveConfig = {
  userId: "guest",
  profileId: "main",
  ...window.GameSuiteConfig,
  ...window.GameSuiteConfig?.games?.siyril,
  gameId: "siyril",
  slots: { "siyril.v1": "progress" },
};
