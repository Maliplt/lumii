"use strict";
// the desktop: icons, the game window with its menus, counters and face button
(function (M) {
  const { h, pixelIcon } = M.dom;
  const t = (key, vars) => M.t(key, vars);
  const LEVEL_IDS = ["beginner", "intermediate", "expert"];

  class App {
    constructor(root) {
      this.root = root;
      this.openMenu = null;
      this.windowHidden = false;
      this.build();
      this.bind();
    }

    get small() {
      return window.innerWidth < 700 || window.innerHeight < 520;
    }

    get coarse() {
      return window.matchMedia?.("(pointer: coarse)").matches;
    }

    // ---------- building ----------

    build() {
      this.leftLed = h("canvas", { class: "led", "aria-hidden": "true" });
      this.timeLed = h("canvas", { class: "led", "aria-hidden": "true" });
      this.faceCanvas = h("canvas", { class: "face__art", "aria-hidden": "true" });
      this.faceBtn = h("button", { type: "button", class: "face", label: "game.new" }, this.faceCanvas);
      this.boardCanvas = h("canvas", { class: "board__canvas" });
      this.field = new M.Field(this.boardCanvas, {
        onChange: (changes) => this.changed(changes),
        onPress: (down) => this.setFace(down ? "wow" : this.restingFace()),
      });
      this.flagBtn = h("button", { type: "button", class: "btn btn--toggle flagbar__btn", "aria-pressed": "false", onclick: () => this.toggleFlagMode() }, pixelIcon("flag", 16), h("span", { class: "flagbar__label" }));
      this.statusLeft = h("span", { class: "statusbar__cell" });
      this.statusTip = h("span", { class: "statusbar__cell statusbar__cell--grow statusbar__tip" });
      this.statusRight = h("span", { class: "statusbar__cell" });
      this.menubar = h("div", { class: "menubar", role: "menubar" });
      this.titleText = h("span", { class: "titlebar__text" });

      this.window = h(
        "section",
        { class: "win game", "aria-label": "Mines98" },
        h(
          "div",
          { class: "titlebar" },
          pixelIcon("mine", 16),
          this.titleText,
          h(
            "div",
            { class: "titlebar__buttons" },
            h("button", { type: "button", class: "cap cap--min", label: "window.minimize", onclick: () => this.hideWindow() }, h("span", { class: "cap__line" })),
            h("button", { type: "button", class: "cap cap--close", label: "window.close", onclick: () => this.hideWindow() }, h("span", { class: "cap__x" })),
          ),
        ),
        this.menubar,
        h(
          "div",
          { class: "game__body" },
          h("div", { class: "panel sunken" }, h("div", { class: "led-box sunken-thin" }, this.leftLed), this.faceBtn, h("div", { class: "led-box sunken-thin" }, this.timeLed)),
          h("div", { class: "board sunken" }, this.boardCanvas),
          h("div", { class: "flagbar" }, this.flagBtn),
        ),
        h("div", { class: "statusbar" }, this.statusLeft, this.statusTip, this.statusRight),
      );

      const icon = (name, key, onOpen) =>
        h("button", { type: "button", class: "desk-icon", ondblclick: onOpen, onclick: (e) => (this.coarse || e.detail === 0) && onOpen() }, pixelIcon(name, 32), h("span", { class: "desk-icon__label", "data-key": key }));
      this.icons = h(
        "nav",
        { class: "desk-icons" },
        icon("mine", "icons.game", () => this.showWindow()),
        icon("trophy", "icons.best", () => this.bestTimes()),
        icon("book", "icons.help", () => this.howTo()),
        icon("globe", "icons.language", () => this.language()),
      );

      this.taskBtn = h("button", { type: "button", class: "task is-active", onclick: () => (this.windowHidden ? this.showWindow() : this.hideWindow()) }, pixelIcon("mine", 16), h("span", { class: "task__label" }, "Mines98"));
      this.soundBtn = h("button", { type: "button", class: "tray__sound", label: "game.sound", onclick: () => this.toggle("sound") }, pixelIcon("speaker", 16));
      this.clock = h("span", { class: "tray__clock" });
      this.taskbar = h("footer", { class: "taskbar" }, this.taskBtn, h("div", { class: "tray sunken-thin" }, this.soundBtn, this.clock));

      this.desktop = h("div", { class: "desktop" }, this.icons, this.window);
      this.root.replaceChildren(this.desktop, this.taskbar);
      this.labels();
    }

    labels() {
      document.title = t("title");
      this.titleText.textContent = t("title");
      for (const el of this.icons.querySelectorAll(".desk-icon__label")) el.textContent = t(el.dataset.key);
      this.flagBtn.querySelector(".flagbar__label").textContent = t("flagMode");
      this.buildMenus();
      this.status();
      M.dom.relabel(this.root);
    }

    // the menu bar: Game, Options, Help
    buildMenus() {
      const s = M.Store.data;
      const check = (on) => h("span", { class: `menu__check${on ? " is-on" : ""}` });
      const bullet = (on) => h("span", { class: `menu__check menu__check--dot${on ? " is-on" : ""}` });
      const item = (label, onClick, mark = null, key = "") =>
        h("button", { type: "button", class: "menu__item", role: "menuitem", onclick: () => (this.closeMenus(), onClick()) }, mark || h("span", { class: "menu__check" }), h("span", { class: "menu__label" }, label), h("span", { class: "menu__key" }, key));
      const sep = () => h("div", { class: "menu__sep", role: "separator" });
      const menus = [
        [
          "menu.game",
          [
            item(t("game.new"), () => this.newGame(), null, "F2"),
            sep(),
            ...LEVEL_IDS.map((id) => item(t(`game.${id}`), () => this.setLevel(id), bullet(s.level === id))),
            item(t("game.custom"), () => this.custom(), bullet(s.level === "custom")),
            sep(),
            item(t("game.noGuess"), () => this.toggle("noGuess"), check(s.settings.noGuess)),
            item(t("game.marks"), () => this.toggle("marks"), check(s.settings.marks)),
            item(t("game.sound"), () => this.toggle("sound"), check(s.settings.sound)),
            sep(),
            item(t("game.best"), () => this.bestTimes()),
            sep(),
            item(t("game.exit"), () => this.hideWindow()),
          ],
        ],
        ["menu.options", [item(`${t("options.language")}…`, () => this.language())]],
        ["menu.help", [item(t("help.howTo"), () => this.howTo(), null, "F1"), sep(), item(t("help.about"), () => this.about())]],
      ];
      this.menubar.replaceChildren(
        ...menus.map(([key, items]) => {
          const drop = h("div", { class: "menu win", role: "menu" }, items);
          const head = h("button", { type: "button", class: "menubar__head", "aria-haspopup": "true" }, t(key));
          const wrap = h("div", { class: "menubar__item" }, head, drop);
          head.addEventListener("click", (e) => {
            e.stopPropagation();
            this.openMenu === wrap ? this.closeMenus() : this.showMenu(wrap);
          });
          head.addEventListener("pointerenter", () => this.openMenu && this.openMenu !== wrap && this.showMenu(wrap));
          return wrap;
        }),
      );
    }

    showMenu(wrap) {
      this.closeMenus();
      wrap.classList.add("is-open");
      this.openMenu = wrap;
      M.Audio.play("click");
    }

    closeMenus() {
      this.openMenu?.classList.remove("is-open");
      this.openMenu = null;
    }

    // ---------- events ----------

    bind() {
      document.addEventListener("pointerdown", (e) => {
        M.Audio.unlock();
        if (this.openMenu && !this.openMenu.contains(e.target)) this.closeMenus();
      });
      document.addEventListener("keydown", (e) => {
        M.Audio.unlock();
        if (e.key === "F2") {
          e.preventDefault();
          this.newGame();
        } else if (e.key === "F1") {
          e.preventDefault();
          this.howTo();
        } else if (e.key === "Escape") this.closeMenus();
      });
      this.faceBtn.addEventListener("pointerdown", () => this.faceBtn.classList.add("is-down"));
      this.faceBtn.addEventListener("pointerup", () => this.faceBtn.classList.remove("is-down"));
      this.faceBtn.addEventListener("pointerleave", () => this.faceBtn.classList.remove("is-down"));
      this.faceBtn.addEventListener("click", () => this.newGame());
      window.addEventListener("resize", () => {
        clearTimeout(this.resizeTimer);
        this.resizeTimer = setTimeout(() => this.fit(), 120);
      });
      this.dragWindow();
      M.i18n.onChange(() => this.labels());
    }

    // on large screens the window can be moved by its title bar
    dragWindow() {
      const bar = this.window.querySelector(".titlebar");
      let drag = null;
      bar.addEventListener("pointerdown", (e) => {
        if (this.small || e.target.closest("button")) return;
        const r = this.window.getBoundingClientRect();
        drag = { dx: e.clientX - r.left, dy: e.clientY - r.top, id: e.pointerId };
        bar.setPointerCapture(e.pointerId);
      });
      bar.addEventListener("pointermove", (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        const x = Math.max(0, Math.min(window.innerWidth - 80, e.clientX - drag.dx));
        const y = Math.max(0, Math.min(window.innerHeight - 70, e.clientY - drag.dy));
        this.window.style.left = `${x}px`;
        this.window.style.top = `${y}px`;
        this.window.classList.add("is-placed");
      });
      bar.addEventListener("pointerup", () => (drag = null));
    }

    // ---------- the game ----------

    start() {
      M.Audio.setEnabled(M.Store.data.settings.sound);
      this.newGame();
      let last = performance.now();
      const loop = (now) => {
        requestAnimationFrame(loop);
        const dt = Math.min(0.25, (now - last) / 1000);
        last = now;
        if (this.game && !M.Dialogs.isOpen && !document.hidden && this.game.tick(dt)) {
          this.counters();
          M.Audio.play("tick");
        }
      };
      requestAnimationFrame(loop);
      this.clockTimer = setInterval(() => this.tickClock(), 10000);
      this.tickClock();
      requestAnimationFrame(() => document.body.classList.add("is-ready"));
      if (!M.Store.tipSeen("howTo")) {
        M.Store.markTip("howTo");
        setTimeout(() => this.howTo(), 500);
      }
    }

    // the board size for this screen: wide boards stand up on tall screens
    dims() {
      const size = M.Store.size();
      const portrait = window.innerHeight > window.innerWidth;
      if (this.small && portrait && size.w > size.h) return { w: size.h, h: size.w, mines: size.mines };
      return size;
    }

    newGame() {
      M.Dialogs.closeAll();
      const d = this.dims();
      const s = M.Store.data.settings;
      this.game = new M.Game({ ...d, noGuess: s.noGuess, marks: s.marks });
      this.counted = false;
      this.fit();
      this.setFace("smile");
      this.counters();
      this.status();
      if (this.windowHidden) this.showWindow();
    }

    // picks the square size and whether the window fills the screen
    fit() {
      const g = this.game;
      if (!g) return;
      const small = this.small;
      this.window.classList.toggle("is-max", small);
      this.desktop.classList.toggle("is-small", small);
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const flagbar = this.coarse ? 46 : 0;
      this.window.classList.toggle("has-flagbar", Boolean(flagbar));
      const chromeH = 22 + 24 + 64 + 26 + 28 + flagbar + 36;
      const availW = (small ? vw : vw - 160) - 36;
      const availH = vh - chromeH - (small ? 0 : 60);
      const cell = Math.max(16, Math.min(small ? 44 : 32, Math.floor(Math.min(availW / g.w, availH / g.h))));
      if (g.w !== this.field.game?.w || g.h !== this.field.game?.h || cell !== this.field.cell || this.field.game !== g) this.field.load(g, cell);
      else this.field.draw();
      const height = cell >= 28 ? 32 : 26;
      M.Pixel.counter(this.leftLed, g.left, { height });
      M.Pixel.counter(this.timeLed, Math.floor(g.seconds), { height });
      this.faceSize = cell >= 28 ? 34 : 28;
      this.faceCanvas.style.width = `${this.faceSize}px`;
      this.faceCanvas.style.height = `${this.faceSize}px`;
      this.setFace(this.face || "smile");
      if (!small && !this.window.classList.contains("is-placed")) {
        this.window.style.left = "";
        this.window.style.top = "";
      }
    }

    restingFace() {
      const s = this.game?.state;
      return s === "won" ? "cool" : s === "lost" ? "dead" : "smile";
    }

    setFace(mood) {
      this.face = mood;
      const size = this.faceSize || 28;
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      const c = this.faceCanvas;
      c.width = size * dpr;
      c.height = size * dpr;
      const ctx = c.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      M.Pixel.face(ctx, 0, 0, size, mood);
    }

    counters() {
      const height = this.field.cell >= 28 ? 32 : 26;
      M.Pixel.counter(this.leftLed, this.game.left, { height });
      M.Pixel.counter(this.timeLed, Math.floor(this.game.seconds), { height });
    }

    status() {
      if (!this.game) return;
      const s = M.Store.data;
      const g = this.game;
      const name = s.level === "custom" ? t("game.custom").replace("…", "") : t(`game.${s.level}`);
      this.statusLeft.textContent = `${name} · ${t("status.size", { w: g.w, h: g.h, mines: g.mines })}`;
      this.statusRight.textContent = s.settings.noGuess ? t("status.fair") : "";
      this.statusRight.hidden = !s.settings.noGuess;
      this.statusTip.textContent = t(this.coarse ? "status.tipTouch" : "status.tipMouse");
    }

    changed(changes) {
      const g = this.game;
      for (const c of changes) {
        if (c.type === "open") M.Audio.play("open", { cells: c.cells.length });
        else if (c.type === "mark") M.Audio.play(c.value === 1 ? "flag" : "unflag");
        else if (c.type === "lost") {
          M.Audio.play("boom");
          this.done(false);
        } else if (c.type === "won") {
          M.Audio.play("win");
          this.done(true);
        }
      }
      this.counters();
      this.setFace(this.restingFace());
      if (g.state === "won" || g.state === "lost") this.field.draw();
    }

    done(won) {
      if (this.counted) return;
      this.counted = true;
      const level = M.Store.data.level;
      const seconds = Math.max(1, Math.ceil(this.game.seconds));
      const record = M.Store.finish(level, won, seconds);
      if (record) {
        setTimeout(() => {
          M.Dialogs.open({
            title: t("record.title"),
            icon: "trophy",
            className: "record",
            body: [h("div", { class: "message" }, pixelIcon("trophy", 32), h("p", {}, t("record.text", { level: t(`game.${level}`), n: seconds })))],
            actions: [{ label: t("common.ok"), primary: true }],
          });
        }, 700);
      }
    }

    toggleFlagMode() {
      this.field.flagMode = !this.field.flagMode;
      this.flagBtn.setAttribute("aria-pressed", String(this.field.flagMode));
      this.flagBtn.classList.toggle("is-on", this.field.flagMode);
      M.Audio.play("click");
    }

    // ---------- settings ----------

    setLevel(id) {
      M.Store.setLevel(id);
      this.buildMenus();
      this.newGame();
    }

    toggle(key) {
      const s = M.Store.data.settings;
      M.Store.set(key, !s[key]);
      if (key === "sound") {
        M.Audio.setEnabled(s.sound);
        this.soundBtn.classList.toggle("is-off", !s.sound);
      }
      if (key === "marks" && this.game) this.game.marks = s.marks;
      this.buildMenus();
      this.status();
      if (key === "noGuess" && this.game?.state === "ready") this.newGame();
    }

    // ---------- windows ----------

    hideWindow() {
      this.windowHidden = true;
      this.window.hidden = true;
      this.taskBtn.classList.remove("is-active");
      this.closeMenus();
    }

    showWindow() {
      this.windowHidden = false;
      this.window.hidden = false;
      this.taskBtn.classList.add("is-active");
      this.fit();
    }

    tickClock() {
      const now = new Date();
      this.clock.textContent = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    }

    custom() {
      const c = M.Store.data.custom;
      const field = (key, value) => {
        const input = h("input", { class: "field-input sunken", type: "number", inputmode: "numeric", min: "1", value: String(value) });
        return [h("label", { class: "form__row" }, h("span", {}, t(`custom.${key}`)), input), input];
      };
      const [hRow, hIn] = field("height", c.h);
      const [wRow, wIn] = field("width", c.w);
      const [mRow, mIn] = field("mines", c.mines);
      M.Dialogs.open({
        title: t("custom.title"),
        className: "custom",
        body: [h("div", { class: "form" }, hRow, wRow, mRow)],
        actions: [
          {
            label: t("common.ok"),
            primary: true,
            onClick: () => {
              M.Store.setLevel("custom", { w: Number(wIn.value), h: Number(hIn.value), mines: Number(mIn.value) });
              this.buildMenus();
              setTimeout(() => this.newGame(), 0);
            },
          },
          { label: t("common.cancel") },
        ],
      });
    }

    bestTimes() {
      const s = M.Store.data;
      const rows = LEVEL_IDS.map((id) => {
        const best = s.best[id];
        const [won, played] = s.stats[id];
        return h(
          "div",
          { class: "best__row" },
          h("span", { class: "best__level" }, t(`game.${id}`)),
          h("span", { class: "best__time" }, best === null ? t("best.none") : t("best.seconds", { n: best })),
          h("span", { class: "best__won" }, t("best.won", { won, played })),
        );
      });
      M.Dialogs.open({ title: t("best.title"), icon: "trophy", className: "best", body: [h("div", { class: "best__table sunken" }, rows)], actions: [{ label: t("common.ok"), primary: true }] });
    }

    howTo() {
      const keys = ["goal", "numbers", "mark", "chord", "fair"];
      M.Dialogs.open({
        title: t("howTo.title"),
        icon: "book",
        className: "howto",
        body: [h("div", { class: "howto__text sunken" }, keys.map((k) => h("p", {}, t(`howTo.${k}`))))],
        actions: [{ label: t("common.ok"), primary: true }],
      });
    }

    about() {
      M.Dialogs.open({
        title: t("about.title"),
        icon: "mine",
        className: "about",
        body: [h("div", { class: "message" }, pixelIcon("mine", 32), h("div", {}, h("p", { class: "about__name" }, "Mines98"), h("p", {}, t("about.version", { v: M.VERSION })), h("p", {}, t("about.text"))))],
        actions: [{ label: t("common.ok"), primary: true }],
      });
    }

    language() {
      let chosen = M.i18n.lang;
      const list = h(
        "div",
        { class: "radio-list sunken", role: "radiogroup" },
        M.LANGUAGES.map((code) => {
          const input = h("input", { type: "radio", name: "lang", value: code, checked: code === chosen, onchange: () => (chosen = code) });
          return h("label", { class: "radio", lang: code }, input, h("span", { class: "radio__dot" }), h("span", {}, M.LOCALES[code].meta.name));
        }),
      );
      M.Dialogs.open({
        title: t("options.language"),
        icon: "globe",
        className: "language",
        body: [list],
        actions: [
          {
            label: t("common.ok"),
            primary: true,
            onClick: () => {
              M.Store.set("language", chosen);
              M.i18n.set(chosen);
            },
          },
          { label: t("common.cancel") },
        ],
      });
    }
  }

  M.App = App;
})(window.Mines98);
