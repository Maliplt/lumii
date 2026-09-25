"use strict";
(function (V) {
  const { h, icon } = V.dom;
  const t = (key, vars) => V.t(key, vars);
  const { clock } = V.util;

  // a small canvas with one cat drawn on it
  function catPicture(size, look, mood, clue = null) {
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const canvas = h("canvas", { class: "cat-picture", width: Math.round(size * dpr), height: Math.round(size * dpr) });
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    if (clue) V.Paint.resident(ctx, 0, 0, size, clue, look, mood);
    else V.Paint.cat(ctx, size / 2, size * 0.55, size, look, mood);
    return canvas;
  }

  class PlayScreen {
    constructor(app, root) {
      this.app = app;
      this.root = root;
      this.active = false;
      this.boardHost = h("div", { class: "play__board" });
      this.board = new V.Board(this.boardHost, { onChange: (e) => this.changed(e), onWin: () => this.won() });
      window.addEventListener("keydown", (e) => this.active && this.onKey(e));
      window.addEventListener("resize", () => this.active && setTimeout(() => this.app.coach.reflow(), 50));
    }

    build({ mode, chapter, level, size, seed }) {
      if (mode === "daily") return V.Levels.daily(V.util.dayKey());
      if (mode === "free") return V.Levels.free(size, seed, V.Store.reached());
      return V.Levels.story(chapter, level);
    }

    enter(params) {
      this.params = params;
      this.active = true;
      this.puzzle = this.build(params);
      this.elapsed = 0;
      this.hints = 0;
      this.done = false;
      this.paused = false;
      this.render();
      this.board.load(this.puzzle);
      requestAnimationFrame(() => {
        this.board.layout();
        this.board.canvas.focus({ preventScroll: true });
        this.introduce();
      });
    }

    exit() {
      this.active = false;
      this.app.coach.hide();
    }

    refresh() {
      if (!this.root.hidden) this.renderBars();
    }

    // [where, which] for the heading
    title() {
      const { mode, chapter, level } = this.params;
      if (mode === "daily") return [t("play.daily"), V.util.dayKey()];
      if (mode === "free") return [t("play.free"), t(`free.${this.params.size}`)];
      return [t(`chapters.${V.Levels.CHAPTERS[chapter].id}.name`), t("result.number", { n: level + 1 })];
    }

    render() {
      this.top = h("header", { class: "topline play__top" });
      this.tools = h("footer", { class: "tools" });
      this.root.replaceChildren(this.top, this.boardHost, this.tools);
      this.renderBars();
    }

    renderBars() {
      const [where, which] = this.title();
      this.clockEl = h("span", { class: "pill pill--clock" }, clock(this.elapsed));
      if (!V.Store.data.settings.timer) this.clockEl.classList.add("is-hidden");
      this.top.replaceChildren(
        h("button", { type: "button", class: "round round--white round--small", label: "pause.title", onclick: () => this.pause() }, icon("pause", { size: 22 })),
        h("div", { class: "play__title" }, h("span", { class: "play__where" }, where), h("span", { class: "play__which" }, which)),
        this.clockEl,
      );
      this.undoButton = h("button", { type: "button", class: "chunky chunky--white chunky--tool", onclick: () => this.undo() }, icon("undo", { size: 24 }), h("span", {}, t("play.undo")));
      this.hintCount = h("span", { class: "badge badge--fish" }, String(V.Store.data.lanterns));
      this.tools.replaceChildren(
        this.undoButton,
        h("button", { type: "button", class: "chunky chunky--orange chunky--tool", onclick: () => this.hint() }, icon("fish", { size: 24 }), h("span", {}, t("play.hint")), this.hintCount),
        h("button", { type: "button", class: "chunky chunky--white chunky--tool", onclick: () => this.clear() }, icon("trash", { size: 24 }), h("span", {}, t("play.clear"))),
      );
      this.syncTools();
    }

    syncTools() {
      if (!this.undoButton) return;
      this.undoButton.disabled = !this.board.history?.length || this.done;
      this.hintCount.textContent = String(V.Store.data.lanterns);
    }

    get blocked() {
      return this.paused || this.done || V.Dialogs.isOpen || (this.app.coach.visible && !this.app.coach.button.hidden);
    }

    // first steps and new kinds of cat

    introduce() {
      const { mode, chapter, level } = this.params;
      if (mode === "story" && chapter === 0 && level === 0 && !V.Store.tipSeen("tutorial.drag")) {
        this.teach();
        return;
      }
      if (mode === "story" && chapter === 0 && level === 1) this.say("tutorial.remove");
      const kind = mode === "story" && level === 0 ? V.Levels.CHAPTERS[chapter].introduces : null;
      if (kind && !V.Store.tipSeen(`intro.${kind}`)) {
        V.Store.markTip(`intro.${kind}`);
        this.showKind(kind);
      }
    }

    teach() {
      const rect = [...this.puzzle.solution].sort((a, b) => b.w * b.h - a.w * a.h)[0];
      this.lesson = rect;
      this.board.guide = rect;
      this.app.coach.show({
        text: "tutorial.drag",
        button: false,
        path: () => [this.board.pointOf(rect.x, rect.y), this.board.pointOf(rect.x + rect.w - 1, rect.y + rect.h - 1)],
      });
    }

    say(key) {
      if (V.Store.tipSeen(key)) return;
      V.Store.markTip(key);
      setTimeout(() => this.active && !this.done && this.app.coach.show({ text: key }), 400);
    }

    showKind(kind) {
      const samples = {
        square: [{ kind: "square", value: 4 }],
        shape: [{ kind: "wide", value: 6 }, { kind: "tall", value: 6 }],
        any: [{ kind: "any", value: null }],
      }[kind];
      V.Dialogs.open({
        title: t(`kinds.${kind}.name`),
        className: "kind",
        body: [
          h("p", { class: "kicker" }, t("intro.title")),
          h("div", { class: "kind__cats" }, samples.map((clue, i) => catPicture(110, [1, 4, 5][i % 3], "idle", clue))),
          h("p", {}, t(`kinds.${kind}.text`)),
        ],
        actions: [{ label: t("common.ok"), kind: "green" }],
      });
    }

    // moves

    changed(event) {
      if (event.type === "place") {
        const { pane, verdict } = event;
        if (verdict.ok) V.Audio.play("place", { area: pane.w * pane.h });
        else V.Audio.play("wrong");
        if (this.lesson && verdict.ok && this.app.coach.visible && this.app.coach.key === "tutorial.drag") {
          this.app.coach.hide();
          V.Store.markTip("tutorial.drag");
          this.lesson = null;
          this.board.guide = null;
          this.say("tutorial.one");
        }
      } else if (event.type === "remove" || event.type === "clear") V.Audio.play("remove");
      else if (event.type === "undo") V.Audio.play("undo");
      else if (event.type === "tap") V.Audio.play("tap");
      this.syncTools();
    }

    undo() {
      if (this.done) return;
      if (!this.board.undo()) V.Audio.play("locked");
    }

    async clear() {
      if (this.done || !this.board.panes.length) return;
      this.paused = true;
      const yes = await V.Dialogs.confirm({ title: t("play.clear"), text: t("play.clearConfirm") });
      this.paused = false;
      if (yes) this.board.clear();
    }

    hint() {
      if (this.done) return;
      if (V.Store.data.lanterns <= 0) {
        V.Audio.play("locked");
        V.Dialogs.toast(t("play.noLanterns"));
        return;
      }
      if (!this.board.nextHint()) return;
      V.Store.spendLantern();
      this.hints++;
      V.Audio.play("hint");
      this.board.hint();
      this.syncTools();
      V.dom.replay(this.hintCount, "is-popping");
    }

    onKey(e) {
      if (V.Dialogs.isOpen) return;
      const key = e.key.toLowerCase();
      if (key === "escape" && !this.board.anchor) this.pause();
      else if (key === "escape") this.board.anchor = null;
      else if (key === "z") this.undo();
      else if (key === "h") this.hint();
    }

    pause() {
      if (this.done || V.Dialogs.isOpen) return;
      this.paused = true;
      V.Dialogs.open({
        title: t("pause.title"),
        className: "pause",
        body: h(
          "div",
          { class: "pause__cat" },
          catPicture(120, 3, "sleep"),
          h(
            "div",
            { class: "roundrow" },
            h("button", { type: "button", class: "round round--pink", label: "menu.help", onclick: () => V.Help.open() }, icon("help", { size: 24 })),
            h("button", { type: "button", class: "round round--white", label: "pause.settings", onclick: () => V.Settings.open(this.app) }, icon("gear", { size: 24 })),
          ),
        ),
        actions: [
          { label: t("pause.quit"), kind: "white", onClick: () => this.leave() },
          { label: t("pause.restart"), kind: "blue", onClick: () => this.app.go("play", { ...this.params }) },
          { label: t("pause.resume"), kind: "green" },
        ],
        onClose: () => (this.paused = false),
      });
    }

    leave() {
      if (this.params.mode === "story") this.app.go("windows", { chapter: this.params.chapter });
      else this.app.go("menu");
    }

    // the end

    won() {
      this.done = true;
      this.app.coach.hide();
      const seconds = Math.round(this.elapsed);
      const marks = [true, this.hints === 0, seconds <= this.puzzle.par];
      const stars = marks.filter(Boolean).length;
      let outcome = {};
      const { mode, chapter, level } = this.params;
      if (mode === "story") outcome = V.Store.finishLevel(chapter, level, stars, seconds);
      else if (mode === "daily") outcome = V.Store.finishDaily();
      else outcome = V.Store.finishFree();
      this.syncTools();
      V.Audio.play("win");
      setTimeout(() => this.active && this.showResult({ seconds, marks, outcome }), V.dom.calm() ? 300 : 2000);
    }

    showResult({ seconds, marks, outcome }) {
      const { mode, chapter, level } = this.params;
      const [where, which] = this.title();
      const labels = ["result.starSolved", "result.starClean", "result.starFast"];
      const paws = h(
        "div",
        { class: "paws" },
        marks.map((on, i) => h("div", { class: "paw-mark", style: { "--i": i } }, h("span", { class: "paw-mark__icon" }, icon("paw", { size: 44, fill: true })), h("span", { class: "paw-mark__label" }, t(labels[i])))),
      );
      const best = mode === "story" ? V.Store.bestOf(chapter, level) : null;
      const stats = h(
        "div",
        { class: "stats" },
        h("span", { class: "pill" }, `${t("result.time")} ${clock(seconds)}`),
        h("span", { class: "pill" }, `${t("result.par")} ${clock(this.puzzle.par)}`),
        best !== null ? h("span", { class: "pill" }, `${t("result.best")} ${clock(best)}`) : null,
      );
      const notes = [];
      if (outcome.newBest) notes.push(t("result.newBest"));
      if (outcome.lanterns) notes.push(t("result.lanterns", { n: outcome.lanterns }));
      if (mode === "daily") notes.push(t("result.streak", { n: outcome.streak }));
      if (outcome.completed) notes.push(t("result.completed", { name: t(`chapters.${V.Levels.CHAPTERS[chapter].id}.name`) }));
      if (outcome.opened) notes.push(t("result.opened", { name: t(`chapters.${V.Levels.CHAPTERS[chapter + 1].id}.name`) }));

      const actions = [];
      if (mode === "story") {
        actions.push({ label: t("result.again"), kind: "white", onClick: () => this.app.go("play", { ...this.params }) });
        actions.push({ label: t("result.windows"), kind: "blue", onClick: () => this.app.go("windows", { chapter }) });
        const next = this.nextLevel();
        if (next) actions.push({ label: t("result.next"), kind: "green", onClick: () => this.app.go("play", { mode: "story", ...next }) });
      } else if (mode === "daily") {
        actions.push({ label: t("result.menu"), kind: "green", onClick: () => this.app.go("menu") });
      } else {
        actions.push({ label: t("result.menu"), kind: "white", onClick: () => this.app.go("menu") });
        actions.push({ label: t("result.another"), kind: "green", onClick: () => this.app.go("play", { mode: "free", size: this.params.size, seed: `${Date.now()}` }) });
      }
      V.Dialogs.open({
        title: t("result.title"),
        className: "result",
        dismissible: false,
        body: [h("p", { class: "kicker" }, `${where} · ${which}`), catPicture(130, this.board.colors[0].cat, "happy"), paws, stats, notes.length ? h("p", { class: "result__notes" }, notes.join(" · ")) : null],
        actions,
      });
      marks.forEach((on, i) => {
        if (!on) return;
        setTimeout(() => {
          paws.children[i].classList.add("is-on");
          V.Audio.play("star", i);
        }, 350 + i * 300);
      });
    }

    nextLevel() {
      const { chapter, level } = this.params;
      if (level + 1 < V.Levels.LEVELS) return { chapter, level: level + 1 };
      if (chapter + 1 < V.Levels.CHAPTERS.length && V.Store.chapterOpen(chapter + 1)) return { chapter: chapter + 1, level: 0 };
      return null;
    }

    update(dt) {
      if (!this.active) return;
      this.board.update(dt);
      if (!this.blocked && !document.hidden) {
        this.elapsed += dt;
        const text = clock(this.elapsed);
        if (this.clockEl && this.clockEl.textContent !== text) {
          this.clockEl.textContent = text;
          this.clockEl.classList.toggle("is-over", this.elapsed > this.puzzle.par);
        }
      }
    }

    draw() {
      if (this.active) this.board.draw({ calm: V.dom.calm() });
    }
  }

  V.PlayScreen = PlayScreen;
  V.PlayScreen.catPicture = catPicture;
})(window.Purrfit);
