"use strict";
// level select: six areas of twenty levels
(function (V) {
  const { h, icon } = V.dom;
  const t = (key, vars) => V.t(key, vars);
  const COLORS = ["orange", "pink", "green", "blue", "purple", "yellow"];
  const LOOKS = [0, 3, 1, 4, 2, 5];

  class WindowsScreen {
    constructor(app, root) {
      this.app = app;
      this.root = root;
      this.chapter = 0;
      this.time = 0;
      let startX = null;
      root.addEventListener("pointerdown", (e) => (startX = e.clientX));
      root.addEventListener("pointerup", (e) => {
        if (startX === null) return;
        const dx = e.clientX - startX;
        startX = null;
        if (Math.abs(dx) < 80) return;
        this.swiped = performance.now();
        const forward = document.documentElement.dir === "rtl" ? dx > 0 : dx < 0;
        this.show(this.chapter + (forward ? 1 : -1));
      });
    }

    enter({ chapter = 0 } = {}) {
      this.chapter = chapter;
      this.render();
    }

    refresh() {
      if (!this.root.hidden) this.render();
    }

    show(chapter) {
      if (chapter < 0 || chapter >= V.Levels.CHAPTERS.length || chapter === this.chapter) return;
      this.chapter = chapter;
      V.Audio.play("open");
      this.render();
      V.dom.replay(this.root.querySelector(".area"), "is-popping");
    }

    render() {
      const store = V.Store;
      const chapter = V.Levels.CHAPTERS[this.chapter];
      const open = store.chapterOpen(this.chapter);
      const previous = V.Levels.CHAPTERS[this.chapter - 1];
      const next = store.next();
      const solved = store.chapterSolved(this.chapter);
      this.cat = h("canvas", { class: "area__cat", "aria-hidden": "true" });

      const levels = h(
        "div",
        { class: "levels" },
        Array.from({ length: V.Levels.LEVELS }, (_, level) => {
          const stars = store.starsOf(this.chapter, level);
          const reachable = store.levelOpen(this.chapter, level);
          const current = next && next.chapter === this.chapter && next.level === level;
          const state = stars ? "is-done" : current ? "is-current" : reachable ? "" : "is-locked";
          return h(
            "button",
            {
              type: "button",
              class: `level ${state}`,
              style: { "--i": level },
              "aria-label": `${t("windows.pane", { n: level + 1 })}${reachable ? "" : `, ${t("common.locked")}`}`,
              onclick: (e) => this.open(level, e.currentTarget),
            },
            reachable ? h("span", { class: "level__num" }, String(level + 1)) : icon("lock", { size: 22 }),
            h("span", { class: "level__paws" }, V.dom.stars(stars, { size: 12 })),
          );
        }),
      );

      this.root.replaceChildren(
        h(
          "header",
          { class: "topline" },
          h("button", { type: "button", class: "round round--white round--small", label: "common.back", onclick: () => this.app.go("menu") }, icon("back", { size: 24 })),
          h("h1", { class: "screen-title" }, t("windows.title")),
          h("span", { class: "pill" }, icon("paw", { size: 18, fill: true }), `${store.chapterStars(this.chapter)}/${V.Levels.LEVELS * 3}`),
        ),
        h(
          "div",
          { class: "area-row" },
          h("button", { type: "button", class: "round round--white round--small", "aria-label": previous ? t(`chapters.${previous.id}.name`) : "", disabled: this.chapter === 0, onclick: () => this.show(this.chapter - 1) }, icon("back", { size: 22 })),
          h(
            "div",
            { class: `area area--${COLORS[this.chapter]}` },
            this.cat,
            h(
              "div",
              { class: "area__text" },
              h("span", { class: "area__kicker" }, t("windows.series", { n: this.chapter + 1 })),
              h("h2", { class: "area__name" }, t(`chapters.${chapter.id}.name`)),
              h("p", { class: "area__info" }, open ? t(`chapters.${chapter.id}.text`) : t("windows.locked", { name: t(`chapters.${previous.id}.name`) })),
              h("span", { class: "meter" }, h("span", { class: "meter__fill", style: { "--p": solved / V.Levels.LEVELS } }), h("span", { class: "meter__text" }, t("windows.progress", { n: solved }))),
            ),
          ),
          h("button", { type: "button", class: "round round--white round--small", "aria-label": V.Levels.CHAPTERS[this.chapter + 1] ? t(`chapters.${V.Levels.CHAPTERS[this.chapter + 1].id}.name`) : "", disabled: this.chapter === V.Levels.CHAPTERS.length - 1, onclick: () => this.show(this.chapter + 1) }, icon("forward", { size: 22 })),
        ),
        levels,
      );
    }

    open(level, button) {
      if (this.swiped && performance.now() - this.swiped < 300) return;
      if (!V.Store.levelOpen(this.chapter, level)) {
        V.Audio.play("locked");
        V.dom.replay(button, "is-shaking");
        return;
      }
      this.app.go("play", { mode: "story", chapter: this.chapter, level });
    }

    update(dt) {
      this.time += dt;
    }

    draw() {
      const canvas = this.cat;
      if (!canvas) return;
      const size = canvas.clientWidth;
      if (!size) return;
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      if (canvas.width !== Math.round(size * dpr) || canvas.height !== Math.round(size * dpr)) {
        canvas.width = Math.round(size * dpr);
        canvas.height = Math.round(size * dpr);
      }
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      const open = V.Store.chapterOpen(this.chapter);
      const mood = !open ? "sleep" : this.time % 3 < 0.15 ? "blink" : "idle";
      const bob = V.dom.calm() ? 0 : Math.abs(Math.sin(this.time * 2)) * size * 0.04;
      V.Paint.cat(ctx, size / 2, size * 0.52, size * 1.1, LOOKS[this.chapter], mood, { bob });
    }
  }

  V.WindowsScreen = WindowsScreen;
})(window.Purrfit);
