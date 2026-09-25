"use strict";
// the front screen
(function (B) {
  const { h, icon } = B.dom;
  const t = (key, vars) => B.t(key, vars);

  // the emblem: four blocks in a square
  function emblem() {
    return h("span", { class: "emblem", "aria-hidden": "true" }, ["coral", "sun", "sky", "lime"].map((c) => h("i", { class: `emblem__block emblem__block--${c}` })));
  }

  // today's missions, each with its bar and reward
  function openMissions() {
    const list = B.Store.missions();
    B.Audio.play("open");
    B.Dialogs.open({
      title: t("missions.title"),
      className: "missions",
      body: [
        h("p", { class: "missions__note" }, t("missions.note")),
        h(
          "div",
          { class: "mission-list" },
          list.map((m) => {
            const done = m.have >= m.need;
            return h(
              "div",
              { class: `mission${done ? " is-done" : ""}` },
              h(
                "div",
                { class: "mission__text" },
                h("span", { class: "mission__name" }, t(`missions.${m.kind}`, { n: B.util.number(m.need) })),
                h("div", { class: "mission__bar" }, h("span", { style: { "--p": String(m.have / m.need) } })),
                h("span", { class: "mission__count" }, done ? t("missions.done") : `${B.util.number(m.have)} / ${B.util.number(m.need)}`),
              ),
              h("span", { class: "mission__reward", title: t(`play.${m.reward}`) }, done ? icon("check", { size: 22 }) : icon(m.reward, { size: 22 }), done ? null : h("b", {}, "+1")),
            );
          }),
        ),
      ],
      actions: [{ label: t("common.ok"), kind: "primary" }],
    });
  }

  class MenuScreen {
    constructor(app, root) {
      this.app = app;
      this.root = root;
      this.time = 0;
      this.stepAt = 0;
      this.stage = null;
    }

    enter() {
      this.render();
    }

    refresh() {
      if (!this.root.hidden) this.render();
    }

    render() {
      const store = B.Store;
      const next = store.next();
      const daily = store.dailyStatus();
      const dailyOpen = store.dailyOpen();
      const missions = store.missions();
      const missionsDone = missions.filter((m) => m.have >= m.need).length;
      const canvas = h("canvas", { class: "hero__art", "aria-hidden": "true" });
      this.stage = new B.Stage(canvas, { demo: true });
      this.newDemo();

      const play = h(
        "button",
        { type: "button", class: "play-btn", onclick: () => this.playEndless() },
        h("span", { class: "play-btn__icon" }, icon("play", { size: 30 })),
        h(
          "span",
          { class: "play-btn__text" },
          h("span", { class: "play-btn__label" }, t("menu.play")),
          store.data.best ? h("span", { class: "play-btn__sub" }, icon("trophy", { size: 16 }), t("menu.best", { n: B.util.number(store.data.best) })) : null,
        ),
      );
      const level = h(
        "div",
        { class: "level-row" },
        h(
          "button",
          { type: "button", class: "level-btn", onclick: () => (next === null ? this.app.go("levels") : this.app.go("play", { mode: "story", n: next })) },
          h("span", { class: "level-btn__label" }, next === null ? t("menu.allDone") : t("menu.next", { n: next + 1 })),
          h("span", { class: "level-btn__stars" }, icon("star", { size: 16 }), String(store.totalStars())),
        ),
        h("button", { type: "button", class: "map-btn", label: "menu.levels", onclick: () => this.app.go("levels") }, icon("grid", { size: 26 })),
      );
      const card = (kind, iconName, label, sub, onclick, extra = {}) =>
        h(
          "button",
          { type: "button", class: `card-btn card-btn--${kind}${extra.locked ? " is-locked" : ""}`, onclick },
          h("span", { class: "card-btn__icon" }, icon(extra.locked ? "lock" : iconName, { size: 24 })),
          h("span", { class: "card-btn__text" }, h("span", { class: "card-btn__label" }, label), sub ? h("span", { class: "card-btn__sub" }, sub) : null),
          extra.badge ? h("span", { class: "tag" }, extra.badge) : null,
        );

      this.root.replaceChildren(
        h(
          "div",
          { class: "topline" },
          h("span", { class: "chip chip--star", title: t("menu.stars") }, icon("star", { size: 18 }), String(store.totalStars())),
          h(
            "div",
            { class: "topline__end" },
            h("button", { type: "button", class: "icon-btn", label: "menu.help", onclick: () => B.Help.open() }, icon("help", { size: 22 })),
            h("button", { type: "button", class: "icon-btn", label: "menu.settings", onclick: () => B.Settings.open(this.app) }, icon("gear", { size: 22 })),
          ),
        ),
        h(
          "div",
          { class: "menu__body" },
          h("header", { class: "brand" }, emblem(), h("h1", { class: "brand__name" }, t("title"))),
          h("div", { class: "hero" }, canvas),
          h(
            "nav",
            { class: "actions" },
            play,
            level,
            h(
              "div",
              { class: "actions__pair" },
              card(
                "daily",
                "calendar",
                t("menu.daily"),
                !dailyOpen ? t("menu.dailyLocked") : daily.played ? t("menu.dailyDone", { n: daily.streak }) : daily.streak ? t("menu.dailyStreak", { n: daily.streak }) : null,
                () => (dailyOpen ? this.app.go("play", { mode: "daily" }) : this.locked(t("menu.dailyLocked"))),
                { locked: !dailyOpen, badge: dailyOpen && !daily.played ? t("menu.dailyNew") : null },
              ),
              card("missions", "trophy", t("menu.missions"), `${missionsDone} / ${missions.length}`, () => openMissions()),
            ),
          ),
        ),
      );
    }

    // play opens the endless game, after the lessons the first time
    playEndless() {
      const lesson = B.Store.firstLesson();
      this.app.go("play", lesson === null ? { mode: "endless" } : { mode: "story", n: lesson, then: "endless" });
    }

    locked(text) {
      B.Audio.play("locked");
      B.Dialogs.toast(text);
    }

    newDemo() {
      this.demo = new B.Session({ ...B.Levels.endless(`menu/${Math.floor(this.time)}`), hardness: () => 0.2 });
      this.stage.load(this.demo);
      this.stepAt = this.time + 1;
    }

    update(dt) {
      this.time += dt;
      if (!this.stage) return;
      this.stage.update(dt);
      if (this.time > this.stepAt && !B.dom.calm()) {
        this.stepAt = this.time + 0.75;
        if (this.demo.over || this.demo.moves > 40) return this.newDemo();
        const move = B.Bot.choose(this.demo);
        if (!move) return this.newDemo();
        this.stage.play(this.demo.place(move.slot, move.x, move.y));
      }
    }

    draw() {
      if (this.stage?.canvas.isConnected) this.stage.draw();
    }
  }

  B.MenuScreen = MenuScreen;
})(window.Blockhaven);
