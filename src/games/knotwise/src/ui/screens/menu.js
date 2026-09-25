"use strict";
// the front screen
(function (K) {
  const { h, icon } = K.dom;
  const t = (key, vars) => K.t(key, vars);
  const P = K.Paper;
  const G = K.Geo;
  const { clamp, easeInOut, easeBack } = K.util;
  const CYCLE = 6.2;
  const DEMO = ["heart", "fish", "star", "cat", "boat", "flower", "house", "whale"];

  // a paper tab button
  function tab(kind, iconName, label, sub, onclick, extra = {}) {
    return h(
      "button",
      { type: "button", class: `tab tab--${kind}${extra.locked ? " is-locked" : ""}${extra.big ? " tab--big" : ""}`, onclick },
      iconName ? h("span", { class: "tab__icon" }, icon(extra.locked ? "lock" : iconName, { size: extra.big ? 28 : 24 })) : null,
      h("span", { class: "tab__text" }, h("span", { class: "tab__label" }, label), sub ? h("span", { class: "tab__sub" }, sub) : null),
      extra.badge ? h("span", { class: "badge" }, extra.badge) : null,
    );
  }

  class MenuScreen {
    constructor(app, root) {
      this.app = app;
      this.root = root;
      this.time = 0;
      this.cycle = 0;
      this.cycleAt = 0;
      this.demo = null;
    }

    enter() {
      this.app.tint("#ff9e8f");
      this.render();
    }

    refresh() {
      if (!this.root.hidden) this.render();
    }

    render() {
      const store = K.Store;
      const next = store.next();
      const daily = store.dailyStatus();
      const dailyOpen = store.dailyOpen();
      const freeOpen = store.freeOpen();
      const chapterName = (c) => t(`chapters.${K.Levels.CHAPTERS[c].id}.name`);

      this.art = h("canvas", { class: "hero__art", "aria-hidden": "true", onclick: () => this.skip() });
      const logo = h(
        "h1",
        { class: "logo", "aria-label": t("title") },
        [...t("title")].map((ch, i) => h("span", { style: { "--i": i }, "aria-hidden": "true" }, ch)),
      );

      this.root.replaceChildren(
        h(
          "div",
          { class: "topline topline--end" },
          h("span", { class: "chip chip--star", title: t("menu.stars") }, icon("star", { size: 18 }), String(store.totalStars())),
          h("span", { class: "chip chip--pin", title: t("menu.pins") }, icon("pin", { size: 18 }), String(store.data.pins)),
        ),
        h(
          "div",
          { class: "menu__body" },
          h("div", { class: "hero" }, this.art, logo, h("p", { class: "tagline" }, t("tagline"))),
          h(
            "nav",
            { class: "stack" },
            tab(
              "coral",
              "play",
              t("menu.play"),
              next ? t("menu.next", { chapter: chapterName(next.chapter), n: next.level + 1 }) : t("menu.allDone"),
              () => (next ? this.app.go("play", { mode: "story", chapter: next.chapter, level: next.level }) : this.app.go("pages")),
              { big: true },
            ),
            tab(
              "butter",
              "calendar",
              t("menu.daily"),
              !dailyOpen ? t("menu.dailyLocked") : daily.played ? t("menu.dailyDone", { n: daily.streak }) : daily.streak ? t("menu.dailyStreak", { n: daily.streak }) : null,
              () => (dailyOpen ? this.app.go("play", { mode: "daily" }) : this.locked(t("menu.dailyLocked"))),
              { locked: !dailyOpen, badge: dailyOpen && !daily.played ? t("menu.dailyNew") : null },
            ),
            tab("mint", "shuffle", t("menu.free"), freeOpen ? t("menu.freeSub") : t("menu.freeLocked"), () => (freeOpen ? this.app.openFree() : this.locked(t("menu.freeLocked"))), { locked: !freeOpen }),
            h(
              "div",
              { class: "dots" },
              h("button", { type: "button", class: "dot dot--sky", label: "menu.pages", onclick: () => this.app.go("pages") }, icon("grid", { size: 24 })),
              h("button", { type: "button", class: "dot dot--lilac", label: "menu.help", onclick: () => K.Help.open() }, icon("help", { size: 24 })),
              h("button", { type: "button", class: "dot dot--paper", label: "menu.settings", onclick: () => K.Settings.open(this.app) }, icon("gear", { size: 24 })),
            ),
          ),
        ),
      );
    }

    locked(text) {
      K.Audio.play("locked");
      K.Dialogs.toast(text);
    }

    skip() {
      this.cycle++;
      this.cycleAt = this.time;
      this.demo = null;
      K.Audio.play("pick");
    }

    // a small puzzle that plays itself: tangled, then untangled bead by bead
    makeDemo() {
      const motif = DEMO[this.cycle % DEMO.length];
      const puzzle = K.Generator.build({ seed: `menu/${this.cycle % DEMO.length}`, motif, nodes: 7, keep: 0.85, shuffle: 1, minTangle: 3 });
      const order = puzzle.nodes.map((_, i) => i).filter((i) => G.dist(puzzle.nodes[i].start, puzzle.nodes[i].home) > 0.02);
      this.demo = { puzzle, order, colors: puzzle.nodes.map((_, i) => P.BEADS[(i * 3 + 1) % P.BEADS.length]), poly: null, popped: false };
    }

    update(dt) {
      this.time += dt;
      if (this.time - this.cycleAt > CYCLE) {
        this.cycle++;
        this.cycleAt = this.time;
        this.demo = null;
      }
    }

    draw() {
      const canvas = this.art;
      if (!canvas || !canvas.isConnected) return;
      const w = canvas.clientWidth;
      const hh = canvas.clientHeight;
      if (w < 10 || hh < 10) return;
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(hh * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(hh * dpr);
        if (this.demo) this.demo.poly = null;
      }
      if (!this.demo) this.makeDemo();
      const d = this.demo;
      const calm = K.dom.calm();
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, hh);
      const age = calm ? 3 : this.time - this.cycleAt;
      const sheet = { x: 6, y: 14, w: w - 20, h: hh - 30 };
      const s = (Math.min(sheet.w, sheet.h) / 2) * 1.02;
      const cx = sheet.x + sheet.w / 2;
      const cy = sheet.y + sheet.h / 2;
      const px = (p) => ({ x: cx + Math.max(-0.9, Math.min(0.9, p.x)) * s, y: cy + Math.max(-0.84, Math.min(0.84, p.y)) * s });
      const fade = calm ? 1 : clamp((CYCLE - age) / 0.45, 0, 1) * clamp(age / 0.3, 0, 1);
      P.sheet(ctx, sheet.x, sheet.y, sheet.w, sheet.h, { accent: "#ffd166", grid: 20, seed: 9 });

      // beads walk home one after another
      const pos = d.puzzle.nodes.map((n) => n.start);
      d.order.forEach((node, k) => {
        const t = calm ? 1 : easeInOut(clamp((age - 0.9 - k * 0.32) / 0.4, 0, 1));
        const a = d.puzzle.nodes[node].start;
        const b = d.puzzle.nodes[node].home;
        pos[node] = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      });
      const state = G.judge(d.puzzle, pos);
      const doneAt = 0.9 + d.order.length * 0.32 + 0.4;
      const reveal = calm ? 1 : clamp((age - doneAt) / 0.5, 0, 1);
      if (reveal > 0 && !d.popped && !calm) {
        d.popped = true;
        K.Audio.play("untie", { step: 7 });
      }

      ctx.save();
      ctx.globalAlpha = fade;
      if (reveal > 0) {
        if (!d.poly) d.poly = d.puzzle.outline.map(px);
        P.cutout(ctx, d.poly, d.puzzle.color, { progress: reveal, seed: 4, line: 2.5 });
      }
      d.puzzle.edges.forEach((e, i) => P.string(ctx, px(pos[e.a]), px(pos[e.b]), 2.6, P.STRING, { seed: i + 1, tangled: state.bad.has(i) ? 1 : 0, time: this.time, alpha: reveal ? 1 - reveal * 0.4 : 1 }));
      for (const c of state.crossings) P.tangle(ctx, cx + c.x * s, cy + c.y * s, 5, calm ? 0 : this.time, c.i + c.j);
      const upset = new Set();
      for (const i of state.bad) upset.add(d.puzzle.edges[i].a).add(d.puzzle.edges[i].b);
      const r = G.beadRadius(7) * s;
      pos.forEach((p, i) => {
        const pop = calm ? 1 : easeBack(clamp(age * 2.2 - i * 0.12, 0, 1));
        if (pop <= 0) return;
        const hop = reveal > 0 && !calm ? Math.max(0, Math.sin((age - doneAt - i * 0.06) * 7)) * r * 0.5 * (1 - reveal * 0.3) : 0;
        const q = px(p);
        const mood = reveal > 0 ? "joy" : upset.has(i) ? "worried" : "happy";
        P.bead(ctx, q.x, q.y - hop, r * pop, d.colors[i], { mood, seed: i + 2, blink: (this.time + i) % 3.3 < 0.12, look: { x: Math.sin(this.time + i), y: 0.2 } });
      });
      ctx.restore();
    }
  }

  K.MenuScreen = MenuScreen;
  K.tab = tab;
})(window.Knotwise);
