"use strict";
const SudokuEngine = (() => {
  const ALL = 0x3fe;
  const row = (i) => Math.floor(i / 9);
  const col = (i) => i % 9;
  const box = (i) => Math.floor(row(i) / 3) * 3 + Math.floor(col(i) / 3);
  const units = Array.from({ length: 27 }, (_, u) =>
    Array.from({ length: 9 }, (_, n) =>
      u < 9
        ? u * 9 + n
        : u < 18
          ? n * 9 + u - 9
          : Math.floor((u - 18) / 3) * 27 +
            ((u - 18) % 3) * 3 +
            Math.floor(n / 3) * 9 +
            (n % 3),
    ),
  );
  const peers = Array.from({ length: 81 }, (_, i) =>
    [...new Set(units.filter((u) => u.includes(i)).flat())].filter(
      (j) => j !== i,
    ),
  );
  function random(seed) {
    let value = seed >>> 0;
    return () => {
      value += 0x6d2b79f5;
      let x = Math.imul(value ^ (value >>> 15), 1 | value);
      x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(text) {
    let value = 2166136261;
    for (const char of String(text))
      value = Math.imul(value ^ char.charCodeAt(0), 16777619);
    return value >>> 0;
  }
  function shuffle(items, rng) {
    const list = [...items];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }
  function candidates(board, i) {
    if (board[i]) return [];
    const used = new Set(peers[i].map((j) => board[j]));
    return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => !used.has(n));
  }
  function solve(input, limit = 2, rng = null) {
    const board = [...input],
      rows = Array(9).fill(0),
      cols = Array(9).fill(0),
      boxes = Array(9).fill(0);
    for (let i = 0; i < 81; i++) {
      if (!board[i]) continue;
      const bit = 1 << board[i],
        r = row(i),
        c = col(i),
        b = box(i);
      if ((rows[r] | cols[c] | boxes[b]) & bit)
        return { count: 0, solution: null };
      rows[r] |= bit;
      cols[c] |= bit;
      boxes[b] |= bit;
    }
    let count = 0,
      solution = null;
    function search() {
      let best = -1,
        mask = 0,
        size = 10;
      for (let i = 0; i < 81; i++) {
        if (board[i]) continue;
        const possible = ALL & ~(rows[row(i)] | cols[col(i)] | boxes[box(i)]);
        let bits = possible,
          length = 0;
        while (bits) {
          bits &= bits - 1;
          length++;
        }
        if (!length) return;
        if (length < size) {
          best = i;
          mask = possible;
          size = length;
        }
        if (length === 1) break;
      }
      if (best === -1) {
        count++;
        solution ||= [...board];
        return;
      }
      const r = row(best),
        c = col(best),
        b = box(best);
      const digits = rng
        ? shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng)
        : [1, 2, 3, 4, 5, 6, 7, 8, 9];
      for (const n of digits) {
        if (count >= limit) break;
        const bit = 1 << n;
        if (!(mask & bit)) continue;
        board[best] = n;
        rows[r] |= bit;
        cols[c] |= bit;
        boxes[b] |= bit;
        search();
        board[best] = 0;
        rows[r] ^= bit;
        cols[c] ^= bit;
        boxes[b] ^= bit;
      }
    }
    search();
    return { count, solution };
  }
  function build(rng, difficulty) {
    const solution = solve(Array(81).fill(0), 1, rng).solution;
    const givens = [...solution],
      target = [46, 38, 30, 26][difficulty] || 38;
    let left = 81;
    for (const i of shuffle(
      Array.from({ length: 41 }, (_, i) => i),
      rng,
    )) {
      const j = 80 - i,
        removed = i === j ? 1 : 2;
      if (left - removed < target) continue;
      const a = givens[i],
        b = givens[j];
      givens[i] = givens[j] = 0;
      if (solve(givens).count === 1) left -= removed;
      else {
        givens[i] = a;
        givens[j] = b;
      }
    }
    return { givens, solution };
  }
  function grade(puzzle) {
    if (typeof SudokuTechniques !== "undefined")
      return SudokuTechniques.rate(puzzle.givens).grade;
    const board = [...puzzle.givens];
    let hidden = 0;
    while (board.includes(0)) {
      const next = hint(board, puzzle.solution);
      if (next.type === "reveal") return 3;
      if (next.type === "hidden") hidden++;
      board[next.index] = next.value;
    }
    return hidden > 3 ? 2 : hidden > 0 ? 1 : 0;
  }
  function generate(seed, difficulty = 1) {
    const rng = random(hash(seed));
    let nearest = null,
      distance = Infinity;
    for (let attempt = 0; attempt < 300; attempt++) {
      const puzzle = build(rng, difficulty),
        rating = grade(puzzle);
      const difference = Math.abs(rating - difficulty);
      if (difference < distance) {
        nearest = puzzle;
        distance = difference;
      }
      if (!difference) return puzzle;
    }
    return nearest;
  }
  function hint(board, solution, selected = -1) {
    const wrong = board.findIndex((n, i) => n && n !== solution[i]);
    if (wrong !== -1)
      return { index: wrong, value: solution[wrong], type: "repair" };
    const cells = board.map((n, i) => (n ? [] : candidates(board, i)));
    const single = cells.findIndex((c) => c.length === 1);
    if (single !== -1)
      return { index: single, value: cells[single][0], type: "single" };
    for (const unit of units) {
      for (let n = 1; n <= 9; n++) {
        const possible = unit.filter((i) => cells[i].includes(n));
        if (possible.length === 1)
          return { index: possible[0], value: n, type: "hidden" };
      }
    }
    const index =
      selected >= 0 && !board[selected]
        ? selected
        : cells.reduce(
            (best, c, i) =>
              c.length && (best < 0 || c.length < cells[best].length)
                ? i
                : best,
            -1,
          );
    return index < 0 ? null : { index, value: solution[index], type: "reveal" };
  }
  function conflicts(board) {
    return board.map((n, i) => !!n && peers[i].some((j) => board[j] === n));
  }
  function fromString(text) {
    const values = String(text)
      .replace(/[^0-9.]/g, "")
      .split("")
      .map((c) => (c === "." ? 0 : Number(c)));
    if (values.length !== 81) throw new Error("length");
    const solved = solve(values, 2);
    if (solved.count !== 1)
      throw new Error(solved.count ? "multiple" : "invalid");
    return { givens: values, solution: solved.solution };
  }
  return {
    peers,
    units,
    candidates,
    solve,
    generate,
    hint,
    conflicts,
    hash,
    grade,
    fromString,
  };
})();
if (typeof module !== "undefined") module.exports = SudokuEngine;
