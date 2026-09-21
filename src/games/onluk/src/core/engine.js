"use strict";
/** Finite, seeded sum-10 levels. Model owns gravity and column compression. */
const TenEngine = (() => {
  const COLS = 5,
    ROWS = 6,
    VERSION = 5;
  function random(s) {
    s.rng = (s.rng + 0x6d2b79f5) >>> 0;
    let n = s.rng;
    n = Math.imul(n ^ (n >>> 15), n | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  }
  function neighbors(id) {
    const a = [];
    if (id % 5) a.push(id - 1);
    if (id % 5 < 4) a.push(id + 1);
    if (id >= 5) a.push(id - 5);
    if (id < 25) a.push(id + 5);
    return a;
  }
  const evaluate = (s, chain) =>
    chain.reduce((sum, id) => sum + s.board[id], 0);
  const isTen = (n) => n === 10;
  const operator = () => "+";
  function create(seed, level = 1) {
    const s = {
      version: VERSION,
      seed: seed >>> 0,
      rng: seed >>> 0,
      level,
      board: Array(30).fill(0),
      turns: 0,
      score: 0,
      combo: 1,
      longest: 0,
      cleared: 0,
      hints: 0,
      rounds: 0,
    };
    const world = TenJourney.chapter(level);
    s.rules = { min: world.min, gravity: world.gravity, gold: !!world.gold };
    s.undos = 0;
    s.golden = [];
    s.columns = level < 3 ? 4 : 5;
    s.rows = level < 3 ? 4 : level < 9 ? 5 : 6;
    const puzzle = TenGenerator.build(s, random);
    s.board = puzzle.board;
    s.solution = puzzle.solution;
    if (world.gold)
      s.golden = s.board.flatMap((n, id) =>
        n && random(s) < 0.24 ? [id] : [],
      );
    s.turns = s.board.filter(Boolean).length;
    s.initialCount = s.turns;
    return s;
  }
  function validChain(s, chain) {
    return (
      Array.isArray(chain) &&
      chain.length >= (s.rules?.min || 2) &&
      chain.length <= 10 &&
      new Set(chain).size === chain.length &&
      chain.every(
        (id, i) =>
          Number.isInteger(id) &&
          id >= 0 &&
          id < 30 &&
          s.board[id] > 0 &&
          (!i || neighbors(chain[i - 1]).includes(id)),
      ) &&
      evaluate(s, chain) === 10
    );
  }
  function findChain(board, minimum = 2) {
    function visit(path, total) {
      if (total === 10) return path.length >= minimum ? path : null;
      for (const id of neighbors(path.at(-1)))
        if (board[id] > 0 && !path.includes(id) && total + board[id] <= 10) {
          const found = visit([...path, id], total + board[id]);
          if (found) return found;
        }
      return null;
    }
    for (let id = 0; id < 30; id++)
      if (board[id]) {
        const result = visit([id], board[id]);
        if (result) return result;
      }
    return null;
  }
  function allChains(board, minimum = 2) {
    const found = [],
      seen = new Set();
    function visit(path, total) {
      if (total === 10) {
        if (path.length >= minimum) {
          const reverse = [...path].reverse();
          const key = [path.join("-"), reverse.join("-")].sort()[0];
          if (!seen.has(key)) {
            seen.add(key);
            found.push([...path]);
          }
        }
        return;
      }
      for (const id of neighbors(path.at(-1)))
        if (board[id] > 0 && !path.includes(id) && total + board[id] <= 10)
          visit([...path, id], total + board[id]);
    }
    for (let id = 0; id < board.length; id++)
      if (board[id]) visit([id], board[id]);
    return found.sort((a, b) => b.length - a.length);
  }
  function commit(s, chain) {
    if (!validChain(s, chain)) return null;
    const before = structuredClone(s),
      removed = new Set(chain),
      columns = [];
    for (let c = 0; c < COLS; c++) {
      const column = [];
      for (let r = ROWS - 1; r >= 0; r--) {
        const id = r * COLS + c;
        if (s.board[id] && !removed.has(id))
          column.push({ value: s.board[id], id });
      }
      if (column.length) columns.push(column);
    }
    if (
      s.solution?.length &&
      s.solution[0].length === chain.length &&
      s.solution[0].every((id) => removed.has(id))
    )
      s.solution.shift();
    else s.solution = null;
    const gravity = s.rules?.gravity || "down";
    const upward =
      gravity === "up" || (gravity === "alternate" && s.rounds % 2 === 0);
    const oldGold = new Set(s.golden || []);
    const goldBonus = chain.filter((id) => oldGold.has(id)).length * 50;
    s.golden = [];
    s.board = Array(30).fill(0);
    const drops = [],
      fall = {},
      slide = {};
    columns.forEach((column, c) =>
      column.forEach((old, i) => {
        const row = upward ? column.length - 1 - i : ROWS - 1 - i,
          id = row * COLS + c;
        s.board[id] = old.value;
        if (oldGold.has(old.id)) s.golden.push(id);
        if (id !== old.id) {
          drops.push(id);
          fall[id] = row - Math.floor(old.id / 5);
          slide[id] = (old.id % 5) - c;
        }
      }),
    );
    s.combo = chain.length >= 3 ? Math.min(5, s.combo + 1) : 1;
    const points = chain.length * 10 * s.combo + goldBonus;
    s.score += points;
    s.cleared += chain.length;
    s.rounds++;
    s.longest = Math.max(s.longest, chain.length);
    s.turns = s.board.filter(Boolean).length;
    return {
      before,
      points,
      goldBonus,
      drops,
      fall,
      slide,
      won: s.turns === 0,
    };
  }
  function activeCell(s, id) {
    const row = Math.floor(id / COLS),
      upward = s.rules.gravity === "up";
    return (
      id % COLS < s.columns &&
      (upward ? row < s.rows : row >= ROWS - s.rows)
    );
  }
  function splitValue(s, total, count, maximum) {
    const values = [];
    for (let index = 0; index < count; index++) {
      const left = count - index - 1,
        low = Math.max(1, total - left * maximum),
        high = Math.min(maximum, total - left),
        value = low + Math.floor(random(s) * (high - low + 1));
      values.push(value);
      total -= value;
    }
    return values;
  }
  /** Connect fresh tiles to a surviving tile when a free-form move dead-ends.
   * The rescue itself is a legal sum-10 path, so every board stays finishable
   * without refusing the player's chosen move. */
  function addRescue(s) {
    const minimum = s.rules?.min || 2,
      maximum = s.level < 3 ? 9 : 4,
      occupied = s.board.flatMap((value, id) =>
        value && activeCell(s, id) ? [id] : [],
      );
    for (let length = minimum; length <= Math.min(10, minimum + 5); length++) {
      const additions = length - 1;
      for (const anchor of occupied) {
        const remainder = 10 - s.board[anchor];
        if (remainder < additions || remainder > additions * maximum) continue;
        const path = [anchor],
          used = new Set(path);
        function walk() {
          if (path.length === length) return [...path];
          for (const id of neighbors(path.at(-1))) {
            if (!activeCell(s, id) || s.board[id] || used.has(id)) continue;
            used.add(id);
            path.push(id);
            const found = walk();
            if (found) return found;
            path.pop();
            used.delete(id);
          }
          return null;
        }
        const rescue = walk();
        if (!rescue) continue;
        const spawned = rescue.slice(1),
          values = splitValue(s, remainder, additions, maximum);
        spawned.forEach((id, index) => (s.board[id] = values[index]));
        s.turns += spawned.length;
        s.initialCount += spawned.length;
        s.solution = [rescue];
        return { chain: rescue, spawned };
      }
    }
    return null;
  }
  function commitPlayable(state, chain) {
    const result = commit(state, chain);
    if (!result) return null;
    const rescue = state.turns && !findChain(state.board, state.rules.min)
      ? addRescue(state)
      : null;
    result.spawned = rescue?.spawned || [];
    result.rescue = rescue?.chain || null;
    result.won = state.turns === 0;
    return result;
  }
  function validState(s) {
    return (
      s?.version === VERSION &&
      Array.isArray(s.board) &&
      s.board.length === 30 &&
      s.board.every((n) => Number.isInteger(n) && n >= 0 && n <= 9) &&
      [
        "seed",
        "rng",
        "level",
        "turns",
        "score",
        "combo",
        "longest",
        "cleared",
        "hints",
        "rounds",
        "initialCount",
      ].every((k) => Number.isSafeInteger(s[k]) && s[k] >= 0) &&
      s.rules &&
      [2, 3, 4].includes(s.rules.min) &&
      ["up", "down", "alternate"].includes(s.rules.gravity) &&
      typeof s.rules.gold === "boolean" &&
      (!s.golden ||
        (Array.isArray(s.golden) &&
          s.golden.every(
            (id) =>
              Number.isInteger(id) && id >= 0 && id < 30 && s.board[id] > 0,
          ))) &&
      (s.undos === undefined ||
        (Number.isSafeInteger(s.undos) && s.undos >= 0)) &&
      [4, 5].includes(s.columns) &&
      [4, 5, 6].includes(s.rows) &&
      (s.solution === null ||
        (Array.isArray(s.solution) &&
          s.solution.length <= 15 &&
          s.solution.every(
            (group) =>
              Array.isArray(group) &&
              group.length >= 2 &&
              group.length <= 10 &&
              group.every(
                (id) => Number.isInteger(id) && id >= 0 && id < 30,
              ),
          ))) &&
      s.level >= 1 &&
      s.initialCount <= 10000 &&
      s.turns === s.board.filter(Boolean).length &&
      s.rng <= 4294967295 &&
      s.seed <= 4294967295 &&
      s.combo >= 1 &&
      s.combo <= 5
    );
  }
  return {
    COLS,
    ROWS,
    create,
    evaluate,
    isTen,
    operator,
    neighbors,
    findChain,
    allChains,
    commit,
    commitPlayable,
    addRescue,
    validState,
  };
})();
