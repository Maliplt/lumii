"use strict";
// a patient player who never guesses
(function (M) {
  // plays `board` by logic alone
  function solve(board, { from = board.start } = {}) {
    const n = board.w * board.h;
    const open = new Array(n).fill(false);
    const mine = new Array(n).fill(false);
    let hardest = 1;
    let steps = 0;

    const reveal = (start) => {
      const stack = [start];
      open[start] = true;
      while (stack.length) {
        const c = stack.pop();
        if (board.count[c]) continue;
        for (const j of board.near[c]) {
          if (open[j] || board.jelly[j]) continue;
          open[j] = true;
          stack.push(j);
        }
      }
    };

    reveal(from);
    let progress = true;
    while (progress) {
      progress = false;
      steps++;
      const rules = [];
      for (let i = 0; i < n; i++) {
        if (!open[i] || !board.count[i]) continue;
        const unknown = [];
        let flagged = 0;
        for (const j of board.near[i]) {
          if (mine[j]) flagged++;
          else if (!open[j]) unknown.push(j);
        }
        if (!unknown.length) continue;
        const need = board.count[i] - flagged;
        if (need === 0) {
          for (const j of unknown) if (!open[j]) reveal(j);
          progress = true;
        } else if (need === unknown.length) {
          for (const j of unknown) mine[j] = true;
          progress = true;
        } else rules.push({ cells: unknown, need });
      }
      if (progress) continue;

      // compare pairs of numbers that share hidden cells
      for (let a = 0; a < rules.length && !progress; a++) {
        const A = rules[a];
        const setA = new Set(A.cells);
        for (let b = 0; b < rules.length && !progress; b++) {
          if (a === b) continue;
          const B = rules[b];
          if (B.cells.length <= A.cells.length) continue;
          if (!A.cells.every((c) => B.cells.includes(c))) continue;
          const rest = B.cells.filter((c) => !setA.has(c));
          const left = B.need - A.need;
          if (left === 0) {
            for (const c of rest) reveal(c);
            progress = true;
          } else if (left === rest.length) {
            for (const c of rest) mine[c] = true;
            progress = true;
          }
        }
      }
      if (progress) {
        hardest = Math.max(hardest, 2);
        continue;
      }

      // last resort: the count of mines still hidden
      const hidden = [];
      let marked = 0;
      for (let i = 0; i < n; i++) {
        if (!board.active[i]) continue;
        if (mine[i]) marked++;
        else if (!open[i]) hidden.push(i);
      }
      const left = board.jellyTotal - marked;
      if (hidden.length && left === 0) {
        for (const c of hidden) reveal(c);
        progress = true;
      } else if (hidden.length && left === hidden.length) {
        for (const c of hidden) mine[c] = true;
        progress = true;
      }
      if (progress) hardest = 3;
    }

    let opened = 0;
    for (let i = 0; i < n; i++) if (open[i] && !board.jelly[i]) opened++;
    return { solved: opened === board.safeTotal, opened, steps, hardest, open, mine };
  }

  M.Solver = { solve };
})(window.Mines98);
