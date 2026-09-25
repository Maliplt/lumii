"use strict";
// the front screen: three cats peeking out of a box, the logo, and big buttons
(function (V) {
  const { h, icon } = V.dom;
  const t = (key, vars) => V.t(key, vars);

  class MenuScreen {
    constructor(app, root) {
      this.app = app;
      this.root = root;
      this.time = 0;
      this.hops = [0, 0, 0];
      this.art = h("canvas", { class: "hero__art", "aria-hidden": "true" });
      this.art.addEventListener("pointerdown", (e) => {
        const box = this.art.getBoundingClientRect();
        const which = Math.min(2, Math.floor(((e.clientX - box.left) / box.width) * 3));
        this.hops[which] = this.time;
        V.Audio.play("meow");
      });
    }

    enter() {
      this.render();
    }

    refresh() {
      if (!this.root.hidden) this.render();
    }

    render() {
      const store = V.Store;
      const next = store.next();
      const daily = store.dailyStatus();
      const dailyOpen = store.dailyOpen();
      const freeOpen = store.freeOpen();
      const sub = next ? t("menu.continue", { chapter: t(`chapters.${V.Levels.CHAPTERS[next.chapter].id}.name`), n: next.level + 1 }) : t("menu.allDone");

      const big = (color, iconName, label, subText, onClick, { locked = false, badge = null } = {}) =>
        h(
          "button",
          { type: "button", class: `chunky chunky--${color}${locked ? " is-locked" : ""}`, onclick: (e) => onClick(e.currentTarget) },
          h("span", { class: "chunky__icon" }, icon(locked ? "lock" : iconName, { size: 26 })),
          h("span", { class: "chunky__text" }, h("span", { class: "chunky__label" }, label), subText ? h("span", { class: "chunky__sub" }, subText) : null),
          badge ? h("span", { class: "badge" }, badge) : null,
        );

      this.root.replaceChildren(
        h(
          "header",
          { class: "topline" },
          h("span", { class: "pill" }, icon("paw", { size: 18, fill: true }), String(store.totalStars())),
          h("span", { class: "pill pill--fish" }, icon("fish", { size: 18 }), String(store.data.lanterns)),
        ),
        h("div", { class: "hero" }, this.art, h("h1", { class: "logo" }, [...t("title")].map((ch, i) => h("span", { style: { "--i": i } }, ch))), h("p", { class: "tagline" }, t("tagline"))),
        h(
          "nav",
          { class: "stack" },
          big("green", "play", t("menu.play"), sub, () => this.play()),
          big("orange", "calendar", t("menu.daily"), dailyOpen && daily.played ? t("menu.dailyDone", { n: daily.streak }) : null, (el) => this.guard(el, dailyOpen, () => this.app.go("play", { mode: "daily" }), "menu.dailyLocked"), {
            locked: !dailyOpen,
            badge: dailyOpen && !daily.played ? t("menu.dailyNew") : null,
          }),
          big("blue", "shuffle", t("menu.free"), null, (el) => this.guard(el, freeOpen, () => this.app.openFree(), "menu.freeLocked"), { locked: !freeOpen }),
          h(
            "div",
            { class: "roundrow" },
            h("button", { type: "button", class: "round round--purple", label: "menu.windows", onclick: () => this.app.go("windows", { chapter: next ? next.chapter : 0 }) }, icon("grid", { size: 26 })),
            h("button", { type: "button", class: "round round--pink", label: "menu.help", onclick: () => V.Help.open() }, icon("help", { size: 26 })),
            h("button", { type: "button", class: "round round--white", label: "menu.settings", onclick: () => V.Settings.open(this.app) }, icon("gear", { size: 26 })),
          ),
        ),
      );
    }

    play() {
      const next = V.Store.next();
      if (next) this.app.go("play", { mode: "story", ...next });
      else this.app.go("windows", { chapter: V.Levels.CHAPTERS.length - 1 });
    }

    guard(button, allowed, action, reason) {
      if (allowed) return action();
      V.dom.replay(button, "is-shaking");
      V.Audio.play("locked");
      V.Dialogs.toast(t(reason));
    }

    update(dt) {
      this.time += dt;
    }

    // three cats in a big box, bobbing, blinking and hopping when poked
    draw() {
      const canvas = this.art;
      const w = canvas.clientWidth;
      const hgt = canvas.clientHeight;
      if (!w) return;
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(hgt * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(hgt * dpr);
      }
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, hgt);
      const calm = V.dom.calm();
      const s = Math.min(w / 3.3, hgt * 0.72);
      const boxW = s * 3.2;
      const boxX = (w - boxW) / 2;
      const boxY = hgt - s * 0.62;
      const looks = [0, 4, 2];
      looks.forEach((look, i) => {
        const cx = boxX + boxW * (0.2 + i * 0.3);
        const hop = this.hops[i] && !calm ? Math.max(0, Math.sin(Math.min(1, (this.time - this.hops[i]) / 0.45) * Math.PI)) * s * 0.35 : 0;
        const bob = calm ? 0 : Math.abs(Math.sin(this.time * 2.2 + i * 1.3)) * s * 0.06 + hop;
        const mood = hop > 0 ? "happy" : (this.time + i * 1.1) % 3.2 < 0.15 ? "blink" : i === 1 && Math.floor(this.time / 4) % 3 === 2 ? "happy" : "idle";
        V.Paint.cat(ctx, cx, boxY - s * 0.12, s * 1.15, look, mood, { bob });
      });
      // the front wall of the box, over the cats' chins
      const r = s * 0.12;
      ctx.fillStyle = "rgba(43,33,64,0.25)";
      V.Paint.rounded(ctx, boxX + 4, boxY + 8, boxW, s * 0.58, r);
      ctx.fill();
      V.Paint.rounded(ctx, boxX, boxY, boxW, s * 0.58, r);
      ctx.fillStyle = "#f2bf7c";
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = V.Palette.INK;
      ctx.stroke();
      ctx.fillStyle = "#d99a56";
      ctx.fillRect(boxX + boxW / 2 - s * 0.22, boxY + 1.5, s * 0.44, s * 0.58 - 3);
      ctx.beginPath();
      ctx.moveTo(boxX + boxW / 2 - s * 0.22, boxY + 1.5);
      ctx.lineTo(boxX + boxW / 2 - s * 0.22, boxY + s * 0.58 - 1.5);
      ctx.moveTo(boxX + boxW / 2 + s * 0.22, boxY + 1.5);
      ctx.lineTo(boxX + boxW / 2 + s * 0.22, boxY + s * 0.58 - 1.5);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  V.MenuScreen = MenuScreen;
})(window.Purrfit);
