"use strict";
// one game of mines: waiting for the first click, playing, won or lost
(function (M) {
  const LEVELS = {
    beginner: { w: 9, h: 9, mines: 10 },
    intermediate: { w: 16, h: 16, mines: 40 },
    expert: { w: 30, h: 16, mines: 99 },
  };

  // fits a custom size into sensible bounds
  function custom(w, h, mines) {
    const cw = Math.max(8, Math.min(30, Math.round(w) || 9));
    const ch = Math.max(8, Math.min(24, Math.round(h) || 9));
    const cm = Math.max(1, Math.min(Math.floor(cw * ch * 0.85), Math.round(mines) || 10));
    return { w: cw, h: ch, mines: cm };
  }

  class Game {
    // { w, h, mines, noGuess, marks, seed }
    constructor({ w, h, mines, noGuess = false, marks = false, seed = `${Date.now()}` }) {
      this.w = w;
      this.h = h;
      this.mines = mines;
      this.noGuess = noGuess;
      this.marks = marks;
      this.seed = seed;
      this.state = "ready";
      this.board = null;
      this.flag = new Array(w * h).fill(0);
      this.seconds = 0;
      this.exploded = -1;
      this.fair = null;
    }

    get size() {
      return this.w * this.h;
    }

    isOpen(i) {
      return Boolean(this.board?.open[i]);
    }

    // mines still unmarked, as the left counter shows it
    get left() {
      let flags = 0;
      for (const f of this.flag) if (f === 1) flags++;
      return this.mines - flags;
    }

    neighbours(i) {
      const x = i % this.w;
      const y = Math.floor(i / this.w);
      const out = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < this.w && ny < this.h) out.push(ny * this.w + nx);
        }
      }
      return out;
    }

    begin(i) {
      const layout = M.Generator.build({ w: this.w, h: this.h, mines: this.mines, start: i, seed: this.seed, noGuess: this.noGuess });
      this.fair = layout.solved;
      this.board = new M.Board(layout);
      this.state = "playing";
    }

    // opens a square
    open(i) {
      if (this.state === "won" || this.state === "lost" || this.flag[i] === 1) return [];
      if (this.state === "ready") this.begin(i);
      const b = this.board;
      if (b.open[i]) return [];
      if (b.jelly[i]) return this.lose(i);
      const { opened } = b.reveal(i);
      for (const { i: c } of opened) this.flag[c] = 0;
      const changes = [{ type: "open", cells: opened.map((o) => o.i) }];
      return this.check(changes);
    }

    // on an open number whose flags are all placed: opens the rest around it
    chord(i) {
      if (this.state !== "playing" || !this.board.open[i]) return [];
      const b = this.board;
      const around = this.neighbours(i);
      const flags = around.filter((j) => this.flag[j] === 1).length;
      if (!b.count[i] || flags !== b.count[i]) return [];
      const changes = [];
      for (const j of around) {
        if (b.open[j] || this.flag[j] === 1) continue;
        if (b.jelly[j]) return this.lose(j);
        const { opened } = b.reveal(j);
        for (const { i: c } of opened) this.flag[c] = 0;
        changes.push({ type: "open", cells: opened.map((o) => o.i) });
      }
      return changes.length ? this.check(changes) : [];
    }

    // right click: flag, then a question mark if marks are on, then clear
    mark(i) {
      if (this.state === "won" || this.state === "lost" || this.isOpen(i)) return [];
      const next = this.flag[i] === 0 ? 1 : this.flag[i] === 1 && this.marks ? 2 : 0;
      this.flag[i] = next;
      return [{ type: "mark", i, value: next }];
    }

    check(changes) {
      if (this.board.solved()) {
        this.state = "won";
        for (let i = 0; i < this.size; i++) if (this.board.jelly[i]) this.flag[i] = 1;
        changes.push({ type: "won", seconds: this.seconds });
      }
      return changes;
    }

    lose(i) {
      this.state = "lost";
      this.exploded = i;
      return [{ type: "lost", i }];
    }

    tick(dt) {
      if (this.state !== "playing") return false;
      const before = Math.floor(this.seconds);
      this.seconds = Math.min(999, this.seconds + dt);
      return Math.floor(this.seconds) !== before;
    }

    // what a square shows
    look(i) {
      const b = this.board;
      if (!b) return this.flag[i] === 1 ? "flag" : this.flag[i] === 2 ? "mark" : "closed";
      if (this.state === "lost") {
        if (i === this.exploded) return "boom";
        if (b.jelly[i] && this.flag[i] !== 1) return "mine";
        if (!b.jelly[i] && this.flag[i] === 1) return "wrong";
      }
      if (b.open[i]) return "open";
      return this.flag[i] === 1 ? "flag" : this.flag[i] === 2 ? "mark" : "closed";
    }

    count(i) {
      return this.board ? this.board.count[i] : 0;
    }
  }

  M.Game = Game;
  M.LEVELS = LEVELS;
  M.customSize = custom;
})(window.Mines98);
