(function (root) {
  "use strict";
  const VERSION = 1;
  function adjacent(a, b, width) {
    return (
      Math.abs((a % width) - (b % width)) +
        Math.abs(Math.floor(a / width) - Math.floor(b / width)) ===
      1
    );
  }
  function neighbors(i, w, h) {
    return [i - w, i + w, i - 1, i + 1].filter(
      (j) => j >= 0 && j < w * h && adjacent(i, j, w),
    );
  }
  function validBoard(level, board) {
    if (!Array.isArray(board) || board.length !== level.w * level.h)
      return false;
    const used = new Set();
    return board.every((id, i) => {
      if (level.fixed[i] != null && level.fixed[i] !== id) return false;
      if (id === null) return true;
      if (!Number.isInteger(id) || !level.tiles[id] || used.has(id))
        return false;
      used.add(id);
      return true;
    });
  }
  function inspect(level, board) {
    const positions = new Map(board.map((id, i) => [id, i]));
    const links = [],
      broken = [];
    const groups = [...new Set(level.tiles.map((t) => t.color))].map(
      (color) => {
        const tiles = level.tiles
          .filter((t) => t.color === color)
          .sort((a, b) => a.value - b.value);
        let connected = 0;
        for (let k = 1; k < tiles.length; k++) {
          const a = positions.get(tiles[k - 1].id),
            b = positions.get(tiles[k].id);
          if (a != null && b != null) {
            if (adjacent(a, b, level.w)) {
              links.push({ a, b, color });
              connected++;
            } else broken.push({ a, b, color });
          }
        }
        return {
          color,
          length: tiles.length,
          placed: tiles.filter((t) => positions.has(t.id)).length,
          connected,
          complete:
            connected === tiles.length - 1 &&
            tiles.every((t) => positions.has(t.id)),
        };
      },
    );
    return {
      links,
      broken,
      groups,
      solved:
        validBoard(level, board) &&
        !board.includes(null) &&
        groups.every((g) => g.complete),
    };
  }
  // Enumerate each colour's paths, then solve an exact cover of the board.
  function solve(level, board = level.fixed, limit = 2) {
    if (!validBoard(level, board)) return [];
    const candidates = [];
    for (const color of [...new Set(level.tiles.map((t) => t.color))]) {
      const tiles = level.tiles
        .filter((t) => t.color === color)
        .sort((a, b) => a.value - b.value);
      const paths = [];
      function walk(path, mask) {
        const k = path.length;
        if (k === tiles.length) {
          paths.push({ path: [...path], mask, tiles });
          return;
        }
        const id = tiles[k].id,
          fixedAt = board.indexOf(id);
        const options = k
          ? neighbors(path[k - 1], level.w, level.h)
          : Array.from({ length: board.length }, (_, i) => i);
        for (const i of options) {
          if (
            mask & (1 << i) ||
            (board[i] !== null && board[i] !== id) ||
            (fixedAt >= 0 && i !== fixedAt)
          )
            continue;
          walk([...path, i], mask | (1 << i));
        }
      }
      walk([], 0);
      candidates.push(paths);
    }
    candidates.sort((a, b) => a.length - b.length);
    const results = [];
    function combine(k, mask, out) {
      if (results.length >= limit) return;
      if (k === candidates.length) {
        results.push(out);
        return;
      }
      for (const c of candidates[k]) {
        if (c.mask & mask) continue;
        const next = [...out];
        c.path.forEach((i, j) => (next[i] = c.tiles[j].id));
        combine(k + 1, mask | c.mask, next);
        if (results.length >= limit) return;
      }
    }
    combine(0, 0, Array(board.length).fill(null));
    return results;
  }
  function random(seed) {
    return () => {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function generate(seed, w, h, difficulty = 1) {
    const rng = random(seed),
      shuffle = (a) =>
        a
          .map((v) => ({ v, r: rng() }))
          .sort((a, b) => a.r - b.r)
          .map((x) => x.v);
    const n = w * h;
    let route = null;
    function walk(path, mask) {
      if (path.length === n) {
        route = path;
        return true;
      }
      for (const j of shuffle(neighbors(path.at(-1), w, h)))
        if (!(mask & (1 << j)) && walk([...path, j], mask | (1 << j)))
          return true;
      return false;
    }
    for (const first of shuffle(Array.from({ length: n }, (_, i) => i)))
      if (walk([first], 1 << first)) break;
    const sizes = [];
    let remaining = n;
    while (remaining) {
      let size = Math.min(remaining, 2 + Math.floor(rng() * 5));
      if (remaining - size === 1) size--;
      if (sizes.length === 3) size = remaining;
      sizes.push(size);
      remaining -= size;
    }
    if (sizes.some((x) => x > 6))
      return generate(seed + 7919, w, h, difficulty);
    const tiles = [],
      solution = Array(n).fill(null);
    let cursor = 0;
    sizes.forEach((length, color) => {
      for (let value = 1; value <= length; value++) {
        let id = tiles.length;
        tiles.push({ id, color, value });
        solution[route[cursor++]] = id;
      }
    });
    const level = {
      w,
      h,
      tiles,
      fixed: [...solution],
      seed,
      generatorVersion: VERSION,
    };
    // Remove clues only when uniqueness survives; preserve a clue in every colour.
    for (const i of shuffle(Array.from({ length: n }, (_, i) => i))) {
      const old = level.fixed[i];
      if (
        level.fixed.filter(
          (id) => id !== null && tiles[id].color === tiles[old].color,
        ).length <= 1
      )
        continue;
      level.fixed[i] = null;
      if (solve(level, level.fixed, 2).length !== 1) level.fixed[i] = old;
    }
    if (difficulty === 0)
      for (const i of shuffle(Array.from({ length: n }, (_, i) => i)).slice(
        0,
        Math.max(0, n - 3),
      ))
        level.fixed[i] = solution[i];
    return { ...level, solution };
  }
  const api = {
    VERSION,
    adjacent,
    neighbors,
    validBoard,
    inspect,
    solve,
    random,
    generate,
  };
  if (typeof module !== "undefined") module.exports = api;
  root.ZarEngine = api;
})(typeof window !== "undefined" ? window : globalThis);
