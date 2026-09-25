"use strict";
(function (M) {
  const KEY = "mines98.v1.progress";
  const LEVELS = ["beginner", "intermediate", "expert"];

  const fresh = () => ({
    version: 1,
    best: { beginner: null, intermediate: null, expert: null },
    stats: { beginner: [0, 0], intermediate: [0, 0], expert: [0, 0], custom: [0, 0] },
    level: "beginner",
    custom: { w: 20, h: 12, mines: 40 },
    tips: [],
    settings: { language: null, sound: true, marks: false, noGuess: true },
  });

  const backend = (() => {
    if (window.GameSave?.storage) return window.GameSave.storage;
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  })();

  const count = (value) => Number.isSafeInteger(value) && value >= 0;

  function sanitize(raw) {
    const data = fresh();
    if (!raw || raw.version !== 1) return data;
    for (const level of LEVELS) if (count(raw.best?.[level]) && raw.best[level] <= 999) data.best[level] = raw.best[level];
    for (const key of Object.keys(data.stats)) {
      const pair = raw.stats?.[key];
      if (Array.isArray(pair) && count(pair[0]) && count(pair[1]) && pair[0] <= pair[1]) data.stats[key] = [pair[0], pair[1]];
    }
    if ([...LEVELS, "custom"].includes(raw.level)) data.level = raw.level;
    if (raw.custom) data.custom = M.customSize(raw.custom.w, raw.custom.h, raw.custom.mines);
    if (Array.isArray(raw.tips)) data.tips = raw.tips.filter((tip) => typeof tip === "string");
    const s = raw.settings || {};
    if (M.LANGUAGES.includes(s.language)) data.settings.language = s.language;
    for (const key of ["sound", "marks", "noGuess"]) if (typeof s[key] === "boolean") data.settings[key] = s[key];
    return data;
  }

  let syncTimer = null;

  const Store = {
    data: fresh(),

    load() {
      try {
        const raw = backend?.getItem(KEY);
        this.data = sanitize(raw ? JSON.parse(raw) : null);
      } catch {
        this.data = fresh();
      }
    },

    save() {
      try {
        backend?.setItem(KEY, JSON.stringify(this.data));
      } catch {
        // storage can be blocked; progress then lives only in this session
      }
      const adapter = window.GameSaveConfig?.adapter;
      if (window.Mines98Config?.autoSync && window.GameSave?.pushRemote && adapter?.load && adapter?.save) {
        clearTimeout(syncTimer);
        syncTimer = setTimeout(() => window.GameSave.pushRemote().catch(() => {}), 2000);
      }
    },

    set(key, value) {
      this.data.settings[key] = value;
      this.save();
    },

    setLevel(level, size = null) {
      this.data.level = level;
      if (size) this.data.custom = M.customSize(size.w, size.h, size.mines);
      this.save();
    },

    // the size of the chosen level
    size() {
      return this.data.level === "custom" ? { ...this.data.custom } : { ...M.LEVELS[this.data.level] };
    },

    tipSeen(id) {
      return this.data.tips.includes(id);
    },

    markTip(id) {
      if (this.tipSeen(id)) return;
      this.data.tips.push(id);
      this.save();
    },

    // counts a finished game; returns true when it set a new best time
    finish(level, won, seconds) {
      const pair = this.data.stats[level];
      pair[1]++;
      if (won) pair[0]++;
      let record = false;
      if (won && LEVELS.includes(level)) {
        const best = this.data.best[level];
        if (best === null || seconds < best) {
          this.data.best[level] = seconds;
          record = true;
        }
      }
      this.save();
      return record;
    },
  };

  M.Store = Store;
})(window.Mines98);
