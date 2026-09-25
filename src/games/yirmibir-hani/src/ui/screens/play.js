"use strict";
(function (YB) {
  const { h, icon, sprite } = YB.dom;
  const t = (key, vars) => YB.t(key, vars);
  const THEMES = YB.Levels.REGIONS.map((r) => r.id);
  const host = (mood) => () => YB.Pixels.bake(YB.Sprites.host(mood), { outline: "k" });
  const bakeCoin = () => YB.Pixels.bake(YB.Sprites.COIN, { outline: "k" });
  const TRICK_KEYS = { q: "heart", w: "time", e: "peek", r: "broom" };

  class PlayScreen {
    constructor(app, root) {
      this.app = app;
      this.root = root;
      this.table = new YB.Table();
      this.active = false;
      const canvas = app.stage.display;
      canvas.addEventListener("pointerdown", (e) => this.active && this.onDown(e));
      canvas.addEventListener("pointermove", (e) => this.active && this.onMove(e));
      canvas.addEventListener("pointerleave", () => {
        this.table.hover = null;
        this.table.hoverPatron = null;
      });
      window.addEventListener("keydown", (e) => this.active && this.onKey(e));
      app.stage.onResize((w, height) => this.table.resize(w, height));
    }

    build({ mode, region, level }) {
      if (mode === "daily") return YB.Levels.daily(YB.util.dayKey());
      if (mode === "endless") return YB.Levels.endless(`${YB.GAME_ID}/endless/${Date.now()}`);
      return YB.Levels.build(region, level);
    }

    theme({ mode, region }) {
      if (mode === "daily") return THEMES[new Date().getDay() % THEMES.length];
      if (mode === "endless") return "court";
      return THEMES[region];
    }

    enter(params) {
      this.params = params;
      this.active = true;
      this.level = this.build(params);
      this.round = new YB.Round(this.level);
      this.tutorial = params.mode === "story" && params.region === 0 && params.level === 0 && !YB.Store.tipSeen("tutorial");
      this.openTricks = YB.Shop.TRICK_IDS.filter((id) => YB.Store.trickOpen(id));
      const tray = this.openTricks.length > 0;
      const theme = this.theme(params);
      this.app.setScene(theme, "table", YB.Table.room({ patrons: Boolean(this.level.patrons), tray }));
      this.table.resize(this.app.stage.width, this.app.stage.height);
      this.table.start(this.round, {
        back: YB.Store.data.back,
        cloth: YB.Store.data.cloth,
        stars: params.mode === "endless" ? null : this.level.stars,
        mode: params.mode,
        theme,
        tricks: tray ? { ids: this.openTricks, stock: () => YB.Store.data.tricks } : null,
      });
      this.hasTray = tray;
      this.state = "intro";
      this.introLeft = 0.9;
      this.paused = false;
      this.lastSecond = null;
      this.queue = [];
      YB.Audio.music("table");
      YB.Audio.pace(1);
      YB.Audio.play("deal");
      setTimeout(() => this.active && YB.Audio.play("deal"), 350);
    }

    exit() {
      this.active = false;
      this.app.coach.hide();
      this.table.hover = null;
      this.table.armed = null;
      YB.Audio.pace(1);
    }

    refresh() {}

    get blocked() {
      return this.app.coach.visible && !this.app.coach.button.hidden;
    }

    afterIntro() {
      if (this.tutorial) {
        this.app.coach.show({ text: "tutorial.place", point: () => this.table.anchor("lane", 1), button: false, place: "top" });
        return;
      }
      const tip = this.params.mode === "story" ? YB.Levels.tipFor(this.params.region, this.params.level) : null;
      if (tip && !YB.Store.tipSeen(`tip.${tip}`)) {
        const points = { hold: () => this.table.anchor("hold"), time: () => this.table.anchor("timer") };
        if (tip !== "patrons") this.say(`tips.${tip}`, `tip.${tip}`, points[tip] || null);
      }
      const seat = this.round.seats.findIndex(Boolean);
      if (seat >= 0) {
        YB.Store.markTip(`order.${this.round.seats[seat].order}`);
        this.say("tips.patrons", "tip.patrons", () => this.table.anchor("patron", seat));
      }
      this.openTricks.forEach((id, slot) => {
        if (YB.Store.tipSeen(`trick.${id}`)) return;
        YB.Store.giftTrick(id);
        this.table.trayPop[id] = this.table.time;
        this.say(`tricks.${id}.intro`, `trick.${id}`, () => this.table.anchor("tray", slot));
      });
    }

    say(text, id, point = null) {
      if (id && YB.Store.tipSeen(id)) return;
      if (id) YB.Store.markTip(id);
      this.queue.push({ text, point });
      this.nextMessage();
    }

    nextMessage() {
      if (this.app.coach.visible || !this.queue.length || this.state !== "play" || this.round.over) return;
      const { text, point } = this.queue.shift();
      setTimeout(() => {
        if (!this.active || this.round.over) return;
        this.app.coach.show({ text, point, place: this.placeFor(point), onDismiss: () => this.nextMessage() });
      }, 900);
    }

    placeFor(point) {
      const at = point?.();
      return at && at.y > this.app.stage.height * 0.55 ? "top" : "bottom";
    }

    update(dt) {
      if (!this.active) return;
      this.table.update(dt);
      if (this.state === "intro") {
        this.introLeft -= dt;
        if (this.introLeft <= 0) {
          this.state = "play";
          this.afterIntro();
        }
        return;
      }
      if (this.state !== "play" || this.paused || this.blocked || this.table.armed || YB.Dialogs.isOpen) return;
      const events = this.round.tick(dt);
      if (events.length) this.handle(events);
      const left = this.round.timeLeft;
      if (left !== null && left <= 10 && !this.round.over) {
        const second = Math.ceil(left);
        if (second !== this.lastSecond) {
          this.lastSecond = second;
          YB.Audio.play("tick");
        }
        YB.Audio.pace(1.18);
      } else YB.Audio.pace(1);
    }

    draw(ctx) {
      if (this.active) this.table.draw(ctx, { calm: YB.dom.calm() });
    }

    onDown(e) {
      const p = this.app.stage.toArt(e.clientX, e.clientY);
      const hit = this.table.hit(p.x, p.y);
      if (!hit) {
        if (this.table.armed) this.table.armed = null;
        return;
      }
      if (hit.type === "pause") return this.pause();
      if (hit.type === "trick") return this.trick(hit.id);
      if (hit.type === "patron") {
        this.table.showOrder(hit.index);
        return;
      }
      if (hit.type === "lane") this.act(hit.index);
      else if (hit.type === "hold") this.swap();
    }

    onMove(e) {
      if (e.pointerType !== "mouse") return;
      const p = this.app.stage.toArt(e.clientX, e.clientY);
      const hit = this.table.hit(p.x, p.y);
      this.table.hover = hit?.type === "lane" && this.state === "play" ? hit.index : null;
      this.table.hoverPatron = hit?.type === "patron" ? hit.index : null;
      this.app.stage.display.style.cursor = hit ? "pointer" : "default";
    }

    onKey(e) {
      if (YB.Dialogs.isOpen) return;
      const key = e.key.toLowerCase();
      if (e.key >= "1" && e.key <= "4") this.act(Number(e.key) - 1);
      else if (e.key === " " || key === "h") {
        e.preventDefault();
        this.swap();
      } else if (TRICK_KEYS[key] && this.openTricks.includes(TRICK_KEYS[key])) this.trick(TRICK_KEYS[key]);
      else if (e.key === "Escape" && this.table.armed) this.table.armed = null;
      else if (e.key === "Escape" || key === "p") this.pause();
    }

    get ready() {
      return this.state === "play" && !this.paused && !this.round.over && !this.blocked;
    }

    act(lane) {
      if (!this.ready) return;
      if (this.table.armed === "broom") {
        if (this.round.lanes[lane].length) this.spend("broom", lane);
        else YB.Audio.play("button");
        return;
      }
      const events = this.round.place(lane);
      if (!events.length) return;
      this.table.apply(events);
      this.handle(events);
      if (this.tutorial && this.app.coach.visible && this.app.coach.key === "tutorial.place") {
        this.app.coach.hide();
        YB.Store.markTip("tutorial");
        this.tutorial = false;
        this.say("tutorial.total", "tutorial.total", () => this.table.anchor("lane", lane));
      }
    }

    swap() {
      if (!this.ready || !this.round.holdEnabled || this.table.armed) return;
      const events = this.round.swap();
      if (!events.length) return;
      this.table.apply(events);
      YB.Audio.play("hold");
    }

    // a tap on a trick in the pouch: use it, or get the broom ready
    trick(id) {
      if (!this.ready || !this.hasTray) return;
      if (this.table.armed) {
        const same = this.table.armed === id;
        this.table.armed = null;
        if (same) return;
      }
      if (!YB.Store.data.tricks[id]) {
        YB.Audio.play("button");
        YB.Dialogs.toast(t("tricks.none", { name: t(`tricks.${id}.name`) }));
        return;
      }
      if (!this.round.canUse(id)) {
        YB.Audio.play("button");
        YB.Dialogs.toast(t(this.round.used.has(id) ? "tricks.used" : "tricks.notNow"));
        return;
      }
      if (id === "broom") {
        this.table.armed = "broom";
        YB.Audio.play("hold");
        return;
      }
      this.spend(id);
    }

    spend(id, lane = null) {
      const events = this.round.use(id, lane);
      this.table.armed = null;
      if (!events.length) return;
      YB.Store.spendTrick(id);
      this.table.apply(events);
    }

    handle(events) {
      for (const event of events) {
        if (event.type === "clear") {
          this.say("tutorial.combo", "tutorial.combo");
        } else if (event.type === "bust") {
          this.say("tutorial.bust", "tutorial.bust");
        } else if (event.type === "place") {
          if (this.round.lanes[event.lane].length === 4) this.say("tutorial.five", "tutorial.five", () => this.table.anchor("lane", event.lane));
        } else if (event.type === "draw" || event.type === "hold") {
          if (event.current && YB.Cards.isAce(event.current)) this.say("tutorial.ace", "tutorial.ace", () => this.table.anchor("current"));
        } else if (event.type === "patron") {
          const lane = event.lane;
          if (!YB.Store.tipSeen("tip.patrons")) {
            YB.Store.markTip(`order.${event.patron.order}`);
            this.say("tips.patrons", "tip.patrons", () => this.table.anchor("patron", lane));
          } else this.say(`orders.${event.patron.order}.tip`, `order.${event.patron.order}`, () => this.table.anchor("patron", lane));
        } else if (event.type === "tip") {
          this.say("tutorial.tip", "tutorial.tip");
        } else if (event.type === "end") {
          this.finish(event);
        }
      }
    }

    pause() {
      if (this.state === "over" || YB.Dialogs.isOpen) return;
      this.paused = true;
      this.table.armed = null;
      YB.Audio.play("button");
      YB.Dialogs.open({
        title: t("pause.title"),
        body: [
          sprite("host|idle", host("idle"), { scale: 2 }),
          h("button", { type: "button", class: "btn btn-small pause__settings", onclick: () => YB.Settings.open(this.app) }, icon("gear"), t("settings.title")),
        ],
        actions: [
          { label: t("pause.quit"), icon: "home", onClick: () => this.leave() },
          { label: t("pause.restart"), icon: "restart", onClick: () => this.app.go("play", { ...this.params }) },
          { label: t("pause.resume"), icon: "play", kind: "primary" },
        ],
        onClose: () => (this.paused = false),
      });
    }

    leave() {
      if (this.params.mode === "story") this.app.go("map", { region: this.params.region });
      else this.app.go("menu");
    }

    finish(event) {
      this.state = "over";
      this.table.hover = null;
      this.table.armed = null;
      this.app.coach.hide();
      this.queue = [];
      YB.Audio.pace(1);
      if (event.reason === "time") YB.Audio.play("timeUp");
      const mode = this.params.mode;
      const thresholds = mode === "endless" ? null : this.level.stars;
      const stars = thresholds ? thresholds.filter((value) => this.round.score >= value).length : 0;
      this.outcome = YB.Store.finishRound(this.round, { mode, region: this.params.region, level: this.params.level, stars });
      this.outcome.stars = stars;
      setTimeout(() => this.active && this.showResult(event), 1300);
    }

    showResult(event) {
      const round = this.round;
      const mode = this.params.mode;
      const score = round.score;
      const thresholds = mode === "endless" ? null : this.level.stars;
      const outcome = this.outcome;
      const stars = outcome.stars;
      const won = mode === "endless" || stars > 0;
      YB.Audio.play(won ? "win" : "lose");

      const scoreEl = h("span", { class: "result__score" }, "0");
      const starRow = thresholds
        ? h(
            "div",
            { class: "result__stars" },
            [0, 1, 2].map(() => sprite("star-off", () => YB.Pixels.bake(YB.Sprites.STAR_EMPTY, { outline: "k" }), { scale: 2 })),
          )
        : null;
      let note = null;
      const best = mode === "story" ? YB.Store.bestOf(this.params.region, this.params.level) : mode === "endless" ? YB.Store.data.endless.best : 0;
      if (outcome.newBest) note = h("span", { class: "result__note is-gold" }, t("result.newBest"));
      else if (!won && thresholds) note = h("span", { class: "result__note" }, t("result.need", { n: thresholds[0] }));
      else if (best) note = h("span", { class: "result__note" }, t("result.best", { n: best }));

      const tags = [];
      const clears = round.stats.twentyOnes + round.stats.blackjacks;
      if (round.bonus) tags.push([t("result.bonus", { n: round.bonus })]);
      if (clears) tags.push([t("result.twentyOnes", { n: clears })]);
      if (round.stats.tips) tags.push([t("result.served", { n: round.stats.tips })]);
      if (outcome.perfect) tags.push([t("result.flawless"), "is-gold"]);
      if (mode === "daily") tags.push([t("result.streak", { n: outcome.streak })]);

      const pay = outcome.pay;
      const coinsEl = h("span", { class: "result__coins-value" }, "+0");
      const parts = [
        ["base", pay.base],
        ["tips", pay.tips],
        ["stars", pay.stars],
        ["daily", pay.daily],
      ]
        .filter(([, value]) => value > 0)
        .map(([key, value]) => t(`result.pay.${key}`, { n: value }));
      const purse = h(
        "div",
        { class: "result__coins" },
        h("span", { class: "result__coins-row" }, sprite("coin", bakeCoin, { scale: 2 }), coinsEl),
        parts.length ? h("span", { class: "result__coins-parts" }, parts.join(" · ")) : null,
      );
      const errands = outcome.errands.length
        ? h(
            "div",
            { class: "result__errands" },
            h("span", { class: "result__errands-head" }, icon("book", "#e9a126"), t("result.errands")),
            outcome.errands.map((errand) => h("span", { class: "result__errand" }, icon("check", "#3c8a43"), t(`ledger.errands.${errand.id}`, { n: errand.goal }))),
          )
        : null;
      const actions = [];
      if (mode === "story") {
        actions.push({ label: t("result.map"), icon: "map", onClick: () => this.app.go("map", { region: this.params.region }) });
        actions.push({ label: t("result.retry"), icon: "restart", kind: won ? null : "primary", onClick: () => this.app.go("play", { ...this.params }) });
        const next = this.nextLevel();
        if (won && next) actions.push({ label: t("result.next"), icon: "play", kind: "primary", onClick: () => this.app.go("play", { mode: "story", ...next }) });
      } else {
        actions.push({ label: t("result.menu"), icon: "home", onClick: () => this.app.go("menu") });
        actions.push({ label: t("result.retry"), icon: "restart", kind: "primary", onClick: () => this.app.go("play", { ...this.params }) });
      }

      const title = mode === "story" ? (won ? t("result.win") : t("result.lose")) : t(mode === "daily" ? "daily.title" : "endless.title");
      YB.Dialogs.open({
        className: "result",
        dismissible: false,
        body: [
          h(
            "div",
            { class: "result__head" },
            sprite(`host|${won ? "cheer" : "sad"}`, host(won ? "cheer" : "sad"), { className: "result__host" }),
            h("div", { class: "result__heading" }, h("h2", { class: "dialog__title" }, title), h("p", { class: "result__reason" }, t(`result.${event.reason}`))),
          ),
          starRow,
          h("div", { class: "result__total" }, h("span", { class: "result__label" }, t("result.score")), scoreEl, note),
          purse,
          tags.length ? h("div", { class: "result__tags" }, tags.map(([text, extra]) => h("span", { class: `tag${extra ? ` ${extra}` : ""}` }, text))) : null,
          outcome.regionDone ? h("p", { class: "result__banner" }, t("result.regionDone", { name: t(`regions.${YB.Levels.REGIONS[this.params.region].id}.name`) })) : null,
          errands,
        ],
        actions,
      });

      const start = performance.now();
      const count = (now) => {
        const p = Math.min(1, (now - start) / 900);
        scoreEl.textContent = String(Math.round(score * YB.util.easeOut(p)));
        if (p < 1) requestAnimationFrame(count);
      };
      requestAnimationFrame(count);
      const delay = 500 + (starRow ? stars * 380 : 0);
      setTimeout(() => {
        const begin = performance.now();
        let shown = 0;
        const tick = (now) => {
          const p = Math.min(1, (now - begin) / 600);
          const value = Math.round(pay.total * YB.util.easeOut(p));
          if (value !== shown) {
            shown = value;
            coinsEl.textContent = `+${value}`;
            YB.Audio.play("coin");
          }
          if (p < 1) requestAnimationFrame(tick);
          else YB.dom.replay(purse, "is-popping");
        };
        if (pay.total) requestAnimationFrame(tick);
      }, delay);
      if (starRow) {
        [...starRow.children].forEach((el, i) => {
          if (i >= stars) return;
          setTimeout(() => {
            el.src = YB.dom.spriteUrl("star", () => YB.Pixels.bake(YB.Sprites.STAR, { outline: "k" })).url;
            YB.dom.replay(el, "is-popping");
            YB.Audio.play("star", i);
          }, 500 + i * 380);
        });
      }
      if (errands) setTimeout(() => YB.Audio.play("unlock"), delay + 800);
    }

    nextLevel() {
      const { region, level } = this.params;
      if (level + 1 < YB.Levels.LEVELS) return { region, level: level + 1 };
      if (region + 1 < YB.Levels.REGIONS.length) return { region: region + 1, level: 0 };
      return null;
    }
  }

  YB.PlayScreen = PlayScreen;
})(window.YirmibirHani);
