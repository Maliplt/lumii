"use strict";
(function (YB) {
  const { h, icon, sprite } = YB.dom;
  const t = (key, vars) => YB.t(key, vars);
  const bakeHost = (mood) => () => YB.Pixels.bake(YB.Sprites.host(mood), { outline: "k" });
  const bakeStar = () => YB.Pixels.bake(YB.Sprites.STAR, { outline: "k" });

  class MenuScreen {
    constructor(app, root) {
      this.app = app;
      this.root = root;
      this.blinkTimer = 0;
    }

    enter() {
      const next = YB.Store.next();
      const theme = YB.Levels.REGIONS[next ? next.region : YB.Levels.REGIONS.length - 1].id;
      this.app.setScene(theme, "menu");
      YB.Audio.music("tavern");
      this.render();
      clearInterval(this.blinkTimer);
      this.blinkTimer = setInterval(() => this.blink(), 3200);
    }

    exit() {
      clearInterval(this.blinkTimer);
    }

    refresh() {
      if (!this.root.hidden) this.render();
    }

    blink() {
      if (!this.mascot || YB.dom.calm()) return;
      const idle = this.mascot.src;
      this.mascot.src = YB.dom.spriteUrl("host|blink", bakeHost("blink")).url;
      setTimeout(() => this.mascot && (this.mascot.src = idle), 140);
    }

    render() {
      const store = YB.Store;
      const daily = store.dailyStatus();
      const total = YB.Levels.REGIONS.length * YB.Levels.LEVELS * 3;
      const errands = store.errands();
      const claimable = store.claimable();
      const fresh = errands.seen !== errands.day;
      const ledgerTab = store.deeds().some((deed) => deed.ready) && !errands.list.some((e) => !e.claimed && e.progress >= e.goal) && !store.chestReady() ? "deeds" : "errands";

      this.mascot = sprite("host|idle", bakeHost("idle"), { className: "menu__mascot" });
      this.mascot.addEventListener("pointerdown", () => {
        YB.dom.replay(this.mascot, "is-hopping");
        YB.Audio.play("clear", { kind: "joker", combo: 1 });
      });

      const play = h(
        "button",
        { type: "button", class: "btn btn-primary btn-large menu__play", onclick: () => this.app.go("map") },
        icon("play"),
        h("span", {}, t("menu.play")),
      );

      const dailyOpen = store.dailyOpen();
      const dailyButton = h(
        "button",
        { type: "button", class: `btn btn-wide${dailyOpen ? "" : " is-locked"}`, onclick: (e) => this.open(e.currentTarget, dailyOpen, () => this.app.go("play", { mode: "daily" })) },
        dailyOpen ? icon("calendar", "#e9a126", { large: true }) : icon("lock", "#3f2b40", { large: true }),
        h("span", { class: "btn-stack" }, h("span", {}, t("menu.daily")), h("span", { class: "btn-sub" }, dailyOpen ? (daily.played ? t("menu.dailyBest", { n: daily.best }) : "") : t("menu.dailyLocked"))),
        dailyOpen && !daily.played ? h("span", { class: "badge" }, t("menu.dailyNew")) : null,
      );

      const endlessOpen = store.endlessOpen();
      const endlessButton = h(
        "button",
        { type: "button", class: `btn btn-wide${endlessOpen ? "" : " is-locked"}`, onclick: (e) => this.open(e.currentTarget, endlessOpen, () => this.app.go("play", { mode: "endless" })) },
        endlessOpen ? icon("endless", "#a3263a", { large: true }) : icon("lock", "#3f2b40", { large: true }),
        h("span", { class: "btn-stack" }, h("span", {}, t("menu.endless")), h("span", { class: "btn-sub" }, endlessOpen ? (store.data.endless.best ? t("menu.endlessBest", { n: store.data.endless.best }) : "") : t("menu.endlessLocked"))),
      );

      this.root.replaceChildren(
        h(
          "header",
          { class: "menu__top" },
          h("span", { class: "chip" }, sprite("star", bakeStar), `${store.totalStars()}/${total}`),
          h("button", { type: "button", class: "chip purse", label: "menu.shop", onclick: () => this.app.go("shop") }, YB.ShopScreen.coin(), String(store.data.coins)),
        ),
        h(
          "div",
          { class: "menu__hero" },
          this.mascot,
          h("h1", { class: "logo" }, t("title")),
          h("p", { class: "menu__subtitle title-text" }, t("subtitle")),
        ),
        h(
          "nav",
          { class: "menu__actions" },
          play,
          dailyButton,
          endlessButton,
          h(
            "div",
            { class: "menu__row" },
            h("button", { type: "button", class: "btn btn-square", label: "menu.shop", onclick: () => this.app.go("shop") }, icon("market", "#231726", { large: true })),
            this.errandsButton(errands, claimable, fresh, ledgerTab),
            h("button", { type: "button", class: "btn btn-square", label: "menu.help", onclick: () => YB.Help.open() }, icon("help", "#231726", { large: true })),
            h("button", { type: "button", class: "btn btn-square", label: "menu.settings", onclick: () => YB.Settings.open(this.app) }, icon("gear", "#231726", { large: true })),
          ),
        ),
      );
    }

    // the day's errands at a glance: three pips and the chest behind them
    errandsButton(errands, claimable, fresh, tab) {
      const chest = errands.chest ? "open" : "closed";
      const pips = errands.list.map((errand) => h("span", { class: `pip${errand.claimed ? " is-claimed" : errand.progress >= errand.goal ? " is-done" : ""}` }));
      return h(
        "button",
        { type: "button", class: `btn errands-btn${claimable ? " btn-gold is-ready" : ""}`, label: "menu.ledger", onclick: () => this.app.go("ledger", { tab }) },
        sprite(`chest|${chest}`, () => YB.Pixels.bake(YB.Sprites.CHEST[chest], { outline: "k" }), { className: "errands-btn__chest" }),
        h("span", { class: "errands-btn__text" }, h("span", { class: "errands-btn__label" }, t("menu.errands")), h("span", { class: "pips" }, pips)),
        claimable ? h("span", { class: "badge" }, String(claimable)) : fresh ? h("span", { class: "badge" }, t("menu.dailyNew")) : null,
      );
    }

    open(button, allowed, action) {
      if (allowed) action();
      else {
        YB.dom.replay(button, "is-shaking");
        YB.Audio.play("bust");
      }
    }
  }

  YB.MenuScreen = MenuScreen;
})(window.YirmibirHani);
