"use strict";
const WeaveStorage = (() => {
  const KEY = "puzzle-suite.v1.orgu.weave";
  const data = {
    schemaVersion: 1,
    generatorVersion: WeaveEngine.VERSION,
    seed: "ORGU-2026",
    next: 1,
    records: {},
    session: null,
    settings: { language: "tr", theme: "light", muted: false, learned: false },
  };
  let readOnly = false;
  try {
    const stored = JSON.parse(GameSave.storage.getItem(KEY));
    readOnly =
      stored != null &&
      (stored.schemaVersion !== 1 ||
        stored.generatorVersion !== WeaveEngine.VERSION);
    if (stored && !readOnly) {
      if (
        Number.isSafeInteger(stored.next) &&
        stored.next > 0 &&
        stored.next < Number.MAX_SAFE_INTEGER
      )
        data.next = stored.next;
      if (
        typeof stored.seed === "string" &&
        stored.seed.length <= 32 &&
        stored.seed.length > 0
      )
        data.seed = stored.seed;
      if (
        ["tr", "en", "es", "fr", "de", "ar"].includes(stored.settings?.language)
      )
        data.settings.language = stored.settings.language;
      data.settings.theme =
        stored.settings?.theme === "dark" ? "dark" : "light";
      data.settings.muted = stored.settings?.muted === true;
      data.settings.learned = stored.settings?.learned === true;
      if (stored.records && typeof stored.records === "object") {
        for (const [id, record] of Object.entries(stored.records)) {
          if (
            /^[1-9]\d{0,15}$/.test(id) &&
            Number.isInteger(record?.stars) &&
            record.stars >= 1 &&
            record.stars <= 3 &&
            Number.isFinite(record.time) &&
            record.time >= 0
          )
            data.records[id] = record;
        }
      }
      data.session = stored.session;
    }
  } catch {
    /* Corrupt or unavailable storage leaves a playable in-memory session. */
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
  function exportData() {
    return JSON.parse(
      JSON.stringify({
        schemaVersion: 1,
        gameId: "orgu",
        exportedAt: new Date().toISOString(),
        settings: { ...data.settings },
        levels: Object.entries(data.records).map(([levelNumber, record]) => ({
          levelId: `orgu:weave:g${WeaveEngine.VERSION}:${data.seed}:${levelNumber}`,
          gameId: "orgu",
          modeId: "weave",
          generatorVersion: WeaveEngine.VERSION,
          seed: data.seed,
          levelNumber,
          completed: true,
          score: { stars: record.stars, points: null, bestTimeMs: record.time },
        })),
        native: data,
      }),
    );
  }
  window.gameData = Object.freeze({ exportData });
  return { data, save, exportData };
})();
