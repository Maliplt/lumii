"use strict";
const ColorSort = (() => {
  const capacity = 4;
  const clone = (tubes) => tubes.map((tube) => [...tube]);
  const top = (tube) => tube.at(-1);
  const complete = (tube) =>
    tube.length === capacity && tube.every((color) => color === tube[0]);
  const solved = (tubes) =>
    tubes.every((tube) => !tube.length || complete(tube));
  function run(tube) {
    let count = 0;
    for (let i = tube.length - 1; i >= 0 && tube[i] === top(tube); i--) count++;
    return count;
  }
  function amount(tubes, from, to) {
    if (
      from === to ||
      !tubes[from]?.length ||
      !tubes[to] ||
      tubes[to].length === capacity
    )
      return 0;
    if (tubes[to].length && top(tubes[to]) !== top(tubes[from])) return 0;
    return Math.min(run(tubes[from]), capacity - tubes[to].length);
  }
  function pour(tubes, from, to) {
    const count = amount(tubes, from, to);
    if (!count) return null;
    const next = clone(tubes);
    next[to].push(...next[from].splice(-count));
    return { tubes: next, count, color: top(tubes[from]), from, to };
  }
  const key = (tubes) =>
    tubes
      .map((tube) => tube.join(""))
      .sort()
      .join("|");
  function moves(tubes) {
    const result = [];
    for (let from = 0; from < tubes.length; from++) {
      if (!tubes[from].length || complete(tubes[from])) continue;
      let emptyUsed = false;
      for (let to = 0; to < tubes.length; to++) {
        if (!amount(tubes, from, to)) continue;
        if (!tubes[to].length) {
          if (emptyUsed || run(tubes[from]) === tubes[from].length) continue;
          emptyUsed = true;
        }
        result.push([from, to]);
      }
    }
    return result.sort((a, b) => tubes[b[1]].length - tubes[a[1]].length);
  }
  function solve(tubes, limit = 50000) {
    const seen = new Set();
    let visited = 0;
    function visit(state, depth = 0) {
      if (solved(state)) return [];
      if (++visited > limit || depth > 160) return null;
      const hash = key(state);
      if (seen.has(hash)) return null;
      seen.add(hash);
      for (const [from, to] of moves(state)) {
        const result = visit(pour(state, from, to).tubes, depth + 1);
        if (result) return [[from, to], ...result];
      }
      return null;
    }
    return visit(tubes);
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
  function settings(level) {
    if (level <= 3)
      return { colors: level === 1 ? 2 : 3, depth: 6 + level * 4 };
    if (level % 10 === 1) return { colors: 3, depth: 18 };
    return {
      colors: Math.min(
        6,
        3 + Math.floor(level / 7) + (level % 10 === 0 ? 1 : 0),
      ),
      depth: 25 + Math.min(60, level * 2),
    };
  }
  const cache = new Map();
  function level(number) {
    if (cache.has(number)) return cache.get(number);
    const { colors, depth } = settings(number);
    const rng = random(number * 7919 + 62851);
    let best;
    for (let trial = 0; trial < 18; trial++) {
      const tubes = Array.from({ length: colors }, (_, i) =>
        Array(capacity).fill(i),
      );
      tubes.push([], []);
      const reverse = [],
        seen = new Set([key(tubes)]);
      for (let step = 0; step < depth; step++) {
        const choices = [];
        for (let from = 0; from < tubes.length; from++) {
          const streak = run(tubes[from]);
          for (let to = 0; to < tubes.length; to++) {
            if (
              from === to ||
              tubes[to].length === capacity ||
              top(tubes[to]) === top(tubes[from])
            )
              continue;
            for (
              let count = 1;
              count <= Math.min(streak, capacity - tubes[to].length);
              count++
            ) {
              if (count === streak && count !== tubes[from].length) continue;
              const next = clone(tubes);
              next[to].push(...next[from].splice(-count));
              if (seen.has(key(next))) continue;
              choices.push({ from, to, count, next });
            }
          }
        }
        if (!choices.length) break;
        const pick = choices[Math.floor(rng() * choices.length)];
        tubes.splice(0, tubes.length, ...pick.next);
        seen.add(key(tubes));
        reverse.unshift([pick.to, pick.from]);
        const mixed = tubes.reduce(
          (sum, tube) =>
            sum + tube.filter((color, i) => i && color !== tube[i - 1]).length,
          0,
        );
        const merit =
          mixed * 20 +
          tubes.filter((tube) => !tube.length).length * 8 -
          tubes.filter(complete).length * 10;
        if (!solved(tubes) && (!best || merit > best.merit))
          best = { tubes: clone(tubes), solution: [...reverse], merit };
      }
    }
    const result = {
      number,
      colors,
      tubes: best.tubes,
      solution: best.solution,
      revision: 1,
    };
    if (cache.size > 30) cache.delete(cache.keys().next().value);
    cache.set(number, result);
    return result;
  }
  function tutorial() {
    return {
      number: 0,
      colors: 2,
      tubes: [
        [0, 0, 1, 1],
        [1, 1],
        [0, 0],
      ],
      solution: [
        [0, 1],
        [0, 2],
      ],
    };
  }
  return {
    capacity,
    clone,
    top,
    complete,
    solved,
    run,
    amount,
    pour,
    moves,
    solve,
    level,
    tutorial,
    settings,
  };
})();
if (typeof module !== "undefined") module.exports = ColorSort;
