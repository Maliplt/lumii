"use strict";
// a board: which squares hold mines (`jelly`), their counts, and which are open
(function (M) {
  class Board {
    constructor({ w, h, active, jelly, start }) {
      this.w = w;
      this.h = h;
      this.active = active.slice();
      this.jelly = jelly.slice();
      this.start = start;
      this.open = new Array(w * h).fill(false);
      this.near = this.active.map(() => []);
      for (let i = 0; i < w * h; i++) {
        if (!this.active[i]) continue;
        const x = i % w;
        const y = Math.floor(i / w);
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            const j = ny * w + nx;
            if (this.active[j]) this.near[i].push(j);
          }
        }
      }
      this.count = this.active.map((on, i) => (on ? this.near[i].filter((j) => this.jelly[j]).length : 0));
      this.safeTotal = this.active.filter((on, i) => on && !this.jelly[i]).length;
      this.jellyTotal = this.jelly.filter(Boolean).length;
    }

    // opens a square; empty squares spread to their neighbours
    reveal(i) {
      if (!this.active[i] || this.open[i]) return { opened: [], stung: false };
      if (this.jelly[i]) {
        this.open[i] = true;
        return { opened: [{ i, depth: 0 }], stung: true };
      }
      const opened = [];
      const queue = [[i, 0]];
      this.open[i] = true;
      while (queue.length) {
        const [c, depth] = queue.shift();
        opened.push({ i: c, depth });
        if (this.count[c]) continue;
        for (const n of this.near[c]) {
          if (this.open[n] || this.jelly[n]) continue;
          this.open[n] = true;
          queue.push([n, depth + 1]);
        }
      }
      return { opened, stung: false };
    }

    openSafe() {
      let n = 0;
      for (let i = 0; i < this.open.length; i++) if (this.open[i] && !this.jelly[i]) n++;
      return n;
    }

    solved() {
      return this.openSafe() === this.safeTotal;
    }
  }

  M.Board = Board;
})(window.Mines98);
