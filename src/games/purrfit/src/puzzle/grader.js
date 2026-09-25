"use strict";
// rates how hard a window is to solve by hand
(function (V) {
  function grade(puzzle) {
    const perClue = V.Solver.candidates(puzzle);
    const all = perClue.flat();
    const size = puzzle.w * puzzle.h;
    const byCell = Array.from({ length: size }, () => []);
    all.forEach((rect, i) => {
      rect.id = i;
      rect.cells.forEach((c) => byCell[c].push(i));
    });
    const byClue = perClue.map((list) => list.map((rect) => rect.id));
    const answer = puzzle.solution;

    const fresh = () => ({ alive: new Uint8Array(all.length).fill(1), owner: new Int16Array(size).fill(-1), done: new Uint8Array(puzzle.clues.length) });
    const copy = (s) => ({ alive: s.alive.slice(), owner: s.owner.slice(), done: s.done.slice() });

    function place(s, rect) {
      s.done[rect.clue] = 1;
      byClue[rect.clue].forEach((id) => (s.alive[id] = id === rect.id ? 1 : 0));
      for (const c of rect.cells) {
        s.owner[c] = rect.clue;
        byCell[c].forEach((id) => {
          if (all[id].clue !== rect.clue) s.alive[id] = 0;
        });
      }
    }

    // singles only
    function singles(s) {
      let moved = true;
      while (moved) {
        moved = false;
        for (let clue = 0; clue < byClue.length; clue++) {
          if (s.done[clue]) continue;
          const live = byClue[clue].filter((id) => s.alive[id]);
          if (!live.length) return false;
          if (live.length === 1) {
            place(s, all[live[0]]);
            moved = true;
          }
        }
        for (let c = 0; c < size; c++) {
          if (s.owner[c] >= 0) continue;
          const live = byCell[c].filter((id) => s.alive[id]);
          if (!live.length) return false;
          if (live.length === 1) {
            place(s, all[live[0]]);
            moved = true;
          }
        }
      }
      return true;
    }

    // cells every live pane of a clue covers belong to that clue
    function overlap(s) {
      let moved = false;
      for (let clue = 0; clue < byClue.length; clue++) {
        if (s.done[clue]) continue;
        const live = byClue[clue].filter((id) => s.alive[id]);
        if (!live.length) continue;
        const shared = live.reduce((set, id) => set.filter((c) => all[id].cells.includes(c)), all[live[0]].cells);
        for (const c of shared) {
          byCell[c].forEach((id) => {
            if (s.alive[id] && all[id].clue !== clue) {
              s.alive[id] = 0;
              moved = true;
            }
          });
        }
      }
      return moved;
    }

    const solved = (s) => s.done.every(Boolean);
    const settle = (s) => {
      if (!singles(s)) return false;
      while (overlap(s)) if (!singles(s)) return false;
      return true;
    };

    let state = fresh();
    let score = 0;
    let steps = 0;
    while (steps++ < 400) {
      if (!singles(state)) break;
      if (solved(state)) return score;
      if (overlap(state)) {
        score += 1;
        continue;
      }
      // try each pane of the tightest clue and drop the ones that break
      let dropped = false;
      const open = byClue.map((ids, clue) => ({ clue, live: ids.filter((id) => state.alive[id]) })).filter((o) => !state.done[o.clue]);
      open.sort((a, b) => a.live.length - b.live.length);
      for (const { live } of open.slice(0, 4)) {
        for (const id of live) {
          const trial = copy(state);
          place(trial, all[id]);
          if (!settle(trial)) {
            state.alive[id] = 0;
            dropped = true;
          }
        }
        if (dropped) break;
      }
      if (dropped) {
        score += 3;
        continue;
      }
      // a guess: take the true pane of the tightest clue
      const clue = open[0].clue;
      const truth = answer.find((rect) => rect.clue === clue);
      const id = byClue[clue].find((i) => all[i].x === truth.x && all[i].y === truth.y && all[i].w === truth.w && all[i].h === truth.h);
      place(state, all[id]);
      score += 8;
    }
    return score;
  }

  V.Grader = { grade };
})(window.Purrfit);
