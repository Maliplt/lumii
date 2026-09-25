"use strict";
(function (B) {
  const KEY = "blockhaven.v1.progress";

  const fresh = () => ({
    version: 1,
    stars: {},
    best: 0,
    daily: { last: null, streak: 0, bestStreak: 0 },
    boosters: { hammer: 2, shuffle: 2 },
    missions: { day: null, list: [] },
    tips: [],
    settings: { language: null, music: 0.5, sfx: 0.8, calm: false },
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

  // daily missions: three a day, each a different kind at one of three sizes
  const MISSIONS = {
    lines: { sizes: [15, 25, 40] },
    combo: { sizes: [3, 4, 5], best: true },
    perks: { sizes: [2, 4, 6] },
    score: { sizes: [1500, 3000, 5000], best: true },
    pieces: { sizes: [40, 70, 100] },
    multi: { sizes: [3, 5, 8] },
  };
  const day = (value) => (typeof value === "string" && /^\d{4}-\d\d-\d\d$/.test(value) ? value : null);

  function sanitize(raw) {
    const data = fresh();
    if (!raw || raw.version !== 1) return data;
    for (const [key, value] of Object.entries(raw.stars || {})) if (/^\d\/\d{1,2}$/.test(key) && value >= 1 && value <= 3) data.stars[key] = value;
    if (count(raw.best)) data.best = raw.best;
    const d = raw.daily || {};
    data.daily = { last: day(d.last), streak: count(d.streak) ? d.streak : 0, bestStreak: count(d.bestStreak) ? d.bestStreak : 0 };
    for (const key of ["hammer", "shuffle"]) if (count(raw.boosters?.[key])) data.boosters[key] = Math.min(raw.boosters[key], 99);
    if (Array.isArray(raw.tips)) data.tips = raw.tips.filter((tip) => typeof tip === "string");
    const m = raw.missions || {};
    if (day(m.day) && Array.isArray(m.list)) {
      const list = m.list.filter((x) => x && MISSIONS[x.kind] && count(x.need) && count(x.have)).slice(0, 3);
      data.missions = { day: m.day, list: list.map((x) => ({ kind: x.kind, need: x.need, have: Math.min(x.have, x.need), reward: x.reward === "shuffle" ? "shuffle" : "hammer" })) };
    }
    const s = raw.settings || {};
    if (B.LANGUAGES.includes(s.language)) data.settings.language = s.language;
    for (const key of ["music", "sfx"]) if (typeof s[key] === "number") data.settings[key] = B.util.clamp(s[key], 0, 1);
    if (typeof s.calm === "boolean") data.settings.calm = s.calm;
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
      if (window.BlockhavenConfig?.autoSync && window.GameSave?.pushRemote && adapter?.load && adapter?.save) {
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

    // stars of level n on the path; saved under its run and place
    starsAt(n) {
      const { world, level } = B.Levels.locate(n);
      return this.data.stars[`${world}/${level}`] || 0;
    },

    totalStars() {
      return Object.values(this.data.stars).reduce((a, b) => a + b, 0);
    },

    // levels finished along the path
    done() {
      let n = 0;
      for (let i = 0; i < B.Levels.TOTAL; i++) if (this.starsAt(i)) n++;
      return n;
    },

    levelOpen(n) {
      return n === 0 || this.starsAt(n - 1) > 0;
    },

    // the first open level not yet finished, or null when all are done
    next() {
      for (let i = 0; i < B.Levels.TOTAL; i++) {
        if (!this.levelOpen(i)) break;
        if (!this.starsAt(i)) return i;
      }
      return null;
    },

    // the first lesson not yet finished, or null once all are done
    firstLesson() {
      for (let n = 0; n < B.Levels.LESSON_COUNT; n++) if (!this.starsAt(n)) return n;
      return null;
    },

    dailyOpen() {
      return this.starsAt(4) > 0;
    },
    // today's missions, drawn fresh on a new day
    missions() {
      const today = B.util.dayKey();
      if (this.data.missions.day !== today) {
        const rng = new B.Random(`${B.SEED}/missions/${today}`);
        const kinds = rng.shuffle(Object.keys(MISSIONS)).slice(0, 3);
        this.data.missions = {
          day: today,
          list: kinds.map((kind, i) => ({ kind, need: MISSIONS[kind].sizes[rng.int(0, 2)], have: 0, reward: i % 2 ? "shuffle" : "hammer" })),
        };
        this.save();
      }
      return this.data.missions.list;
    },

    // moves missions along; returns the ones this finished
    track(amounts) {
      const done = [];
      for (const m of this.missions()) {
        const value = amounts[m.kind];
        if (!value || m.have >= m.need) continue;
        m.have = Math.min(m.need, MISSIONS[m.kind].best ? Math.max(m.have, value) : m.have + value);
        if (m.have >= m.need) {
          this.data.boosters[m.reward] = Math.min(99, this.data.boosters[m.reward] + 1);
          done.push(m);
        }
      }
      if (Object.keys(amounts).length) this.save();
      return done;
    },

    useBooster(kind) {
      if (this.data.boosters[kind] <= 0) return false;
      this.data.boosters[kind]--;
      this.save();
      return true;
    },

    // records level n
    finishLevel(n, stars) {
      const { world, level } = B.Levels.locate(n);
      const key = `${world}/${level}`;
      const before = this.data.stars[key] || 0;
      if (stars > before) this.data.stars[key] = stars;
      const reward = stars === 3 && before < 3 ? (n % 2 ? "shuffle" : "hammer") : null;
      if (reward) this.data.boosters[reward] = Math.min(99, this.data.boosters[reward] + 1);
      this.save();
      return { reward, gained: Math.max(0, stars - before) };
    },
    finishEndless(score) {
      const record = score > this.data.best;
      if (record) this.data.best = score;
      this.save();
      return { record };
    },

    dailyStatus() {
      const today = B.util.dayKey();
      const { last, streak } = this.data.daily;
      const alive = last === today || last === B.util.shiftDay(today, -1);
      return { today, played: last === today, streak: alive ? streak : 0 };
    },

    finishDaily() {
      const today = B.util.dayKey();
      const daily = this.data.daily;
      let bonus = 0;
      if (daily.last !== today) {
        daily.streak = daily.last === B.util.shiftDay(today, -1) ? daily.streak + 1 : 1;
        daily.last = today;
        daily.bestStreak = Math.max(daily.bestStreak, daily.streak);
        bonus = daily.streak % 7 === 0 ? 3 : 1;
        this.data.boosters.hammer = Math.min(99, this.data.boosters.hammer + bonus);
        this.data.boosters.shuffle = Math.min(99, this.data.boosters.shuffle + bonus);
      }
      this.save();
      return { streak: daily.streak, bonus };
    },
  };

  B.Store = Store;
})(window.Blockhaven);
