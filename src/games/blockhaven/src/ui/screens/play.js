"use strict";
// a game in progress
(function (B) {
  const { h, icon } = B.dom;
  const t = (key, vars) => B.t(key, vars);
  const L = B.Levels;

  const goalBadge = (goal, size) => B.dom.badge(goal.type === "score" ? "block" : goal.type, size, goal.type === "gems" ? goal.gem : "sun");
  const goalName = (goal) => t(`goals.${goal.type === "gems" ? goal.gem : goal.type}`);
  const goalCount = (goal) => (goal.type === "score" ? `${B.util.number(goal.have)}/${B.util.number(goal.need)}` : `${goal.have}/${goal.need}`);

  class PlayScreen {
    constructor(app, root) {
      this.app = app;
      this.root = root;
      this.active = false;
      window.addEventListener("keydown", (e) => {
        if (!this.active || B.Dialogs.isOpen || this.app.moving) return;
        if (e.key === "Escape" || e.key === "p") this.pause();
      });
      window.addEventListener("resize", () => this.active && this.level?.lesson && requestAnimationFrame(() => this.lesson()));
    }

    enter(params) {
      this.params = params;
      this.active = true;
      this.ended = false;
      this.recordShown = false;
      this.shown = 0;
      if (params.mode === "endless") this.level = L.endless(`${Date.now()}`);
      else if (params.mode === "daily") this.level = L.daily(B.util.dayKey());
      else this.level = L.story(params.n);
      this.session = new B.Session(this.level);
      this.render();
      this.stage.load(this.session);
      this.status();
      requestAnimationFrame(() => {
        this.stage.layout(true);
        this.intro();
      });
    }

    exit() {
      this.active = false;
      if (this.canvas) this.canvas.hidden = true;
      this.app.coach.hide();
      this.app.coach.place(null);
    }

    refresh() {
      if (!this.active) return;
      this.render(true);
      this.status();
      if (this.level.lesson) this.lesson();
    }

    get title() {
      const p = this.params;
      return p.mode === "endless" ? t("play.endless") : p.mode === "daily" ? t("play.daily") : t("play.level", { n: p.n + 1 });
    }

    render(keepStage = false) {
      const p = this.params;
      const lesson = Boolean(this.level.lesson);
      // the canvas lies over the whole window; the board is laid out in `area`
      if (!this.area) {
        this.area = h("div", { class: "play__stage", role: "application", "aria-label": t("title") });
        this.canvas = h("canvas", { class: "stage", "aria-hidden": "true" });
        document.body.append(this.canvas);
      }
      const canvas = this.canvas;
      canvas.hidden = false;
      if (!this.stage) {
        this.stage = new B.Stage(canvas, {
          area: this.area,
          onPlace: (events) => this.placed(events),
          goalTarget: (goal) => this.goalTarget(goal),
          onGoal: (goal) => this.goalArrived(goal),
          onHammer: (x, y) => this.smash(x, y),
        });
      }
      this.goalEls = new Map();
      const goals = h(
        "div",
        { class: "goals" },
        this.session.goals.map((goal) => {
          const el = h("div", { class: "goal", title: goalName(goal) }, goalBadge(goal, 24), h("span", { class: "goal__count" }));
          this.goalEls.set(goal, el);
          return el;
        }),
      );
      const endless = p.mode === "endless";
      this.movesEl = h("div", { class: `moves${lesson ? " is-hidden" : ""}` }, h("span", { class: "moves__num" }), h("span", { class: "moves__label" }, endless ? t("play.best") : t("play.moves")));
      this.scoreNum = h("span", { class: "score__num" }, "0");
      this.scoreEl = h("div", { class: "score" }, h("span", { class: "score__label" }, t("play.score")), this.scoreNum);
      this.comboEl = h("div", { class: "combo", "aria-live": "polite" }, h("span", { class: "combo__label" }), h("span", { class: "combo__pips" }, [0, 1, 2].map(() => h("i"))));
      this.hammerBtn = h("button", { type: "button", class: "power", label: "play.hammer", onclick: () => this.toggleHammer() }, icon("hammer", { size: 24 }), h("span", { class: "power__count" }));
      this.shuffleBtn = h("button", { type: "button", class: "power", label: "play.shuffle", onclick: () => this.shuffle() }, icon("shuffle", { size: 24 }), h("span", { class: "power__count" }));
      this.root.replaceChildren(
        h(
          "div",
          { class: "hud" },
          h("button", { type: "button", class: "icon-btn", label: "play.pause", onclick: () => this.pause() }, icon("pause", { size: 22 })),
          h("div", { class: "hud__middle" }, h("span", { class: "hud__title" }, this.title), endless ? null : goals),
          this.movesEl,
        ),
        h("div", { class: "scorebar" }, this.scoreEl, this.comboEl),
        this.area,
        h("div", { class: `powers${lesson ? " is-hidden" : ""}` }, this.hammerBtn, this.shuffleBtn),
      );
    }

    status() {
      const s = this.session;
      if (!s) return;
      for (const [goal, el] of this.goalEls) {
        el.querySelector(".goal__count").textContent = goalCount(goal);
        el.classList.toggle("is-done", goal.have >= goal.need);
      }
      const num = this.movesEl.querySelector(".moves__num");
      if (this.params.mode === "endless") num.textContent = B.util.number(Math.max(B.Store.data.best, s.score));
      else if (s.movesLeft !== null) {
        num.textContent = String(s.movesLeft);
        this.movesEl.classList.toggle("is-low", s.movesLeft <= 5);
      }
      const combo = s.combo >= 2;
      this.comboEl.classList.toggle("is-on", combo);
      this.comboEl.querySelector(".combo__label").textContent = t("play.combo", { n: Math.max(2, s.combo) });
      const left = B.Scoring.CALM_LIMIT - s.calm;
      [...this.comboEl.querySelectorAll(".combo__pips i")].forEach((pip, i) => pip.classList.toggle("is-on", i < left));
      const b = B.Store.data.boosters;
      this.hammerBtn.querySelector(".power__count").textContent = String(b.hammer);
      this.shuffleBtn.querySelector(".power__count").textContent = String(b.shuffle);
      this.hammerBtn.classList.toggle("is-active", this.stage.hammer);
      this.hammerBtn.classList.toggle("is-empty", b.hammer <= 0);
      this.shuffleBtn.classList.toggle("is-empty", b.shuffle <= 0);
    }

    // ---------- before play ----------

    intro() {
      const p = this.params;
      const store = B.Store;
      if (this.level.lesson) {
        this.lesson();
        return;
      }
      const steps = [];
      const teach = p.mode === "story" ? L.teaches(p.n) : store.tipSeen("teach.perks") ? null : "perks";
      if (teach && !store.tipSeen(`teach.${teach}`)) steps.push(() => this.teach(teach));
      if (p.mode !== "endless") steps.push(() => this.startCard());
      const run = () => {
        const step = steps.shift();
        if (step) step().then(run);
      };
      run();
    }

    // in a lesson: the dotted target on the board, the note and the finger
    lesson() {
      const hint = this.session.hint();
      this.stage.hint = hint;
      if (!hint || this.ended) {
        this.app.coach.hide();
        return;
      }
      this.app.coach.show({ text: this.session.tip || "coach.drag", button: false, path: () => this.coachPath(hint) });
      const st = this.stage;
      this.app.coach.place(st.canvas.getBoundingClientRect().top + st.trayY + st.trayH + 14);
    }

    teach(kind) {
      B.Store.markTip(`teach.${kind}`);
      B.Audio.play("open");
      return new Promise((resolve) => {
        let art;
        let extra = null;
        if (kind === "perks") {
          art = h("div", { class: "teach__art" }, B.Scoring.PERKS.map((perk) => B.dom.badge("perk", 56, perk)));
          extra = h(
            "div",
            { class: "perk-list" },
            B.Scoring.PERKS.map((perk) => h("div", { class: "perk-row" }, B.dom.badge("perk", 34, perk), h("span", {}, t(`perks.${perk}`)))),
          );
        } else art = h("div", { class: "teach__art" }, B.dom.badge(kind === "gems" ? "gems" : kind, 64, "ruby"));
        B.Dialogs.open({
          title: t(`teach.${kind}.title`),
          className: "teach",
          body: [art, h("p", {}, t(`teach.${kind}.text`)), extra],
          actions: [{ label: t("common.ok"), kind: "primary" }],
          onClose: () => resolve(),
        });
      });
    }

    startCard() {
      const p = this.params;
      const goals = this.session.goals;
      const hard = p.mode === "story" && L.hard(p.n);
      const fun = Boolean(this.level.fun);
      return new Promise((resolve) => {
        B.Dialogs.open({
          className: `start${hard ? " is-hard" : ""}${fun ? " is-fun" : ""}`,
          dismissible: false,
          body: [
            h(
              "div",
              { class: "start__head" },
              h("span", { class: "start__badge", "aria-hidden": "true" }, p.mode === "daily" ? icon("calendar", { size: 30 }) : String(p.n + 1)),
              h("div", { class: "start__titles" }, h("h2", { class: "start__title" }, this.title), hard ? h("span", { class: "start__hard" }, t("levels.hard")) : null, fun ? h("span", { class: "start__hard start__fun" }, t("levels.fun")) : null),
            ),
            fun ? h("p", { class: "start__note" }, t("levels.funText")) : null,
            h("p", { class: "start__label" }, t("goals.title")),
            h(
              "div",
              { class: "start__list" },
              goals.map((g) => h("div", { class: "start__row" }, h("span", { class: "start__icon" }, goalBadge(g, 30)), h("span", { class: "start__name" }, goalName(g)), h("span", { class: "start__need" }, g.type === "score" ? B.util.number(g.need) : `×${g.need}`))),
            ),
            h("div", { class: "start__moves" }, icon("moves", { size: 18 }), h("span", {}, t("play.movesLeft", { n: this.level.moves }))),
          ],
          actions: [{ label: t("play.start"), kind: "primary", icon: "play" }],
          onClose: () => resolve(),
        });
      });
    }

    coachPath(hint) {
      const st = this.stage;
      const piece = this.session.tray[hint.slot];
      if (!piece) return [{ x: 0, y: 0 }, { x: 0, y: 0 }];
      const rect = st.canvas.getBoundingClientRect();
      const slot = st.slots[hint.slot];
      const lift = window.matchMedia?.("(pointer: coarse)").matches ? 1.7 : 0.4;
      return [
        { x: rect.left + slot.x + slot.w / 2, y: rect.top + slot.y + slot.h / 2 },
        { x: rect.left + st.bx + (hint.x + piece.shape.w / 2) * st.cell, y: rect.top + st.by + (hint.y + piece.shape.h / 2) * st.cell + st.cell * lift },
      ];
    }

    // ---------- during play ----------

    goalTarget(goal) {
      const el = this.goalEls.get(goal);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const c = this.stage.canvas.getBoundingClientRect();
      return { x: r.left + 18 - c.left, y: r.top + r.height / 2 - c.top };
    }

    goalArrived(goal) {
      const el = this.goalEls.get(goal);
      if (el) B.dom.replay(el, "is-bumping");
      this.status();
    }

    placed(events) {
      this.status();
      this.track(events);
      if (events.some((e) => e.type === "clear")) B.dom.replay(this.scoreEl, "is-bumping");
      if (events.some((e) => e.type === "clear" && e.combo >= 2)) B.dom.replay(this.comboEl, "is-bumping");
      const end = events.find((e) => e.type === "end");
      if (this.level.lesson) this.lesson();
      if (end) {
        this.ended = true;
        this.app.coach.hide();
        setTimeout(() => this.active && this.finish(end), end.won ? 1300 : 900);
      }
    }

    // daily missions move with every move; an endless run cheers a new record once
    track(events) {
      const amounts = { score: this.session.score };
      for (const ev of events) {
        if (ev.type === "place") amounts.pieces = (amounts.pieces || 0) + 1;
        if (ev.type !== "clear") continue;
        amounts.lines = (amounts.lines || 0) + ev.lines.count;
        if (ev.lines.count >= 2) amounts.multi = (amounts.multi || 0) + 1;
        amounts.combo = Math.max(amounts.combo || 0, ev.combo);
        if (ev.perks?.length) amounts.perks = (amounts.perks || 0) + ev.perks.length;
      }
      for (const m of B.Store.track(amounts)) {
        B.Dialogs.toast(t("missions.toast", { booster: t(`play.${m.reward}`) }));
        B.Audio.play("booster");
      }
      const best = B.Store.data.best;
      if (this.params.mode === "endless" && !this.recordShown && best > 0 && this.session.score > best) {
        this.recordShown = true;
        const st = this.stage;
        st.text(t("result.record"), st.bx + st.size / 2, st.by + st.size * 0.42, st.cell * 1.2, "perfect", 0.5);
        setTimeout(() => B.Audio.play("perfect"), 500);
      }
      this.status();
    }

    update(dt) {
      if (!this.active) return;
      this.stage.update(dt);
      const target = this.session.score;
      if (this.shown !== target) {
        this.shown += (target - this.shown) * Math.min(1, dt * 7);
        if (Math.abs(target - this.shown) < 1) this.shown = target;
        this.scoreNum.textContent = B.util.number(this.shown);
      }
    }

    draw() {
      if (this.active) this.stage.draw();
    }

    toggleHammer() {
      if (this.ended && !this.session.over) return;
      if (B.Store.data.boosters.hammer <= 0) {
        B.Audio.play("locked");
        B.Dialogs.toast(t("play.noBooster"));
        return;
      }
      this.stage.hammer = !this.stage.hammer;
      if (this.stage.hammer) B.Dialogs.toast(t("play.hammerHint"));
      B.Audio.play("tap");
      this.status();
    }

    smash(x, y) {
      const cell = this.session.grid.at(x, y);
      if (!cell || cell.kind === "stone") {
        B.Audio.play("locked");
        return;
      }
      if (!B.Store.useBooster("hammer")) return;
      this.stage.hammer = false;
      const events = this.session.smash(x, y);
      this.stage.play(events);
      this.status();
      const end = events.find((e) => e.type === "end");
      if (end) {
        this.ended = true;
        setTimeout(() => this.active && this.finish(end), 1300);
      }
    }

    shuffle() {
      if (this.session.over) return;
      if (!B.Store.useBooster("shuffle")) {
        B.Audio.play("locked");
        B.Dialogs.toast(t("play.noBooster"));
        return;
      }
      B.Audio.play("booster");
      this.stage.play(this.session.reshuffle());
      this.status();
    }

    // a quick switch in the pause card
    quick(iconName, key, onclick, off = false) {
      const button = h("button", { type: "button", class: `icon-btn icon-btn--big${off ? " is-off" : ""}`, label: key, onclick: () => onclick(button) }, icon(iconName, { size: 24 }));
      return h("div", { class: "quick__item" }, button, h("span", { class: "quick__label" }, t(key)));
    }

    pause() {
      if (!this.active || this.ended || B.Dialogs.isOpen) return;
      const settings = B.Store.data.settings;
      B.Audio.play("open");
      const flip = (key, fallback) => (button) => {
        const next = settings[key] > 0 ? 0 : fallback;
        B.Store.setSetting(key, next);
        this.app.applySettings();
        button.classList.toggle("is-off", next === 0);
        button.replaceChildren(icon(key === "music" ? "music" : next === 0 ? "mute" : "sound", { size: 24 }));
      };
      const s = this.session;
      B.Dialogs.open({
        title: t("play.pause"),
        className: "pause",
        body: [
          h(
            "div",
            { class: "pause__stats" },
            h("span", { class: "chip" }, `${t("play.score")} ${B.util.number(s.score)}`),
            s.movesLeft !== null ? h("span", { class: "chip" }, t("play.movesLeft", { n: s.movesLeft })) : null,
          ),
          h(
            "div",
            { class: "quick" },
            this.quick("music", "play.music", flip("music", 0.5), settings.music === 0),
            this.quick(settings.sfx === 0 ? "mute" : "sound", "play.sound", flip("sfx", 0.8), settings.sfx === 0),
            this.quick("help", "menu.help", () => B.Help.open()),
            this.quick("gear", "menu.settings", () => B.Settings.open(this.app)),
          ),
        ],
        actions: [
          { label: t("play.resume"), kind: "primary" },
          { label: t("play.restart"), kind: "ghost", onClick: () => this.app.go("play", { ...this.params }) },
          { label: this.params.mode === "story" ? t("play.quit") : t("result.menu"), kind: "ghost", onClick: () => this.app.go(this.params.mode === "story" ? "levels" : "menu", { n: this.params.n }) },
        ],
      });
    }

    // ---------- the end ----------

    nextLevel() {
      const n = this.params.n + 1;
      return n < L.TOTAL && B.Store.levelOpen(n) ? n : null;
    }

    finish(end) {
      const p = this.params;
      const s = this.session;
      const store = B.Store;
      const notes = [];
      const actions = [];
      let stars = 0;
      let title;
      let won = end.won;
      let record = false;

      if (p.mode === "endless") {
        record = store.finishEndless(s.score).record;
        title = t("result.over");
        won = true;
        actions.push({ label: t("result.retry"), kind: "primary", icon: "restart", onClick: () => this.app.go("play", { mode: "endless" }) });
        actions.push({ label: t("result.menu"), kind: "ghost", onClick: () => this.app.go("menu") });
      } else if (won) {
        stars = L.stars(this.level, s.movesLeft);
        title = t(stars === 3 ? "result.perfect" : stars === 2 ? "result.great" : "result.win");
        if (p.mode === "story") {
          const outcome = store.finishLevel(p.n, stars);
          if (outcome.reward) notes.push(t("result.reward", { booster: t(`play.${outcome.reward}`) }));
          if (p.then) {
            // lessons taken on the way to the endless game lead into it
            const lesson = store.firstLesson();
            if (lesson !== null) actions.push({ label: t("result.next"), kind: "primary", icon: "play", onClick: () => this.app.go("play", { mode: "story", n: lesson, then: p.then }) });
            else actions.push({ label: t("menu.play"), kind: "primary", icon: "play", onClick: () => this.app.go("play", { mode: p.then }) });
          } else {
            const next = this.nextLevel();
            if (next !== null) actions.push({ label: t("result.next"), kind: "primary", icon: "play", onClick: () => this.app.go("play", { mode: "story", n: next }) });
            actions.push({ label: t("result.retry"), kind: "ghost", onClick: () => this.app.go("play", { ...p }) });
          }
          actions.push({ label: t("result.map"), kind: "ghost", onClick: () => this.app.go("levels", { n: p.n }) });
        } else {
          const outcome = store.finishDaily();
          notes.push(t("result.streak", { n: outcome.streak }));
          actions.push({ label: t("result.menu"), kind: "primary", onClick: () => this.app.go("menu") });
        }
      } else {
        title = t("result.lose");
        if (end.reason === "stuck" && store.data.boosters.shuffle > 0) {
          actions.push({
            label: `${t("play.shuffle")} · ${store.data.boosters.shuffle}`,
            kind: "orange",
            icon: "shuffle",
            onClick: () => {
              if (!s.revive() || !store.useBooster("shuffle")) return;
              this.ended = false;
              B.Audio.play("booster");
              this.stage.play(s.reshuffle());
              this.status();
            },
          });
        }
        actions.push({ label: t("result.retry"), kind: "primary", icon: "restart", onClick: () => this.app.go("play", { ...p }) });
        actions.push({ label: p.mode === "story" ? t("result.map") : t("result.menu"), kind: "ghost", onClick: () => this.app.go(p.mode === "story" ? "levels" : "menu", { n: p.n }) });
      }

      B.Audio.play(won ? "win" : "lose");
      const reason = p.mode === "endless" ? null : won ? null : t(`result.${end.reason === "stuck" ? "stuck" : "moves"}`);
      const num = h("span", { class: "result__num" }, "0");
      const stat = (value, label) => h("div", { class: "stat" }, h("span", { class: "stat__value" }, value), h("span", { class: "stat__label" }, label));
      B.Dialogs.open({
        className: `result${won ? " is-win" : " is-lose"}`,
        dismissible: false,
        body: [
          h("p", { class: "result__kicker" }, this.title),
          h("h2", { class: "result__title" }, title),
          reason ? h("p", { class: "result__reason" }, reason) : null,
          p.mode !== "endless" && won ? h("div", { class: "marks" }, [0, 1, 2].map(() => h("span", { class: "mark" }, icon("star", { size: 46 })))) : null,
          h("div", { class: "result__score" }, h("span", { class: "result__label" }, t("play.score")), num, record ? h("span", { class: "result__record" }, t("result.record")) : null),
          p.mode === "endless" && !record ? h("p", { class: "result__best" }, t("result.best", { n: B.util.number(store.data.best) })) : null,
          h("div", { class: "stats" }, stat(String(s.stats.lines), t("goals.lines")), stat(`×${Math.max(1, s.stats.bestCombo)}`, t("result.combo")), stat(String(s.stats.perks), t("result.perks"))),
          notes.length ? h("p", { class: "result__notes" }, notes.join(" · ")) : null,
        ],
        actions,
      });
      this.countUp(num, s.score);
      for (let i = 0; i < stars; i++) {
        setTimeout(
          () => {
            const mark = document.querySelectorAll(".result .mark")[i];
            if (!mark) return;
            mark.classList.add("is-on");
            B.Audio.play("star", { index: i });
          },
          B.dom.calm() ? 0 : 500 + i * 320,
        );
      }
    }

    // the final score counts up from zero
    countUp(el, value) {
      if (B.dom.calm() || value <= 0) {
        el.textContent = B.util.number(value);
        return;
      }
      const start = performance.now();
      const length = Math.min(1200, 400 + value / 3);
      let lastTick = 0;
      const step = (now) => {
        if (!el.isConnected) return;
        const k = Math.min(1, (now - start) / length);
        el.textContent = B.util.number(value * B.util.easeOut(k));
        if (now - lastTick > 60 && k < 1) {
          lastTick = now;
          B.Audio.play("count");
        }
        if (k < 1) requestAnimationFrame(step);
        else B.dom.replay(el, "is-bumping");
      };
      requestAnimationFrame(step);
    }
  }

  B.PlayScreen = PlayScreen;
})(window.Blockhaven);
