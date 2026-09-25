"use strict";
(function (YB) {
  const SCREENS = { menu: "MenuScreen", map: "MapScreen", shop: "ShopScreen", ledger: "LedgerScreen", play: "PlayScreen" };
  const WIPE = 0.26;

  class App {
    constructor() {
      this.stage = new YB.Stage(document.getElementById("stage"));
      this.wipe = new YB.Wipe(document.getElementById("wipe"));
      this.scenery = new YB.Scenery();
      this.stage.onResize((w, h) => this.scenery.resize(w, h));
      this.coach = new YB.Coach(document.querySelector(".coach"), this.stage);
      this.coach.hide();
      this.screens = {};
      for (const [name, type] of Object.entries(SCREENS)) this.screens[name] = new YB[type](this, document.getElementById(`screen-${name}`));
      this.current = null;
      this.moving = false;
      this.transition = null;

      const unlock = () => YB.Audio.unlock();
      window.addEventListener("pointerdown", unlock, { capture: true });
      window.addEventListener("keydown", unlock, { capture: true });
      document.addEventListener("click", (e) => {
        const button = e.target.closest?.("button");
        if (button && !button.disabled && !button.classList.contains("is-locked") && !button.classList.contains("level")) YB.Audio.play("button");
      });
      window.addEventListener("keydown", (e) => {
        if (e.key !== "Escape" || YB.Dialogs.isOpen || this.moving) return;
        if (this.current === "map" || this.current === "shop" || this.current === "ledger") this.go("menu");
      });
      document.addEventListener("visibilitychange", () => {
        if (document.hidden && this.current === "play" && this.screens.play.state === "play") this.screens.play.pause();
      });
      YB.i18n.onChange(() => this.refresh());
    }

    setScene(theme, mode, room = null) {
      this.scenery.set(theme, mode === "menu" ? "menu" : "room");
      this.stage.setMode(mode === "table" ? "table" : "page", room);
    }

    start(route) {
      this.applySettings();
      this.stage.resize();
      this.show(route.name, route.params);
      let last = performance.now();
      this.wipe.amount = 1;
      this.transition = { from: 1, to: 0, t: 0, done: null };
      const tick = (now) => {
        requestAnimationFrame(tick);
        const dt = YB.util.clamp((now - last) / 1000, 0, 0.05);
        last = now;
        this.frame(dt);
      };
      requestAnimationFrame(tick);
    }

    frame(dt) {
      this.scenery.update(dt);
      if (this.current === "play") this.screens.play.update(dt);
      const calm = YB.dom.calm();
      this.stage.render((ctx) => {
        this.scenery.draw(ctx, calm);
        if (this.current === "play") this.screens.play.draw(ctx);
      });
      if (this.transition) {
        const tr = this.transition;
        tr.t = Math.min(1, tr.t + dt / (calm ? 0.05 : WIPE));
        this.wipe.amount = tr.from + (tr.to - tr.from) * tr.t;
        if (tr.t >= 1) {
          this.transition = null;
          tr.done?.();
        }
      }
      this.wipe.draw(this.stage);
    }

    show(name, params = {}) {
      const previous = this.screens[this.current];
      previous?.exit?.();
      if (previous) previous.root.hidden = true;
      YB.Dialogs.closeAll();
      this.current = name;
      const screen = this.screens[name];
      screen.root.hidden = false;
      screen.enter(params);
    }

    go(name, params = {}) {
      if (this.moving) return;
      this.moving = true;
      YB.Dialogs.closeAll();
      this.transition = {
        from: this.wipe.amount,
        to: 1,
        t: 0,
        done: () => {
          this.show(name, params);
          this.transition = {
            from: 1,
            to: 0,
            t: 0,
            done: () => (this.moving = false),
          };
        },
      };
    }

    applySettings() {
      const { music, sfx, calm } = YB.Store.data.settings;
      YB.Audio.setVolumes(music, sfx);
      document.documentElement.classList.toggle("calm", calm);
    }

    refresh() {
      Object.values(this.screens).forEach((screen) => screen.refresh?.());
      this.coach.refresh();
      YB.dom.relabel();
    }
  }

  YB.App = App;
})(window.YirmibirHani);
