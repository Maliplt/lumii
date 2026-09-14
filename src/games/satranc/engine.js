"use strict";
const Chess = (() => {
  const initial = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const knight = [
    [1, 2],
    [2, 1],
    [-1, 2],
    [-2, 1],
    [1, -2],
    [2, -1],
    [-1, -2],
    [-2, -1],
  ];
  const diagonal = [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ],
    straight = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
  const color = (p) => (p ? (p === p.toUpperCase() ? "w" : "b") : null);
  const opposite = (c) => (c === "w" ? "b" : "w");
  const square = (i) => "abcdefgh"[i % 8] + (8 - Math.floor(i / 8));
  const index = (s) => (8 - Number(s[1])) * 8 + "abcdefgh".indexOf(s[0]);
  function parse(fen = initial) {
    const [rows, turn, rights, ep, half, full] = fen.split(" "),
      board = [];
    for (const c of rows.replaceAll("/", "")) {
      if (/\d/.test(c)) board.push(...Array(Number(c)).fill(null));
      else board.push(c);
    }
    if (
      board.length !== 64 ||
      !["w", "b"].includes(turn) ||
      board.filter((p) => p === "K").length !== 1 ||
      board.filter((p) => p === "k").length !== 1
    )
      throw Error("Invalid position");
    return {
      board,
      turn,
      rights: rights === "-" ? "" : rights,
      ep: ep === "-" ? -1 : index(ep),
      half: Number(half) || 0,
      full: Number(full) || 1,
    };
  }
  function fen(s) {
    const rows = [];
    for (let r = 0; r < 8; r++) {
      let row = "",
        empty = 0;
      for (let c = 0; c < 8; c++) {
        const p = s.board[r * 8 + c];
        if (!p) empty++;
        else {
          if (empty) row += empty;
          empty = 0;
          row += p;
        }
      }
      if (empty) row += empty;
      rows.push(row);
    }
    return `${rows.join("/")} ${s.turn} ${s.rights || "-"} ${s.ep < 0 ? "-" : square(s.ep)} ${s.half} ${s.full}`;
  }
  function attacked(s, target, by) {
    const tr = Math.floor(target / 8),
      tc = target % 8;
    for (let i = 0; i < 64; i++) {
      const p = s.board[i];
      if (color(p) !== by) continue;
      const r = Math.floor(i / 8),
        c = i % 8,
        dr = tr - r,
        dc = tc - c,
        t = p.toLowerCase();
      if (t === "p" && dr === (by === "w" ? -1 : 1) && Math.abs(dc) === 1)
        return true;
      if (t === "n" && Math.abs(dr) * Math.abs(dc) === 2) return true;
      if (t === "k" && Math.max(Math.abs(dr), Math.abs(dc)) === 1) return true;
      if (
        ((t === "b" || t === "q") &&
          Math.abs(dr) === Math.abs(dc) &&
          dr !== 0) ||
        ((t === "r" || t === "q") && (dr === 0) !== (dc === 0))
      ) {
        let rr = r + Math.sign(dr),
          cc = c + Math.sign(dc),
          clear = true;
        while (rr !== tr || cc !== tc) {
          if (s.board[rr * 8 + cc]) {
            clear = false;
            break;
          }
          rr += Math.sign(dr);
          cc += Math.sign(dc);
        }
        if (clear) return true;
      }
    }
    return false;
  }
  const check = (s, c = s.turn) =>
    attacked(s, s.board.indexOf(c === "w" ? "K" : "k"), opposite(c));
  function pseudo(s) {
    const moves = [],
      us = s.turn;
    function add(from, to, extra = {}) {
      if (s.board[to]?.toLowerCase() === "k") return;
      if (
        s.board[from].toLowerCase() === "p" &&
        [0, 7].includes(Math.floor(to / 8))
      )
        for (const promotion of ["q", "r", "b", "n"])
          moves.push({ from, to, ...extra, promotion });
      else moves.push({ from, to, ...extra });
    }
    for (let i = 0; i < 64; i++) {
      const p = s.board[i];
      if (color(p) !== us) continue;
      const t = p.toLowerCase(),
        r = Math.floor(i / 8),
        c = i % 8;
      if (t === "p") {
        const d = us === "w" ? -1 : 1,
          rr = r + d;
        if (rr < 0 || rr > 7) continue;
        if (!s.board[rr * 8 + c]) {
          add(i, rr * 8 + c);
          if (r === (us === "w" ? 6 : 1) && !s.board[(r + 2 * d) * 8 + c])
            add(i, (r + 2 * d) * 8 + c);
        }
        for (const cc of [c - 1, c + 1])
          if (cc >= 0 && cc < 8) {
            const to = rr * 8 + cc;
            if (color(s.board[to]) === opposite(us)) add(i, to);
            else if (
              to === s.ep &&
              s.board[r * 8 + cc] === (us === "w" ? "p" : "P")
            )
              add(i, to, { ep: true });
          }
      } else {
        const dirs =
          t === "n"
            ? knight
            : t === "b"
              ? diagonal
              : t === "r"
                ? straight
                : [...diagonal, ...straight];
        for (const [dr, dc] of dirs)
          for (let n = 1; n < 8; n++) {
            const rr = r + dr * n,
              cc = c + dc * n;
            if (rr < 0 || rr > 7 || cc < 0 || cc > 7) break;
            const to = rr * 8 + cc;
            if (color(s.board[to]) === us) break;
            add(i, to);
            if (s.board[to] || t === "n" || t === "k") break;
          }
        if (t === "k" && i === (us === "w" ? 60 : 4) && !check(s)) {
          for (const side of [1, -1]) {
            const right =
                us === "w" ? (side === 1 ? "K" : "Q") : side === 1 ? "k" : "q",
              rook = side === 1 ? i + 3 : i - 4;
            if (
              !s.rights.includes(right) ||
              s.board[rook] !== (us === "w" ? "R" : "r")
            )
              continue;
            const between = side === 1 ? [i + 1, i + 2] : [i - 1, i - 2, i - 3];
            if (
              between.every((x) => !s.board[x]) &&
              !attacked(s, i + side, opposite(us)) &&
              !attacked(s, i + 2 * side, opposite(us))
            )
              add(i, i + 2 * side, { castle: true });
          }
        }
      }
    }
    return moves;
  }
  function apply(s, m) {
    const board = s.board.slice(),
      p = board[m.from],
      captured = board[m.to];
    board[m.from] = null;
    board[m.to] = m.promotion
      ? s.turn === "w"
        ? m.promotion.toUpperCase()
        : m.promotion
      : p;
    if (m.ep) board[m.to + (s.turn === "w" ? 8 : -8)] = null;
    if (m.castle) {
      const right = m.to > m.from,
        from = right ? m.from + 3 : m.from - 4,
        to = right ? m.from + 1 : m.from - 1;
      board[to] = board[from];
      board[from] = null;
    }
    let rights = s.rights;
    if (p === "K") rights = rights.replace(/[KQ]/g, "");
    if (p === "k") rights = rights.replace(/[kq]/g, "");
    for (const [at, right] of [
      [0, "q"],
      [7, "k"],
      [56, "Q"],
      [63, "K"],
    ])
      if (m.from === at || m.to === at) rights = rights.replace(right, "");
    return {
      board,
      turn: opposite(s.turn),
      rights,
      ep:
        p.toLowerCase() === "p" && Math.abs(m.to - m.from) === 16
          ? (m.to + m.from) / 2
          : -1,
      half: p.toLowerCase() === "p" || captured || m.ep ? 0 : s.half + 1,
      full: s.full + (s.turn === "b" ? 1 : 0),
    };
  }
  const legal = (s) => pseudo(s).filter((m) => !check(apply(s, m), s.turn));
  const key = (s) => {
    const parts = fen(s).split(" ");
    if (s.ep >= 0 && !legal(s).some((m) => m.ep)) parts[3] = "-";
    return parts.slice(0, 4).join(" ");
  };
  function dead(s) {
    const pieces = s.board
      .map((p, i) => ({ p: p?.toLowerCase(), i }))
      .filter((x) => x.p && x.p !== "k");
    if (!pieces.length) return true;
    if (pieces.length === 1 && ["b", "n"].includes(pieces[0].p)) return true;
    return (
      pieces.every((x) => x.p === "b") &&
      new Set(pieces.map((x) => (Math.floor(x.i / 8) + (x.i % 8)) % 2)).size ===
        1
    );
  }
  function canMate(s, c) {
    if (dead(s)) return false;
    const own = s.board.filter(
      (p) => color(p) === c && p.toLowerCase() !== "k",
    );
    if (!own.length) return false;
    return true;
  }
  function status(s, history = []) {
    const moves = legal(s),
      inCheck = check(s),
      repeated = history.filter((k) => k === key(s)).length;
    if (!moves.length)
      return {
        over: true,
        reason: inCheck ? "mate" : "stalemate",
        winner: inCheck ? opposite(s.turn) : null,
      };
    if (dead(s)) return { over: true, reason: "material", winner: null };
    if (s.half >= 150 || repeated >= 5)
      return {
        over: true,
        reason: s.half >= 150 ? "seventyfive" : "fivefold",
        winner: null,
      };
    return {
      over: false,
      check: inCheck,
      claim: s.half >= 100 || repeated >= 3,
    };
  }
  function notation(s, m) {
    let text;
    if (m.castle) text = m.to > m.from ? "O-O" : "O-O-O";
    else {
      const p = s.board[m.from].toUpperCase(),
        capture = !!s.board[m.to] || m.ep;
      let prefix = p === "P" ? (capture ? square(m.from)[0] : "") : p;
      if (p !== "P") {
        const others = legal(s).filter(
          (x) =>
            x.to === m.to &&
            x.from !== m.from &&
            s.board[x.from] === s.board[m.from],
        );
        if (others.length)
          prefix += others.every((x) => x.from % 8 !== m.from % 8)
            ? square(m.from)[0]
            : others.every(
                  (x) => Math.floor(x.from / 8) !== Math.floor(m.from / 8),
                )
              ? square(m.from)[1]
              : square(m.from);
      }
      text =
        prefix +
        (capture ? "x" : "") +
        square(m.to) +
        (m.promotion ? "=" + m.promotion.toUpperCase() : "");
    }
    const next = apply(s, m);
    if (check(next)) text += legal(next).length ? "+" : "#";
    return text;
  }
  const uci = (m) => square(m.from) + square(m.to) + (m.promotion || "");
  function claimMoves(s, history = []) {
    if (s.half < 99 && history.length < 7) return [];
    return legal(s).filter((m) => {
      const next = apply(s, m);
      return (
        next.half >= 100 || history.filter((k) => k === key(next)).length >= 2
      );
    });
  }
  return {
    initial,
    parse,
    fen,
    color,
    opposite,
    square,
    index,
    attacked,
    check,
    legal,
    apply,
    key,
    dead,
    canMate,
    status,
    claimMoves,
    notation,
    uci,
  };
})();
if (typeof module !== "undefined") module.exports = Chess;
