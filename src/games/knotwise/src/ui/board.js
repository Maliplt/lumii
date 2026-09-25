"use strict";
// the page in play
(function (K) {
  const G = K.Geo;
  const P = K.Paper;
  const { clamp, lerp, easeInOut, easeOut } = K.util;
  const REVEAL = 2.6;
  const BAND = "#ff8fb3";

  class Board {
    constructor(canvas, events = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.events = events;
      this.time = 0;
      this.puzzle = null;
      this.drag = null;
      this.hover = -1;
      this.pointer = null;
      this.fx = [];
      this.lastUntie = 0;
      canvas.addEventListener("pointerdown", (e) => this.down(e));
      canvas.addEventListener("pointermove", (e) => this.move(e));
      canvas.addEventListener("pointerup", (e) => this.up(e));
      canvas.addEventListener("pointercancel", (e) => this.up(e, true));
      canvas.addEventListener("pointerleave", () => {
        this.hover = -1;
        this.pointer = null;
      });
    }

    load(puzzle, accent = "#ff8a7a") {
      this.puzzle = puzzle;
      this.accent = accent;
      this.pos = puzzle.nodes.map((n) => ({ ...n.start }));
      this.vis = this.pos.map((p) => ({ ...p }));
      this.pinned = puzzle.nodes.map((n) => n.pin);
      this.pinnedAt = puzzle.nodes.map(() => -10);
      this.squashAt = puzzle.nodes.map(() => -10);
      this.colors = puzzle.nodes.map((_, i) => P.BEADS[(i * 3 + puzzle.motif.length) % P.BEADS.length]);
      this.phase = puzzle.nodes.map((_, i) => (i * 1.37) % 3.7);
      this.colored = puzzle.edges.some((e) => e.color > 0);
      this.history = [];
      this.moves = 0;
      this.hints = 0;
      this.dropTotal = null;
      this.drag = null;
      this.fx = [];
      this.wonAt = null;
      this.finished = false;
      this.enterAt = this.time;
      this.layout(true);
      this.start = this.stretch(puzzle.nodes.map((n) => ({ ...n.start })));
      this.pos = this.start.map((p) => ({ ...p }));
      this.vis = this.pos.map((p) => ({ ...p }));
      this.state = G.judge(puzzle, this.pos);
      this.initial = Math.max(1, this.state.total);
    }

    // spreads the opening layout along the long side of the page
    stretch(start) {
      const free = start.filter((_, i) => !this.puzzle.nodes[i].pin);
      if (!free.length) return start;
      const reach = (axis) => Math.max(0.2, ...free.map((p) => Math.abs(p[axis])));
      const room = this.bound({ x: 9, y: 9 });
      // scaling each axis on its own keeps every crossing as it was
      const kx = clamp((room.x * 0.92) / reach("x"), 1, 2.6);
      const ky = clamp((room.y * 0.92) / reach("y"), 1, 2.6);
      const out = start.map((p, i) => (this.puzzle.nodes[i].pin ? p : this.bound({ x: p.x * kx, y: p.y * ky })));
      return G.judge(this.puzzle, out).total ? out : start;
    }

    layout(force = false) {
      const w = this.canvas.clientWidth;
      const h = this.canvas.clientHeight;
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      if (!force && w === this.cw && h === this.ch && dpr === this.dpr) return;
      this.cw = w;
      this.ch = h;
      this.dpr = dpr;
      this.canvas.width = Math.max(1, Math.round(w * dpr));
      this.canvas.height = Math.max(1, Math.round(h * dpr));
      // the sheet fills the space, leaving room for its shadow and tape
      this.sheet = { x: 6, y: 14, w: Math.max(60, w - 20), h: Math.max(60, h - 30) };
      this.cx = this.sheet.x + this.sheet.w / 2;
      this.cy = this.sheet.y + this.sheet.h / 2;
      this.s = (Math.min(this.sheet.w, this.sheet.h) / 2) * 0.94;
      this.poly = null;
    }

    toPx(p) {
      return { x: this.cx + p.x * this.s, y: this.cy + p.y * this.s };
    }

    toBoard(x, y) {
      return { x: (x - this.cx) / this.s, y: (y - this.cy) / this.s };
    }

    get radius() {
      return clamp(G.beadRadius(this.pos.length) * this.s * 1.1, 13, 30);
    }

    get lineWidth() {
      return clamp(this.s * 0.012, 2.4, 4.2);
    }

    get busy() {
      return this.wonAt !== null;
    }

    // keeps a bead inside the sheet
    bound(p) {
      const r = this.radius + 6;
      const mx = (this.sheet.w / 2 - r) / this.s;
      const my = (this.sheet.h / 2 - r) / this.s;
      return { x: clamp(p.x, -mx, mx), y: clamp(p.y, -my, my) };
    }

    local(e) {
      const rect = this.canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    nodeAt(x, y) {
      const reach = Math.max(this.radius * 1.45, 24);
      let best = -1;
      let bestD = reach;
      this.vis.forEach((p, i) => {
        const q = this.toPx(p);
        const d = Math.hypot(q.x - x, q.y - y);
        if (d < bestD) {
          best = i;
          bestD = d;
        }
      });
      return best;
    }

    down(e) {
      if (!this.puzzle || this.busy || this.drag) return;
      const { x, y } = this.local(e);
      const i = this.nodeAt(x, y);
      if (i < 0) return;
      e.preventDefault();
      if (this.pinned[i]) {
        this.fx.push({ kind: "shake", node: i, born: this.time });
        K.Audio.play("locked");
        return;
      }
      try {
        this.canvas.setPointerCapture(e.pointerId);
      } catch {
        // synthetic or already released pointers cannot be captured
      }
      const q = this.toPx(this.pos[i]);
      this.drag = { node: i, id: e.pointerId, from: { ...this.pos[i] }, dx: q.x - x, dy: q.y - y, moved: false, touch: e.pointerType === "touch", start: { x, y } };
      K.Audio.play("pick");
      this.events.onPick?.(i);
    }

    move(e) {
      const { x, y } = this.local(e);
      this.pointer = { x, y };
      if (!this.drag) {
        if (e.pointerType === "mouse") this.hover = this.busy ? -1 : this.nodeAt(x, y);
        return;
      }
      if (e.pointerId !== this.drag.id) return;
      // under a finger the bead rises a little so it stays in sight
      const lift = this.drag.touch ? Math.min(this.radius + 18, Math.hypot(x - this.drag.start.x, y - this.drag.start.y)) : 0;
      const p = this.bound(this.toBoard(x + this.drag.dx, y + this.drag.dy - lift));
      const i = this.drag.node;
      if (!this.drag.moved && G.dist(p, this.drag.from) * this.s > 3) this.drag.moved = true;
      this.pos[i] = p;
      this.vis[i] = { ...p };
      this.rejudge(false);
    }

    up(e, cancel = false) {
      if (!this.drag || e.pointerId !== this.drag.id) return;
      const { node, from, moved } = this.drag;
      this.drag = null;
      if (cancel && moved) {
        this.pos[node] = from;
        this.rejudge(false);
        return;
      }
      if (moved) {
        this.history.push({ node, from, to: { ...this.pos[node] } });
        this.moves++;
        const before = this.dropTotal ?? this.initial;
        this.rejudge(true);
        K.Audio.play(this.state.total > before ? "tangle" : "drop");
        this.dropTotal = this.state.total;
        this.squashAt[node] = this.time;
      }
      this.events.onChange?.();
      this.checkWin();
    }

    // recomputes tangles and plays the small rewards for undoing some
    rejudge(dropped) {
      const before = this.state;
      this.state = G.judge(this.puzzle, this.pos);
      const now = new Set(this.state.crossings.map((c) => `${c.i}-${c.j}`));
      for (const c of before.crossings) {
        if (now.has(`${c.i}-${c.j}`)) continue;
        if (this.fx.length < 80) this.fx.push({ kind: "pop", at: { x: c.x, y: c.y }, born: this.time, seed: c.i * 31 + c.j });
      }
      if (this.state.total < before.total && this.time - this.lastUntie > 0.07) {
        this.lastUntie = this.time;
        K.Audio.play("untie", { step: Math.round((1 - this.state.total / this.initial) * 9) });
      }
      if (dropped || this.state.total !== before.total) this.events.onChange?.();
    }

    checkWin() {
      if (this.state.total || this.busy || this.drag) return;
      this.wonAt = this.time;
      this.homeFrom = this.vis.map((p) => ({ ...p }));
      K.Audio.play("win");
      setTimeout(() => K.Audio.play("reveal"), 950);
      this.events.onSolved?.();
    }

    burst() {
      const top = this.toBoard(this.cx, this.sheet.y);
      for (let k = 0; k < 70; k++) {
        const side = k % 2 ? 1 : -1;
        this.fx.push({
          kind: "confetti",
          at: { x: side * (0.2 + (k % 7) * 0.08), y: top.y + 0.1 },
          v: { x: side * (0.3 + ((k * 37) % 10) / 12), y: -1.1 - ((k * 13) % 10) / 9 },
          born: this.time + (k % 10) * 0.012,
          hue: k,
          spin: k * 0.7,
        });
      }
    }

    undo() {
      if (this.busy || this.drag) return false;
      let step = this.history.pop();
      // moves of a bead that has since been pinned stay as they are
      while (step && this.pinned[step.node]) step = this.history.pop();
      if (!step) return false;
      this.pos[step.node] = { ...step.from };
      this.squashAt[step.node] = this.time;
      this.rejudge(true);
      this.dropTotal = this.state.total;
      K.Audio.play("undo");
      this.events.onChange?.();
      return true;
    }

    reset() {
      if (this.busy) return;
      this.pos = this.start.map((p, i) => (this.pinned[i] ? { ...this.pos[i] } : { ...p }));
      this.history = [];
      this.moves = 0;
      this.dropTotal = null;
      this.squashAt = this.squashAt.map(() => this.time);
      this.rejudge(true);
      this.events.onChange?.();
    }

    // pins the most tangled free bead onto its place in the picture
    hint() {
      if (this.busy || this.drag) return false;
      const blame = new Array(this.pos.length).fill(0);
      for (const i of this.state.bad) {
        blame[this.puzzle.edges[i].a]++;
        blame[this.puzzle.edges[i].b]++;
      }
      for (const t of this.state.touches) blame[t.node] += 2;
      const near = new Array(this.pos.length).fill(0);
      for (const e of this.puzzle.edges) {
        if (this.pinned[e.a]) near[e.b]++;
        if (this.pinned[e.b]) near[e.a]++;
      }
      let best = -1;
      let score = -1;
      this.puzzle.nodes.forEach((node, i) => {
        if (this.pinned[i]) return;
        const s = blame[i] * 2 + near[i] * 3 + 1;
        if (s > score) {
          score = s;
          best = i;
        }
      });
      if (best < 0) return false;
      this.pos[best] = { ...this.puzzle.nodes[best].home };
      this.pinned[best] = true;
      this.pinnedAt[best] = this.time + 0.35;
      this.hints++;
      K.Audio.play("hint");
      setTimeout(() => K.Audio.play("pin"), 380);
      this.rejudge(true);
      this.dropTotal = this.state.total;
      setTimeout(() => this.checkWin(), 520);
      return true;
    }

    // a single good move for the tutorial hand: [from, to] in page pixels
    suggestion() {
      let best = null;
      this.pos.forEach((p, i) => {
        if (this.pinned[i]) return;
        const nb = this.puzzle.edges.filter((e) => e.a === i || e.b === i).map((e) => this.pos[e.a === i ? e.b : e.a]);
        if (!nb.length) return;
        const target = { x: nb.reduce((s, q) => s + q.x, 0) / nb.length, y: nb.reduce((s, q) => s + q.y, 0) / nb.length };
        const trial = this.pos.slice();
        trial[i] = target;
        const total = G.judge(this.puzzle, trial).total;
        if (!best || total < best.total) best = { i, target, total };
      });
      if (!best) return null;
      const rect = this.canvas.getBoundingClientRect();
      const a = this.toPx(this.pos[best.i]);
      const b = this.toPx(best.target);
      return [
        { x: rect.left + a.x, y: rect.top + a.y },
        { x: rect.left + b.x, y: rect.top + b.y },
      ];
    }

    update(dt) {
      this.time += dt;
      if (!this.puzzle) return;
      const calm = K.dom.calm();
      if (this.wonAt !== null) {
        const won = this.time - this.wonAt;
        const t = clamp((won - 0.15) / 0.8, 0, 1);
        const k = easeInOut(t);
        this.vis = this.homeFrom.map((p, i) => ({ x: lerp(p.x, this.puzzle.nodes[i].home.x, k), y: lerp(p.y, this.puzzle.nodes[i].home.y, k) }));
        if (!this.burstDone && won > 1.05) {
          this.burstDone = true;
          if (!calm) this.burst();
        }
        if (!this.finished && won > (calm ? 0.3 : REVEAL)) {
          this.finished = true;
          this.events.onWin?.();
        }
      } else {
        this.burstDone = false;
        const follow = calm ? 1 : 1 - Math.exp(-dt * 14);
        this.vis.forEach((p, i) => {
          if (this.drag?.node === i) return;
          p.x += (this.pos[i].x - p.x) * follow;
          p.y += (this.pos[i].y - p.y) * follow;
        });
      }
      for (const f of this.fx) {
        if (f.kind !== "confetti" || this.time < f.born) continue;
        f.v.y += dt * 1.9;
        f.v.x *= 1 - dt * 0.8;
        f.at.x += f.v.x * dt + Math.sin((this.time + f.hue) * 5) * dt * 0.12;
        f.at.y += f.v.y * dt * 0.6;
      }
      this.fx = this.fx.filter((f) => this.time - f.born < (f.kind === "confetti" ? 3.2 : 0.9));
    }

    // how each bead feels right now
    moods() {
      const upset = new Set();
      for (const i of this.state.bad) {
        upset.add(this.puzzle.edges[i].a);
        upset.add(this.puzzle.edges[i].b);
      }
      for (const t of this.state.touches) upset.add(t.node);
      for (const [a, b] of this.state.stacked) upset.add(a).add(b);
      return this.pos.map((_, i) => {
        if (this.wonAt !== null) return "joy";
        if (this.drag?.node === i) return "wow";
        return upset.has(i) ? "worried" : "happy";
      });
    }

    draw() {
      if (!this.puzzle) return;
      this.layout();
      const { ctx, dpr } = this;
      const calm = K.dom.calm();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, this.cw, this.ch);
      const intro = calm ? 1 : easeOut(clamp((this.time - this.enterAt) / 0.6, 0, 1));
      const won = this.wonAt !== null ? this.time - this.wonAt : -1;
      const reveal = won < 0 ? 0 : calm ? 1 : clamp((won - 0.85) / 0.55, 0, 1);
      const { x, y, w, h } = this.sheet;
      P.sheet(ctx, x, y, w, h, { accent: this.accent, grid: Math.max(18, this.s * 0.09), glow: won < 0 ? 0 : Math.min(1, won * 2) });

      if (reveal > 0) {
        if (!this.poly) this.poly = this.puzzle.outline.map((p) => this.toPx(p));
        P.cutout(ctx, this.poly, this.puzzle.color, { progress: reveal, seed: this.puzzle.motif.length, line: Math.max(2.5, this.s * 0.014) });
      }
      this.drawStrings(intro, won, reveal);
      if (won < 0) this.drawTangles();
      this.drawBeads(intro, won);
      this.drawFx(calm);
    }

    stringColor(e) {
      return this.colored ? P.STRINGS[e.color % P.STRINGS.length] : P.STRING;
    }

    drawStrings(intro, won, reveal) {
      const { ctx } = this;
      const w = this.lineWidth;
      const dragged = this.drag?.node ?? -1;
      if (dragged >= 0 && won < 0) {
        // show how far each rubber band on the dragged bead may reach
        for (const e of this.puzzle.edges) {
          if (!e.max || (e.a !== dragged && e.b !== dragged)) continue;
          const other = this.toPx(this.vis[e.a === dragged ? e.b : e.a]);
          ctx.save();
          ctx.setLineDash([5, 7]);
          ctx.strokeStyle = P.rgba(BAND, 0.9);
          ctx.lineWidth = 2;
          P.roughCircle(ctx, other.x, other.y, e.max * this.s, 3, 0.01);
          ctx.stroke();
          ctx.restore();
        }
      }
      this.puzzle.edges.forEach((e, i) => {
        const grow = clamp(intro * 1.5 - (i / this.puzzle.edges.length) * 0.5, 0, 1);
        if (grow <= 0) return;
        const a = this.toPx(this.vis[e.a]);
        const b0 = this.toPx(this.vis[e.b]);
        const b = { x: lerp(a.x, b0.x, grow), y: lerp(a.y, b0.y, grow) };
        const bad = won < 0 && this.state.bad.has(i) ? 1 : 0;
        const lit = dragged >= 0 && (e.a === dragged || e.b === dragged);
        const alpha = reveal > 0 ? 1 - reveal * 0.45 : 1;
        if (e.max) {
          const len = G.dist(this.pos[e.a], this.pos[e.b]);
          const strain = won < 0 && len > e.max ? clamp(0.55 + (len - e.max) / e.max, 0, 1) : 0;
          P.band(ctx, a, b, w * 1.5, BAND, { strain, time: this.time, alpha });
        } else {
          P.string(ctx, a, b, w, this.stringColor(e), { seed: i + 1, alpha, tangled: bad * (this.colored ? 0.3 : 1), time: this.time, highlight: lit });
        }
      });
    }

    drawTangles() {
      const s = Math.max(5, this.lineWidth * 2.1);
      for (const c of this.state.crossings) {
        const e = this.puzzle.edges[c.i];
        const f = this.puzzle.edges[c.j];
        const q = this.toPx(G.meetPoint(this.vis[e.a], this.vis[e.b], this.vis[f.a], this.vis[f.b]));
        P.tangle(this.ctx, q.x, q.y, s, K.dom.calm() ? 0 : this.time, c.i + c.j);
      }
    }

    drawBeads(intro, won) {
      const { ctx } = this;
      const moods = this.moods();
      const alert = new Set();
      for (const t of this.state.touches) alert.add(t.node);
      for (const [a, b] of this.state.stacked) alert.add(a).add(b);
      const dragged = this.drag?.node ?? -1;
      const focus = dragged >= 0 ? this.toPx(this.vis[dragged]) : this.pointer;
      const order = this.vis.map((_, i) => i).sort((a, b) => (a === dragged) - (b === dragged));
      for (const i of order) {
        const pop = clamp(intro * 1.7 - (i / this.vis.length) * 0.7, 0, 1);
        if (pop <= 0) continue;
        let p = this.toPx(this.vis[i]);
        const shake = this.fx.find((f) => f.kind === "shake" && f.node === i);
        if (shake) p = { x: p.x + Math.sin((this.time - shake.born) * 50) * 4 * Math.max(0, 1 - (this.time - shake.born) * 2), y: p.y };
        let hop = 0;
        if (won >= 0) {
          const t = won - 0.9 - (i % 6) * 0.07;
          if (t > 0 && t < 0.5) hop = Math.sin((t / 0.5) * Math.PI) * this.radius * 0.8;
        }
        const since = this.time - this.squashAt[i];
        const squash = since < 0.45 ? Math.sin(since * 22) * Math.exp(-since * 7) * 0.9 : 0;
        let look = null;
        if (focus && i !== dragged) {
          const dx = focus.x - p.x;
          const dy = focus.y - p.y;
          const d = Math.hypot(dx, dy) || 1;
          look = { x: dx / d, y: dy / d };
        } else if (!focus) {
          look = { x: Math.sin(this.time * 0.6 + this.phase[i]) * 0.7, y: Math.cos(this.time * 0.45 + this.phase[i] * 2) * 0.4 };
        }
        const blink = (this.time + this.phase[i]) % 3.7 < 0.13;
        const press = this.puzzle.nodes[i].pin ? 1 : clamp((this.time - this.pinnedAt[i]) / 0.3, 0, 1);
        P.bead(ctx, p.x, p.y - hop, this.radius * K.util.easeBack(pop) * (won >= 0 ? 1 - 0.3 * clamp((won - 0.8) / 0.6, 0, 1) : 1), this.colors[i], {
          mood: moods[i],
          look,
          blink,
          lift: dragged === i ? 1 : this.hover === i && won < 0 ? 0.4 : 0,
          squash,
          seed: i + 1,
          alert: won < 0 && alert.has(i) ? 0.7 + 0.3 * Math.sin(this.time * 8) : 0,
          pinned: this.pinned[i],
          pinPress: press,
        });
      }
    }

    drawFx(calm) {
      if (calm) return;
      const { ctx } = this;
      const w = this.lineWidth;
      for (const f of this.fx) {
        const age = this.time - f.born;
        if (age < 0) continue;
        if (f.kind === "pop") {
          const q = this.toPx(f.at);
          const t = age / 0.55;
          if (t > 1) continue;
          ctx.save();
          ctx.globalAlpha = 1 - t;
          ctx.strokeStyle = P.CONFETTI[f.seed % P.CONFETTI.length];
          ctx.lineCap = "round";
          ctx.lineWidth = w;
          for (let k = 0; k < 6; k++) {
            const a = (k / 6) * Math.PI * 2 + f.seed;
            const d0 = w * (1.5 + t * 4);
            const d1 = d0 + w * (2.2 - t * 1.4);
            ctx.beginPath();
            ctx.moveTo(q.x + Math.cos(a) * d0, q.y + Math.sin(a) * d0);
            ctx.lineTo(q.x + Math.cos(a) * d1, q.y + Math.sin(a) * d1);
            ctx.stroke();
          }
          ctx.restore();
        } else if (f.kind === "confetti") {
          const q = this.toPx(f.at);
          ctx.save();
          ctx.globalAlpha = Math.max(0, Math.min(1, (3.2 - age) / 0.6));
          P.confetti(ctx, q.x, q.y, Math.max(4, this.s * 0.022), f.spin + age * 6, f.hue, age * 8 + f.hue);
          ctx.restore();
        }
      }
    }
  }

  K.Board = Board;
})(window.Knotwise);
