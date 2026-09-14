"use strict";
window.GameSaveConfig = {
  userId: "guest",
  profileId: "main",
  ...window.GameSuiteConfig,
  ...window.GameSuiteConfig?.games?.["renk-renk"],
  gameId: "renk-renk",
  slots: { "renk-renk.v1": "progress" },
};
