"use strict";
(function (YB) {
  const { h, icon, sprite } = YB.dom;
  const t = (key, vars) => YB.t(key, vars);
  const SPECIAL = { harbor: ["joker"], pass: ["double"], abbey: ["half", "thief"], court: ["joker", "double", "half", "thief"] };
  const TINY_STAR = ["..y..", ".yzy.", "yyzyy", ".yyy.", ".Y.Y."];
  const starUrl = (on) => YB.dom.spriteUrl(on ? "tiny-star" : "tiny-star-off", () => YB.Pixels.bake(on ? TINY_STAR : TINY_STAR.map((row) => row.replace(/[yzY]/g, "G"))));

  class MapScreen {
    constructor(app, root) {
      this.app = app;
      this.root = root;
      this.region = 0;
      window.addEventListener("keydown", (e) => {
        if (this.root.hidden || YB.Dialogs.isOpen) return;
        if (e.key === "ArrowRight") this.turn(1);
        if (e.key === "ArrowLeft") this.turn(-1);
      });
      let startX = null;
      root.addEventListener("pointerdown", (e) => (startX = e.clientX));
      root.addEventListener("pointerup", (e) => {
        if (startX === null) return;
        const dx = e.clientX - startX;
        startX = null;
        if (Math.abs(dx) > 60) this.turn(dx < 0 ? 1 : -1);
      });
    }

    enter({ region } = {}) {
      const next = YB.Store.next();
      this.region = region ?? (next ? next.region : YB.Levels.REGIONS.length - 1);
      YB.Audio.music("tavern");
      this.render(true);
    }

    refresh() {
      if (!this.root.hidden) this.render(false);
    }

    turn(step) {
      const target = YB.util.clamp(this.region + step, 0, YB.Levels.REGIONS.length - 1);
      if (target === this.region) return;
      this.region = target;
      YB.Audio.play("swish");
      this.render(true, step);
    }

    render(animate, direction = 0) {
      const store = YB.Store;
      const region = YB.Levels.REGIONS[this.region];
      const open = store.isRegionOpen(this.region);
      this.app.setScene(region.id, "room");
      const next = store.next();

      const levels = h(
        "div",
        { class: "levels" },
        Array.from({ length: YB.Levels.LEVELS }, (_, level) => {
          const available = store.isLevelOpen(this.region, level);
          const stars = store.starsOf(this.region, level);
          const current = next && next.region === this.region && next.level === level;
          return h(
            "button",
            {
              type: "button",
              class: `btn level${available ? "" : " is-locked"}${current ? " is-current" : ""}${stars ? " is-done" : ""}`,
              style: { "--i": level },
              "aria-label": t("common.level", { n: level + 1 }),
              onclick: (e) => {
                if (!available) {
                  YB.dom.replay(e.currentTarget, "is-shaking");
                  YB.Audio.play("bust");
                  return;
                }
                this.app.go("play", { mode: "story", region: this.region, level });
              },
            },
            available ? h("span", { class: "level__num" }, level + 1) : h("span", { class: "level__num" }, icon("lock", "#3f2b40")),
            h(
              "span",
              { class: "level__stars" },
              [0, 1, 2].map((i) => h("img", { class: "sprite", src: starUrl(i < stars).url, alt: "", style: { "--w": 5, "--h": 5 } })),
            ),
          );
        }),
      );

      const specials = (SPECIAL[region.id] || []).map((kind) =>
        sprite(`mini|${kind}`, () => YB.CardArt.face(YB.Cards.special(kind)), { className: "region__card" }),
      );

      const panel = h(
        "section",
        { class: `panel region${animate ? " is-entering" : ""}`, style: { "--dir": direction } },
        h(
          "div",
          { class: "region__sign panel--wood" },
          h("h2", { class: "region__name" }, t(`regions.${region.id}.name`)),
          h("span", { class: "region__count" }, sprite("star", () => YB.Pixels.bake(YB.Sprites.STAR, { outline: "k" })), `${store.regionStars(this.region)}/${YB.Levels.LEVELS * 3}`),
        ),
        h(
          "div",
          { class: "region__intro" },
          specials.length ? h("div", { class: "region__cards" }, specials) : null,
          h("p", { class: "region__text" }, specials.length ? h("b", {}, `${t("map.newCard")}: `) : null, t(`regions.${region.id}.text`)),
        ),
        open ? levels : h("div", { class: "region__locked" }, icon("lock", "#3f2b40", { large: true }), h("p", {}, t("map.locked"))),
      );

      this.root.replaceChildren(
        h(
          "header",
          { class: "topbar" },
          h("button", { type: "button", class: "btn btn-square", label: "common.back", onclick: () => this.app.go("menu") }, icon("back", "#231726", { large: true })),
          h("h1", { class: "topbar__title title-text" }, t("map.title")),
          h("span", { class: "topbar__space" }),
        ),
        h("div", { class: "pager" }, panel),
        h(
          "div",
          { class: "dots" },
          h("button", { type: "button", class: "btn btn-square pager__arrow", disabled: this.region === 0, "aria-label": "‹", onclick: () => this.turn(-1) }, icon("left", "#231726", { large: true })),
          YB.Levels.REGIONS.map((_, i) =>
            h("button", { type: "button", class: `dot${i === this.region ? " is-current" : ""}${store.isRegionOpen(i) ? "" : " is-locked"}`, "aria-label": t(`regions.${YB.Levels.REGIONS[i].id}.name`), onclick: () => this.turn(i - this.region) }),
          ),
          h("button", { type: "button", class: "btn btn-square pager__arrow", disabled: this.region === YB.Levels.REGIONS.length - 1, "aria-label": "›", onclick: () => this.turn(1) }, icon("right", "#231726", { large: true })),
        ),
      );
    }
  }

  YB.MapScreen = MapScreen;
})(window.YirmibirHani);
