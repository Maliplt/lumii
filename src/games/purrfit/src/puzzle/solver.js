"use strict";
// rules of the window and an exact solver
(function (V) {
  const KINDS = ["number", "square", "wide", "tall", "any"];
  const ANY_MAX = 12;

  // whether a w×h rectangle satisfies a clue
  function fits(clue, w, h) {
    const area = w * h;
    if (clue.kind === "any") return area >= 2 && area <= ANY_MAX;
    if (area !== clue.value) return false;
    if (clue.kind === "square") return w === h;
    if (clue.kind === "wide") return w > h;
    if (clue.kind === "tall") return h > w;
    return true;
  }

  function cellsOf(rect, width) {
    const cells = [];
    for (let y = rect.y; y < rect.y + rect.h; y++) for (let x = rect.x; x < rect.x + rect.w; x++) cells.push(y * width + x);
    return cells;
  }

  // which clue sits in each cell (-1 for none)
  function clueMap(puzzle) {
    const map = new Int16Array(puzzle.w * puzzle.h).fill(-1);
    puzzle.clues.forEach((clue, i) => (map[clue.index] = i));
    return map;
  }

  // every rectangle each clue could take, ignoring the other rectangles
  function candidates(puzzle) {
    const { w: W, h: H, clues } = puzzle;
    const owner = clueMap(puzzle);
    return clues.map((clue, i) => {
      const cx = clue.index % W;
      const cy = Math.floor(clue.index / W);
      const areas = clue.kind === "any" ? Array.from({ length: ANY_MAX - 1 }, (_, k) => k + 2) : [clue.value];
      const list = [];
      for (const area of areas) {
        for (let rw = 1; rw <= Math.min(W, area); rw++) {
          if (area % rw) continue;
          const rh = area / rw;
          if (rh > H || !fits(clue, rw, rh)) continue;
          for (let x = Math.max(0, cx - rw + 1); x <= Math.min(cx, W - rw); x++) {
            for (let y = Math.max(0, cy - rh + 1); y <= Math.min(cy, H - rh); y++) {
              const rect = { x, y, w: rw, h: rh };
              const cells = cellsOf(rect, W);
              if (cells.every((c) => owner[c] === -1 || owner[c] === i)) list.push({ ...rect, cells, clue: i });
            }
          }
        }
      }
      return list;
    });
  }

  // counts solutions up to `limit` and returns the ones it found
  function solve(puzzle, { limit = 2, cands = candidates(puzzle), fixed = null } = {}) {
    const size = puzzle.w * puzzle.h;
    const byCell = Array.from({ length: size }, () => []);
    cands.forEach((list) => list.forEach((rect) => rect.cells.forEach((c) => byCell[c].push(rect))));
    const covered = new Uint8Array(size);
    const used = new Uint8Array(puzzle.clues.length);
    const chosen = new Array(puzzle.clues.length).fill(null);
    const solutions = [];
    let nodes = 0;
    const free = (rect) => !used[rect.clue] && rect.cells.every((c) => !covered[c]);
    const take = (rect, on) => {
      rect.cells.forEach((c) => (covered[c] = on));
      used[rect.clue] = on;
      chosen[rect.clue] = on ? rect : null;
    };

    if (fixed) {
      for (const rect of fixed) {
        if (!free(rect)) return { count: 0, solutions, nodes };
        take(rect, 1);
      }
    }

    (function search() {
      if (solutions.length >= limit) return;
      nodes++;
      let best = null;
      let bestOptions = null;
      for (let c = 0; c < size; c++) {
        if (covered[c]) continue;
        const options = byCell[c].filter(free);
        if (!options.length) return;
        if (!bestOptions || options.length < bestOptions.length) {
          best = c;
          bestOptions = options;
          if (options.length === 1) break;
        }
      }
      if (best === null) {
        if (used.every(Boolean)) solutions.push(chosen.slice());
        return;
      }
      for (const rect of bestOptions) {
        take(rect, 1);
        search();
        take(rect, 0);
        if (solutions.length >= limit) return;
      }
    })();
    return { count: solutions.length, solutions, nodes };
  }

  // checks one placed rectangle against the clues it covers
  function judge(puzzle, rect, owner = clueMap(puzzle)) {
    const inside = cellsOf(rect, puzzle.w).map((c) => owner[c]).filter((i) => i >= 0);
    if (inside.length !== 1) return { ok: false, clue: inside.length ? inside[0] : -1, reason: inside.length ? "many" : "none" };
    const clue = puzzle.clues[inside[0]];
    return { ok: fits(clue, rect.w, rect.h), clue: inside[0], reason: fits(clue, rect.w, rect.h) ? null : "shape" };
  }

  V.Rules = { KINDS, ANY_MAX, fits, cellsOf, clueMap, judge };
  V.Solver = { candidates, solve };
})(window.Purrfit);
