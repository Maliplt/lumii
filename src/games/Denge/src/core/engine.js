"use strict";

/* Satır adaylarını sütun toplamlarıyla ele; birden fazla çözümü olanları atla. */
const Puzzle = (() => {
  function random(seed) {
    return () => {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function countSolutions(values, rows, cols, limit = 2) {
    const n = rows.length;
    const options = rows
      .map((target, r) => {
        const masks = [];
        for (let mask = 0; mask < 1 << n; mask++) {
          let sum = 0;
          for (let c = 0; c < n; c++)
            if (mask & (1 << c)) sum += values[r * n + c];
          if (sum === target) masks.push(mask);
        }
        return { r, masks };
      })
      .sort((a, b) => a.masks.length - b.masks.length);
    const min = Array.from({ length: n + 1 }, () => Array(n).fill(0));
    const max = Array.from({ length: n + 1 }, () => Array(n).fill(0));
    for (let k = n - 1; k >= 0; k--) {
      const { r, masks } = options[k];
      if (!masks.length) return 0;
      for (let c = 0; c < n; c++) {
        min[k][c] =
          min[k + 1][c] +
          (masks.every((m) => m & (1 << c)) ? values[r * n + c] : 0);
        max[k][c] =
          max[k + 1][c] +
          (masks.some((m) => m & (1 << c)) ? values[r * n + c] : 0);
      }
    }
    let count = 0,
      visits = 0;
    const sums = Array(n).fill(0);
    function search(k) {
      if (++visits > 30000) {
        count = limit;
        return;
      }
      if (k === n) {
        count++;
        return;
      }
      const { r, masks } = options[k];
      for (const mask of masks) {
        let valid = true;
        for (let c = 0; c < n; c++) {
          const next = sums[c] + (mask & (1 << c) ? values[r * n + c] : 0);
          if (
            next + min[k + 1][c] > cols[c] ||
            next + max[k + 1][c] < cols[c]
          ) {
            valid = false;
            break;
          }
        }
        if (!valid) continue;
        for (let c = 0; c < n; c++)
          if (mask & (1 << c)) sums[c] += values[r * n + c];
        search(k + 1);
        for (let c = 0; c < n; c++)
          if (mask & (1 << c)) sums[c] -= values[r * n + c];
        if (count >= limit) return;
      }
    }
    search(0);
    return count;
  }
  function generate(n, seed) {
    if (!Number.isInteger(n) || n < 3 || n > 6)
      throw new RangeError("Invalid board size");
    const rng = random(seed);
    for (let attempt = 0; attempt < 3000; attempt++) {
      const values = Array.from(
        { length: n * n },
        () => 1 + Math.floor(rng() * 9),
      );
      const solution = values.map(() => rng() < 0.48);
      const rows = Array(n).fill(0),
        cols = Array(n).fill(0);
      const rowCounts = Array(n).fill(0),
        colCounts = Array(n).fill(0);
      solution.forEach((on, i) => {
        if (on) {
          const r = Math.floor(i / n),
            c = i % n;
          rows[r] += values[i];
          cols[c] += values[i];
          rowCounts[r]++;
          colCounts[c]++;
        }
      });
      if (
        [...rowCounts, ...colCounts].some((count) => count === 0 || count === n)
      )
        continue;
      const board = { n, values, solution, rows, cols };
      // Her hücre, satır ve sütun adaylarından çıkarılabilmeli.
      const logical = deduce(board);
      if (
        logical &&
        logical.every((on, i) => on === solution[i]) &&
        countSolutions(values, rows, cols) === 1
      )
        return board;
    }
    throw new Error("Bulmaca oluşturulamadı. Lütfen yeniden dene.");
  }
  function deduce({ n, values, rows, cols }) {
    const known = Array(n * n).fill(null);
    const lines = [...rows, ...cols].map((target, line) => {
      const indices = Array.from({ length: n }, (_, j) =>
        line < n ? line * n + j : j * n + line - n,
      );
      const masks = [];
      for (let mask = 0; mask < 1 << n; mask++) {
        const sum = indices.reduce(
          (total, i, j) => total + (mask & (1 << j) ? values[i] : 0),
          0,
        );
        if (sum === target) masks.push(mask);
      }
      return { indices, masks };
    });
    let changed = true;
    while (changed) {
      changed = false;
      for (const line of lines) {
        line.masks = line.masks.filter((mask) =>
          line.indices.every(
            (i, j) =>
              known[i] === null || known[i] === Boolean(mask & (1 << j)),
          ),
        );
        if (!line.masks.length) return null;
        line.indices.forEach((i, j) => {
          if (known[i] !== null) return;
          const first = Boolean(line.masks[0] & (1 << j));
          if (line.masks.every((mask) => Boolean(mask & (1 << j)) === first)) {
            known[i] = first;
            changed = true;
          }
        });
      }
    }
    return known.every((on) => on !== null) ? known : null;
  }
  function fingerprint(board) {
    return `${board.values.join(",")}/${board.rows.join(",")}/${board.cols.join(",")}`;
  }
  function chapter(n, series, number, recent = []) {
    // Büyük bölüm numaralarında da tüm basamakları kullan.
    for (let salt = 0; salt < 128; salt++) {
      let seed = 2166136261;
      for (const char of `${series}:${n}:${number}:${salt}`)
        seed = Math.imul(seed ^ char.charCodeAt(0), 16777619);
      const board = generate(n, seed >>> 0);
      if (!recent.includes(fingerprint(board))) return board;
    }
    throw new Error("Yeni bölüm hazırlanamadı. Lütfen yeniden dene.");
  }
  function difficulty(number) {
    const index = BigInt(number),
      boss = index % 10n === 0n;
    const tier = index < 21n ? 0 : index < 61n ? 1 : 2;
    return {
      n: Math.min(6, 4 + tier + (boss ? 1 : 0)),
      boss,
      samples: boss
        ? 28
        : Math.min(14, (1 + Number(index > 130n ? 130n : index) / 10) | 0),
    };
  }
  function complexity(board) {
    const { n, values, rows, cols } = board;
    return [...rows, ...cols].reduce((score, target, line) => {
      let count = 0;
      for (let mask = 0; mask < 1 << n; mask++) {
        let sum = 0;
        for (let j = 0; j < n; j++)
          if ((mask >> j) & 1)
            sum += values[line < n ? line * n + j : j * n + line - n];
        if (sum === target) count++;
      }
      return score + Math.log2(count || 1);
    }, 0);
  }
  function progressive(series, number, recent = []) {
    const spec = difficulty(number);
    let best = null;
    for (let i = 0; i < spec.samples; i++) {
      const candidate = chapter(spec.n, series, `${number}:rank:${i}`, recent);
      if (!best || complexity(candidate) > complexity(best)) best = candidate;
    }
    return { ...best, boss: spec.boss };
  }
  function constellation(series, number, legacy = false) {
    const step = BigInt(number),
      tier = legacy ? 0 : (Number(step > 1000n ? 1000n : step) / 5) | 0,
      multiplier = 1 + tier;
    const scale = (b) => ({
      ...b,
      values: b.values.map((v) => v * multiplier),
      rows: b.rows.map((v) => v * multiplier),
      cols: b.cols.map((v) => v * multiplier),
    });
    const meta = scale(chapter(3, series, `${number}:final`)),
      boards = [],
      recent = [];
    for (let i = 0; i < 9; i++) {
      let board = null;
      for (let candidate = 0; candidate < Math.min(12, 1 + tier); candidate++) {
        const next = chapter(
          6,
          series,
          `${number}:sector:${i}${candidate ? ":" + candidate : ""}`,
          recent,
        );
        if (!board || complexity(next) > complexity(board)) board = next;
      }
      recent.push(fingerprint(board));
      boards.push(scale(board));
    }
    return { meta, boards };
  }
  return {
    generate,
    countSolutions,
    deduce,
    chapter,
    fingerprint,
    difficulty,
    complexity,
    progressive,
    constellation,
  };
})();

if (typeof module !== "undefined" && module.exports) module.exports = Puzzle;

// İlerleme kuralları arayüzden bağımsızdır.
class Campaign {
  constructor(seed, next = "1", recent = [], records = {}) {
    this.seed = seed;
    this.next = next;
    this.recent = recent;
    this.records = records;
  }
  board(n, number) {
    if (!/^[1-9]\d*$/.test(number) || BigInt(number) > BigInt(this.next))
      throw new RangeError("Locked chapter");
    const entry = this.records[number];
    if (
      entry?.board?.n === n &&
      Array.isArray(entry.board.values) &&
      entry.board.values.length === n * n &&
      entry.board.values.every(
        (v) => Number.isInteger(v) && v >= 1 && v <= 9,
      ) &&
      Array.isArray(entry.board.rows) &&
      entry.board.rows.length === n &&
      Array.isArray(entry.board.cols) &&
      entry.board.cols.length === n &&
      [...entry.board.rows, ...entry.board.cols].every(
        (v) => Number.isInteger(v) && v > 0 && v < n * 9,
      )
    ) {
      const solution = Puzzle.deduce(entry.board);
      if (solution) return { ...entry.board, solution };
    }
    const board = Puzzle.chapter(
      n,
      this.seed,
      number,
      number === this.next ? this.recent : [],
    );
    this.records[number] = { board, stars: 0, best: null };
    return board;
  }
  complete(number, board, stars, ms, hints) {
    const old = this.records[number] || {};
    this.records[number] = {
      board,
      stars: Math.max(old.stars || 0, stars),
      best: hints === 0 ? Math.min(old.best || Infinity, ms) : old.best || null,
    };
    if (number === this.next) {
      this.next = (BigInt(number) + 1n).toString();
      this.recent = [...this.recent, Puzzle.fingerprint(board)].slice(-128);
    }
  }
}
if (typeof module !== "undefined" && module.exports)
  module.exports.Campaign = Campaign;

class HintWallet {
  constructor(data = {}, now = Date.now()) {
    this.charges = Number.isInteger(data.charges)
      ? Math.max(0, Math.min(3, data.charges))
      : 3;
    this.spent =
      Number.isSafeInteger(data.spent) && data.spent >= 0 ? data.spent : 0;
    this.next =
      Number.isFinite(data.next) && data.next > 0
        ? Math.min(data.next, now + 3600000)
        : 0;
    this.refresh(now);
  }
  refresh(now = Date.now()) {
    if (this.charges === 3) {
      this.next = 0;
      return;
    }
    if (!this.next) this.next = now + 3600000;
    if (now >= this.next) {
      const earned = 1 + Math.floor((now - this.next) / 3600000);
      this.charges = Math.min(3, this.charges + earned);
      this.next = this.charges === 3 ? 0 : this.next + earned * 3600000;
    }
  }
  use(now = Date.now()) {
    this.refresh(now);
    if (!this.charges) return false;
    this.charges--;
    if (!this.next) this.next = now + 3600000;
    return true;
  }
  buy(earned, now = Date.now()) {
    this.refresh(now);
    if (this.charges === 3 || earned - this.spent < 5) return false;
    this.spent += 5;
    this.charges++;
    if (this.charges === 3) this.next = 0;
    return true;
  }
}
if (typeof module !== "undefined" && module.exports)
  module.exports.HintWallet = HintWallet;
