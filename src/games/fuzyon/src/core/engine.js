"use strict";
const FusionEngine = (() => {
  const VERSION = 2;
  const cache = new Map();
  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, -1],
    [-1, 1],
  ];
  function geometry(state) {
    const radius = state?.radius || 2;
    if (cache.has(radius)) return cache.get(radius);
    const cells = [],
      step = 94 / (radius * 2 + 1);
    for (let r = -radius; r <= radius; r++) {
      for (
        let q = Math.max(-radius, -r - radius);
        q <= Math.min(radius, -r + radius);
        q++
      )
        cells.push({
          q,
          r,
          x: 50 + (q + r / 2) * step,
          y: 50 + r * step * 0.98,
        });
    }
    const neighbors = cells.map(({ q, r }) =>
      directions
        .map(([dq, dr]) =>
          cells.findIndex((c) => c.q === q + dq && c.r === r + dr),
        )
        .filter((i) => i >= 0),
    );
    const result = { cells, neighbors, step };
    cache.set(radius, result);
    return result;
  }
  const { cells, neighbors } = geometry({ radius: 2 });
  const number = (rank) => 2 ** rank;
  function random(state) {
    state.rng = (state.rng + 0x6d2b79f5) >>> 0;
    let n = state.rng;
    n = Math.imul(n ^ (n >>> 15), n | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  }
  function draw(state) {
    const p = random(state);
    const floor = Math.max(1, Math.min(24, state.stage - 1));
    return (
      floor + (p < 0.5 ? 0 : p < 0.85 ? 1 : state.stage > 2 && p > 0.96 ? 3 : 2)
    );
  }
  function create(seed) {
    const s = {
      version: VERSION,
      radius: 2,
      stage: 1,
      seed: seed >>> 0,
      rng: seed >>> 0,
      board: Array(19).fill(0),
      hand: [],
      queue: [],
      score: 0,
      moves: 0,
      merges: 0,
      bursts: 0,
      peak: 1,
      longest: 0,
    };
    // Opening pairs create choices without pre-cleared groups.
    s.board[0] = 1;
    s.board[1] = 1;
    s.board[15] = 2;
    s.board[18] = 2;
    s.hand = [1];
    s.queue = Array.from({ length: 3 }, () => draw(s));
    return s;
  }
  function group(board, origin, state) {
    if (!board[origin]) return [];
    const found = new Set([origin]),
      todo = [origin];
    while (todo.length) {
      for (const id of geometry(state).neighbors[todo.pop()]) {
        if (!found.has(id) && board[id] === board[origin]) {
          found.add(id);
          todo.push(id);
        }
      }
    }
    return [...found];
  }
  function resolve(board, origin, state) {
    const frames = [];
    let depth = 0,
      score = 0;
    while (board[origin]) {
      const ids = group(board, origin, state),
        value = board[origin];
      if (ids.length < 3) break;
      depth++;
      const before = [...board];
      let cleared = ids;
      const burst = value >= 30;
      if (burst)
        cleared = [
          ...new Set(
            ids.flatMap((id) => [id, ...geometry(state).neighbors[id]]),
          ),
        ].filter((id) => board[id]);
      cleared.forEach((id) => (board[id] = 0));
      if (!burst) board[origin] = value + 1;
      const points =
        ids.length * number(value) * 10 * depth +
        (burst ? cleared.length * 30 : 0);
      score += points;
      frames.push({
        before,
        after: [...board],
        ids,
        cleared,
        origin,
        value,
        burst,
        points,
        depth,
      });
      if (burst) break;
    }
    return { frames, score };
  }
  function preview(s, origin, slot) {
    if (
      !Number.isInteger(origin) ||
      origin < 0 ||
      origin >= s.board.length ||
      s.board[origin] ||
      slot !== 0
    )
      return null;
    const board = [...s.board];
    board[origin] = s.hand[slot];
    return resolve(board, origin, s);
  }
  function occasionalTile(s) {
    // Only check every seventh move: seeded, replayable and never back-to-back.
    if (s.radius < 3 || s.moves % 7 !== 0 || s.score >= stageGoal(s.stage))
      return null;
    const empty = s.board.flatMap((value, id) => (value === 0 ? [id] : []));
    if (empty.length < 5 || random(s) >= (s.radius === 3 ? 0.5 : 0.7))
      return null;
    const value =
      Math.max(1, Math.min(24, s.stage - 1)) + (random(s) < 0.75 ? 0 : 1);
    // Avoid creating an unresolved match or awarding automatic merge points.
    const eligible = empty.filter((id) => {
      const board = [...s.board];
      board[id] = value;
      return group(board, id, s).length < 3;
    });
    if (!eligible.length) return null;
    const id = eligible[Math.floor(random(s) * eligible.length)];
    s.board[id] = value;
    s.peak = Math.max(s.peak, value);
    return { id, value };
  }
  function place(s, origin, slot) {
    if (
      !Number.isInteger(origin) ||
      origin < 0 ||
      origin >= s.board.length ||
      s.board[origin] ||
      slot !== 0
    )
      return null;
    const value = s.hand[slot];
    s.board[origin] = value;
    const placed = [...s.board],
      result = resolve(s.board, origin, s);
    s.score += result.score + 5;
    s.moves++;
    s.merges += result.frames.length;
    s.bursts += result.frames.filter((f) => f.burst).length;
    s.peak = Math.max(s.peak, ...s.board, value);
    s.longest = Math.max(s.longest, result.frames.length);
    const spawned = occasionalTile(s);
    s.hand[slot] = s.queue.shift();
    s.queue.push(draw(s));
    return {
      ...result,
      placed,
      value,
      origin,
      spawned,
      gameOver: !s.board.includes(0),
    };
  }
  function tutorial() {
    const s = create(44);
    s.board.fill(0);
    s.board[8] = 1;
    s.board[10] = 1;
    s.board[4] = 2;
    s.board[5] = 2;
    s.hand = [1];
    return s;
  }
  // Cumulative targets keep progress deterministic across saves and undo.
  const stageGoal = (stage) => 600 * (2 ** stage - 1);
  function progress(s, score = s.score) {
    const start = stageGoal(s.stage - 1),
      end = stageGoal(s.stage);
    return {
      start,
      end,
      ratio: Math.max(0, Math.min(1, (score - start) / (end - start))),
    };
  }
  function advance(s) {
    if (s.score < stageGoal(s.stage) || s.stage >= 27) return false;
    s.stage++;
    const old = geometry(s).cells,
      previous = s.board;
    s.radius = Math.min(4, s.stage + 1);
    s.board = geometry(s).cells.map((cell) => {
      const id = old.findIndex((c) => c.q === cell.q && c.r === cell.r);
      return id < 0 ? 0 : previous[id];
    });
    // Retired values can no longer be matched by future draws; free that space.
    const floor = Math.max(1, Math.min(24, s.stage - 1));
    s.board = s.board.map((value) => (value < floor ? 0 : value));
    return true;
  }
  function valid(s) {
    return (
      s?.version === VERSION &&
      Number.isInteger(s.stage) &&
      s.stage >= 1 &&
      s.stage <= 27 &&
      s.radius === Math.min(4, s.stage + 1) &&
      Array.isArray(s.board) &&
      s.board.length === geometry(s).cells.length &&
      s.board.every((n) => Number.isInteger(n) && n >= 0 && n <= 30) &&
      ["hand", "queue"].every(
        (k) =>
          Array.isArray(s[k]) &&
          s[k].length === (k === "hand" ? 1 : 3) &&
          s[k].every((n) => Number.isInteger(n) && n >= 1 && n <= 30),
      ) &&
      [
        "seed",
        "rng",
        "score",
        "moves",
        "merges",
        "bursts",
        "peak",
        "longest",
      ].every((k) => Number.isSafeInteger(s[k]) && s[k] >= 0) &&
      s.rng <= 4294967295 &&
      s.seed <= 4294967295 &&
      s.peak <= 30 &&
      s.longest <= 30
    );
  }
  function migrate(old) {
    if (valid(old)) return old;
    if (
      old?.version !== 1 ||
      !Array.isArray(old.board) ||
      old.board.length !== 19
    )
      return null;
    const s = {
      ...old,
      version: VERSION,
      stage: 1,
      radius: 2,
      hand: old.hand?.slice(0, 1),
    };
    return valid(s) ? s : null;
  }
  return {
    cells,
    neighbors,
    geometry,
    progress,
    stageGoal,
    number,
    create,
    tutorial,
    group,
    preview,
    place,
    advance,
    valid,
    migrate,
  };
})();
