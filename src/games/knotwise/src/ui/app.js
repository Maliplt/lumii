"use strict";
(function (K) {
  const SCREENS = { menu: "MenuScreen", pages: "PagesScreen", play: "PlayScreen" };

  class App {
    constructor() {
      this.coach = new K.Coach(document.querySelector(".coach"));
      this.veil = document.getElementById("veil");
      this.screens = {};
      for (const [name, type] of Object.entries(SCREENS)) this.screens[name] = new K[type](this, document.getElementById(`screen-${name}`));
      this.current = null;
      this.moving = false;

      const unlock = () => {
        K.Audio.unlock();
        K.Audio.music(K.Store.data.settings.music > 0);
      };
      window.addEventListener("pointerdown", unlock, { capture: true });
      window.addEventListener("keydown", unlock, { capture: true });
      document.addEventListener("click", (e) => {
        const button = e.target.closest?.("button");
        if (button && !button.disabled && !button.classList.contains("is-locked")) K.Audio.play("tap");
      });
      window.addEventListener("keydown", (e) => {
        if (e.key !== "Escape" || K.Dialogs.isOpen || this.moving) return;
        if (this.current === "pages") this.go("menu");
      });
      document.addEventListener("visibilitychange", () => {
        if (document.hidden && this.current === "play") this.screens.play.pause();
      });
      K.i18n.onChange(() => this.refresh());
    }

    start(route) {
      this.applySettings();
      this.show(route.name, route.params);
      let last = performance.now();
      const tick = (now) => {
        requestAnimationFrame(tick);
        const dt = K.util.clamp((now - last) / 1000, 0, 0.05);
        last = now;
        this.frame(dt);
      };
      requestAnimationFrame(tick);
      requestAnimationFrame(() => document.body.classList.add("is-ready"));
    }

    frame(dt) {
      const screen = this.screens[this.current];
      screen?.update?.(dt);
      screen?.draw?.();
    }

    show(name, params = {}) {
      const previous = this.screens[this.current];
      previous?.exit?.();
      if (previous) previous.root.hidden = true;
      K.Dialogs.closeAll();
      this.current = name;
      const screen = this.screens[name];
      screen.root.hidden = false;
      screen.enter(params);
      K.dom.replay(screen.root, "is-entering");
    }

    // turns a sheet of paper across the screen on the way to another one
    go(name, params = {}) {
      if (this.moving) return;
      this.moving = true;
      K.Dialogs.closeAll();
      const calm = K.dom.calm();
      const veil = this.veil;
      veil.classList.remove("is-leaving");
      veil.classList.add("is-down");
      K.Audio.play("open");
      setTimeout(
        () => {
          this.show(name, params);
          veil.classList.add("is-leaving");
          setTimeout(
            () => {
              veil.classList.remove("is-down", "is-leaving");
              this.moving = false;
            },
            calm ? 0 : 340,
          );
        },
        calm ? 0 : 330,
      );
    }

    // colours the backdrop after the notebook in use
    tint(color) {
      document.body.style.setProperty("--accent", color);
    }

    openFree() {
      K.Free.open(this);
    }

    applySettings() {
      const { music, sfx, calm } = K.Store.data.settings;
      K.Audio.setVolumes(music, sfx);
      K.Audio.music(music > 0);
      document.documentElement.classList.toggle("calm", calm);
    }

    refresh() {
      Object.values(this.screens).forEach((screen) => screen.refresh?.());
      this.coach.refresh();
      K.dom.relabel();
    }
  }

  K.App = App;
})(window.Knotwise);
