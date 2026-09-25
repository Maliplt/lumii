import { ECONOMY, GAME } from '../config.js';
import { Emitter } from '../core/emitter.js';
import { LEVELS_PER_WORLD, WORLDS, todayKey } from '../puzzle/levels.js';
import { Storage } from './storage.js';

const DEFAULT_SETTINGS = {
  language: null,
  music: 0.5,
  sfx: 0.8,
  vibration: true,
  // follows the system setting until the player chooses otherwise
  reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
};

function freshSave() {
  return {
    version: GAME.saveVersion,
    levels: {},
    dewdrops: ECONOMY.startingDewdrops,
    discovered: [],
    tips: [],
    daily: { last: null, streak: 0, best: 0 },
    zen: { solved: 0 },
    settings: { ...DEFAULT_SETTINGS },
  };
}

function shiftDay(dateKey, days) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return todayKey(new Date(y, m - 1, d + days));
}

// everything the player has earned
class Progress extends Emitter {
  constructor() {
    super();
    this.storage = new Storage(GAME.saveKey);
    const stored = this.storage.read();
    const base = freshSave();
    this.data = stored?.version === GAME.saveVersion
      ? { ...base, ...stored, settings: { ...base.settings, ...stored.settings } }
      : base;
  }

  commit() {
    this.storage.write(this.data);
    this.emit('change', this.data);
  }

  // settings

  get settings() {
    return this.data.settings;
  }

  setSetting(key, value) {
    this.data.settings[key] = value;
    this.commit();
    this.emit('settings', this.data.settings);
  }

  // story levels

  record(worldIndex, levelIndex) {
    return this.data.levels[`${WORLDS[worldIndex].id}/${levelIndex}`] ?? null;
  }

  isWorldUnlocked(worldIndex) {
    return worldIndex === 0 || this.isWorldComplete(worldIndex - 1);
  }

  isWorldComplete(worldIndex) {
    return this.record(worldIndex, LEVELS_PER_WORLD - 1) !== null;
  }

  isWorldPerfect(worldIndex) {
    return this.worldStars(worldIndex) === LEVELS_PER_WORLD * 3;
  }

  isLevelUnlocked(worldIndex, levelIndex) {
    if (!this.isWorldUnlocked(worldIndex)) return false;
    return levelIndex === 0 || this.record(worldIndex, levelIndex - 1) !== null;
  }

  worldsUnlocked() {
    return WORLDS.filter((_, i) => this.isWorldUnlocked(i)).length;
  }

  worldStars(worldIndex) {
    let stars = 0;
    for (let l = 0; l < LEVELS_PER_WORLD; l++) stars += this.record(worldIndex, l)?.stars ?? 0;
    return stars;
  }

  totalStars() {
    return WORLDS.reduce((sum, _, w) => sum + this.worldStars(w), 0);
  }

  // where "Play" should take the player: the first unfinished level
  nextLevel() {
    for (let w = 0; w < WORLDS.length; w++) {
      for (let l = 0; l < LEVELS_PER_WORLD; l++) {
        if (this.isLevelUnlocked(w, l) && !this.record(w, l)) return { worldIndex: w, levelIndex: l };
      }
    }
    return { worldIndex: WORLDS.length - 1, levelIndex: LEVELS_PER_WORLD - 1 };
  }

  completeLevel(worldIndex, levelIndex, stars, moves) {
    const key = `${WORLDS[worldIndex].id}/${levelIndex}`;
    const previous = this.data.levels[key];
    const wasComplete = this.isWorldComplete(worldIndex);
    const wasPerfect = this.isWorldPerfect(worldIndex);

    const starsGained = Math.max(0, stars - (previous?.stars ?? 0));
    this.data.levels[key] = {
      stars: Math.max(stars, previous?.stars ?? 0),
      moves: Math.min(moves, previous?.moves ?? Infinity),
    };
    const dewdropsEarned = starsGained * ECONOMY.dewdropsPerNewStar;
    this.data.dewdrops += dewdropsEarned;
    this.commit();

    return {
      firstClear: !previous,
      starsGained,
      dewdropsEarned,
      worldCompleted: !wasComplete && this.isWorldComplete(worldIndex),
      worldPerfected: !wasPerfect && this.isWorldPerfect(worldIndex),
    };
  }

  // dewdrops (hint currency)

  get dewdrops() {
    return this.data.dewdrops;
  }

  addDewdrops(amount) {
    this.data.dewdrops += amount;
    this.commit();
  }

  spendDewdrop() {
    if (this.data.dewdrops <= 0) return false;
    this.data.dewdrops -= 1;
    this.commit();
    return true;
  }

  // herbarium

  isDiscovered(species) {
    return this.data.discovered.includes(species);
  }

  // returns true the first time a species blooms
  discover(species) {
    if (this.isDiscovered(species)) return false;
    this.data.discovered.push(species);
    this.commit();
    return true;
  }

  // coach tips

  hasSeenTip(id) {
    return this.data.tips.includes(id);
  }

  markTipSeen(id) {
    if (this.hasSeenTip(id)) return;
    this.data.tips.push(id);
    this.commit();
  }

  // daily garden

  dailyStatus(dateKey = todayKey()) {
    const { last, streak, best } = this.data.daily;
    const alive = last === dateKey || last === shiftDay(dateKey, -1);
    return { doneToday: last === dateKey, streak: alive ? streak : 0, best };
  }

  completeDaily(dateKey = todayKey()) {
    const daily = this.data.daily;
    if (daily.last === dateKey) return { alreadyDone: true, streak: daily.streak, reward: 0 };
    daily.streak = daily.last === shiftDay(dateKey, -1) ? daily.streak + 1 : 1;
    daily.best = Math.max(daily.best, daily.streak);
    daily.last = dateKey;
    this.data.dewdrops += ECONOMY.dailyReward;
    this.commit();
    return { alreadyDone: false, streak: daily.streak, reward: ECONOMY.dailyReward };
  }

  // zen garden

  get zenSolved() {
    return this.data.zen.solved;
  }

  addZenSolved() {
    this.data.zen.solved += 1;
    this.commit();
  }

  // wipes progress but keeps the player's settings
}

export const progress = new Progress();
