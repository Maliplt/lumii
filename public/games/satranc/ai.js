"use strict";
const ChessAI = (() => {
  const values = { p: 100, n: 320, b: 335, r: 500, q: 900, k: 0 };
  function evaluate(s) {
    let score = 0;
    const heavy = s.board.reduce(
      (sum, p) => sum + (p && ["r", "q"].includes(p.toLowerCase()) ? 1 : 0),
      0,
    );
    for (let i = 0; i < 64; i++) {
      const p = s.board[i];
      if (!p) continue;
      const side = Chess.color(p),
        t = p.toLowerCase(),
        r = side === "w" ? 7 - Math.floor(i / 8) : Math.floor(i / 8),
        c = i % 8;
      const center = 7 - Math.abs(c - 3.5) - Math.abs(r - 3.5);
      let bonus =
        t === "p"
          ? r * 9 - Math.abs(c - 3.5) * 3
          : t === "n"
            ? center * 13
            : t === "b"
              ? center * 7
              : t === "r"
                ? r * 3
                : t === "q"
                  ? center * 2
                  : heavy
                    ? r === 0 && [2, 6].includes(c)
                      ? 45
                      : -r * 12
                    : center * 12;
      score += (values[t] + bonus) * (side === s.turn ? 1 : -1);
    }
    return score;
  }
  function choose(s, level = 2, budget) {
    const opponent =
      typeof ChessOpponents === "undefined" ? null : ChessOpponents[level - 1];
    const style = opponent?.style || "balanced";
    level = opponent?.strength || Math.max(1, Math.min(5, level));
    function preference(m) {
      const next = Chess.apply(s, m),
        piece = s.board[m.from].toLowerCase();
      const center =
        7 - Math.abs((m.to % 8) - 3.5) - Math.abs(Math.floor(m.to / 8) - 3.5);
      if (style === "attacking") {
        const king = next.board.indexOf(s.turn === "w" ? "k" : "K");
        const proximity =
          14 -
          Math.abs((king % 8) - (m.to % 8)) -
          Math.abs(Math.floor(king / 8) - Math.floor(m.to / 8));
        return (
          (Chess.check(next) ? 22 : 0) +
          (s.board[m.to] || m.ep ? 12 : 0) +
          proximity * 2
        );
      }
      if (style === "positional")
        return (
          center * (piece === "n" || piece === "b" ? 5 : 2) +
          (m.castle ? 18 : 0)
        );
      if (style === "defensive")
        return (
          (m.castle ? 40 : 0) +
          (Chess.attacked(next, m.to, next.turn) ? -18 : 10) +
          (piece === "k" && !m.castle ? -10 : 0)
        );
      return 0;
    }
    const limits = [0, 1, 2, 3, 4, 5],
      deadline = Date.now() + (budget ?? [0, 80, 180, 450, 900, 1700][level]),
      cache = new Map();
    let nodes = 0;
    const order = (state, m) =>
      (m.promotion ? 800 : 0) +
      (state.board[m.to]
        ? 10 * values[state.board[m.to].toLowerCase()] -
          values[state.board[m.from].toLowerCase()]
        : m.ep
          ? 900
          : 0) +
      (m.castle ? 60 : 0);
    function search(state, depth, alpha, beta, ply) {
      if ((++nodes & 255) === 0 && Date.now() > deadline)
        throw Error("timeout");
      const moves = Chess.legal(state);
      if (!moves.length) return Chess.check(state) ? -100000 + ply : 0;
      if (Chess.dead(state) || state.half >= 100) return 0;
      if (depth <= 0) {
        let stand = evaluate(state);
        if (ply > 9) return stand;
        if (!Chess.check(state)) {
          if (stand >= beta) return beta;
          alpha = Math.max(alpha, stand);
        }
        const captures = Chess.check(state)
          ? moves
          : moves.filter((m) => state.board[m.to] || m.ep || m.promotion);
        for (const m of captures.sort(
          (a, b) => order(state, b) - order(state, a),
        )) {
          const score = -search(
            Chess.apply(state, m),
            depth - 1,
            -beta,
            -alpha,
            ply + 1,
          );
          if (score >= beta) return beta;
          alpha = Math.max(alpha, score);
        }
        return alpha;
      }
      const k = Chess.fen(state),
        entry = cache.get(k),
        oldAlpha = alpha;
      if (entry && entry.depth >= depth) {
        if (entry.type === "exact") return entry.score;
        if (entry.type === "lower") alpha = Math.max(alpha, entry.score);
        else beta = Math.min(beta, entry.score);
        if (alpha >= beta) return entry.score;
      }
      let best = -Infinity;
      moves.sort((a, b) => order(state, b) - order(state, a));
      for (const m of moves) {
        const score = -search(
          Chess.apply(state, m),
          depth - 1,
          -beta,
          -alpha,
          ply + 1,
        );
        best = Math.max(best, score);
        alpha = Math.max(alpha, score);
        if (alpha >= beta) break;
      }
      cache.set(k, {
        depth,
        score: best,
        type: best <= oldAlpha ? "upper" : best >= beta ? "lower" : "exact",
      });
      return best;
    }
    const moves = Chess.legal(s);
    if (!moves.length) return null;
    let ranked = moves
      .map((m) => ({ m, score: evaluate(Chess.apply(s, m)) * -1 }))
      .sort((a, b) => b.score - a.score);
    for (let depth = 1; depth <= limits[level]; depth++) {
      try {
        const next = [];
        for (const { m } of ranked)
          next.push({
            m,
            score: -search(
              Chess.apply(s, m),
              depth - 1,
              -Infinity,
              Infinity,
              1,
            ),
          });
        ranked = next.sort((a, b) => b.score - a.score);
      } catch {
        break;
      }
    }
    if (Math.abs(ranked[0].score) < 90000) {
      const best = ranked[0].score;
      ranked = ranked
        .map((entry) => ({
          ...entry,
          choice:
            entry.score + (entry.score >= best - 55 ? preference(entry.m) : 0),
        }))
        .sort((a, b) => b.choice - a.choice);
    }
    if (level === 1) {
      const pool = ranked
        .filter((x) => x.score >= ranked[0].score - 180)
        .slice(0, 6);
      return pool[Math.floor(Math.random() * pool.length)].m;
    }
    if (level === 2) {
      const pool = ranked
        .filter((x) => x.score >= ranked[0].score - 45)
        .slice(0, 3);
      return pool[Math.floor(Math.random() * pool.length)].m;
    }
    return ranked[0].m;
  }
  return { choose, evaluate };
})();
if (typeof module !== "undefined") module.exports = ChessAI;
