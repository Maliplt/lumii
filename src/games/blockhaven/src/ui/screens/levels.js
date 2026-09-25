"use strict";
// every level on one winding path: rows run left, then right, joined at the ends
(function (B) {
  const { h, icon } = B.dom;
  const t = (key, vars) => B.t(key, vars);
  const L = B.Levels;

  class LevelsScreen {
    constructor(app, root) {
      this.app = app;
      this.root = root;
      this.cols = 0;
      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !this.root.hidden && !B.Dialogs.isOpen && !this.app.moving) this.app.go("menu");
      });
      window.addEventListener("resize", () => {
        if (this.root.hidden || this.columns() === this.cols) return;
        const top = this.scroller?.scrollTop;
        this.render();
        if (top != null) this.scroller.scrollTop = top;
      });
    }

    columns() {
      return window.innerWidth >= 700 ? 6 : 4;
    }

    enter({ n } = {}) {
      this.focus = n ?? B.Store.next() ?? L.TOTAL - 1;
      this.render();
      requestAnimationFrame(() => this.scrollTo(this.focus));
    }

    refresh() {
      if (!this.root.hidden) this.render();
    }

    scrollTo(n) {
      const node = this.root.querySelector(`[data-n="${n}"]`);
      if (!node) return;
      const box = this.scroller;
      const r = node.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      box.scrollTop += r.top - b.top - box.clientHeight / 2 + r.height / 2;
    }

    node(n, next) {
      const store = B.Store;
      const stars = store.starsAt(n);
      const open = store.levelOpen(n);
      const current = open && !stars;
      const near = n <= (next ?? L.TOTAL) + 2;
      const teach = near ? L.teaches(n) : null;
      const hard = near && L.hard(n);
      const fun = L.isFun(n);
      const cls = ["node", stars ? "is-done" : "", current ? "is-current" : "", open ? "" : "is-locked", hard ? "is-hard" : "", fun ? "is-fun" : ""].filter(Boolean).join(" ");
      const label = [t("play.level", { n: n + 1 }), stars ? `${stars}/3` : "", hard ? t("levels.hard") : "", fun ? t("levels.fun") : ""].filter(Boolean).join(" · ");
      return h(
        "div",
        { class: "path__cell" },
        h(
          "button",
          {
            type: "button",
            class: cls,
            "data-n": String(n),
            "aria-label": label,
            title: label,
            onclick: (e) => {
              if (!open) {
                B.Audio.play("locked");
                B.dom.replay(e.currentTarget, "is-shaking");
                B.Dialogs.toast(t("levels.locked"));
                return;
              }
              this.app.go("play", { mode: "story", n });
            },
          },
          h("span", { class: "node__num" }, String(n + 1)),
          teach ? h("span", { class: "node__new" }, teach === "perks" ? B.dom.badge("perk", 18, "star") : B.dom.badge(teach, 18, "ruby")) : fun ? h("span", { class: "node__new node__new--fun" }, B.dom.badge("perk", 18, "bomb")) : null,
        ),
        stars ? B.dom.stars(stars, 13) : null,
      );
    }

    render() {
      const store = B.Store;
      const done = store.done();
      const next = store.next();
      const cols = (this.cols = this.columns());
      const rows = [];
      for (let start = 0, r = 0; start < L.TOTAL; start += cols, r++) {
        const items = [];
        for (let n = start; n < Math.min(L.TOTAL, start + cols); n++) items.push(this.node(n, next));
        const last = start + cols >= L.TOTAL;
        const lit = store.starsAt(Math.min(L.TOTAL, start + cols) - 1) > 0;
        rows.push(h("div", { class: `path__row${r % 2 ? " is-reverse" : ""}${last ? " is-last" : ""}${lit ? " is-lit" : ""}`, style: { "--cols": String(cols) } }, items));
      }
      this.scroller = h("div", { class: "levels__scroll" }, h("div", { class: "path" }, rows));
      this.root.replaceChildren(
        h(
          "div",
          { class: "topline" },
          h("button", { type: "button", class: "icon-btn", label: "common.back", onclick: () => this.app.go("menu") }, icon("back", { size: 22 })),
          h("h1", { class: "screen-title" }, t("levels.title")),
          h("span", { class: "chip chip--star" }, icon("star", { size: 18 }), `${store.totalStars()}/${L.TOTAL * 3}`),
        ),
        h(
          "div",
          { class: "levels__head" },
          h(
            "div",
            { class: "levels__summary" },
            h("span", { class: "levels__count" }, t("levels.progress", { n: done, total: L.TOTAL })),
            h("div", { class: "meter", style: { "--p": String(done / L.TOTAL) } }, h("span", { class: "meter__fill" })),
          ),
          next === null
            ? null
            : h(
                "button",
                { type: "button", class: "levels__next", onclick: () => this.app.go("play", { mode: "story", n: next }) },
                h("span", { class: "levels__next-label" }, t("play.level", { n: next + 1 })),
                h("span", { class: "levels__next-go" }, icon("play", { size: 16 })),
              ),
        ),
        this.scroller,
      );
    }
  }

  B.LevelsScreen = LevelsScreen;
})(window.Blockhaven);
