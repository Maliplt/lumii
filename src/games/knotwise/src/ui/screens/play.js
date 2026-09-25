"use strict";
// one page being untangled, with its bar, tools, pause and result cards
(function (K) {
  const { h, icon } = K.dom;
  const t = (key, vars) => K.t(key, vars);
  const P = K.Paper;
  const L = K.Levels;

  // a small drawing that explains an idea: goal, tangles, pins, colors or bands
  function teachArt(kind, size = 240) {
    const w = 240;
    const hh = 120;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const canvas = h("canvas", { class: "teach__art", width: Math.round(size * dpr), height: Math.round((size / 2) * dpr) });
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size / 2}px`;
    const ctx = canvas.getContext("2d");
    ctx.scale((dpr * size) / w, (dpr * size) / w);
    const r = 13;
    const bead = (x, y, i, options = {}) => P.bead(ctx, x, y, r, P.BEADS[i % P.BEADS.length], { seed: i + 1, ...options });
    const line = (a, b, options = {}) => P.string(ctx, a, b, 2.6, options.color || P.STRING, { seed: a.x + b.y, ...options });
    if (kind === "goal") {
      const pts = [
        { x: 45, y: 28 },
        { x: 195, y: 28 },
        { x: 195, y: 94 },
        { x: 45, y: 94 },
        { x: 120, y: 61 },
      ];
      [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0],
        [0, 4],
        [2, 4],
      ].forEach(([a, b]) => line(pts[a], pts[b]));
      pts.forEach((p, i) => bead(p.x, p.y, i, { mood: "happy" }));
    } else if (kind === "tangles") {
      line({ x: 25, y: 28 }, { x: 115, y: 94 }, { tangled: 1 });
      line({ x: 25, y: 94 }, { x: 115, y: 28 }, { tangled: 1 });
      P.tangle(ctx, 70, 61, 6, 0, 2);
      [
        [25, 28],
        [115, 94],
        [25, 94],
        [115, 28],
      ].forEach(([x, y], i) => bead(x, y, i, { mood: "worried" }));
      line({ x: 135, y: 61 }, { x: 222, y: 61 }, { tangled: 1 });
      bead(135, 61, 4, { mood: "worried" });
      bead(222, 61, 5, { mood: "worried" });
      bead(178, 63, 1, { mood: "worried", alert: 0.9 });
    } else if (kind === "pins") {
      const pts = [
        { x: 50, y: 64 },
        { x: 120, y: 32 },
        { x: 190, y: 64 },
        { x: 120, y: 96 },
      ];
      [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0],
        [1, 3],
      ].forEach(([a, b]) => line(pts[a], pts[b]));
      pts.forEach((p, i) => bead(p.x, p.y, i, { mood: "happy", pinned: i === 1 || i === 3 }));
    } else if (kind === "colors") {
      line({ x: 20, y: 30 }, { x: 110, y: 95 }, { color: P.STRINGS[0] });
      line({ x: 20, y: 95 }, { x: 110, y: 30 }, { color: P.STRINGS[1] });
      [
        [20, 30],
        [110, 95],
        [20, 95],
        [110, 30],
      ].forEach(([x, y], i) => bead(x, y, i, { mood: "happy" }));
      line({ x: 130, y: 30 }, { x: 220, y: 95 }, { color: P.STRINGS[1], tangled: 1 });
      line({ x: 130, y: 95 }, { x: 220, y: 30 }, { color: P.STRINGS[1], tangled: 1 });
      P.tangle(ctx, 175, 62.5, 6, 0, 3);
      [
        [130, 30],
        [220, 95],
        [130, 95],
        [220, 30],
      ].forEach(([x, y], i) => bead(x, y, i + 4, { mood: "worried" }));
    } else {
      ctx.save();
      ctx.setLineDash([5, 7]);
      ctx.strokeStyle = "#ff8fb3";
      ctx.lineWidth = 2;
      P.roughCircle(ctx, 58, 62, 50, 2, 0.01);
      ctx.stroke();
      ctx.restore();
      P.band(ctx, { x: 58, y: 62 }, { x: 98, y: 44 }, 4, "#ff8fb3");
      bead(58, 62, 0, { mood: "happy" });
      bead(98, 44, 3, { mood: "happy" });
      P.band(ctx, { x: 140, y: 84 }, { x: 222, y: 40 }, 4, "#ff8fb3", { strain: 1 });
      bead(140, 84, 1, { mood: "worried" });
      bead(222, 40, 4, { mood: "worried" });
    }
    return canvas;
  }

  class PlayScreen {
    constructor(app, root) {
      this.app = app;
      this.root = root;
      this.active = false;
      window.addEventListener("keydown", (e) => {
        if (!this.active || K.Dialogs.isOpen || this.app.moving) return;
        if (e.key === "Escape" || e.key === "p") this.pause();
        else if ((e.key === "z" || e.key === "Z") && !e.repeat) this.undo();
        else if (e.key === "h" && !e.repeat) this.hint();
      });
      window.addEventListener("resize", () => this.active && this.app.coach.reflow());
    }

    enter(params) {
      this.params = params;
      this.active = true;
      this.seconds = 0;
      this.done = false;
      if (params.mode === "daily") this.puzzle = L.daily(K.util.dayKey(), K.Store.reached());
      else if (params.mode === "free") this.puzzle = L.free(params.size, params.seed, K.Store.reached());
      else this.puzzle = L.story(params.chapter, params.level);
      this.accent = params.mode === "story" ? L.CHAPTERS[params.chapter].color : params.mode === "daily" ? "#ffc94d" : "#5fd6a8";
      this.app.tint(this.accent);
      this.par = L.par(this.puzzle);
      this.render();
      this.board.load(this.puzzle, this.accent);
      this.status();
      requestAnimationFrame(() => {
        this.board.layout(true);
        this.intro();
      });
    }

    exit() {
      this.active = false;
      this.app.coach.hide();
    }

    refresh() {
      if (!this.active) return;
      this.title.replaceChildren(...this.titleParts());
      this.labels();
      this.status();
    }

    titleParts() {
      const p = this.params;
      if (p.mode === "daily") return [h("span", { class: "play__where" }, K.util.dayKey()), h("span", { class: "play__which" }, t("play.daily"))];
      if (p.mode === "free") return [h("span", { class: "play__where" }, t("free.beads", { n: this.puzzle.nodes.length })), h("span", { class: "play__which" }, t("play.free"))];
      return [h("span", { class: "play__where" }, t(`chapters.${L.CHAPTERS[p.chapter].id}.name`)), h("span", { class: "play__which" }, t("play.page", { n: p.level + 1 }))];
    }

    render() {
      this.title = h("div", { class: "play__title" }, this.titleParts());
      this.counter = h("div", { class: "counter", role: "status" }, h("span", { class: "counter__icon" }), h("span", { class: "counter__num" }, "0"), h("span", { class: "counter__label" }));
      this.info = h("p", { class: "play__info" });
      const canvas = h("canvas", { class: "board__canvas", tabindex: "0", "aria-label": t("title") });
      this.board = new K.Board(canvas, {
        onChange: () => this.status(),
        onPick: () => this.onPick(),
        onSolved: () => {
          this.done = true;
          this.app.coach.hide();
          this.status();
        },
        onWin: () => this.finish(),
      });
      this.undoBtn = K.tab("paper", "undo", "", null, () => this.undo());
      this.hintBtn = K.tab("butter", "pin", "", null, () => this.hint(), { badge: String(K.Store.data.pins) });
      this.resetBtn = K.tab("paper", "restart", "", null, () => this.restart());
      for (const b of [this.undoBtn, this.hintBtn, this.resetBtn]) b.classList.add("tab--tool");
      this.hintBtn.querySelector(".badge").classList.add("badge--count");
      this.labels();
      this.root.replaceChildren(
        h(
          "div",
          { class: "play__top" },
          h("button", { type: "button", class: "dot dot--paper dot--small", label: "play.pause", onclick: () => this.pause() }, icon("pause", { size: 22 })),
          this.title,
          this.counter,
        ),
        this.info,
        h("div", { class: "play__board" }, canvas),
        h("div", { class: "tools" }, this.undoBtn, this.hintBtn, this.resetBtn),
      );
    }

    labels() {
      this.undoBtn.querySelector(".tab__label").textContent = t("play.undo");
      this.hintBtn.querySelector(".tab__label").textContent = t("play.hint");
      this.resetBtn.querySelector(".tab__label").textContent = t("play.reset");
      this.counter.querySelector(".counter__label").textContent = t("play.tangles");
    }

    status() {
      if (!this.board?.state) return;
      const total = this.board.state.total;
      const num = this.counter.querySelector(".counter__num");
      if (num.textContent !== String(total)) {
        num.textContent = String(total);
        K.dom.replay(this.counter, "is-bumping");
      }
      this.counter.classList.toggle("is-clear", total === 0);
      this.counter.querySelector(".counter__icon").replaceChildren(icon(total === 0 ? "check" : "tangle", { size: 20 }));
      const parts = [t("play.moves", { n: this.board.moves }), t("result.par", { n: this.par })];
      if (K.Store.data.settings.timer) parts.unshift(K.util.clock(this.seconds));
      this.info.textContent = parts.join("  ·  ");
      this.info.classList.toggle("is-over", this.board.moves > this.par);
      this.undoBtn.disabled = this.done || !this.board.history.length;
      this.resetBtn.disabled = this.done || !this.board.moves;
      this.hintBtn.disabled = this.done;
      this.hintBtn.querySelector(".badge").textContent = String(K.Store.data.pins);
    }

    intro() {
      const p = this.params;
      const store = K.Store;
      const teach = p.mode === "story" ? L.CHAPTERS[p.chapter].teach : null;
      if (teach && !store.tipSeen(`teach.${teach}`)) {
        store.markTip(`teach.${teach}`);
        K.Audio.play("open");
        K.Dialogs.open({
          title: t(`teach.${teach}.title`),
          className: "teach",
          body: [teachArt(teach), h("p", {}, t(`teach.${teach}.text`))],
          actions: [{ label: t("common.ok"), kind: "primary" }],
        });
        return;
      }
      if (p.mode === "story" && p.chapter === 0 && p.level === 0 && !store.tipSeen("coach.drag")) {
        this.app.coach.show({ text: "coach.drag", button: false, path: () => this.board.suggestion() || [{ x: 0, y: 0 }, { x: 0, y: 0 }] });
      }
    }

    onPick() {
      const store = K.Store;
      if (this.app.coach.visible && this.app.coach.key === "coach.drag") {
        store.markTip("coach.drag");
        this.app.coach.hide();
        setTimeout(() => {
          if (!this.active || this.done || store.tipSeen("coach.tangles")) return;
          store.markTip("coach.tangles");
          this.app.coach.show({ text: "coach.tangles", button: true });
        }, 900);
      }
    }

    update(dt) {
      if (!this.active) return;
      this.board.update(dt);
      if (!this.done && !K.Dialogs.isOpen && !document.hidden) {
        const before = Math.floor(this.seconds);
        this.seconds += dt;
        if (Math.floor(this.seconds) !== before && K.Store.data.settings.timer) this.status();
      }
    }

    draw() {
      if (this.active) this.board.draw();
    }

    undo() {
      if (!this.board.undo()) K.Audio.play("locked");
    }

    restart() {
      this.board.reset();
      this.status();
    }

    hint() {
      if (this.done) return;
      if (K.Store.data.pins <= 0) {
        K.Audio.play("locked");
        K.Dialogs.toast(t("play.noPins"));
        return;
      }
      if (!this.board.hint()) {
        K.Dialogs.toast(t("play.hintNone"));
        return;
      }
      K.Store.spendPin();
      this.app.coach.hide();
      K.Dialogs.toast(t("play.hintDone"));
      K.dom.replay(this.hintBtn.querySelector(".badge"), "is-bumping");
      this.status();
    }

    // a quick switch in the pause card: an icon button with its label
    quick(iconName, key, onclick, off = false) {
      const button = h("button", { type: "button", class: `dot dot--paper${off ? " is-off" : ""}`, label: key, onclick: () => onclick(button) }, icon(iconName, { size: 22 }));
      return h("div", { class: "quick__item" }, button, h("span", { class: "quick__label" }, t(key)));
    }

    pause() {
      if (!this.active || this.done || K.Dialogs.isOpen) return;
      const settings = K.Store.data.settings;
      K.Audio.play("open");
      const flip = (key, fallback) => (button) => {
        const next = settings[key] > 0 ? 0 : fallback;
        K.Store.setSetting(key, next);
        this.app.applySettings();
        button.classList.toggle("is-off", next === 0);
        button.replaceChildren(icon(key === "music" ? "music" : next === 0 ? "mute" : "sound", { size: 22 }));
      };
      K.Dialogs.open({
        title: t("play.pause"),
        className: "pause",
        body: [
          h(
            "div",
            { class: "pause__stats" },
            h("span", { class: "chip" }, icon("tangle", { size: 16 }), t("play.left", { n: this.board.state.total })),
            h("span", { class: "chip" }, t("play.moves", { n: this.board.moves })),
            h("span", { class: "chip" }, K.util.clock(this.seconds)),
          ),
          h(
            "div",
            { class: "quick" },
            this.quick("music", "play.music", flip("music", 0.5), settings.music === 0),
            this.quick(settings.sfx === 0 ? "mute" : "sound", "play.sound", flip("sfx", 0.8), settings.sfx === 0),
            this.quick("help", "menu.help", () => K.Help.open()),
            this.quick("gear", "menu.settings", () => K.Settings.open(this.app)),
          ),
        ],
        actions: [
          { label: t("play.resume"), kind: "primary" },
          { label: t("play.reset"), kind: "paper", onClick: () => this.restart() },
          { label: t("play.quit"), kind: "sky", onClick: () => this.app.go(this.params.mode === "story" ? "pages" : "menu", { chapter: this.params.chapter }) },
        ],
      });
    }

    nextStory() {
      const { chapter, level } = this.params;
      const store = K.Store;
      if (level + 1 < L.LEVELS && store.levelOpen(chapter, level + 1)) return { chapter, level: level + 1 };
      const next = store.next();
      return next && next.chapter >= chapter ? next : null;
    }

    finish() {
      const p = this.params;
      const store = K.Store;
      const b = this.board;
      const marks = [true, b.hints === 0, b.moves <= this.par];
      const stars = marks.filter(Boolean).length;
      const motif = K.Motifs.byId(this.puzzle.motif);
      const notes = [];
      const actions = [];
      if (p.mode === "story") {
        const outcome = store.finishLevel(p.chapter, p.level, stars, b.moves);
        if (outcome.newBest) notes.push(t("result.newBest"));
        if (outcome.pins) notes.push(t("result.pins", { n: outcome.pins }));
        if (outcome.opened) notes.push(t("result.opened"));
        const next = this.nextStory();
        if (next) actions.push({ label: t("result.next"), kind: "primary", onClick: () => this.app.go("play", { mode: "story", ...next }) });
        actions.push({ label: t("result.again"), kind: "paper", onClick: () => this.app.go("play", { ...p }) });
        actions.push({ label: t("result.pages"), kind: "sky", onClick: () => this.app.go("pages", { chapter: next?.chapter ?? p.chapter }) });
      } else if (p.mode === "daily") {
        const outcome = store.finishDaily();
        notes.push(t("result.streak", { n: outcome.streak }));
        if (outcome.pins) notes.push(t("result.pins", { n: outcome.pins }));
        actions.push({ label: t("result.menu"), kind: "primary", onClick: () => this.app.go("menu") });
        actions.push({ label: t("result.pages"), kind: "sky", onClick: () => this.app.go("pages") });
      } else {
        const outcome = store.finishFree();
        notes.push(t("result.freeCount", { n: outcome.solved }));
        if (outcome.pins) notes.push(t("result.pins", { n: outcome.pins }));
        actions.push({ label: t("result.next"), kind: "primary", onClick: () => this.app.go("play", { mode: "free", size: p.size, seed: `${Date.now()}` }) });
        actions.push({ label: t("result.menu"), kind: "paper", onClick: () => this.app.go("menu") });
      }

      const names = ["result.finished", "result.noHint", "result.tidy"];
      const title = stars === 3 ? "result.great" : stars === 2 ? "result.good" : "result.done";
      K.Dialogs.open({
        title: t(title),
        className: "result",
        dismissible: false,
        body: [
          h("div", { class: "result__art" }, K.Paper.mini(h("canvas"), motif, { size: 128 })),
          h("p", { class: "result__name" }, t("result.picture", { name: t(`motifs.${motif.id}`) })),
          h(
            "div",
            { class: "marks" },
            marks.map((on, i) => h("div", { class: "mark", style: { "--i": i } }, h("span", { class: "mark__star" }, icon("star", { size: 34 })), h("span", { class: "mark__label" }, t(names[i])))),
          ),
          h(
            "div",
            { class: "result__chips" },
            h("span", { class: "chip" }, t("result.moves", { n: b.moves })),
            h("span", { class: "chip" }, t("result.par", { n: this.par })),
            h("span", { class: "chip" }, t("result.time", { t: K.util.clock(this.seconds) })),
          ),
          notes.length ? h("p", { class: "result__notes" }, notes.join(" · ")) : null,
        ],
        actions,
      });
      marks.forEach((on, i) => {
        if (!on) return;
        setTimeout(
          () => {
            const mark = document.querySelectorAll(".result .mark")[i];
            if (!mark) return;
            mark.classList.add("is-on");
            K.Audio.play("star", { index: i });
          },
          K.dom.calm() ? 0 : 500 + i * 330,
        );
      });
    }
  }

  K.PlayScreen = PlayScreen;
  K.teachArt = teachArt;
})(window.Knotwise);
