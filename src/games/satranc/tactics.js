"use strict";
(() => {
  const mates = ChessPuzzles.slice();
  const seeds = [
    {
      fen: "3q3k/8/8/4N3/8/8/8/K7 w - - 0 1",
      goal: "gain",
      amount: 9,
      par: 2,
      theme: "fork",
    },
    {
      fen: "4q3/8/4k3/8/8/8/8/R6K w - - 0 1",
      goal: "gain",
      amount: 4,
      par: 2,
      theme: "skewer",
    },
    {
      fen: "7k/8/8/3r4/8/8/6B1/K7 w - - 0 1",
      goal: "gain",
      amount: 5,
      par: 1,
      theme: "gainGoal",
    },
    {
      fen: "4k3/8/8/1q6/8/8/4B3/K3R3 w - - 0 1",
      goal: "gain",
      amount: 9,
      par: 1,
      theme: "discovered",
    },
    {
      fen: "7k/2P5/8/8/8/8/8/K7 w - - 0 1",
      goal: "promote",
      par: 1,
      theme: "promoteGoal",
    },
    {
      fen: "7k/6pp/8/2P5/8/8/8/K7 w - - 0 1",
      goal: "promote",
      par: 3,
      theme: "passed",
    },
    {
      fen: "k7/8/8/8/8/8/5PPP/4K1NR w K - 0 1",
      goal: "castle",
      par: 2,
      theme: "castleGoal",
    },
  ];
  const used = new Set();
  for (let chapter = 0; chapter < 10; chapter++) {
    for (let slot = 0; slot < 10; slot++) {
      const id = chapter * 10 + slot + 1;
      if ([2, 5, 9].includes(slot)) {
        const p =
          mates[chapter * 6 + [2, 5, 9].indexOf(slot) + (chapter > 4 ? 25 : 0)];
        ChessPuzzles[id - 1] = {
          ...p,
          id,
          chapter: chapter + 1,
          par: p.depth,
          goal: "mate",
          goalKey: "mateGoal",
        };
        continue;
      }
      const type = [0, 1, 3, 4, 6, 7, 8].indexOf(slot);
      const seed = { ...seeds[type] };
      if (seed.goal === "promote" && seed.par === 3 && chapter > 0) {
        const base = Chess.parse(seed.fen);
        base.board[base.board.indexOf("P")] = null;
        const row = 2 + chapter % 3;
        base.board[row * 8 + 1 + chapter % 3] = "P";
        seed.fen = Chess.fen(base);
        seed.par = row;
      }
      if (seed.goal === "castle" && chapter % 2) seed.fen = "7k/8/8/8/8/8/PPP5/RN2K3 w Q - 0 1";
      let state = Chess.parse(seed.fen);
      const royal = seed.goal === "castle" ? "k" : "K";
      const old = state.board.indexOf(royal);
      const options =
        royal === "k"
          ? [0, 1, 2, 3, 4, 8, 9, 10, 11, 12]
          : [48, 49, 50, 51, 52, 53, 54, 55, 40, 41, 42, 43, 44, 45, 46, 47, 56, 57, 58, 59, 60, 61, 62, 63, 32, 33, 34];
      for (let offset = 0; offset < options.length; offset++) {
        const cell = options[(chapter + offset) % options.length];
        if (seed.theme === "skewer" && (cell % 8 === 4 || cell >= 56)) continue;
        if (seed.goal === "promote" && cell % 8 > 2) continue;
        const candidate = Chess.parse(seed.fen);
        candidate.board[old] = "";
        if (candidate.board[cell]) continue;
        candidate.board[cell] = royal;
        if (
          Chess.attacked(candidate, candidate.board.indexOf("K"), "b") ||
          Chess.attacked(candidate, candidate.board.indexOf("k"), "w")
        )
          continue;
        const fen = Chess.fen(candidate);
        if (used.has(fen)) continue;
        state = candidate;
        used.add(fen);
        break;
      }
      if (seed.goal === "gain" && chapter) {
        const transformed = Array(64).fill(null);
        state.board.forEach((piece, i) => {
          let row = Math.floor(i / 8), col = i % 8;
          if (chapter >= 4) col = 7 - col;
          for (let turn = 0; turn < chapter % 4; turn++) [row, col] = [col, 7 - row];
          transformed[row * 8 + col] = piece;
        });
        state.board = transformed;
      }
      ChessPuzzles[id - 1] = {
        ...seed,
        id,
        chapter: chapter + 1,
        fen: Chess.fen(state),
        goalKey: seed.goal + "Goal",
      };
    }
  }
})();
