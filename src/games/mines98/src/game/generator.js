"use strict";
// lays mines once the first square is chosen
(function (M) {
  // { w, h, mines
  function build({ w, h, mines, start, seed, noGuess = false, tries = 400 }) {
    const n = w * h;
    const active = new Array(n).fill(true);
    const sx = start % w;
    const sy = Math.floor(start / w);
    const around = new Set();
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = sx + dx;
        const y = sy + dy;
        if (x >= 0 && y >= 0 && x < w && y < h) around.add(y * w + x);
      }
    }
    // keep the first square's neighbours free too when there is room for it
    const keepClear = n - around.size >= mines ? around : new Set([start]);
    const cells = [];
    for (let i = 0; i < n; i++) if (!keepClear.has(i)) cells.push(i);
    const count = Math.min(mines, cells.length);
    let fallback = null;
    for (let attempt = 0; attempt < (noGuess ? tries : 1); attempt++) {
      const rng = new M.Random(`${seed}#${attempt}`);
      const pool = rng.shuffle(cells.slice());
      const jelly = new Array(n).fill(false);
      for (let k = 0; k < count; k++) jelly[pool[k]] = true;
      const layout = { w, h, active, jelly, start };
      if (!noGuess) return { ...layout, solved: null };
      const result = M.Solver.solve(new M.Board(layout));
      if (result.solved) return { ...layout, solved: true };
      if (!fallback || result.opened > fallback.opened) fallback = { layout, opened: result.opened };
    }
    // rare: no fair layout found in time; the most solvable one is used
    return { ...fallback.layout, solved: false };
  }

  M.Generator = { build };
})(window.Mines98);
