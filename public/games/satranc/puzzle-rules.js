"use strict";
const PuzzleRules = (() => {
  const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  function material(state) {
    return state.board.reduce(
      (sum, p) =>
        sum +
        (p ? values[p.toLowerCase()] * (Chess.color(p) === "w" ? 1 : -1) : 0),
      0,
    );
  }
  function achieved(puzzle, state, log = []) {
    if (state.turn === "w" && Chess.check(state) && !Chess.legal(state).length) return false;
    if (puzzle.goal === "gain")
      return (
        material(state) - material(Chess.parse(puzzle.fen)) >= puzzle.amount
      );
    if (puzzle.goal === "promote")
      return log.some((m, i) => i % 2 === 0 && m.promotion);
    if (puzzle.goal === "castle")
      return log.some((m, i) => i % 2 === 0 && m.castle);
    return (
      state.turn === "b" &&
      Chess.check(state) &&
      Chess.legal(state).length === 0
    );
  }
  function suggest(puzzle, state, log = []) {
    const legal = Chess.legal(state);
    const finish = legal.find((m) =>
      achieved(puzzle, Chess.apply(state, m), [...log, m]),
    );
    if (finish) return finish;
    if (puzzle.goal === "promote") {
      const pawns = legal.filter((m) => state.board[m.from] === "P");
      const safe = pawns.filter(
        (m) => !Chess.attacked(Chess.apply(state, m), m.to, "b"),
      );
      if (safe.length) return safe.sort((a, b) => a.to - b.to)[0];
    }
    if (puzzle.goal === "castle") {
      const development = legal.filter(
        (m) =>
          [5, 6].includes(m.from % 8) &&
          m.from >= 56 &&
          state.board[m.from] !== "K" &&
          state.board[m.from] !== "R",
      );
      if (development.length)
        return development.sort(
          (a, b) =>
            Number(Chess.attacked(Chess.apply(state, a), a.to, "b")) -
            Number(Chess.attacked(Chess.apply(state, b), b.to, "b")),
        )[0];
    }
    return ChessAI.choose(state, 4, 160);
  }
  return { material, achieved, suggest };
})();
