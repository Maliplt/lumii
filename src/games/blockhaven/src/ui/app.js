"use strict";
(function (B) {
  const SCREENS = { menu: "MenuScreen", levels: "LevelsScreen", play: "PlayScreen" };

  class App {
    constructor() {
      this.coach = new B.Coach(document.querySelector(".coach"));
      this.veil = document.getElementById("veil");
      this.screens = {};
      for (const [name, type] of Object.entries(SCREENS)) this.screens[name] = new B[type](this, document.getElementById(`screen-${name}`));
      this.current = null;
      this.moving = false;

      const unlock = () => {
        B.Audio.unlock();
        B.Audio.music(B.Store.data.settings.music > 0);
      };
      window.addEventListener("pointerdown", unlock, { capture: true });
      window.addEventListener("keydown", unlock, { capture: true });
      document.addEventListener("click", (e) => {
        const button = e.target.closest?.("button");
        if (button && !button.disabled && !button.classList.contains("is-locked")) B.Audio.play("tap");
      });
      document.addEventListener("visibilitychange", () => {
        if (document.hidden && this.current === "play") this.screens.play.pause();
      });
      B.i18n.onChange(() => this.refresh());
    }

    start(route) {
      this.applySettings();
      this.show(route.name, route.params);
      let last = performance.now();
      const tick = (now) => {
        requestAnimationFrame(tick);
        const dt = B.util.clamp((now - last) / 1000, 0, 0.05);
        last = now;
        this.frame(dt);
      };
      requestAnimationFrame(tick);
      requestAnimationFrame(() => document.body.classList.add("is-ready"));
    }

    frame(dt) {
      B.Backdrop.update(dt);
      B.Backdrop.draw();
      const screen = this.screens[this.current];
      screen?.update?.(dt);
      screen?.draw?.();
    }

    show(name, params = {}) {
      const previous = this.screens[this.current];
      previous?.exit?.();
      if (previous) previous.root.hidden = true;
      B.Dialogs.closeAll();
      this.current = name;
      const screen = this.screens[name];
      screen.root.hidden = false;
      screen.enter(params);
      B.dom.replay(screen.root, "is-entering");
      clearTimeout(this.enterTimer);
      this.enterTimer = setTimeout(() => screen.root.classList.remove("is-entering"), 700);
    }

    // a wall of blocks closes over the screen, then opens on the next one
    go(name, params = {}) {
      if (this.moving) return;
      this.moving = true;
      B.Dialogs.closeAll();
      const calm = B.dom.calm();
      const veil = this.veil;
      veil.classList.remove("is-leaving");
      veil.classList.add("is-down");
      B.Audio.play("open");
      setTimeout(
        () => {
          this.show(name, params);
          veil.classList.add("is-leaving");
          setTimeout(
            () => {
              veil.classList.remove("is-down", "is-leaving");
              this.moving = false;
            },
            calm ? 0 : 420,
          );
        },
        calm ? 0 : 420,
      );
    }

    applySettings() {
      const { music, sfx, calm } = B.Store.data.settings;
      B.Audio.setVolumes(music, sfx);
      B.Audio.music(music > 0);
      document.documentElement.classList.toggle("calm", calm);
    }

    refresh() {
      Object.values(this.screens).forEach((screen) => screen.refresh?.());
      this.coach.refresh();
      B.dom.relabel();
    }
  }

  B.App = App;
})(window.Blockhaven);
