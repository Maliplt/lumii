"use strict";
const FusionStorage = (() => {
  const KEY = "puzzle-suite.v1.fuzyon.reactor";
  const data = {
    version: 1,
    best: 0,
    bestPeak: 1,
    session: null,
    undo: null,
    settings: {
      language: "tr",
      theme: "light",
      themeRevision: 2,
      muted: false,
      learned: false,
    },
  };
  let protectedVersion = false;
  try {
    const old = JSON.parse(GameSave.storage.getItem(KEY));
    protectedVersion = old != null && old.version !== 1;
    if (old && !protectedVersion) {
      if (Number.isSafeInteger(old.best) && old.best >= 0) data.best = old.best;
      if (
        Number.isInteger(old.bestPeak) &&
        old.bestPeak >= 1 &&
        old.bestPeak <= 30
      )
        data.bestPeak = old.bestPeak;
      data.session = FusionEngine.migrate(old.session);
      data.undo = FusionEngine.migrate(old.undo);
      if (["tr", "en", "es", "fr", "de", "ar"].includes(old.settings?.language))
        data.settings.language = old.settings.language;
      // The revised palette starts light once; subsequent explicit choices persist.
      data.settings.theme =
        old.settings?.themeRevision === 2 && old.settings.theme === "dark"
          ? "dark"
          : "light";
      data.settings.muted = old.settings?.muted === true;
      data.settings.learned = old.settings?.learned === true;
    }
  } catch {
    /* Storage failure must not prevent a round. */
  }
  function save() {
    if (protectedVersion) return false;
    try {
      GameSave.storage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }
  return { data, save };
})();
