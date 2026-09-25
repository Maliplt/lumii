"use strict";
(function (V) {
  const SCREENS = { menu: "MenuScreen", windows: "WindowsScreen", play: "PlayScreen" };

  class App {
    constructor() {
      this.coach = new V.Coach(document.querySelector(".coach"));
      this.veil = document.getElementById("veil");
      this.screens = {};
      for (const [name, type] of Object.entries(SCREENS)) this.screens[name] = new V[type](this, document.getElementById(`screen-${name}`));
      this.current = null;
      this.moving = false;

      const unlock = () => {
        V.Audio.unlock();
        V.Audio.music(V.Store.data.settings.music > 0);
      };
      window.addEventListener("pointerdown", unlock, { capture: true });
      window.addEventListener("keydown", unlock, { capture: true });
      document.addEventListener("click", (e) => {
        const button = e.target.closest?.("button");
        if (button && !button.disabled && !button.classList.contains("is-locked")) V.Audio.play("tap");
      });
      window.addEventListener("keydown", (e) => {
        if (e.key !== "Escape" || V.Dialogs.isOpen || this.moving) return;
        if (this.current === "windows") this.go("menu");
      });
      document.addEventListener("visibilitychange", () => {
        if (document.hidden && this.current === "play") this.screens.play.pause();
      });
      V.i18n.onChange(() => this.refresh());
    }

    start(route) {
      this.applySettings();
      this.show(route.name, route.params);
      let last = performance.now();
      const tick = (now) => {
        requestAnimationFrame(tick);
        const dt = V.util.clamp((now - last) / 1000, 0, 0.05);
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
      V.Dialogs.closeAll();
      this.current = name;
      const screen = this.screens[name];
      screen.root.hidden = false;
      screen.enter(params);
      V.dom.replay(screen.root, "is-entering");
    }

    // fades through a sunny veil to another screen
    go(name, params = {}) {
      if (this.moving) return;
      this.moving = true;
      V.Dialogs.closeAll();
      const calm = V.dom.calm();
      this.veil.classList.add("is-down");
      setTimeout(
        () => {
          this.show(name, params);
          this.veil.classList.remove("is-down");
          setTimeout(() => (this.moving = false), calm ? 0 : 260);
        },
        calm ? 0 : 280,
      );
    }

    openFree() {
      V.Free.open(this);
    }

    applySettings() {
      const { music, sfx, calm } = V.Store.data.settings;
      V.Audio.setVolumes(music, sfx);
      V.Audio.music(music > 0);
      document.documentElement.classList.toggle("calm", calm);
    }

    refresh() {
      Object.values(this.screens).forEach((screen) => screen.refresh?.());
      this.coach.refresh();
      V.dom.relabel();
    }
  }

  V.App = App;
})(window.Purrfit);
