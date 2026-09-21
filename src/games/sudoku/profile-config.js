"use strict";
window.GameSaveConfig = {
  userId: "guest", profileId: "main",
  ...window.GameSuiteConfig, ...window.GameSuiteConfig?.games?.sudoku,
  gameId: "sudoku", slots: { "sudoku.v1": "progress" },
};
