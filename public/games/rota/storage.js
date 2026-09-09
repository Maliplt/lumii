"use strict";
// Eski katlama oyununun kayıtlarına dokunulmaz.
const DotStorage = (() => {
  const KEY = "puzzle-suite.v1.rota.connect";
  let data = {
    schemaVersion: 1,
    gameId: "rota",
    modeId: "connect",
    generatorVersion: "dots-2",
    next: 1,
    seed: 831927,
    records: {},
    session: null,
    settings: { language: "tr", theme: "light", muted: false, learned: false },
  };
  let readOnly = false;
  try {
    const old = JSON.parse(localStorage.getItem(KEY) || localStorage.getItem("puzzle-suite.v1.katman.connect"));
    readOnly = old != null && old.schemaVersion !== 1;
    if (
      old?.schemaVersion === 1 &&
      old.modeId === "connect" &&
      Number.isSafeInteger(old.next) &&
      old.next > 0 &&
      Number.isInteger(old.seed)
    ) {
      data.next = old.next;
      data.seed = old.seed;
      data.session = old.session || null;
      data.settings = {
        language: old.settings?.language === "en" ? "en" : "tr",
        theme: old.settings?.theme === "dark" ? "dark" : "light",
        muted: old.settings?.muted === true,
        learned: old.settings?.learned === true,
      };
      // Eksik veya bozuk skorlar kazanma ekranını engellemesin.
      for (const [id, record] of Object.entries(old.records || {})) {
        const score = record?.score;
        if (
          record?.levelId !== id ||
          !score ||
          !Number.isInteger(score.stars) ||
          score.stars < 1 ||
          score.stars > 3 ||
          !Number.isFinite(score.points) ||
          score.points < 0 ||
          !Number.isFinite(score.bestTimeMs) ||
          score.bestTimeMs < 0
        )
          continue;
        data.records[id] = record;
      }
    }
  } catch {}
  function save() {
    if (readOnly) return false;
    data.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }
  function exportData() {
    return JSON.parse(
      JSON.stringify({ ...data, exportedAt: new Date().toISOString() }),
    );
  }
  function download() {
    const url = URL.createObjectURL(
        new Blob([JSON.stringify(exportData(), null, 2)], {
          type: "application/json",
        }),
      ),
      link = document.createElement("a");
    link.href = url;
    link.download = "rota-save.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return { data, save, exportData, download };
})();
