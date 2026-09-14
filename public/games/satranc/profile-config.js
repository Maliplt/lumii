"use strict";
window.GameSaveConfig = {
  userId: "guest",
  profileId: "main",
  ...window.GameSuiteConfig,
  ...window.GameSuiteConfig?.games?.["satranc"],
  gameId: "satranc",
  slots: { "satranc.v1": "progress" },
};
