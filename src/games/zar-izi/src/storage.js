(function (root) {
  "use strict";
  const KEY = "puzzle-suite.v1.zar-izi.chains";
  const data = {
    schemaVersion: 1,
    generatorVersion: 1,
    campaignVersion: 2,
    previousCampaign: null,
    next: 1,
    activeMode: "journey",
    records: {},
    dailyRecords: {},
    sessions: { journey: null, daily: null },
    settings: {
      language: "tr",
      theme: "dark",
      palette: 0,
      display: "pips",
      colorblind: false,
      sound: true,
      tutorialDone: false,
      learned: false,
    },
  };
  let readOnly = false;
  function record(r) {
    return (
      r &&
      [2, 3].includes(r.stars) &&
      Number.isSafeInteger(r.moves) &&
      r.moves >= 0 &&
      Number.isSafeInteger(r.hints) &&
      r.hints >= 0
    );
  }
  try {
    const raw = root.GameSave.storage.getItem(KEY),
      saved = raw === null ? null : JSON.parse(raw);
    if (saved && (saved.schemaVersion !== 1 || saved.generatorVersion !== 1))
      readOnly = true;
    if (saved && !readOnly) {
      if (["journey", "daily"].includes(saved.activeMode))
        data.activeMode = saved.activeMode;
      if (Number.isInteger(saved.next) && saved.next >= 1 && saved.next <= 48)
        data.next = saved.next;
      for (const [key, r] of Object.entries(saved.records || {}))
        if (/^([1-9]|[1-3][0-9]|4[0-8])$/.test(key) && record(r))
          data.records[key] = r;
      for (const [key, r] of Object.entries(saved.dailyRecords || {}))
        if (/^\d{4}-\d{2}-\d{2}$/.test(key) && record(r))
          data.dailyRecords[key] = r;
      const s = saved.settings || {};
      if (root.ZarI18n.languages.includes(s.language))
        data.settings.language = s.language;
      if (["dark", "light"].includes(s.theme)) data.settings.theme = s.theme;
      if ([0, 1, 2].includes(s.palette)) data.settings.palette = s.palette;
      if (["pips", "numbers"].includes(s.display))
        data.settings.display = s.display;
      for (const k of ["colorblind", "sound", "tutorialDone", "learned"])
        if (typeof s[k] === "boolean") data.settings[k] = s[k];
      data.sessions = {
        journey: saved.sessions?.journey ?? null,
        daily: saved.sessions?.daily ?? null,
      };
      if (saved.campaignVersion !== 2) {
        data.previousCampaign = {
          records: { ...data.records },
          session: data.sessions.journey,
        };
        data.sessions.journey = null;
        for (let id = 1; id <= 16; id++) delete data.records[id];
        data.next = 1;
      } else data.previousCampaign = saved.previousCampaign ?? null;
    }
  } catch {
    readOnly = true;
  }
  function save() {
    if (readOnly) return false;
    try {
      root.GameSave.storage.setItem(KEY, JSON.stringify(data));
      return (
        root.GameSave.status().persistent && !root.GameSave.status().readOnly
      );
    } catch {
      return false;
    }
  }
  function exportData() {
    return JSON.parse(
      JSON.stringify({
        schemaVersion: 1,
        gameId: "zar-izi",
        exportedAt: new Date().toISOString(),
        settings: data.settings,
        levels: Object.entries(data.records).map(([id, r]) => ({
          levelId: `zar-izi:chains:g1:ZI-2026:${id}`,
          gameId: "zar-izi",
          modeId: "chains",
          generatorVersion: 1,
          seed: "ZI-2026",
          levelNumber: Number(id),
          completed: true,
          score: { stars: r.stars, points: null, bestTimeMs: null },
        })),
        daily: data.dailyRecords,
        native: data,
      }),
    );
  }
  root.gameData = Object.freeze({ exportData });
  root.ZarStorage = { data, save, readOnly };
})(window);
