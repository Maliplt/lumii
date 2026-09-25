"use strict";
// the notebooks
(function (K) {
  const { h, icon } = K.dom;
  const t = (key, vars) => K.t(key, vars);
  const L = K.Levels;

  class PagesScreen {
    constructor(app, root) {
      this.app = app;
      this.root = root;
      this.chapter = 0;
      let startX = null;
      root.addEventListener("pointerdown", (e) => (startX = e.clientX));
      root.addEventListener("pointerup", (e) => {
        if (startX === null) return;
        const dx = e.clientX - startX;
        startX = null;
        if (Math.abs(dx) < 60 || K.Dialogs.isOpen) return;
        const rtl = document.documentElement.dir === "rtl";
        this.show(this.chapter + ((dx < 0) !== rtl ? 1 : -1));
      });
    }

    enter({ chapter } = {}) {
      const next = K.Store.next();
      this.chapter = chapter ?? next?.chapter ?? 0;
      this.render();
    }

    refresh() {
      if (!this.root.hidden) this.render();
    }

    show(chapter) {
      if (chapter < 0 || chapter >= L.CHAPTERS.length || chapter === this.chapter) return;
      const forward = chapter > this.chapter;
      this.chapter = chapter;
      K.Audio.play("open");
      this.render();
      K.dom.replay(this.root.querySelector(".notebook"), forward ? "is-next" : "is-prev");
    }

    render() {
      const store = K.Store;
      const c = this.chapter;
      const info = L.CHAPTERS[c];
      const open = store.chapterOpen(c);
      const solved = store.chapterSolved(c);
      const total = L.CHAPTERS.length * L.LEVELS * 3;
      this.app.tint(info.color);

      const tiles = [];
      for (let l = 0; l < L.LEVELS; l++) {
        const stars = store.starsOf(c, l);
        const levelOpen = store.levelOpen(c, l);
        const current = levelOpen && !stars;
        const cls = ["page", stars ? "is-done" : "", current ? "is-current" : "", levelOpen ? "" : "is-locked"].filter(Boolean).join(" ");
        const inner = [];
        if (stars) {
          const motif = K.Motifs.byId(L.storySpec(c, l).motif);
          inner.push(K.Paper.mini(h("canvas", { class: "page__art" }), motif, { size: 96 }));
          inner.push(K.dom.stars(stars, 13));
        } else {
          inner.push(h("span", { class: "page__num" }, levelOpen ? String(l + 1) : icon("lock", { size: 22 })));
          if (current) inner.push(h("span", { class: "page__mark" }));
        }
        tiles.push(
          h(
            "button",
            {
              type: "button",
              class: cls,
              style: { "--i": l, "--r": `${((l * 37) % 7) - 3}deg` },
              "aria-label": `${t("play.page", { n: l + 1 })}${stars ? ` · ${stars}/3` : ""}`,
              onclick: (e) => {
                if (!levelOpen) {
                  K.Audio.play("locked");
                  K.dom.replay(e.currentTarget, "is-shaking");
                  K.Dialogs.toast(t(open ? "pages.levelLocked" : "pages.locked"));
                  return;
                }
                this.app.go("play", { mode: "story", chapter: c, level: l });
              },
            },
            inner,
          ),
        );
      }

      this.root.replaceChildren(
        h(
          "div",
          { class: "topline" },
          h("button", { type: "button", class: "dot dot--paper dot--small", label: "common.back", onclick: () => this.app.go("menu") }, icon("back", { size: 22 })),
          h("h1", { class: "screen-title" }, t("pages.title")),
          h("span", { class: "chip chip--star" }, icon("star", { size: 18 }), `${store.totalStars()}/${total}`),
        ),
        h(
          "section",
          { class: "notebook", style: { "--nb": info.color, "--nb-deep": info.deep } },
          h(
            "div",
            { class: "notebook__cover" },
            h("span", { class: "notebook__rings", "aria-hidden": "true" }, Array.from({ length: 7 }, () => h("i"))),
            h("button", { type: "button", class: "dot dot--paper dot--small notebook__prev", label: "common.prev", disabled: c === 0, onclick: () => this.show(c - 1) }, icon("back", { size: 20 })),
            h(
              "div",
              { class: "notebook__title" },
              h("span", { class: "notebook__kicker" }, t("pages.chapter", { n: c + 1 })),
              h("h2", { class: "notebook__name" }, t(`chapters.${info.id}.name`)),
              h("p", { class: "notebook__text" }, open ? t(`chapters.${info.id}.text`) : t("pages.locked")),
              h("span", { class: "meter", style: { "--p": solved / L.LEVELS } }, h("span", { class: "meter__fill" }), h("span", { class: "meter__text" }, t("pages.progress", { n: solved }))),
            ),
            h("button", { type: "button", class: "dot dot--paper dot--small notebook__next", label: "common.next", disabled: c === L.CHAPTERS.length - 1, onclick: () => this.show(c + 1) }, icon("forward", { size: 20 })),
          ),
          h("div", { class: `pages${open ? "" : " is-closed"}` }, tiles),
        ),
      );
    }
  }

  K.PagesScreen = PagesScreen;
})(window.Knotwise);
