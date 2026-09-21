"use strict";
const TenStorage = (() => {
  const KEY = "puzzle-suite.v1.onluk.arcade";
  const data = {
    version: 1,
    best: 0,
    games: 0,
    stars: {},
    session: null,
    undo: null,
    level: 1,
    legacySession: null,
    settings: { language: "tr", theme: "light", muted: false, learned: false },
  };
  let readOnly = false;
  try {
    const old = JSON.parse(GameSave.storage.getItem(KEY));
    readOnly = old != null && old.version !== 1;
    if (old && !readOnly) {
      for (const key of ["best", "games"])
        if (Number.isSafeInteger(old[key]) && old[key] >= 0)
          data[key] = old[key];
      if (Number.isSafeInteger(old.level) && old.level > 0)
        data.level = old.level;
      if (old.stars && typeof old.stars === "object") {
        for (const [level, stars] of Object.entries(old.stars))
          if (
            /^[1-9]\d*$/.test(level) &&
            Number.isInteger(stars) &&
            stars >= 1 &&
            stars <= 3
          )
            data.stars[level] = stars;
      }
      data.legacySession =
        old.legacySession || (old.session?.version < 5 ? old.session : null);
      if (TenEngine.validState(old.undo)) data.undo = old.undo;
      if (TenEngine.validState(old.session) && old.session.turns > 0)
        data.session = old.session;
      if (["tr", "en", "es", "fr", "de", "ar"].includes(old.settings?.language))
        data.settings.language = old.settings.language;
      data.settings.theme = old.settings?.theme === "dark" ? "dark" : "light";
      data.settings.muted = old.settings?.muted === true;
      data.settings.learned = old.settings?.learned === true;
    }
  } catch {
    /* A broken save must not block play. */
  }
  function save() {
    if (readOnly) return false;
    try {
      GameSave.storage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }
  return { data, save };
})();
