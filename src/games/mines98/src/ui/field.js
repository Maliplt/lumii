"use strict";
// the minefield: draws the squares and turns mouse, touch and keys into moves
(function (M) {
  const P = M.Pixel;
  const HOLD = 380;

  class Field {
    constructor(canvas, hooks = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.hooks = hooks;
      this.cell = 24;
      this.pressed = null;
      this.flagMode = false;
      this.holdTimer = null;
      this.focus = 0;
      canvas.tabIndex = 0;
      canvas.addEventListener("pointerdown", (e) => this.down(e));
      canvas.addEventListener("pointermove", (e) => this.move(e));
      canvas.addEventListener("pointerup", (e) => this.up(e));
      canvas.addEventListener("pointercancel", () => this.cancel());
      canvas.addEventListener("contextmenu", (e) => e.preventDefault());
      canvas.addEventListener("keydown", (e) => this.key(e));
    }

    load(game, cell) {
      this.game = game;
      this.cell = cell;
      this.pressed = null;
      this.focus = Math.floor(game.h / 2) * game.w + Math.floor(game.w / 2);
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      this.dpr = dpr;
      this.canvas.width = game.w * cell * dpr;
      this.canvas.height = game.h * cell * dpr;
      this.canvas.style.width = `${game.w * cell}px`;
      this.canvas.style.height = `${game.h * cell}px`;
      this.draw();
    }

    at(e) {
      const r = this.canvas.getBoundingClientRect();
      const x = Math.floor(((e.clientX - r.left) / r.width) * this.game.w);
      const y = Math.floor(((e.clientY - r.top) / r.height) * this.game.h);
      return x >= 0 && y >= 0 && x < this.game.w && y < this.game.h ? y * this.game.w + x : -1;
    }

    get over() {
      return this.game.state === "won" || this.game.state === "lost";
    }

    down(e) {
      if (!this.game || this.over) return;
      const i = this.at(e);
      if (i < 0) return;
      e.preventDefault();
      this.canvas.focus({ preventScroll: true });
      try {
        this.canvas.setPointerCapture(e.pointerId);
      } catch {
        // synthetic pointers cannot be captured
      }
      if (e.pointerType === "mouse") {
        if (e.button === 2 && !(e.buttons & 1)) {
          this.apply(this.game.mark(i));
          this.pressed = null;
          return;
        }
        this.pressed = { i, chord: e.button === 1 || (e.buttons & 3) === 3, id: e.pointerId, touch: false };
        this.hooks.onPress?.(true);
        this.draw();
        return;
      }
      // touch and pen: a long press marks
      this.pressed = { i, chord: false, id: e.pointerId, touch: true, x: e.clientX, y: e.clientY };
      this.hooks.onPress?.(true);
      clearTimeout(this.holdTimer);
      this.holdTimer = setTimeout(() => {
        if (!this.pressed || this.pressed.id !== e.pointerId) return;
        const target = this.pressed.i;
        this.pressed = null;
        this.hooks.onPress?.(false);
        navigator.vibrate?.(15);
        this.apply(this.game.mark(target));
      }, HOLD);
      this.draw();
    }

    move(e) {
      if (!this.pressed || e.pointerId !== this.pressed.id) return;
      if (this.pressed.touch) {
        if (Math.hypot(e.clientX - this.pressed.x, e.clientY - this.pressed.y) > this.cell * 0.6) this.cancel();
        return;
      }
      const i = this.at(e);
      if (i >= 0 && i !== this.pressed.i) {
        this.pressed.i = i;
        this.draw();
      }
      if ((e.buttons & 3) === 3) this.pressed.chord = true;
    }

    up(e) {
      clearTimeout(this.holdTimer);
      const press = this.pressed;
      if (!press || e.pointerId !== press.id) return;
      this.pressed = null;
      this.hooks.onPress?.(false);
      const g = this.game;
      const i = press.i;
      let changes;
      if (press.chord || (g.isOpen(i) && g.count(i))) changes = g.chord(i);
      else if (press.touch && this.flagMode) changes = g.mark(i);
      else changes = g.open(i);
      this.apply(changes);
    }

    cancel() {
      clearTimeout(this.holdTimer);
      if (!this.pressed) return;
      this.pressed = null;
      this.hooks.onPress?.(false);
      this.draw();
    }

    // arrow keys move a focus square; Space or Enter opens, F marks
    key(e) {
      if (!this.game || this.over) return;
      const g = this.game;
      const x = this.focus % g.w;
      const y = Math.floor(this.focus / g.w);
      const move = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (move) {
        e.preventDefault();
        const nx = Math.max(0, Math.min(g.w - 1, x + move[0]));
        const ny = Math.max(0, Math.min(g.h - 1, y + move[1]));
        this.focus = ny * g.w + nx;
        this.showFocus = true;
        this.draw();
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        this.showFocus = true;
        this.apply(g.isOpen(this.focus) ? g.chord(this.focus) : g.open(this.focus));
      } else if (e.key === "f" || e.key === "F") {
        this.showFocus = true;
        this.apply(g.mark(this.focus));
      }
    }

    apply(changes) {
      this.draw();
      if (changes.length) this.hooks.onChange?.(changes);
    }

    // squares pushed in by the current press
    pushed() {
      const press = this.pressed;
      if (!press || this.over) return new Set();
      const g = this.game;
      const list = press.chord || (g.isOpen(press.i) && !press.touch) ? [press.i, ...g.neighbours(press.i)] : [press.i];
      return new Set(list.filter((j) => !g.isOpen(j) && g.flag[j] !== 1));
    }

    draw() {
      if (!this.game) return;
      const { ctx, cell, dpr } = this;
      const g = this.game;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      const pushed = this.pushed();
      const bevel = cell >= 22 ? 3 : 2;
      for (let i = 0; i < g.size; i++) {
        const x = (i % g.w) * cell;
        const y = Math.floor(i / g.w) * cell;
        const look = g.look(i);
        if (look === "closed" || look === "flag" || look === "mark") {
          if (pushed.has(i) && look !== "flag") this.flat(x, y);
          else P.raised(ctx, x, y, cell, cell, bevel);
          if (look === "flag") P.centred(ctx, P.SPRITES.flag, x, y, cell, 0.6);
          if (look === "mark") P.centred(ctx, P.SPRITES.mark, x, y, cell, 0.5);
        } else {
          this.flat(x, y, look === "boom" ? "#ff0000" : P.GREY);
          if (look === "open") {
            const n = g.count(i);
            if (n) P.number(ctx, n, x, y, cell);
          } else if (look === "mine" || look === "boom") P.centred(ctx, P.SPRITES.mine, x, y, cell, 0.72);
          else if (look === "wrong") {
            P.centred(ctx, P.SPRITES.mine, x, y, cell, 0.72);
            P.centred(ctx, P.SPRITES.cross, x, y, cell, 0.72);
          }
        }
        if (this.showFocus && i === this.focus && document.activeElement === this.canvas) {
          ctx.strokeStyle = "#000080";
          ctx.setLineDash([2, 2]);
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 3.5, y + 3.5, cell - 7, cell - 7);
          ctx.setLineDash([]);
        }
      }
    }

    flat(x, y, fill = P.GREY) {
      const { ctx, cell } = this;
      ctx.fillStyle = fill;
      ctx.fillRect(x, y, cell, cell);
      ctx.fillStyle = P.SHADE;
      ctx.fillRect(x, y, cell, 1);
      ctx.fillRect(x, y, 1, cell);
    }
  }

  M.Field = Field;
})(window.Mines98);
