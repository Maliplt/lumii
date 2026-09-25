"use strict";
// the board in play
(function (B) {
  const A = B.Art;
  const { clamp, easeOut, easeBack } = B.util;
  const MARGIN = 0.24;
  const GAP = 0.45;
  const TRAY_ROWS = 3.2;

  class Stage {
    constructor(canvas, hooks = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.hooks = hooks;
      this.time = 0;
      this.drag = null;
      this.ghost = null;
      this.hint = null;
      this.reset();
      this.shake = 0;
      this.hammer = false;
      this.hover = null;
      this.n = B.SIZE;
      // a demo stage only shows the board: no tray, no input
      this.demo = Boolean(hooks.demo);
      // in play the canvas covers the whole window
      this.area = hooks.area || canvas;
      const area = this.area;
      area.addEventListener("pointerdown", (e) => this.down(e));
      area.addEventListener("pointermove", (e) => this.move(e));
      area.addEventListener("pointerup", (e) => this.up(e));
      area.addEventListener("pointercancel", (e) => this.up(e, true));
      area.addEventListener("pointerleave", () => (this.hover = null));
    }

    reset() {
      this.fx = [];
      this.parts = [];
      this.texts = [];
      this.flyers = [];
      this.debris = [];
      this.beams = [];
      this.placedAt = new Map();
    }

    load(session) {
      this.session = session;
      this.n = session.grid.size;
      this.reset();
      this.drag = null;
      this.ghost = null;
      this.hint = null;
      this.hammer = false;
      this.enterAt = this.time;
      this.trayAt = [this.time + 0.3, this.time + 0.38, this.time + 0.46];
      this.layout(true);
    }

    layout(force = false) {
      const w = this.canvas.clientWidth;
      const h = this.canvas.clientHeight;
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      let box = { left: 0, top: 0, width: w, height: h };
      if (this.area !== this.canvas) {
        const a = this.area.getBoundingClientRect();
        const c = this.canvas.getBoundingClientRect();
        box = { left: a.left - c.left, top: a.top - c.top, width: a.width, height: a.height };
      }
      const key = `${w}x${h}@${dpr}|${Math.round(box.left)},${Math.round(box.top)},${Math.round(box.width)},${Math.round(box.height)}`;
      if (!force && key === this.key) return;
      this.key = key;
      if (w !== this.w || h !== this.h || dpr !== this.dpr) {
        this.canvas.width = Math.max(1, Math.round(w * dpr));
        this.canvas.height = Math.max(1, Math.round(h * dpr));
      }
      this.w = w;
      this.h = h;
      this.dpr = dpr;
      const n = this.n;
      if (this.demo) {
        const cell = Math.max(8, Math.floor((Math.min(w, h) * 0.88) / (n + MARGIN * 2)));
        this.cell = cell;
        this.size = cell * n;
        this.bx = Math.round((w - this.size) / 2);
        this.by = Math.round((h - this.size) / 2);
        this.slots = [];
        return;
      }
      // the space is sized for an 8×8 board
      const frame = 8 + MARGIN * 2;
      const aw = box.width;
      const ah = box.height;
      const unit = Math.floor(Math.max(18, Math.min((aw - 20) / frame, (ah - 12) / (frame + GAP + TRAY_ROWS))));
      const cell = n >= 8 ? unit : Math.min(72, Math.floor((unit * frame) / (n + MARGIN * 2 + 0.3)));
      const area = unit * frame;
      const top = box.top + Math.max(4, Math.round((ah - area - unit * (GAP + TRAY_ROWS)) / 2));
      this.unit = unit;
      this.cell = cell;
      this.size = cell * n;
      this.bx = Math.round(box.left + (aw - this.size) / 2);
      this.by = Math.round(top + (area - this.size) / 2);
      this.trayY = top + area + unit * GAP;
      this.trayH = unit * TRAY_ROWS;
      this.trayW = area;
      this.trayX = Math.round(box.left + (aw - area) / 2);
      const slot = this.trayW / 3;
      this.slots = [0, 1, 2].map((i) => ({ x: this.trayX + i * slot, y: this.trayY, w: slot, h: this.trayH }));
    }

    // the demo on the menu plays silently
    sound(name, options) {
      if (!this.demo) B.Audio.play(name, options);
    }

    local(e) {
      const rect = this.canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    cellAt(x, y) {
      const gx = Math.floor((x - this.bx) / this.cell);
      const gy = Math.floor((y - this.by) / this.cell);
      return gx >= 0 && gy >= 0 && gx < this.n && gy < this.n ? [gx, gy] : null;
    }

    // where a cell's middle is, in canvas pixels
    cellCenter(x, y) {
      return { x: this.bx + (x + 0.5) * this.cell, y: this.by + (y + 0.5) * this.cell };
    }

    // size of a cell for the piece shown in a tray slot
    trayCell(piece) {
      const span = Math.max(piece.shape.w, piece.shape.h);
      return Math.min(this.unit * 0.62, (this.slots[0].w * 0.82) / span, (this.trayH * 0.8) / span);
    }

    down(e) {
      const s = this.session;
      if (this.demo || !s || s.over || this.drag) return;
      const p = this.local(e);
      if (this.hammer) {
        const at = this.cellAt(p.x, p.y);
        if (at) this.hooks.onHammer?.(at[0], at[1]);
        return;
      }
      const slot = this.slots.findIndex((r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y - this.unit * 0.4 && p.y <= r.y + r.h);
      if (slot < 0 || !s.tray[slot]) return;
      e.preventDefault();
      try {
        this.area.setPointerCapture(e.pointerId);
      } catch {
        // synthetic pointers cannot be captured
      }
      this.drag = { slot, id: e.pointerId, x: p.x, y: p.y, touch: e.pointerType === "touch", at: this.time };
      this.snap();
      this.sound("pick");
      this.hooks.onPick?.(slot);
    }

    move(e) {
      const p = this.local(e);
      if (this.hammer) this.hover = this.cellAt(p.x, p.y);
      if (!this.drag || e.pointerId !== this.drag.id) return;
      this.drag.x = p.x;
      this.drag.y = p.y;
      this.snap();
    }

    // top-left of the dragged piece in pixels
    dragOrigin() {
      const d = this.drag;
      const piece = this.session.tray[d.slot];
      const lift = d.touch ? this.cell * 1.7 : this.cell * 0.4;
      return { x: d.x - (piece.shape.w * this.cell) / 2, y: d.y - (piece.shape.h * this.cell) / 2 - lift };
    }

    snap() {
      const piece = this.session.tray[this.drag.slot];
      const o = this.dragOrigin();
      const gx = Math.round((o.x - this.bx) / this.cell);
      const gy = Math.round((o.y - this.by) / this.cell);
      const valid = this.session.canPlace(this.drag.slot, gx, gy);
      const before = this.ghost;
      this.ghost = valid ? { gx, gy, piece, lines: this.previewLines(piece, gx, gy) } : null;
      if (this.ghost && (!before || before.gx !== gx || before.gy !== gy)) this.sound("tick");
    }

    previewLines(piece, gx, gy) {
      const grid = this.session.grid.clone();
      grid.place(piece.shape, gx, gy, piece.color);
      return grid.fullLines();
    }

    up(e, cancel = false) {
      if (!this.drag || e.pointerId !== this.drag.id) return;
      const { slot } = this.drag;
      const ghost = this.ghost;
      const o = this.dragOrigin();
      this.drag = null;
      this.ghost = null;
      if (!cancel && ghost) {
        const events = this.session.place(slot, ghost.gx, ghost.gy);
        this.play(events);
        this.hooks.onPlace?.(events);
      } else {
        this.fx.push({ kind: "return", slot, from: o, born: this.time });
        this.sound("miss");
      }
    }

    // ---------- events into motion ----------

    play(events) {
      const c = this.cell;
      let origin = null;
      const spotless = events.some((e) => e.type === "perfect");
      for (const ev of events) {
        if (ev.type === "place") this.landed(ev, (o) => (origin = o));
        else if (ev.type === "clear") this.cleared(ev, origin || { x: this.bx + this.size / 2, y: this.by + this.size / 2 }, spotless);
        else if (ev.type === "blast") this.blasted(ev);
        else if (ev.type === "goal") this.fly(ev.goal, ev.source);
        else if (ev.type === "perfect") {
          this.text(B.t("play.perfect"), this.bx + this.size / 2, this.by + this.size * 0.62, c * 1.4, "perfect", 0.55);
          for (let k = 0; k < 70; k++) this.confetti(this.bx + this.size / 2, this.by + this.size / 2);
          this.fx.push({ kind: "shock", x: this.bx + this.size / 2, y: this.by + this.size / 2, born: this.time + 0.3, reach: 7 });
          this.sound("perfect");
        } else if (ev.type === "deal") {
          this.trayAt = [this.time + 0.08, this.time + 0.16, this.time + 0.24];
          this.sound("deal");
        } else if (ev.type === "rescue") {
          this.text(B.t("play.rescue"), this.bx + this.size / 2, this.by + this.size / 2, c * 0.9, "cheer", 0.2);
        } else if (ev.type === "smash") {
          this.debris.push({ x: ev.x, y: ev.y, cell: ev.cell, born: this.time + 0.18 });
          this.fx.push({ kind: "hammer", x: ev.x, y: ev.y, born: this.time });
          this.shake = 0.5;
          this.sound("smash");
        } else if (ev.type === "comboLost") {
          this.sound("comboLost");
        }
      }
    }

    landed(ev, setOrigin) {
      const c = this.cell;
      const xs = ev.cells.map(([x]) => x);
      const ys = ev.cells.map(([, y]) => y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs) + 1;
      const maxY = Math.max(...ys) + 1;
      setOrigin({ x: this.bx + ((minX + maxX) / 2) * c, y: this.by + ((minY + maxY) / 2) * c });
      ev.cells.forEach(([x, y], i) => {
        this.placedAt.set(`${x},${y}`, this.time + i * 0.015);
        const p = this.cellCenter(x, y);
        for (let k = 0; k < 2; k++) this.spark(p.x + (Math.random() - 0.5) * c * 0.8, p.y + c * 0.45, A.BLOCK[ev.piece.color][0], 0.5);
      });
      this.fx.push({ kind: "ring", x: this.bx + minX * c, y: this.by + minY * c, w: (maxX - minX) * c, h: (maxY - minY) * c, color: A.BLOCK[ev.piece.color][0], born: this.time });
      this.sound("place", { size: ev.piece.shape.size });
    }

    cleared(ev, origin, spotless = false) {
      const c = this.cell;
      const lines = ev.lines.count;
      for (const r of ev.result.removed) {
        const p = this.cellCenter(r.x, r.y);
        const delay = Math.hypot(p.x - origin.x, p.y - origin.y) / (c * 20);
        this.debris.push({ x: r.x, y: r.y, cell: r.cell, born: this.time + delay });
      }
      for (const r of ev.result.cracked) {
        const p = this.cellCenter(r.x, r.y);
        for (let k = 0; k < 6; k++) this.shard(p.x, p.y, "ghost");
        this.sound("crack");
      }
      for (const y of ev.lines.rows) this.beams.push({ row: y, born: this.time, o: origin.x });
      for (const x of ev.lines.cols) this.beams.push({ col: x, born: this.time, o: origin.y });
      if (lines >= 2) this.fx.push({ kind: "shock", x: origin.x, y: origin.y, born: this.time, reach: 3 + lines });
      this.shake = Math.min(0.9, 0.2 + lines * 0.16);
      this.text(`+${B.util.number(ev.points)}`, origin.x, origin.y - c * 0.3, c * (0.85 + Math.min(4, lines) * 0.12), "score", 0);
      if (ev.combo >= 2) this.text(B.t("play.combo", { n: ev.combo }), this.bx + this.size / 2, this.by + this.size * 0.3, c * 1.1, "combo", 0.08);
      if (lines >= 2 && !spotless) this.text(B.t(`play.cheer${Math.min(4, lines)}`), this.bx + this.size / 2, this.by + this.size * 0.56, c * 1.0, "cheer", 0.16);
      for (const perk of ev.perks || []) {
        const p = this.cellCenter(perk.x, perk.y);
        this.fx.push({ kind: "burst", x: p.x, y: p.y, born: this.time + 0.1, color: perk.perk === "bomb" ? "#ff8a1f" : "#ffd000" });
        for (let k = 0; k < 14; k++) this.spark(p.x, p.y, perk.perk === "bomb" ? "#ffb070" : "#ffe27a", 1.4);
        if (perk.perk === "double") this.text("×2", p.x, p.y - c * 0.7, c * 1.2, "perk", 0.15);
        if (perk.perk === "star") this.text(`+${B.Scoring.STAR * ev.combo}`, p.x, p.y - c * 0.7, c * 0.9, "perk", 0.15);
      }
      if (ev.perks?.length) this.sound("perk");
      if (ev.result.crates) this.sound("crate");
      this.sound("clear", { lines, combo: ev.combo });
    }

    blasted(ev) {
      const p = this.cellCenter(ev.x, ev.y);
      this.fx.push({ kind: "flash", x: p.x, y: p.y, born: this.time + 0.05 });
      this.fx.push({ kind: "shock", x: p.x, y: p.y, born: this.time + 0.05, reach: 2.5 });
      for (const r of ev.result.removed) this.debris.push({ x: r.x, y: r.y, cell: r.cell, born: this.time + 0.1 + Math.random() * 0.06 });
      this.shake = 1;
      this.sound("smash");
    }

    fly(goal, source) {
      const target = this.hooks.goalTarget?.(goal);
      if (!target) {
        this.hooks.onGoal?.(goal);
        return;
      }
      const list = source.length ? source : [{ x: this.n / 2 - 0.5, y: this.n / 2 - 0.5, cell: null }];
      list.forEach((r, i) => {
        this.flyers.push({ from: this.cellCenter(r.x, r.y), to: target, born: this.time + 0.25 + i * 0.07, goal, last: i === list.length - 1 });
      });
    }

    text(text, x, y, size, kind, delay) {
      this.texts.push({ text, x, y, size, kind, born: this.time + delay });
    }

    // ---------- particles ----------

    spark(x, y, color, power = 1) {
      const a = Math.random() * Math.PI * 2;
      const v = this.cell * (1.5 + Math.random() * 3) * power;
      this.parts.push({ kind: "spark", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - this.cell * 1.5, g: 6, born: this.time, life: 0.45 + Math.random() * 0.35, size: this.cell * (0.05 + Math.random() * 0.05), color });
    }

    shard(x, y, color) {
      const a = Math.random() * Math.PI * 2;
      const v = this.cell * (2.5 + Math.random() * 4.5);
      this.parts.push({ kind: "shard", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - this.cell * 4, g: 24, born: this.time, life: 0.9 + Math.random() * 0.4, size: this.cell * (0.16 + Math.random() * 0.14), color, rot: a, vr: (Math.random() - 0.5) * 14 });
    }

    confetti(x, y) {
      const colors = Object.keys(A.BLOCK).slice(0, 8);
      this.shard(x, y, colors[Math.floor(Math.random() * colors.length)]);
      const last = this.parts[this.parts.length - 1];
      last.vx *= 1.8;
      last.vy *= 1.5;
      last.life = 1.6;
    }

    update(dt) {
      this.time += dt;
      this.shake = Math.max(0, this.shake - dt * 3);
      for (const p of this.parts) {
        p.vy += p.g * this.cell * dt;
        p.vx *= 1 - dt * 1.5;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.rot !== undefined) p.rot += p.vr * dt;
      }
      this.parts = this.parts.filter((p) => this.time - p.born < p.life);
      this.fx = this.fx.filter((f) => this.time - f.born < (f.kind === "return" ? 0.25 : 0.7));
      this.texts = this.texts.filter((t) => this.time - t.born < 1.2);
      this.beams = this.beams.filter((b) => this.time - b.born < 0.55);
      for (const d of this.debris) {
        if (!d.burst && this.time >= d.born) {
          d.burst = true;
          const p = this.cellCenter(d.x, d.y);
          const color = d.cell.kind === "block" ? d.cell.color : d.cell.kind === "crate" ? "tangerine" : d.cell.kind === "ice" ? "sky" : "ghost";
          for (let k = 0; k < 4; k++) this.shard(p.x, p.y, color);
          for (let k = 0; k < 3; k++) this.spark(p.x, p.y, A.BLOCK[color][0], 1.2);
        }
      }
      this.debris = this.debris.filter((d) => this.time - d.born < 0.3);
      for (const f of this.flyers) {
        if (!f.done && this.time - f.born > 0.55) {
          f.done = true;
          this.sound("gem");
          if (f.last) this.hooks.onGoal?.(f.goal);
        }
      }
      this.flyers = this.flyers.filter((f) => !f.done);
    }

    // ---------- drawing ----------

    draw() {
      if (!this.session) return;
      this.layout();
      const { ctx, dpr, cell, bx, by } = this;
      const calm = B.dom.calm();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, this.w, this.h);
      const intro = calm ? 1 : easeOut(clamp((this.time - this.enterAt) / 0.55, 0, 1));
      const sx = calm ? 0 : Math.sin(this.time * 70) * this.shake * cell * 0.1;
      const sy = calm ? 0 : Math.cos(this.time * 61) * this.shake * cell * 0.08;
      ctx.save();
      ctx.translate(sx, sy + (1 - intro) * cell * 1.5);
      ctx.globalAlpha = intro;
      A.board(ctx, bx, by, cell, this.n);
      ctx.globalAlpha = 1;
      this.drawHint();
      this.drawGrid();
      this.drawGhost();
      this.drawDebris();
      this.drawBeams();
      ctx.restore();
      if (!this.demo) {
        A.tray(ctx, this.trayX, this.trayY, this.trayW, this.trayH, this.unit * 0.45);
        this.drawTray(intro);
      }
      this.drawFx();
      this.drawParts();
      this.drawDrag();
      this.drawTexts();
      this.drawFlyers();
    }

    drawGrid() {
      const { ctx, cell, bx, by } = this;
      const grid = this.session.grid;
      const glow = this.ghost ? this.ghost.lines : null;
      const pulse = (Math.sin(this.time * 9) + 1) / 2;
      for (let y = 0; y < this.n; y++) {
        for (let x = 0; x < this.n; x++) {
          const c = grid.at(x, y);
          if (!c) continue;
          const born = this.placedAt.get(`${x},${y}`);
          let scale = 1;
          let flash = 0;
          if (born !== undefined) {
            const t = (this.time - born) / 0.26;
            if (t < 0) continue;
            if (t < 1) {
              scale = 1 + 0.16 * (1 - easeOut(t));
              flash = 0.5 * (1 - t);
            }
          }
          const lit = glow && (glow.rows.includes(y) || glow.cols.includes(x));
          A.cell(ctx, bx + x * cell, by + y * cell, cell, c, { scale, glow: lit ? 0.25 + pulse * 0.35 : flash, time: this.time });
        }
      }
    }

    // in a lesson: the cells where the next piece belongs, softly pulsing
    drawHint() {
      const h = this.hint;
      if (!h || this.drag) return;
      const piece = this.session.tray[h.slot];
      if (!piece) return;
      const { ctx, cell, bx, by } = this;
      const a = 0.35 + (Math.sin(this.time * 5) + 1) * 0.2;
      ctx.save();
      ctx.strokeStyle = `rgba(255,255,255,${a})`;
      ctx.fillStyle = `rgba(255,255,255,${a * 0.18})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([cell * 0.14, cell * 0.1]);
      for (const [cx, cy] of piece.shape.cells) {
        A.rr(ctx, bx + (h.x + cx) * cell + cell * 0.1, by + (h.y + cy) * cell + cell * 0.1, cell * 0.8, cell * 0.8, cell * 0.12);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    drawGhost() {
      const g = this.ghost;
      if (!g) return;
      const { ctx, cell, bx, by, size } = this;
      const color = A.BLOCK[g.piece.color][1];
      ctx.save();
      ctx.fillStyle = A.rgba(color, 0.14);
      for (const y of g.lines.rows) {
        A.rr(ctx, bx, by + y * cell, size, cell, cell * 0.12);
        ctx.fill();
      }
      for (const x of g.lines.cols) {
        A.rr(ctx, bx + x * cell, by, cell, size, cell * 0.12);
        ctx.fill();
      }
      ctx.restore();
      g.piece.shape.cells.forEach(([cx, cy], i) =>
        A.block(ctx, bx + (g.gx + cx) * cell, by + (g.gy + cy) * cell, cell, g.piece.color, { alpha: 0.38, gem: g.piece.gems[i] || null, perk: g.piece.perks?.[i] || null, time: this.time }),
      );
    }

    drawDebris() {
      const { ctx, cell, bx, by } = this;
      for (const d of this.debris) {
        const t = this.time - d.born;
        const x = bx + d.x * cell;
        const y = by + d.y * cell;
        if (t < 0) {
          A.cell(ctx, x, y, cell, d.cell, { glow: 0.35, time: this.time });
          continue;
        }
        const k = clamp(t / 0.22, 0, 1);
        const scale = k < 0.3 ? 1 + k * 0.5 : 1.15 * (1 - (k - 0.3) / 0.7);
        A.cell(ctx, x, y, cell, d.cell, { scale, glow: 1 - k * 0.5, alpha: 1 - k * 0.4, time: this.time });
      }
    }

    // a beam of light runs out along each cleared line from where the piece landed
    drawBeams() {
      const { ctx, cell, bx, by, size } = this;
      if (!this.beams.length) return;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const b of this.beams) {
        const t = (this.time - b.born) / 0.55;
        const reach = size * Math.min(1, easeOut(t * 1.8));
        const fade = t < 0.2 ? 1 : Math.max(0, 1 - (t - 0.2) / 0.6);
        const thick = cell * (0.5 + t * 0.7);
        if (b.row !== undefined) {
          const cy = by + (b.row + 0.5) * cell;
          const g = ctx.createLinearGradient(0, cy - thick / 2, 0, cy + thick / 2);
          g.addColorStop(0, "rgba(255,255,255,0)");
          g.addColorStop(0.5, `rgba(255,236,170,${0.6 * fade})`);
          g.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = g;
          const x0 = Math.max(bx, b.o - reach);
          const x1 = Math.min(bx + size, b.o + reach);
          ctx.fillRect(x0, cy - thick / 2, x1 - x0, thick);
        } else {
          const cx = bx + (b.col + 0.5) * cell;
          const g = ctx.createLinearGradient(cx - thick / 2, 0, cx + thick / 2, 0);
          g.addColorStop(0, "rgba(255,255,255,0)");
          g.addColorStop(0.5, `rgba(255,236,170,${0.6 * fade})`);
          g.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = g;
          const y0 = Math.max(by, b.o - reach);
          const y1 = Math.min(by + size, b.o + reach);
          ctx.fillRect(cx - thick / 2, y0, thick, y1 - y0);
        }
      }
      ctx.restore();
    }

    drawTray(intro) {
      const { ctx } = this;
      const s = this.session;
      s.tray.forEach((piece, i) => {
        if (!piece || (this.drag && this.drag.slot === i)) return;
        if (this.fx.some((f) => f.kind === "return" && f.slot === i)) return;
        const slot = this.slots[i];
        const tc = this.trayCell(piece);
        const pop = B.dom.calm() ? 1 : easeBack(clamp((this.time - this.trayAt[i]) / 0.32, 0, 1));
        if (pop <= 0) return;
        const fits = s.grid.anyFit(piece.shape);
        const pw = piece.shape.w * tc;
        const ph = piece.shape.h * tc;
        const ox = slot.x + slot.w / 2 - pw / 2;
        const oy = slot.y + slot.h / 2 - ph / 2;
        ctx.save();
        ctx.translate(slot.x + slot.w / 2, slot.y + slot.h / 2);
        ctx.scale(pop * intro, pop * intro);
        ctx.translate(-(slot.x + slot.w / 2), -(slot.y + slot.h / 2));
        piece.shape.cells.forEach(([cx, cy], k) =>
          A.block(ctx, ox + cx * tc, oy + cy * tc, tc, fits ? piece.color : "ghost", { alpha: fits ? 1 : 0.7, gem: piece.gems[k] || null, perk: piece.perks?.[k] || null, time: this.time }),
        );
        ctx.restore();
      });
    }

    drawDrag() {
      const { ctx, cell } = this;
      if (this.drag) {
        const piece = this.session.tray[this.drag.slot];
        const o = this.dragOrigin();
        const grow = B.dom.calm() ? 1 : easeOut(clamp((this.time - this.drag.at) / 0.12, 0, 1));
        const size = this.trayCell(piece) + (cell - this.trayCell(piece)) * grow;
        const cx = o.x + (piece.shape.w * cell) / 2;
        const cy = o.y + (piece.shape.h * cell) / 2;
        const ox = cx - (piece.shape.w * size) / 2;
        const oy = cy - (piece.shape.h * size) / 2;
        ctx.save();
        ctx.fillStyle = "rgba(12,27,77,0.4)";
        piece.shape.cells.forEach(([x, y]) => {
          A.rr(ctx, ox + x * size + size * 0.12, oy + y * size + size * 0.3, size * 0.9, size * 0.9, size * 0.12);
          ctx.fill();
        });
        ctx.restore();
        piece.shape.cells.forEach(([x, y], k) => A.block(ctx, ox + x * size, oy + y * size, size, piece.color, { gem: piece.gems[k] || null, perk: piece.perks?.[k] || null, time: this.time }));
      }
      for (const f of this.fx) {
        if (f.kind !== "return") continue;
        const piece = this.session.tray[f.slot];
        if (!piece) continue;
        const slot = this.slots[f.slot];
        const tc = this.trayCell(piece);
        const t = easeOut(clamp((this.time - f.born) / 0.25, 0, 1));
        const size = cell + (tc - cell) * t;
        const tx = slot.x + slot.w / 2 - (piece.shape.w * tc) / 2;
        const ty = slot.y + slot.h / 2 - (piece.shape.h * tc) / 2;
        const ox = f.from.x + (tx - f.from.x) * t;
        const oy = f.from.y + (ty - f.from.y) * t;
        piece.shape.cells.forEach(([x, y], k) => A.block(ctx, ox + x * size, oy + y * size, size, piece.color, { gem: piece.gems[k] || null, perk: piece.perks?.[k] || null, time: this.time }));
      }
      if (this.hammer && this.hover) {
        const [x, y] = this.hover;
        const c = this.session.grid.at(x, y);
        ctx.save();
        ctx.strokeStyle = c && c.kind !== "stone" ? "#ffffff" : "rgba(255,255,255,0.35)";
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 5]);
        A.rr(ctx, this.bx + x * cell + 2, this.by + y * cell + 2, cell - 4, cell - 4, cell * 0.12);
        ctx.stroke();
        ctx.restore();
      }
    }

    drawFx() {
      const { ctx, cell } = this;
      for (const f of this.fx) {
        const age = this.time - f.born;
        if (age < 0) continue;
        if (f.kind === "ring") {
          const t = clamp(age / 0.35, 0, 1);
          const pad = cell * (0.05 + easeOut(t) * 0.35);
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.strokeStyle = A.rgba(f.color, 0.7 * (1 - t));
          ctx.lineWidth = Math.max(1, cell * 0.08 * (1 - t));
          A.rr(ctx, f.x - pad, f.y - pad, f.w + pad * 2, f.h + pad * 2, cell * 0.2);
          ctx.stroke();
          ctx.restore();
        } else if (f.kind === "shock") {
          const t = clamp(age / 0.6, 0, 1);
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - t)})`;
          ctx.lineWidth = cell * 0.25 * (1 - t);
          ctx.beginPath();
          ctx.arc(f.x, f.y, cell * (0.4 + easeOut(t) * f.reach), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else if (f.kind === "flash" || f.kind === "burst") {
          const t = clamp(age / 0.4, 0, 1);
          const r = cell * (f.kind === "flash" ? 2.2 : 1.1) * (0.5 + easeOut(t) * 0.8);
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r);
          g.addColorStop(0, `rgba(255,255,235,${0.9 * (1 - t)})`);
          g.addColorStop(0.4, A.rgba(f.color || "#ff8a1f", 0.55 * (1 - t)));
          g.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = g;
          ctx.fillRect(f.x - r, f.y - r, r * 2, r * 2);
          ctx.restore();
        } else if (f.kind === "hammer") {
          const t = clamp(age / 0.3, 0, 1);
          const px = this.bx + (f.x + 0.8) * cell;
          const py = this.by + (f.y + 0.1) * cell;
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(-1.2 + t * 1.4);
          ctx.fillStyle = "#8a5a33";
          ctx.fillRect(-cell * 0.08, 0, cell * 0.16, cell * 0.9);
          ctx.fillStyle = "#b8bfcc";
          A.rr(ctx, -cell * 0.35, -cell * 0.15, cell * 0.7, cell * 0.32, cell * 0.08);
          ctx.fill();
          ctx.restore();
        }
      }
    }

    drawParts() {
      const { ctx } = this;
      for (const p of this.parts) {
        if (p.kind !== "shard") continue;
        const k = (this.time - p.born) / p.life;
        const c = A.BLOCK[p.color] || A.BLOCK.ghost;
        ctx.save();
        ctx.globalAlpha = clamp((1 - k) * 1.6, 0, 1);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        const s = p.size * (1 - k * 0.4);
        ctx.fillStyle = c[2];
        ctx.fillRect(-s / 2, -s / 2, s, s);
        ctx.fillStyle = c[0];
        ctx.fillRect(-s / 2, -s / 2, s, s * 0.45);
        ctx.restore();
      }
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const p of this.parts) {
        if (p.kind !== "spark") continue;
        const a = 1 - (this.time - p.born) / p.life;
        ctx.fillStyle = A.rgba(p.color, 0.3 * a);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    drawTexts() {
      const STYLE = {
        score: { fill: "#ffffff", rise: 1.1 },
        combo: { fill: "#ffc42e", rise: 0.35, angle: -0.04 },
        cheer: { fill: "#5fe3ff", rise: 0.3, angle: 0.03 },
        perk: { fill: "#ffd84a", rise: 0.9 },
        perfect: { rainbow: true, rise: 0 },
      };
      for (const t of this.texts) {
        const age = this.time - t.born;
        if (age < 0) continue;
        const style = STYLE[t.kind] || STYLE.score;
        const k = clamp(age / 1.2, 0, 1);
        const pop = easeBack(clamp(age / 0.28, 0, 1));
        const alpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
        A.shout(this.ctx, t.text, t.x, t.y - easeOut(k) * this.cell * style.rise, t.size, { alpha, scale: pop, fill: style.fill, rainbow: style.rainbow, angle: style.angle || 0, bounds: [10, this.w - 10] });
      }
    }

    drawFlyers() {
      const { ctx } = this;
      for (const f of this.flyers) {
        if (this.time < f.born) continue;
        const t = clamp((this.time - f.born) / 0.55, 0, 1);
        const k = easeOut(t);
        const mx = (f.from.x + f.to.x) / 2 + this.cell * 2;
        const my = Math.min(f.from.y, f.to.y) - this.cell * 2;
        const x = (1 - k) * (1 - k) * f.from.x + 2 * (1 - k) * k * mx + k * k * f.to.x;
        const y = (1 - k) * (1 - k) * f.from.y + 2 * (1 - k) * k * my + k * k * f.to.y;
        const r = this.cell * (0.4 - t * 0.12);
        if (f.goal.type === "gems") A.gemIcon(ctx, x, y, r, f.goal.gem);
        else if (f.goal.type === "crates") A.crate(ctx, x - r, y - r, r * 2);
        else if (f.goal.type === "ice") A.ice(ctx, x - r, y - r, r * 2, 2);
        else A.sparkle(ctx, x, y, r, "#ffd000");
      }
    }
  }

  B.Stage = Stage;
})(window.Blockhaven);
