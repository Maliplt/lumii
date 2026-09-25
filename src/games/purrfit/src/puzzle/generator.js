"use strict";
// builds a window with exactly one solution
(function (V) {
  const { fits, cellsOf } = V.Rules;

  // cuts a w×h grid into rectangles, filling it from the top-left
  function partition(rng, W, H, { mean, spread, maxArea, maxSide, squares = 0 }) {
    const owner = new Int16Array(W * H).fill(-1);
    const rects = [];
    for (let index = 0; index < W * H; index++) {
      if (owner[index] >= 0) continue;
      const x = index % W;
      const y = Math.floor(index / W);
      let run = 0;
      while (x + run < W && owner[y * W + x + run] < 0) run++;
      const options = [];
      for (let rw = 1; rw <= Math.min(run, maxSide); rw++) {
        for (let rh = 1; rh <= Math.min(H - y, maxSide); rh++) {
          const area = rw * rh;
          if (area > maxArea) break;
          let open = true;
          for (let dx = 0; dx < rw && open; dx++) if (owner[(y + rh - 1) * W + x + dx] >= 0) open = false;
          if (!open) break;
          if (area < 2) continue;
          const aspect = Math.max(rw, rh) / Math.min(rw, rh);
          const weight = (Math.exp(-((area - mean) ** 2) / (2 * spread * spread)) / (aspect > 4 ? 3 : 1)) * (rw === rh && area >= 4 ? 1 + squares : 1);
          options.push({ rw, rh, weight });
        }
      }
      if (!options.length) return null;
      let roll = rng.next() * options.reduce((sum, o) => sum + o.weight, 0);
      const pick = options.find((o) => (roll -= o.weight) <= 0) || options[options.length - 1];
      const rect = { x, y, w: pick.rw, h: pick.rh };
      cellsOf(rect, W).forEach((c) => (owner[c] = rects.length));
      rects.push(rect);
    }
    return rects;
  }

  // the kind of clue a rectangle gets, from the chapter's mix
  function kindFor(rng, rect, mix) {
    const area = rect.w * rect.h;
    if (mix.square && rect.w === rect.h && area >= 4 && rng.chance(mix.square)) return "square";
    if (mix.shape && rect.w !== rect.h && rng.chance(mix.shape)) return rect.w > rect.h ? "wide" : "tall";
    if (mix.any && area <= V.Rules.ANY_MAX && rng.chance(mix.any)) return "any";
    return "number";
  }

  function build(W, H, rects, kinds, spots) {
    const clues = rects.map((rect, i) => ({
      index: (rect.y + Math.floor(spots[i] / rect.w)) * W + rect.x + (spots[i] % rect.w),
      kind: kinds[i],
      value: kinds[i] === "any" ? null : rect.w * rect.h,
    }));
    return { w: W, h: H, clues, solution: rects.map((rect, i) => ({ ...rect, clue: i })) };
  }

  const sameRect = (a, b) => a && b && a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;

  // spec: { w, h, mean, spread, maxArea, maxSide, mix
  function generate(seed, spec) {
    const rng = new V.Random(seed);
    const { w: W, h: H } = spec;
    let best = null;
    for (let attempt = 0, found = 0; attempt < 80 && found < (spec.target ? 6 : 1); attempt++) {
      const rects = partition(rng, W, H, spec);
      if (!rects) continue;
      const kinds = rects.map((rect) => kindFor(rng, rect, spec.mix || {}));
      const spots = rects.map((rect) => rng.int(0, rect.w * rect.h - 1));
      let puzzle = build(W, H, rects, kinds, spots);
      let result = V.Solver.solve(puzzle, { limit: 2 });
      for (let step = 0; step < 90 && result.count > 1; step++) {
        const other = result.solutions.find((solution) => solution.some((rect, i) => !sameRect(rect, puzzle.solution[i])));
        const suspects = puzzle.solution.map((rect, i) => i).filter((i) => !sameRect(other[i], puzzle.solution[i]));
        const i = rng.pick(suspects);
        // a "?" that causes trouble becomes a plain number; otherwise the clue moves
        if (kinds[i] === "any" && rng.chance(0.5)) kinds[i] = "number";
        else if ((kinds[i] === "wide" || kinds[i] === "tall" || kinds[i] === "square") && rng.chance(0.25)) kinds[i] = "number";
        else {
          const area = rects[i].w * rects[i].h;
          if (area > 1) spots[i] = (spots[i] + rng.int(1, area - 1)) % area;
        }
        puzzle = build(W, H, rects, kinds, spots);
        result = V.Solver.solve(puzzle, { limit: 2 });
      }
      if (result.count !== 1) continue;
      if (!spec.target) return { ...puzzle, seed };
      // harden: move clues about while the solution stays unique
      let score = V.Grader.grade(puzzle);
      for (let step = 0; step < (spec.harden || 90) && score < spec.target; step++) {
        const i = rng.int(0, rects.length - 1);
        const area = rects[i].w * rects[i].h;
        const before = [kinds[i], spots[i]];
        spots[i] = rng.int(0, area - 1);
        if (spec.mix?.any && area <= V.Rules.ANY_MAX && rng.chance(spec.mix.any * 0.3)) kinds[i] = "any";
        const next = build(W, H, rects, kinds, spots);
        if (V.Solver.solve(next, { limit: 2 }).count === 1) {
          const nextScore = V.Grader.grade(next);
          if (nextScore >= score) {
            puzzle = next;
            score = nextScore;
            continue;
          }
        }
        [kinds[i], spots[i]] = before;
      }
      found++;
      if (!best || score > best.score) best = { ...puzzle, seed, score };
      if (score >= spec.target) break;
    }
    if (best) return best;
    throw new Error(`No unique window for ${seed}`);
  }

  V.Generator = { generate, partition, fits };
})(window.Purrfit);
