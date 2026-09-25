"use strict";
(function (YB) {
  const KEY = "yirmibir-hani.v1.progress";
  // before the market, backs opened with stars; saves from then keep them
  const STAR_BACKS = { crimson: 0, forest: 12, harbor: 35, night: 65, royal: 100, sun: 140 };
  const TOTALS = ["rounds", "twentyOnes", "blackjacks", "fives", "jokers", "customers", "perfect", "bestCombo", "bestStreak"];

  const fresh = () => ({
    version: 1,
    stars: {},
    best: {},
    back: "crimson",
    cloth: "plain",
    coins: 0,
    earned: 0,
    owned: { backs: ["crimson"], cloths: ["plain"] },
    tricks: Object.fromEntries(YB.Shop.TRICK_IDS.map((id) => [id, 0])),
    errands: { day: null, list: [], chest: false, seen: null },
    deeds: {},
    endless: { best: 0 },
    daily: { last: null, streak: 0, day: null, best: 0 },
    tips: [],
    totals: Object.fromEntries(TOTALS.map((key) => [key, 0])),
    settings: { language: null, music: 0.6, sfx: 0.8, calm: false },
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
    for (const [key, value] of Object.entries(raw.stars || {})) if (/^\d\/\d$/.test(key) && value >= 1 && value <= 3) data.stars[key] = value;
    for (const [key, value] of Object.entries(raw.best || {})) if (/^\d\/\d$/.test(key) && count(value)) data.best[key] = value;
    if (count(raw.endless?.best)) data.endless.best = raw.endless.best;
    const d = raw.daily || {};
    data.daily = { last: day(d.last), streak: count(d.streak) ? d.streak : 0, day: day(d.day), best: count(d.best) ? d.best : 0 };
    if (Array.isArray(raw.tips)) data.tips = raw.tips.filter((tip) => typeof tip === "string");
    for (const key of TOTALS) if (count(raw.totals?.[key])) data.totals[key] = raw.totals[key];

    if (raw.owned) {
      for (const [kind, prices] of [["backs", YB.Shop.BACKS], ["cloths", YB.Shop.CLOTHS]]) {
        const list = Array.isArray(raw.owned[kind]) ? raw.owned[kind] : [];
        data.owned[kind] = Object.keys(prices).filter((id) => prices[id] === 0 || list.includes(id));
      }
      if (count(raw.coins)) data.coins = raw.coins;
      if (count(raw.earned)) data.earned = raw.earned;
      for (const id of YB.Shop.TRICK_IDS) data.tricks[id] = count(raw.tricks?.[id]) ? Math.min(raw.tricks[id], YB.Shop.STACK) : 0;
    } else {
      // an older save: keep the backs its stars had opened and pay the stars out
      const stars = Object.values(data.stars).reduce((sum, value) => sum + value, 0);
      data.owned.backs = Object.keys(STAR_BACKS).filter((id) => stars >= STAR_BACKS[id]);
      data.coins = stars * 5;
    }
    if (data.owned.backs.includes(raw.back)) data.back = raw.back;
    if (data.owned.cloths.includes(raw.cloth)) data.cloth = raw.cloth;

    const e = raw.errands || {};
    if (day(e.day) && Array.isArray(e.list)) {
      data.errands.day = e.day;
      data.errands.list = e.list
        .filter((item) => item && YB.Quests.ERRANDS[item.id] && count(item.goal) && item.goal > 0 && count(item.reward) && count(item.progress))
        .slice(0, YB.Quests.DAILY_COUNT)
        .map((item) => ({ id: item.id, goal: item.goal, reward: item.reward, progress: Math.min(item.progress, item.goal), claimed: item.claimed === true }));
      data.errands.chest = e.chest === true;
    }
    data.errands.seen = day(e.seen);
    for (const entry of YB.Quests.DEEDS) if (count(raw.deeds?.[entry.id])) data.deeds[entry.id] = Math.min(raw.deeds[entry.id], entry.goals.length);

    const s = raw.settings || {};
    if (YB.LANGUAGES.includes(s.language)) data.settings.language = s.language;
    for (const key of ["music", "sfx"]) if (typeof s[key] === "number") data.settings[key] = YB.util.clamp(s[key], 0, 1);
    if (typeof s.calm === "boolean") data.settings.calm = s.calm;
    return data;
  }

  const listeners = new Set();
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
      listeners.forEach((listener) => listener(this.data));
      const config = window.YirmibirHaniConfig;
      if (config?.autoSync && this.cloudAvailable()) {
        clearTimeout(syncTimer);
        syncTimer = setTimeout(() => window.GameSave.pushRemote().catch(() => {}), 2000);
      }
    },

    cloudAvailable() {
      const adapter = window.GameSaveConfig?.adapter;
      return Boolean(window.GameSave?.pushRemote && adapter?.load && adapter?.save);
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

    key: (region, level) => `${region}/${level}`,

    starsOf(region, level) {
      return this.data.stars[this.key(region, level)] || 0;
    },

    bestOf(region, level) {
      return this.data.best[this.key(region, level)] || 0;
    },

    regionStars(region) {
      let sum = 0;
      for (let l = 0; l < YB.Levels.LEVELS; l++) sum += this.starsOf(region, l);
      return sum;
    },

    totalStars() {
      return Object.values(this.data.stars).reduce((sum, value) => sum + value, 0);
    },

    regionDone(region) {
      return this.starsOf(region, YB.Levels.LEVELS - 1) > 0;
    },

    isRegionOpen(region) {
      return region === 0 || this.regionDone(region - 1);
    },

    isLevelOpen(region, level) {
      return this.isRegionOpen(region) && (level === 0 || this.starsOf(region, level - 1) > 0);
    },

    // the first open level without a star, or null when every one has one
    next() {
      for (let r = 0; r < YB.Levels.REGIONS.length; r++) {
        for (let l = 0; l < YB.Levels.LEVELS; l++) if (this.isLevelOpen(r, l) && !this.starsOf(r, l)) return { region: r, level: l };
      }
      return null;
    },

    dailyOpen() {
      return this.starsOf(0, 2) > 0;
    },

    endlessOpen() {
      return this.regionDone(0);
    },

    // the market

    owns(kind, id) {
      return this.data.owned[kind].includes(id);
    },

    addCoins(amount) {
      this.data.coins += amount;
      this.data.earned += amount;
    },

    // buys a back, a cloth or one trick; returns false when it cannot
    buy(kind, id) {
      const prices = { backs: YB.Shop.BACKS, cloths: YB.Shop.CLOTHS, tricks: YB.Shop.TRICKS }[kind];
      const cost = prices?.[id];
      if (cost === undefined || this.data.coins < cost) return false;
      if (kind === "tricks") {
        if (this.data.tricks[id] >= YB.Shop.STACK) return false;
        this.data.tricks[id]++;
      } else {
        if (this.owns(kind, id)) return false;
        this.data.owned[kind].push(id);
        this.data[kind === "backs" ? "back" : "cloth"] = id;
      }
      this.data.coins -= cost;
      this.save();
      return true;
    },

    equip(kind, id) {
      if (!this.owns(kind, id)) return;
      this.data[kind === "backs" ? "back" : "cloth"] = id;
      this.save();
    },

    // whether the story has reached the hand where a trick joins the pouch
    trickOpen(id) {
      const [region, level] = YB.Shop.UNLOCK[id];
      return this.isLevelOpen(region, level);
    },

    // the first one of a trick comes free when it is introduced
    giftTrick(id) {
      this.data.tricks[id] = Math.min(YB.Shop.STACK, this.data.tricks[id] + 1);
      this.save();
    },

    spendTrick(id) {
      if (!this.data.tricks[id]) return false;
      this.data.tricks[id]--;
      this.save();
      return true;
    },

    // the ledger

    // today's errands, written up fresh on a new day
    errands() {
      const today = YB.util.dayKey();
      const errands = this.data.errands;
      if (errands.day !== today) {
        errands.day = today;
        errands.list = YB.Quests.daily(today, { stars: this.totalStars(), open: { patrons: this.dailyOpen(), story: true, harbor: this.isRegionOpen(1) } });
        errands.chest = false;
        this.save();
      }
      return errands;
    },

    markErrandsSeen() {
      const errands = this.errands();
      if (errands.seen === errands.day) return;
      errands.seen = errands.day;
      this.save();
    },

    claimErrand(index) {
      const errand = this.errands().list[index];
      if (!errand || errand.claimed || errand.progress < errand.goal) return 0;
      errand.claimed = true;
      this.addCoins(errand.reward);
      this.save();
      return errand.reward;
    },

    chestReady() {
      const { list, chest } = this.errands();
      return !chest && list.length > 0 && list.every((errand) => errand.claimed);
    },

    // the chest behind the day's errands: coins and a trick
    openChest() {
      if (!this.chestReady()) return null;
      this.data.errands.chest = true;
      this.addCoins(YB.Quests.CHEST);
      const room = YB.Shop.TRICK_IDS.filter((id) => this.data.tricks[id] < YB.Shop.STACK);
      const trick = room.length ? room[Math.floor(Math.random() * room.length)] : null;
      if (trick) this.data.tricks[trick]++;
      this.save();
      return { coins: YB.Quests.CHEST, trick };
    },

    deedValues() {
      const t = this.data.totals;
      return {
        twentyOnes: t.twentyOnes,
        blackjacks: t.blackjacks,
        fives: t.fives,
        customers: t.customers,
        combo: t.bestCombo,
        stars: this.totalStars(),
        regions: YB.Levels.REGIONS.filter((region, i) => this.regionDone(i)).length,
        streak: t.bestStreak,
        endless: this.data.endless.best,
        perfect: t.perfect,
        coins: this.data.earned,
      };
    },

    deeds() {
      const values = this.deedValues();
      return YB.Quests.DEEDS.map((entry) => ({ id: entry.id, goals: entry.goals, ...YB.Quests.deed(entry, values[entry.id], this.data.deeds[entry.id] || 0) }));
    },

    claimDeed(id) {
      const deed = this.deeds().find((entry) => entry.id === id);
      if (!deed?.ready) return 0;
      this.data.deeds[id] = deed.claimed + 1;
      this.addCoins(deed.reward);
      this.save();
      return deed.reward;
    },

    // how many things wait in the ledger, for the menu badge
    claimable() {
      const errands = this.errands();
      const ready = errands.list.filter((errand) => !errand.claimed && errand.progress >= errand.goal).length;
      return ready + (this.chestReady() ? 1 : 0) + this.deeds().filter((deed) => deed.ready).length;
    },

    // finished hands

    // records a story round; returns what changed for the result screen
    finishLevel(region, level, score, stars) {
      const key = this.key(region, level);
      const regionBefore = this.regionDone(region);
      const before = this.data.stars[key] || 0;
      const best = this.data.best[key] || 0;
      if (stars > before) this.data.stars[key] = stars;
      if (score > best) this.data.best[key] = score;
      return {
        newBest: score > best && best > 0,
        gained: Math.max(0, stars - before),
        regionDone: !regionBefore && this.regionDone(region),
      };
    },

    dailyStatus() {
      const today = YB.util.dayKey();
      const { last, streak, day: played, best } = this.data.daily;
      const alive = last === today || last === YB.util.shiftDay(today, -1);
      return { today, played: last === today, streak: alive ? streak : 0, best: played === today ? best : 0 };
    },

    finishDaily(score) {
      const today = YB.util.dayKey();
      const daily = this.data.daily;
      const first = daily.last !== today;
      if (first) {
        daily.streak = daily.last === YB.util.shiftDay(today, -1) ? daily.streak + 1 : 1;
        daily.last = today;
      }
      this.data.totals.bestStreak = Math.max(this.data.totals.bestStreak, daily.streak);
      const newBest = daily.day !== today || score > daily.best;
      if (daily.day !== today) daily.best = 0;
      daily.day = today;
      daily.best = Math.max(daily.best, score);
      return { newBest: newBest && score > 0, streak: daily.streak, first };
    },

    finishEndless(score) {
      const newBest = score > this.data.endless.best;
      if (newBest) this.data.endless.best = score;
      return { newBest };
    },

    // books a finished hand
    finishRound(round, { mode, region, level, stars }) {
      let outcome;
      if (mode === "story") outcome = this.finishLevel(region, level, round.score, stars);
      else if (mode === "daily") outcome = this.finishDaily(round.score);
      else outcome = this.finishEndless(round.score);

      const s = round.stats;
      const perfect = round.reason === "deck" && s.busts === 0;
      const t = this.data.totals;
      t.rounds++;
      t.twentyOnes += s.twentyOnes + s.blackjacks;
      t.blackjacks += s.blackjacks;
      t.fives += s.fives;
      t.jokers += s.jokers;
      t.customers += s.tips;
      if (perfect) t.perfect++;
      t.bestCombo = Math.max(t.bestCombo, s.bestCombo);

      const summary = { ...s, score: round.score, stars: mode === "story" ? stars : 0, perfect };
      const errands = YB.Quests.advance(this.errands().list, summary);
      const pay = YB.Shop.payout({ score: round.score, tipCoins: s.tipCoins, gained: outcome.gained || 0, firstDaily: outcome.first, streak: outcome.streak });
      this.addCoins(pay.total);
      this.save();
      return { ...outcome, pay, errands, perfect };
    },
  };

  YB.Store = Store;
})(window.YirmibirHani);
