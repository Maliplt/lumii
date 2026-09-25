"use strict";
// one game: the grid
(function (B) {
  const { Grid, Pieces } = B;

  const PERFECT = 600;
  const CALM_LIMIT = 3;
  const STAR = 100;
  const PERKS = ["star", "double", "bomb"];

  // points for clearing `lines` at once, before the combo
  const linePoints = (lines) => 80 * lines + 40 * lines * (lines - 1);

  class Session {
    // level: { mode, seed, cells, goals: [{ type, gem?, need }], moves, gemRate,
    constructor(level) {
      this.level = level;
      this.rng = new B.Random(`${level.seed}/play`);
      this.grid = new Grid(level.size || B.SIZE, level.cells || null);
      this.score = 0;
      this.combo = 0;
      this.calm = 0;
      this.moves = 0;
      this.over = false;
      this.won = false;
      this.stats = { lines: 0, bestCombo: 0, perfect: 0, placed: 0, bestClear: 0, perks: 0 };
      this.goals = (level.goals || []).map((g) => ({ ...g, have: 0 }));
      this.rescues = level.rescues || 0;
      this.tray = [null, null, null];
      this.step = 0;
      this.hints = [null, null, null];
      this.tip = null;
      this.deal();
    }

    // in a lesson: where the first piece still in the tray should go
    hint() {
      const slot = this.tray.findIndex((p, i) => p && this.hints[i]);
      return slot < 0 ? null : { slot, ...this.hints[slot] };
    }

    get movesLeft() {
      return this.level.moves == null ? null : this.level.moves - this.moves;
    }

    hardness() {
      return this.level.hardness ? this.level.hardness(this.score) : 0.3;
    }

    // can the pieces be placed one after another, clears included?
    playable(pieces, budget = { left: 3000 }) {
      const search = (grid, rest) => {
        if (!rest.length) return true;
        for (let i = 0; i < rest.length; i++) {
          const shape = rest[i];
          for (const [x, y] of grid.spots(shape)) {
            if (--budget.left < 0) return null;
            const next = grid.clone();
            next.place(shape, x, y, "x");
            next.clear(next.fullLines());
            const found = search(next, rest.filter((_, j) => j !== i));
            if (found !== false) return found;
          }
        }
        return false;
      };
      return search(this.grid, pieces);
    }

    deal() {
      const script = this.level.script;
      if (script && this.step < script.length) {
        const step = script[this.step++];
        this.tray = step.tray.map((id) => (id ? this.dress(Pieces.byId[id]) : null));
        this.hints = step.hints || [null, null, null];
        this.tip = step.tip || null;
        return { type: "deal", tray: this.tray };
      }
      this.hints = [null, null, null];
      this.tip = null;
      const hard = this.hardness();
      const strict = this.rng.next() < (this.level.guarantee ? this.level.guarantee(this.score) : 1);
      let chosen = null;
      for (let attempt = 0; attempt < 30 && !chosen; attempt++) {
        const soften = attempt > 12 ? Math.max(0, hard - attempt * 0.05) : hard;
        const set = [0, 1, 2].map(() => Pieces.pick(this.rng, soften));
        if (set[0].id === set[1].id && set[1].id === set[2].id) continue;
        if (strict) {
          const ok = this.playable(set);
          if (ok === false) continue;
          if (ok === null && set.filter((s) => this.grid.anyFit(s)).length < 2) continue;
        } else if (!set.some((s) => this.grid.anyFit(s))) continue;
        chosen = set;
      }
      if (!chosen) chosen = [Pieces.byId.dot, Pieces.byId.i2h, Pieces.byId.c3a];
      this.tray = chosen.map((shape) => this.dress(shape));
      return { type: "deal", tray: this.tray };
    }

    // gives a fresh piece its colour and, in gem levels, maybe a gem
    dress(shape) {
      const piece = { shape, color: shape.color, gems: {}, perks: {} };
      const types = this.level.gemTypes || [];
      if (types.length && this.rng.next() < (this.level.gemRate || 0)) {
        const wanted = types.filter((t) => this.goalFor("gems", t)?.have < this.goalFor("gems", t)?.need);
        const pool = wanted.length ? wanted : types;
        piece.gems[Math.floor(this.rng.next() * shape.size)] = this.rng.pick(pool);
      } else if (this.level.perkRate && this.rng.next() < this.level.perkRate) {
        piece.perks[Math.floor(this.rng.next() * shape.size)] = this.rng.pick(this.level.perks || PERKS);
      }
      return piece;
    }

    goalFor(type, gem) {
      return this.goals.find((g) => g.type === type && (!gem || g.gem === gem));
    }

    canPlace(slot, x, y) {
      const piece = this.tray[slot];
      return !this.over && piece && this.grid.fits(piece.shape, x, y);
    }

    anyMove() {
      return this.tray.some((piece) => piece && this.grid.anyFit(piece.shape));
    }

    place(slot, x, y) {
      if (!this.canPlace(slot, x, y)) return [];
      const piece = this.tray[slot];
      const events = [];
      const cells = this.grid.place(piece.shape, x, y, piece.color, piece.gems, piece.perks);
      this.tray[slot] = null;
      this.moves++;
      this.stats.placed++;
      this.score += piece.shape.size;
      events.push({ type: "place", slot, x, y, cells, piece, points: piece.shape.size });

      const lines = this.grid.fullLines();
      if (lines.count) {
        this.combo++;
        this.calm = 0;
        const result = this.grid.clear(lines);
        // perks in the cleared cells fire; a bomb can reach more perks
        const fired = [];
        const blasts = [];
        const queue = result.removed.filter((r) => r.cell.perk);
        while (queue.length) {
          const r = queue.shift();
          fired.push({ x: r.x, y: r.y, perk: r.cell.perk });
          if (r.cell.perk !== "bomb") continue;
          const extra = this.grid.blast(r.x, r.y);
          merge(result, extra);
          blasts.push({ type: "blast", x: r.x, y: r.y, result: extra });
          queue.push(...extra.removed.filter((e) => e.cell.perk));
        }
        const factor = 2 ** fired.filter((f) => f.perk === "double").length;
        const bonus = fired.filter((f) => f.perk === "star").length * STAR * this.combo;
        const base = Math.round(linePoints(lines.count) * (1 + 0.5 * (this.combo - 1)));
        const points = base * factor + bonus;
        this.score += points;
        this.stats.lines += lines.count;
        this.stats.perks += fired.length;
        this.stats.bestCombo = Math.max(this.stats.bestCombo, this.combo);
        this.stats.bestClear = Math.max(this.stats.bestClear, lines.count);
        events.push({ type: "clear", lines, result, points, base, factor, bonus, perks: fired, combo: this.combo }, ...blasts);
        const lineGoal = this.goalFor("lines");
        if (lineGoal) {
          const before = lineGoal.have;
          lineGoal.have = Math.min(lineGoal.need, lineGoal.have + lines.count);
          if (lineGoal.have > before) events.push({ type: "goal", goal: lineGoal, amount: lineGoal.have - before, source: [] });
        }
        this.progress(result, events);
        if (this.grid.spotless()) {
          this.score += PERFECT;
          this.stats.perfect++;
          events.push({ type: "perfect", points: PERFECT });
        }
      } else {
        this.calm++;
        if (this.calm >= CALM_LIMIT && this.combo) {
          this.combo = 0;
          events.push({ type: "comboLost" });
        }
      }
      this.scoreGoal(events);

      if (this.goals.length && this.goals.every((g) => g.have >= g.need)) return this.finish(true, events);
      if (this.tray.every((p) => !p)) events.push(this.deal());
      if (this.movesLeft !== null && this.movesLeft <= 0) return this.finish(false, events, "moves");
      if (!this.anyMove() && this.rescues > 0) {
        // once a level, a jammed board gets a fresh tray of small pieces
        this.rescues--;
        const tray = this.tray;
        this.tray = [null, null, null];
        const saved = this.level.hardness;
        this.level.hardness = () => 0;
        const deal = this.deal();
        this.level.hardness = saved;
        if (this.anyMove()) events.push({ type: "rescue", old: tray }, deal);
        else this.tray = tray;
      }
      if (!this.anyMove()) return this.finish(false, events, "stuck");
      return events;
    }

    progress(result, events) {
      const bump = (goal, amount, source) => {
        if (!goal || amount <= 0) return;
        const before = goal.have;
        goal.have = Math.min(goal.need, goal.have + amount);
        if (goal.have > before) events.push({ type: "goal", goal, amount: goal.have - before, source });
      };
      for (const [gem, n] of Object.entries(result.gems)) bump(this.goalFor("gems", gem), n, result.removed.filter((r) => r.cell.gem === gem));
      bump(this.goalFor("crates"), result.crates, result.removed.filter((r) => r.cell.kind === "crate"));
      bump(this.goalFor("ice"), result.ice, result.removed.filter((r) => r.cell.kind === "ice"));
    }

    scoreGoal(events) {
      const goal = this.goalFor("score");
      if (!goal) return;
      const before = goal.have;
      goal.have = Math.min(goal.need, this.score);
      if (goal.have !== before) events.push({ type: "goal", goal, amount: goal.have - before, source: [] });
    }

    finish(won, events, reason = "goals") {
      this.over = true;
      this.won = won;
      events.push({ type: "end", won, reason });
      return events;
    }

    // hammer: knocks out one cell that is not stone
    smash(x, y) {
      const cell = this.grid.at(x, y);
      if (this.over || !cell || cell.kind === "stone") return [];
      this.grid.set(x, y, null);
      const result = { removed: [{ x, y, cell }], cracked: [], gems: {}, crates: 0, ice: 0 };
      if (cell.gem) result.gems[cell.gem] = 1;
      if (cell.kind === "crate") result.crates = 1;
      if (cell.kind === "ice") result.ice = 1;
      const events = [{ type: "smash", x, y, cell }];
      this.progress(result, events);
      if (this.goals.length && this.goals.every((g) => g.have >= g.need)) return this.finish(true, events);
      return events;
    }

    // shuffle: a brand new tray
    reshuffle() {
      if (this.over) return [];
      return [this.deal()];
    }

    // after a booster the game may be playable again
    revive() {
      if (!this.over || this.won) return false;
      if (this.movesLeft !== null && this.movesLeft <= 0) return false;
      this.over = false;
      return true;
    }
  }

  // adds a bomb's haul to the clear it came from
  function merge(into, extra) {
    into.removed.push(...extra.removed);
    into.cracked.push(...extra.cracked);
    for (const [gem, n] of Object.entries(extra.gems)) into.gems[gem] = (into.gems[gem] || 0) + n;
    into.crates += extra.crates;
    into.ice += extra.ice;
  }

  B.Session = Session;
  B.Scoring = { linePoints, PERFECT, CALM_LIMIT, STAR, PERKS };
})(window.Blockhaven);
