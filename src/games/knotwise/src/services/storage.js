"use strict";
(function (K) {
  const KEY = "knotwise.v1.progress";
  const START_PINS = 3;
  // pages of a notebook needed to open the next one
  const UNLOCK = 12;

  const fresh = () => ({
    version: 1,
    stars: {},
    best: {},
    pins: START_PINS,
    daily: { last: null, streak: 0, bestStreak: 0 },
    free: { solved: 0 },
    tips: [],
    settings: { language: null, music: 0.5, sfx: 0.8, calm: false, timer: true },
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
  const day = (value) => (typeof value === "string" && /^\d{4}-\d\d-\d\d$/.test(value) ? value : null);

  function sanitize(raw) {
    const data = fresh();
    if (!raw || raw.version !== 1) return data;
    for (const [key, value] of Object.entries(raw.stars || {})) if (/^\d\/\d{1,2}$/.test(key) && value >= 1 && value <= 3) data.stars[key] = value;
    for (const [key, value] of Object.entries(raw.best || {})) if (/^\d\/\d{1,2}$/.test(key) && count(value)) data.best[key] = value;
    if (count(raw.pins)) data.pins = Math.min(raw.pins, 99);
    const d = raw.daily || {};
    data.daily = { last: day(d.last), streak: count(d.streak) ? d.streak : 0, bestStreak: count(d.bestStreak) ? d.bestStreak : 0 };
    if (count(raw.free?.solved)) data.free.solved = raw.free.solved;
    if (Array.isArray(raw.tips)) data.tips = raw.tips.filter((tip) => typeof tip === "string");
    const s = raw.settings || {};
    if (K.LANGUAGES.includes(s.language)) data.settings.language = s.language;
    for (const key of ["music", "sfx"]) if (typeof s[key] === "number") data.settings[key] = K.util.clamp(s[key], 0, 1);
    for (const key of ["calm", "timer"]) if (typeof s[key] === "boolean") data.settings[key] = s[key];
    return data;
  }

  let syncTimer = null;

  const Store = {
    data: fresh(),

    load() {
      let raw = null;
      try {
        raw = backend?.getItem(KEY);
        this.data = sanitize(raw ? JSON.parse(raw) : null);
      } catch {
        this.data = fresh();
      }
      if (!raw && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) this.data.settings.calm = true;
    },

    save() {
      try {
        backend?.setItem(KEY, JSON.stringify(this.data));
      } catch {
        // storage can be blocked; progress then lives only in this session
      }
      const adapter = window.GameSaveConfig?.adapter;
      if (window.KnotwiseConfig?.autoSync && window.GameSave?.pushRemote && adapter?.load && adapter?.save) {
        clearTimeout(syncTimer);
        syncTimer = setTimeout(() => window.GameSave.pushRemote().catch(() => {}), 2000);
      }
    },

    setSetting(key, value) {
      this.data.settings[key] = value;
      this.save();
    },

    tipSeen(id) {
      return this.data.tips.includes(id);
    },

    markTip(id) {
      if (this.tipSeen(id)) return;
      this.data.tips.push(id);
      this.save();
    },

    key: (chapter, level) => `${chapter}/${level}`,

    starsOf(chapter, level) {
      return this.data.stars[this.key(chapter, level)] || 0;
    },

    bestOf(chapter, level) {
      return this.data.best[this.key(chapter, level)] ?? null;
    },

    chapterStars(chapter) {
      let sum = 0;
      for (let l = 0; l < K.Levels.LEVELS; l++) sum += this.starsOf(chapter, l);
      return sum;
    },

    chapterSolved(chapter) {
      let n = 0;
      for (let l = 0; l < K.Levels.LEVELS; l++) if (this.starsOf(chapter, l)) n++;
      return n;
    },

    totalStars() {
      return Object.values(this.data.stars).reduce((sum, value) => sum + value, 0);
    },

    // a notebook opens once twelve pages of the one before are finished
    chapterOpen(chapter) {
      return chapter === 0 || this.chapterSolved(chapter - 1) >= UNLOCK;
    },

    levelOpen(chapter, level) {
      return this.chapterOpen(chapter) && (level === 0 || this.starsOf(chapter, level - 1) > 0);
    },

    // how far the story has gone, for the ideas mixed into daily and free pages
    reached() {
      let last = 0;
      K.Levels.CHAPTERS.forEach((c, i) => {
        if (this.chapterOpen(i)) last = i;
      });
      return last;
    },

    next() {
      for (let c = 0; c < K.Levels.CHAPTERS.length; c++) {
        if (!this.chapterOpen(c)) break;
        for (let l = 0; l < K.Levels.LEVELS; l++) if (this.levelOpen(c, l) && !this.starsOf(c, l)) return { chapter: c, level: l };
      }
      return null;
    },

    dailyOpen() {
      return this.starsOf(0, 3) > 0;
    },

    freeOpen() {
      return this.chapterSolved(0) >= K.Levels.LEVELS;
    },

    spendPin() {
      if (this.data.pins <= 0) return false;
      this.data.pins--;
      this.save();
      return true;
    },

    // records a story page; a first three-star finish earns a pin
    finishLevel(chapter, level, stars, moves) {
      const key = this.key(chapter, level);
      const before = this.data.stars[key] || 0;
      const best = this.data.best[key];
      const chapterBefore = this.chapterSolved(chapter);
      if (stars > before) this.data.stars[key] = stars;
      const newBest = best === undefined || moves < best;
      if (newBest) this.data.best[key] = moves;
      const pins = stars === 3 && before < 3 ? 1 : 0;
      this.data.pins = Math.min(99, this.data.pins + pins);
      const opened = chapter + 1 < K.Levels.CHAPTERS.length && chapterBefore < UNLOCK && this.chapterSolved(chapter) >= UNLOCK;
      this.save();
      return { newBest: newBest && best !== undefined, gained: Math.max(0, stars - before), pins, opened, completed: chapterBefore < K.Levels.LEVELS && this.chapterSolved(chapter) === K.Levels.LEVELS };
    },

    dailyStatus() {
      const today = K.util.dayKey();
      const { last, streak } = this.data.daily;
      const alive = last === today || last === K.util.shiftDay(today, -1);
      return { today, played: last === today, streak: alive ? streak : 0 };
    },

    finishDaily() {
      const today = K.util.dayKey();
      const daily = this.data.daily;
      let pins = 0;
      if (daily.last !== today) {
        daily.streak = daily.last === K.util.shiftDay(today, -1) ? daily.streak + 1 : 1;
        daily.last = today;
        daily.bestStreak = Math.max(daily.bestStreak, daily.streak);
        pins = daily.streak % 7 === 0 ? 3 : 1;
        this.data.pins = Math.min(99, this.data.pins + pins);
      }
      this.save();
      return { streak: daily.streak, pins };
    },

    finishFree() {
      this.data.free.solved++;
      const pins = this.data.free.solved % 5 === 0 ? 1 : 0;
      this.data.pins = Math.min(99, this.data.pins + pins);
      this.save();
      return { pins, solved: this.data.free.solved };
    },
  };

  K.Store = Store;
})(window.Knotwise);
