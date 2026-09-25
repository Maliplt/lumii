"use strict";
// the play area: a rug of cells with cats on it
(function (V) {
  const { clamp, easeOut, easeBack } = V.util;
  const { cellsOf, clueMap, judge } = V.Rules;
  const INK = V.Palette.INK;

  class Board {
    constructor(host, { onChange, onWin }) {
      this.host = host;
      this.canvas = document.createElement("canvas");
      this.canvas.className = "board__canvas";
      this.canvas.tabIndex = 0;
      this.canvas.setAttribute("role", "application");
      host.append(this.canvas);
      this.ctx = this.canvas.getContext("2d");
      this.onChange = onChange;
      this.onWin = onWin;
      this.time = 0;
      this.puzzle = null;
      new ResizeObserver(() => this.layout()).observe(host);
      this.bindInput();
    }

    load(puzzle, colorSet) {
      this.puzzle = puzzle;
      this.colors = V.Palette.colorize(puzzle);
      this.fx = [];
      this.owner = clueMap(puzzle);
      this.panes = [];
      this.history = [];
      this.ghosts = [];
      this.drag = null;
      this.cursor = null;
      this.anchor = null;
      this.hover = null;
      this.wonAt = null;
      this.guide = null;
      this.enterAt = this.time;
      this.layout();
    }

    layout() {
      const rect = this.host.getBoundingClientRect();
      if (!rect.width || !this.puzzle) return;
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      this.dpr = dpr;
      this.cssW = rect.width;
      this.cssH = rect.height;
      this.canvas.width = Math.round(rect.width * dpr);
      this.canvas.height = Math.round(rect.height * dpr);
      const { w, h } = this.puzzle;
      const cell = Math.floor(Math.min((rect.width - 24) / w, (rect.height - 24) / h, 84));
      this.cell = cell;
      this.gridW = cell * w;
      this.gridH = cell * h;
      this.ox = Math.round((rect.width - this.gridW) / 2);
      this.oy = Math.round((rect.height - this.gridH) / 2);
      this.line = Math.max(2, Math.round(cell * 0.06));
    }

    // geometry

    cellAt(clientX, clientY, clampToGrid = false) {
      const bounds = this.canvas.getBoundingClientRect();
      const x = (clientX - bounds.left - this.ox) / this.cell;
      const y = (clientY - bounds.top - this.oy) / this.cell;
      if (!clampToGrid && (x < 0 || y < 0 || x >= this.puzzle.w || y >= this.puzzle.h)) return null;
      return { x: clamp(Math.floor(x), 0, this.puzzle.w - 1), y: clamp(Math.floor(y), 0, this.puzzle.h - 1) };
    }

    // the middle of a cell in page pixels, for the tutorial's pointer
    pointOf(x, y) {
      const bounds = this.canvas.getBoundingClientRect();
      return { x: bounds.left + this.ox + (x + 0.5) * this.cell, y: bounds.top + this.oy + (y + 0.5) * this.cell };
    }

    area(r) {
      return { x: this.ox + r.x * this.cell, y: this.oy + r.y * this.cell, w: r.w * this.cell, h: r.h * this.cell };
    }

    static span(a, b) {
      return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x) + 1, h: Math.abs(a.y - b.y) + 1 };
    }

    paneAt(x, y) {
      return this.panes.find((p) => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h) || null;
    }

    // moves

    snapshot() {
      this.history.push(this.panes.map((p) => ({ ...p })));
      if (this.history.length > 200) this.history.shift();
    }

    place(rect, { hinted = false } = {}) {
      if (this.wonAt !== null) return;
      this.snapshot();
      const overlapping = this.panes.filter((p) => !(p.x + p.w <= rect.x || rect.x + rect.w <= p.x || p.y + p.h <= rect.y || rect.y + rect.h <= p.y));
      overlapping.forEach((p) => this.ghosts.push({ ...p, at: this.time }));
      this.panes = this.panes.filter((p) => !overlapping.includes(p));
      const verdict = judge(this.puzzle, rect, this.owner);
      const pane = { ...rect, born: this.time, ok: verdict.ok, clue: verdict.clue, hinted };
      this.panes.push(pane);
      this.puff(pane, verdict.ok);
      this.onChange?.({ type: "place", pane, verdict, replaced: overlapping.length });
      this.checkWin();
    }

    remove(pane) {
      if (this.wonAt !== null) return;
      this.snapshot();
      this.panes = this.panes.filter((p) => p !== pane);
      this.ghosts.push({ ...pane, at: this.time });
      this.puff(pane, false, true);
      this.onChange?.({ type: "remove", pane });
    }

    undo() {
      if (!this.history.length || this.wonAt !== null) return false;
      const previous = this.history.pop();
      this.panes.forEach((p) => {
        if (!previous.some((q) => q.x === p.x && q.y === p.y && q.w === p.w && q.h === p.h)) this.ghosts.push({ ...p, at: this.time });
      });
      this.panes = previous;
      this.onChange?.({ type: "undo" });
      return true;
    }

    clear() {
      if (!this.panes.length || this.wonAt !== null) return;
      this.snapshot();
      this.panes.forEach((p) => this.ghosts.push({ ...p, at: this.time }));
      this.panes = [];
      this.onChange?.({ type: "clear" });
    }

    // the solution pane of one clue that is not in place yet, easiest first
    nextHint() {
      const placed = (rect) => this.panes.some((p) => p.x === rect.x && p.y === rect.y && p.w === rect.w && p.h === rect.h);
      const counts = V.Solver.candidates(this.puzzle).map((list) => list.length);
      const missing = this.puzzle.solution.filter((rect) => !placed(rect));
      missing.sort((a, b) => counts[a.clue] - counts[b.clue]);
      return missing[0] || null;
    }

    hint() {
      const rect = this.nextHint();
      if (!rect) return false;
      this.place({ x: rect.x, y: rect.y, w: rect.w, h: rect.h }, { hinted: true });
      return true;
    }

    solved() {
      const covered = new Uint8Array(this.puzzle.w * this.puzzle.h);
      for (const p of this.panes) {
        if (!p.ok) return false;
        cellsOf(p, this.puzzle.w).forEach((c) => covered[c]++);
      }
      return this.panes.length === this.puzzle.clues.length && covered.every((n) => n === 1);
    }

    checkWin() {
      if (!this.solved()) return;
      this.wonAt = this.time;
      this.drag = null;
      this.anchor = null;
      this.cursor = null;
      this.confetti();
      this.onWin?.();
    }

    // input

    bindInput() {
      const c = this.canvas;
      c.addEventListener("pointerdown", (e) => {
        if (!this.puzzle || this.wonAt !== null) return;
        const cell = this.cellAt(e.clientX, e.clientY);
        if (!cell) return;
        try {
          c.setPointerCapture(e.pointerId);
        } catch {
          // synthetic pointers cannot be captured; the drag still works
        }
        this.drag = { start: cell, end: cell, id: e.pointerId, moved: false };
        this.cursor = null;
        V.Audio.play("pick");
        e.preventDefault();
      });
      c.addEventListener("pointermove", (e) => {
        if (!this.drag || e.pointerId !== this.drag.id) {
          if (e.pointerType === "mouse" && this.puzzle) this.hover = this.cellAt(e.clientX, e.clientY);
          return;
        }
        const cell = this.cellAt(e.clientX, e.clientY, true);
        if (cell.x !== this.drag.end.x || cell.y !== this.drag.end.y) {
          this.drag.end = cell;
          this.drag.moved = true;
          V.Audio.play("stretch", Board.span(this.drag.start, cell));
        }
      });
      const finish = (e) => {
        if (!this.drag || e.pointerId !== this.drag.id) return;
        const { start, end, moved } = this.drag;
        this.drag = null;
        if (e.type === "pointercancel") return;
        this.commit(start, end, moved);
      };
      c.addEventListener("pointerup", finish);
      c.addEventListener("pointercancel", finish);
      c.addEventListener("pointerleave", () => (this.hover = null));
      c.addEventListener("contextmenu", (e) => e.preventDefault());
      c.addEventListener("keydown", (e) => this.onKey(e));
    }

    commit(start, end, moved) {
      const rect = Board.span(start, end);
      if (!moved || (rect.w === 1 && rect.h === 1)) {
        const pane = this.paneAt(start.x, start.y);
        if (pane) this.remove(pane);
        else this.onChange?.({ type: "tap", cell: start });
        return;
      }
      this.place(rect);
    }

    onKey(e) {
      if (!this.puzzle || this.wonAt !== null) return;
      const moves = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      if (moves[e.key]) {
        e.preventDefault();
        const at = this.cursor || { x: 0, y: 0 };
        this.cursor = { x: clamp(at.x + moves[e.key][0], 0, this.puzzle.w - 1), y: clamp(at.y + moves[e.key][1], 0, this.puzzle.h - 1) };
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const at = this.cursor || { x: 0, y: 0 };
        this.cursor = at;
        if (!this.anchor) this.anchor = { ...at };
        else {
          const start = this.anchor;
          this.anchor = null;
          this.commit(start, at, start.x !== at.x || start.y !== at.y);
        }
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && this.cursor) {
        const pane = this.paneAt(this.cursor.x, this.cursor.y);
        if (pane) this.remove(pane);
      }
    }

    // effects

    // dust puffs at a box's corners; hearts float up when a cat is happy
    puff(rect, happy, gone = false) {
      const box = this.area(rect);
      const corners = [[box.x, box.y], [box.x + box.w, box.y], [box.x, box.y + box.h], [box.x + box.w, box.y + box.h]];
      for (const [x, y] of corners) {
        for (let i = 0; i < (gone ? 3 : 2); i++) {
          const a = Math.random() * Math.PI * 2;
          const v = this.cell * (0.6 + Math.random() * 0.8);
          this.fx.push({ kind: "puff", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: this.cell * (0.1 + Math.random() * 0.08), age: 0, life: 0.45 });
        }
      }
      if (happy) {
        const clue = this.puzzle.clues[judge(this.puzzle, rect, this.owner).clue];
        const cx = this.ox + ((clue.index % this.puzzle.w) + 0.5) * this.cell;
        const cy = this.oy + Math.floor(clue.index / this.puzzle.w) * this.cell;
        for (let i = 0; i < 3; i++) this.fx.push({ kind: "heart", x: cx + (i - 1) * this.cell * 0.25, y: cy, vx: (i - 1) * 8, vy: -this.cell * (1.2 + i * 0.2), r: this.cell * 0.12, age: -i * 0.08, life: 0.9 });
      }
    }

    confetti() {
      const colors = ["#ff7fb5", "#58cc5a", "#56b4ff", "#ffd35c", "#ff9b3d", "#9b7bff"];
      for (let i = 0; i < 70; i++) {
        this.fx.push({
          kind: Math.random() < 0.3 ? "heart" : "bit",
          x: this.ox + Math.random() * this.gridW,
          y: this.oy - Math.random() * this.cell * 2,
          vx: (Math.random() - 0.5) * this.cell * 2,
          vy: this.cell * (1 + Math.random() * 2),
          r: this.cell * (0.08 + Math.random() * 0.08),
          spin: (Math.random() - 0.5) * 10,
          rot: Math.random() * 6,
          color: colors[i % colors.length],
          age: -Math.random() * 0.6,
          life: 2.4,
        });
      }
    }

    // drawing

    update(dt) {
      this.time += dt;
      this.ghosts = this.ghosts.filter((g) => this.time - g.at < 0.2);
      for (const f of this.fx) {
        f.age += dt;
        if (f.age < 0) continue;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        if (f.kind === "puff") {
          f.vx *= 0.9;
          f.vy *= 0.9;
        } else if (f.kind === "heart" && f.vy < 0) f.vy *= 0.97;
        if (f.kind === "bit") f.rot += f.spin * dt;
      }
      this.fx = this.fx.filter((f) => f.age < f.life);
    }

    draw({ calm = false } = {}) {
      if (!this.puzzle || !this.cell) return;
      const { ctx, dpr } = this;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, this.cssW, this.cssH);
      const intro = calm ? 1 : clamp((this.time - this.enterAt) / 0.4, 0, 1);
      ctx.globalAlpha = Math.min(1, intro * 1.5);
      this.drawRug();
      this.drawGhosts();
      this.drawBoxes(calm);
      this.drawGuide();
      this.drawPreview();
      this.drawCats(calm, intro);
      this.drawCursor();
      this.drawFx(calm);
      ctx.globalAlpha = 1;
    }

    drawRug() {
      const { ctx, cell } = this;
      const pad = cell * 0.18;
      const x = this.ox - pad;
      const y = this.oy - pad;
      const w = this.gridW + pad * 2;
      const h = this.gridH + pad * 2;
      // fringe on the short sides
      ctx.strokeStyle = INK;
      ctx.lineWidth = Math.max(1.5, this.line * 0.7);
      ctx.beginPath();
      for (let fx = x + cell * 0.3; fx < x + w - cell * 0.2; fx += cell * 0.28) {
        ctx.moveTo(fx, y);
        ctx.lineTo(fx, y - cell * 0.2);
        ctx.moveTo(fx, y + h);
        ctx.lineTo(fx, y + h + cell * 0.2);
      }
      ctx.stroke();
      ctx.fillStyle = "rgba(43,33,64,0.25)";
      V.Paint.rounded(ctx, x, y + this.line * 2, w, h, cell * 0.3);
      ctx.fill();
      V.Paint.rounded(ctx, x, y, w, h, cell * 0.3);
      ctx.fillStyle = "#fff4dc";
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.fillStyle = "#ffe6b8";
      for (let cy = 0; cy < this.puzzle.h; cy++) {
        for (let cx = 0; cx < this.puzzle.w; cx++) {
          if ((cx + cy) % 2) ctx.fillRect(this.ox + cx * cell, this.oy + cy * cell, cell, cell);
        }
      }
      if (this.hover && !this.drag) {
        ctx.fillStyle = "rgba(255,155,61,0.25)";
        ctx.fillRect(this.ox + this.hover.x * cell, this.oy + this.hover.y * cell, cell, cell);
      }
      ctx.restore();
      ctx.lineWidth = this.line;
      ctx.strokeStyle = INK;
      V.Paint.rounded(ctx, x, y, w, h, cell * 0.3);
      ctx.stroke();
      ctx.setLineDash([cell * 0.12, cell * 0.1]);
      ctx.lineWidth = Math.max(1, this.line * 0.5);
      ctx.strokeStyle = "rgba(224,112,26,0.55)";
      V.Paint.rounded(ctx, x + pad * 0.45, y + pad * 0.45, w - pad * 0.9, h - pad * 0.9, cell * 0.22);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    boxArea(p) {
      const b = this.area(p);
      const inset = Math.max(1.5, this.cell * 0.05);
      return { x: b.x + inset, y: b.y + inset, w: b.w - inset * 2, h: b.h - inset * 2 };
    }

    colorsOf(p) {
      return p.ok ? V.Palette.BOXES[this.colors[p.clue].box] : V.Palette.WRONG;
    }

    drawGhosts() {
      for (const g of this.ghosts) {
        const t = (this.time - g.at) / 0.2;
        this.ctx.save();
        this.ctx.globalAlpha *= 1 - t;
        V.Paint.box(this.ctx, this.boxArea(g), this.colorsOf(g), { cell: this.cell, pop: 1 - t * 0.3, line: this.line });
        this.ctx.restore();
      }
    }

    drawBoxes(calm) {
      for (const p of this.panes) {
        const t = calm ? 1 : clamp((this.time - p.born) / 0.32, 0, 1);
        let pop = 0.6 + 0.4 * easeBack(t);
        let b = this.boxArea(p);
        if (!p.ok && !calm && this.time - p.born < 0.4) {
          b = { ...b, x: b.x + Math.sin((this.time - p.born) * 55) * this.cell * 0.07 * (1 - (this.time - p.born) / 0.4) };
        }
        if (this.wonAt !== null && !calm) {
          const d = (p.x + p.y) / (this.puzzle.w + this.puzzle.h);
          const w = this.time - this.wonAt - d * 0.6;
          if (w > 0 && w < 0.4) pop *= 1 + Math.sin((w / 0.4) * Math.PI) * 0.08;
        }
        V.Paint.box(this.ctx, b, this.colorsOf(p), { cell: this.cell, pop, line: this.line });
      }
    }

    // the box the lesson asks for, outlined and breathing
    drawGuide() {
      if (!this.guide || this.drag) return;
      const { ctx } = this;
      const b = this.area(this.guide);
      ctx.save();
      ctx.globalAlpha *= 0.5 + 0.4 * Math.sin(this.time * 5);
      ctx.setLineDash([this.cell * 0.16, this.cell * 0.1]);
      ctx.lineDashOffset = -this.time * this.cell * 0.8;
      ctx.lineWidth = this.line;
      ctx.strokeStyle = "#ff9b3d";
      V.Paint.rounded(ctx, b.x + 3, b.y + 3, b.w - 6, b.h - 6, this.cell * 0.22);
      ctx.stroke();
      ctx.restore();
    }

    // the box being drawn, and a size tag above it
    drawPreview() {
      if (!this.drag || !this.drag.moved) return;
      const { ctx } = this;
      const rect = Board.span(this.drag.start, this.drag.end);
      const verdict = judge(this.puzzle, rect, this.owner);
      const colors = verdict.clue >= 0 && verdict.reason !== "many" ? V.Palette.BOXES[this.colors[verdict.clue].box] : V.Palette.BOXES.kraft;
      ctx.save();
      ctx.globalAlpha *= 0.7;
      V.Paint.box(ctx, this.boxArea(rect), colors, { cell: this.cell, line: this.line });
      ctx.restore();
      const b = this.area(rect);
      ctx.save();
      ctx.setLineDash([this.cell * 0.18, this.cell * 0.12]);
      ctx.lineDashOffset = -this.time * this.cell;
      ctx.lineWidth = this.line;
      ctx.strokeStyle = verdict.ok ? "#36a03a" : "#e05a5a";
      V.Paint.rounded(ctx, b.x + 1, b.y + 1, b.w - 2, b.h - 2, this.cell * 0.22);
      ctx.stroke();
      ctx.restore();

      const label = `${rect.w} × ${rect.h} = ${rect.w * rect.h}`;
      ctx.save();
      ctx.font = `800 17px ${V.Paint.FONT}`;
      const tw = ctx.measureText(label).width + 26;
      const th = 34;
      const tx = clamp(b.x + b.w / 2 - tw / 2, 2, this.cssW - tw - 2);
      const ty = b.y - th - 10 > 0 ? b.y - th - 10 : b.y + b.h + 10;
      V.Paint.rounded(ctx, tx, ty + 4, tw, th, th / 2);
      ctx.fillStyle = INK;
      ctx.fill();
      V.Paint.rounded(ctx, tx, ty, tw, th, th / 2);
      ctx.fillStyle = verdict.ok ? "#58cc5a" : "#ff7070";
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = INK;
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 4;
      ctx.lineJoin = "round";
      ctx.strokeText(label, tx + tw / 2, ty + th / 2 + 2);
      ctx.fillText(label, tx + tw / 2, ty + th / 2 + 2);
      ctx.restore();
    }

    moodOf(i, x, y) {
      const covering = this.paneAt(x, y);
      if (this.wonAt !== null) return this.time - this.wonAt > 1.2 ? "sleep" : "happy";
      if (covering && covering.ok && covering.clue === i) return this.time - covering.born > 1 ? "sleep" : "happy";
      if (covering && !covering.ok) return "angry";
      if (this.drag && this.drag.moved) {
        const r = Board.span(this.drag.start, this.drag.end);
        if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return "curious";
      }
      return (this.time + i * 1.37) % 3.6 < 0.14 ? "blink" : "idle";
    }

    drawCats(calm, intro) {
      const { ctx, cell } = this;
      this.puzzle.clues.forEach((clue, i) => {
        const x = clue.index % this.puzzle.w;
        const y = Math.floor(clue.index / this.puzzle.w);
        const mood = this.moodOf(i, x, y);
        let bob = 0;
        if (!calm) {
          // cats drop in one by one, then breathe
          const arrive = clamp((this.time - this.enterAt - i * 0.03) / 0.35, 0, 1);
          bob = (1 - easeBack(arrive)) * cell * 0.6;
          if (mood === "idle" || mood === "blink" || mood === "curious") bob += Math.abs(Math.sin(this.time * 2 + i)) * cell * 0.03;
          if (mood === "happy") bob += Math.abs(Math.sin(this.time * 9 + i)) * cell * 0.08;
          if (mood === "sleep") bob += Math.sin(this.time * 1.6 + i) * cell * 0.015;
        }
        const tagFill = mood === "angry" ? "#ffb3b3" : mood === "happy" || mood === "sleep" ? "#c6f7b8" : "#ffffff";
        const covering = this.paneAt(x, y);
        const pulse = covering && covering.ok && !calm ? 1 + 0.25 * Math.max(0, 1 - (this.time - covering.born) / 0.25) : 1;
        V.Paint.resident(ctx, this.ox + x * cell, this.oy + y * cell, cell, clue, this.colors[i].cat, mood, { bob, tagFill, tagScale: pulse });
        if (mood === "sleep" && !calm) this.drawZ(this.ox + (x + 0.72) * cell, this.oy + (y + 0.3) * cell, i);
        if (mood === "angry" && !calm) this.drawSteam(this.ox + (x + 0.2) * cell, this.oy + (y + 0.12) * cell);
      });
    }

    drawZ(x, y, i) {
      const { ctx, cell } = this;
      ctx.save();
      ctx.font = `800 ${cell * 0.24}px ${V.Paint.FONT}`;
      ctx.textAlign = "center";
      for (let k = 0; k < 2; k++) {
        const t = (this.time * 0.6 + k * 0.5 + i * 0.13) % 1;
        ctx.globalAlpha = Math.sin(t * Math.PI) * 0.9;
        ctx.fillStyle = "#6f4fe0";
        ctx.fillText("z", x + t * cell * 0.2, y - t * cell * 0.45);
      }
      ctx.restore();
    }

    drawSteam(x, y) {
      const { ctx, cell } = this;
      ctx.save();
      ctx.strokeStyle = "#e05a5a";
      ctx.lineWidth = Math.max(1.5, cell * 0.04);
      ctx.lineCap = "round";
      const t = this.time * 8;
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        const a = -Math.PI / 2 - 0.7 + k * 0.7 + Math.sin(t + k) * 0.08;
        ctx.moveTo(x + Math.cos(a) * cell * 0.08, y + Math.sin(a) * cell * 0.08);
        ctx.lineTo(x + Math.cos(a) * cell * 0.18, y + Math.sin(a) * cell * 0.18);
        ctx.stroke();
      }
      ctx.restore();
    }

    heart(x, y, r, color) {
      const { ctx } = this;
      ctx.beginPath();
      ctx.moveTo(x, y + r * 0.9);
      ctx.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.6, y - r * 1.3, x, y - r * 0.35);
      ctx.bezierCurveTo(x + r * 0.6, y - r * 1.3, x + r * 1.6, y - r * 0.2, x, y + r * 0.9);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = Math.max(1.2, r * 0.3);
      ctx.strokeStyle = INK;
      ctx.stroke();
    }

    drawFx(calm) {
      if (calm) return;
      const { ctx } = this;
      for (const f of this.fx) {
        if (f.age < 0) continue;
        const t = f.age / f.life;
        ctx.save();
        ctx.globalAlpha *= t > 0.7 ? (1 - t) / 0.3 : 1;
        if (f.kind === "puff") {
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r * (0.6 + t), 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = INK;
          ctx.stroke();
        } else if (f.kind === "heart") {
          this.heart(f.x, f.y, f.r, f.color || "#ff7fb5");
        } else {
          ctx.translate(f.x, f.y);
          ctx.rotate(f.rot);
          ctx.fillStyle = f.color;
          ctx.fillRect(-f.r, -f.r * 0.5, f.r * 2, f.r);
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = INK;
          ctx.strokeRect(-f.r, -f.r * 0.5, f.r * 2, f.r);
        }
        ctx.restore();
      }
    }

    drawCursor() {
      const at = this.cursor;
      if (!at) return;
      const { ctx } = this;
      const rect = this.anchor ? Board.span(this.anchor, at) : { x: at.x, y: at.y, w: 1, h: 1 };
      const b = this.area(rect);
      ctx.save();
      ctx.strokeStyle = "#2f86d6";
      ctx.lineWidth = 3;
      ctx.setLineDash(this.anchor ? [6, 4] : []);
      V.Paint.rounded(ctx, b.x + 2, b.y + 2, b.w - 4, b.h - 4, this.cell * 0.2);
      ctx.stroke();
      ctx.restore();
    }
  }

  V.Board = Board;
})(window.Purrfit);
