const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");
const context = vm.createContext({ structuredClone });
for (const file of ["journey", "generator", "engine"])
  vm.runInContext(
    fs.readFileSync(path.join(__dirname, "../src/core", file + ".js"), "utf8"),
    context,
  );
const engine = vm.runInContext("TenEngine", context);
const journey = vm.runInContext("TenJourney", context);
test("after the two introductory levels, no two-tile solution exists anywhere", () => {
  let bent = 0,
    chains = 0;
  for (let level = 3; level <= 40; level++)
    for (let seed = 1; seed <= 20; seed++) {
      const state = engine.create(seed, level);
      assert.ok(state.board.every((n) => n <= 4));
      for (const group of state.solution) {
        chains++;
        if (
          new Set(group.map((id) => id % 5)).size > 1 &&
          new Set(group.map((id) => Math.floor(id / 5))).size > 1
        )
          bent++;
      }
    }
  assert.ok(bent / chains > 0.35, `Bent chain ratio: ${bent / chains}`);
});
function canonicalMove(state) {
  return state.solution?.[0] ? [...state.solution[0]] : null;
}

test("all 250 levels have complete legal solutions across 4,000 boards", () => {
  for (let level = 1; level <= 250; level++)
    for (let seed = 1; seed <= 16; seed++) {
      const state = engine.create(seed, level);
      assert.ok(engine.validState(state));
      let steps = 0;
      while (state.turns) {
        const move = canonicalMove(state);
        assert.ok(move, `level ${level}, seed ${seed}`);
        const before = state.turns,
          result = engine.commitPlayable(state, move);
        assert.ok(result);
        assert.equal(state.turns, before - move.length);
        assert.ok(engine.validState(state));
        assert.ok(++steps <= 15);
      }
      assert.equal(journey.stars(state), 3);
    }
});
test("every legal player route is accepted and always leaves another move", () => {
  for (let level = 3; level <= 48; level += 5) {
    const state = engine.create(level * 91, level),
      moves = engine.allChains(state.board, state.rules.min).slice(0, 12);
    assert.ok(moves.length);
    for (const move of moves) {
      const candidate = structuredClone(state),
        beforeTurns = candidate.turns,
        result = engine.commitPlayable(candidate, move);
      assert.ok(result);
      assert.ok(candidate.turns < beforeTurns);
      assert.ok(
        candidate.turns === 0 ||
          engine.findChain(candidate.board, candidate.rules.min),
      );
    }
    const canonical = structuredClone(state),
      result = engine.commitPlayable(canonical, canonical.solution[0]);
    assert.ok(result);
  }
});
test("a dead end adds a legal rescue route through a surviving tile", () => {
  const state = engine.create(17, 25);
  state.board.fill(0);
  state.board[21] = 3;
  state.board[25] = 4;
  state.board[26] = 3;
  state.board[29] = 4;
  state.turns = state.initialCount = 4;
  state.solution = null;
  state.golden = [];
  const result = engine.commitPlayable(state, [25, 26, 21]);
  assert.ok(result);
  assert.equal(result.spawned.length, 2);
  assert.equal(state.turns, 3);
  assert.ok(engine.findChain(state.board, state.rules.min));
  assert.ok(engine.validState(state));
});
test("repeated cells, gaps, invalid sums, and short crystal chains do not mutate state", () => {
  const state = engine.create(19, 25),
    snapshot = JSON.stringify(state);
  for (const move of [[0, 0], [0, 29], [-1, 0], [1.5, 2], [0], [100, 101]])
    assert.equal(engine.commit(state, move), null);
  assert.equal(JSON.stringify(state), snapshot);
  state.board = Array(30).fill(0);
  state.board[25] = 4;
  state.board[26] = 6;
  assert.equal(engine.commit(state, [25, 26]), null);
  assert.equal(engine.findChain(state.board, 3), null);
});
test("gold rewards exactly 50 per collected tile and follows gravity", () => {
  const state = engine.create(44, 17),
    move = canonicalMove(state);
  state.golden = [move[0]];
  const result = engine.commit(state, move);
  assert.equal(result.goldBonus, 50);
  assert.equal(result.points, move.length * 10 * state.combo + 50);
  assert.equal(state.golden.length, 0);
});
test("seeded generation is repeatable and undo snapshot owns independent arrays", () => {
  const a = engine.create(8, 33),
    b = engine.create(8, 33);
  assert.equal(JSON.stringify(a), JSON.stringify(b));
  const previous = JSON.stringify(a),
    result = engine.commit(a, canonicalMove(a));
  assert.equal(JSON.stringify(result.before), previous);
  assert.notEqual(a.board, result.before.board);
});
test("star conditions and damaged save rejection", () => {
  const state = engine.create(1);
  state.board.fill(0);
  state.turns = 0;
  assert.equal(journey.stars(state), 3);
  state.hints = 1;
  assert.equal(journey.stars(state), 2);
  state.undos = 1;
  assert.equal(journey.stars(state), 1);
  state.rules.min = 99;
  assert.equal(engine.validState(state), false);
  state.rules.min = 2;
  state.golden = [31];
  assert.equal(engine.validState(state), false);
});
