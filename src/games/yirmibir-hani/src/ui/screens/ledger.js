"use strict";
// the innkeeper's ledger
(function (YB) {
  const { h, icon, sprite } = YB.dom;
  const t = (key, vars) => YB.t(key, vars);
  const bake = (rows) => () => YB.Pixels.bake(rows, { outline: "k" });
  const big = (text, color, shade) => () => YB.Font.render("big", text, { color, shade, ink: "#231726" });

  // a picture for every errand and deed
  const PICTURES = {
    twentyOnes: ["num|21", big("21", "#ffd84a", "#e9a126")],
    blackjacks: ["card|K", () => YB.CardArt.face(YB.Cards.number(13, "H"))],
    fives: ["num|5", big("5", "#fff3da", "#efd3a6")],
    customers: ["patron|1", () => YB.PatronArt.patron(1, "happy")],
    combo: ["flame", bake(YB.Sprites.FLAME[0]), 2],
    score: ["star", bake(YB.Sprites.STAR), 2],
    perfect: ["heart", bake(YB.Sprites.HEART), 2],
    threeStars: ["star", bake(YB.Sprites.STAR), 2],
    rounds: ["pouch", bake(YB.Sprites.POUCH), 2],
    jokers: ["card|joker", () => YB.CardArt.face(YB.Cards.special("joker"))],
    stars: ["star", bake(YB.Sprites.STAR), 2],
    regions: ["map", () => YB.Pixels.bake(YB.Sprites.ICONS.map, { colors: { "#": "#3c8a43" }, outline: "k" }), 2],
    streak: ["calendar", () => YB.Pixels.bake(YB.Sprites.ICONS.calendar, { colors: { "#": "#e9a126" }, outline: "k" }), 2],
    endless: ["endless", () => YB.Pixels.bake(YB.Sprites.ICONS.endless, { colors: { "#": "#a3263a" }, outline: "k" }), 2],
    coins: ["coin", bake(YB.Sprites.COIN), 2],
  };
  const MEDALS = ["#d38b54", "#d3dce8", "#ffd84a"];

  function picture(id) {
    const [key, make, scale = 1] = PICTURES[id];
    return h("span", { class: `pic pic--${key.split("|")[0]}` }, sprite(`ledger|${key}`, make, { scale }));
  }

  function medal(color, on) {
    const rows = ["..###..", ".#####.", "##w####", "#######", "#######", ".#####.", "..###.."];
    return sprite(`medal|${color}|${on}`, () => YB.Pixels.bake(rows, { colors: { "#": on ? color : "#6b5d6e", w: on ? "#ffffff" : "#a89aa6" }, outline: "k" }), { className: "medal" });
  }

  function bar(value, goal) {
    const ratio = Math.min(1, value / goal);
    return h(
      "span",
      { class: `bar${ratio >= 1 ? " is-full" : ""}` },
      h("span", { class: "bar__fill", style: { "--ratio": ratio } }),
      h("span", { class: "bar__text" }, `${Math.min(value, goal)}/${goal}`),
    );
  }

  function untilMidnight() {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const minutes = Math.max(1, Math.ceil((next - now) / 60000));
    return { hours: Math.floor(minutes / 60), minutes: minutes % 60 };
  }

  class LedgerScreen {
    constructor(app, root) {
      this.app = app;
      this.root = root;
      this.tab = "errands";
      this.timer = 0;
    }

    enter({ tab } = {}) {
      if (tab) this.tab = tab;
      this.app.setScene("abbey", "room");
      YB.Audio.music("tavern");
      YB.Store.markErrandsSeen();
      this.render(true);
      clearInterval(this.timer);
      this.timer = setInterval(() => this.tick(), 30000);
    }

    exit() {
      clearInterval(this.timer);
    }

    refresh() {
      if (!this.root.hidden) this.render(false);
    }

    tick() {
      if (YB.Store.data.errands.day !== YB.util.dayKey()) this.render(true);
      else if (this.clock) this.clock.textContent = t("ledger.renews", untilMidnight());
    }

    render(animate) {
      const store = YB.Store;
      const errands = store.errands();
      const ready = {
        errands: errands.list.filter((e) => !e.claimed && e.progress >= e.goal).length + (store.chestReady() ? 1 : 0),
        deeds: store.deeds().filter((d) => d.ready).length,
      };
      this.purseEl = h("span", { class: "chip purse" }, YB.ShopScreen.coin(), h("span", { class: "purse__value" }, String(store.data.coins)));
      const tabs = h(
        "div",
        { class: "tabs", role: "tablist" },
        ["errands", "deeds"].map((id) =>
          h(
            "button",
            {
              type: "button",
              role: "tab",
              class: "btn btn-small tab",
              "aria-selected": String(this.tab === id),
              onclick: () => {
                if (this.tab === id) return;
                this.tab = id;
                this.render(true);
              },
            },
            t(`ledger.tabs.${id}`),
            ready[id] ? h("span", { class: "badge" }, String(ready[id])) : null,
          ),
        ),
      );
      this.root.replaceChildren(
        h(
          "header",
          { class: "topbar" },
          h("button", { type: "button", class: "btn btn-square", label: "common.back", onclick: () => this.app.go("menu") }, icon("back", "#231726", { large: true })),
          h("h1", { class: "topbar__title title-text" }, t("ledger.title")),
          this.purseEl,
        ),
        tabs,
        this.tab === "errands" ? this.errands(animate) : this.deeds(animate),
      );
    }

    errands(animate) {
      const store = YB.Store;
      const { list, chest } = store.errands();
      const daily = store.dailyStatus();
      this.clock = h("span", { class: "ledger__clock" }, t("ledger.renews", untilMidnight()));
      const rows = list.map((errand, i) => {
        const done = errand.progress >= errand.goal;
        const action = errand.claimed
          ? h("span", { class: "ledger__done" }, icon("check", "#3c8a43"), t("ledger.claimed"))
          : h(
              "button",
              { type: "button", class: `btn btn-small btn-gold ledger__claim${done ? "" : " is-locked"}`, onclick: (e) => this.claimErrand(i, e.currentTarget) },
              YB.ShopScreen.coin(),
              String(errand.reward),
            );
        return h(
          "div",
          { class: `panel entry${errand.claimed ? " is-claimed" : done ? " is-ready" : ""}`, style: { "--i": i } },
          picture(errand.id),
          h("span", { class: "entry__text" }, h("span", { class: "entry__name" }, t(`ledger.errands.${errand.id}`, { n: errand.goal })), bar(errand.progress, errand.goal)),
          action,
        );
      });
      const allClaimed = list.length > 0 && list.every((errand) => errand.claimed);
      const chestState = chest ? "open" : "closed";
      const chestRow = h(
        "div",
        { class: `panel panel--wood chest${allClaimed && !chest ? " is-ready" : ""}${chest ? " is-open" : ""}`, style: { "--i": list.length } },
        sprite(`chest|${chestState}`, bake(YB.Sprites.CHEST[chestState]), { scale: 2, className: "chest__art" }),
        h("span", { class: "entry__text" }, h("span", { class: "entry__name" }, t("ledger.chest.name")), h("span", { class: "entry__desc" }, t(chest ? "ledger.chest.opened" : "ledger.chest.desc", { n: YB.Quests.CHEST }))),
        chest ? null : h("button", { type: "button", class: `btn btn-small btn-gold${allClaimed ? "" : " is-locked"}`, onclick: (e) => this.openChest(e.currentTarget) }, t("ledger.chest.open")),
      );
      const streak = h(
        "p",
        { class: "ledger__streak title-text" },
        icon("calendar", "#e9a126"),
        daily.streak ? t("ledger.streak", { n: daily.streak }) : t("ledger.noStreak"),
      );
      return h("div", { class: `ledger${animate ? " is-dealing" : ""}` }, h("div", { class: "ledger__head" }, h("span", { class: "title-text" }, t("ledger.today")), this.clock), ...rows, chestRow, streak);
    }

    deeds(animate) {
      const list = YB.Store.deeds();
      list.sort((a, b) => Number(b.ready) - Number(a.ready) || Number(a.done) - Number(b.done));
      return h(
        "div",
        { class: `ledger${animate ? " is-dealing" : ""}` },
        list.map((deed, i) => {
          const action = deed.done
            ? h("span", { class: "ledger__done" }, icon("check", "#3c8a43"))
            : h(
                "button",
                { type: "button", class: `btn btn-small btn-gold ledger__claim${deed.ready ? "" : " is-locked"}`, onclick: (e) => this.claimDeed(deed.id, e.currentTarget) },
                YB.ShopScreen.coin(),
                String(deed.reward),
              );
          return h(
            "div",
            { class: `panel entry${deed.ready ? " is-ready" : ""}${deed.done ? " is-claimed" : ""}`, style: { "--i": i } },
            picture(deed.id),
            h(
              "span",
              { class: "entry__text" },
              h("span", { class: "entry__name" }, t(`ledger.deeds.${deed.id}.name`), h("span", { class: "medals" }, deed.goals.map((goal, tier) => medal(MEDALS[tier], tier < deed.claimed)))),
              h("span", { class: "entry__desc" }, t(`ledger.deeds.${deed.id}.desc`, { n: deed.goal })),
              deed.done ? null : bar(deed.value, deed.goal),
            ),
            action,
          );
        }),
      );
    }

    reward(amount, button) {
      YB.Audio.play("buy");
      this.render(false);
      YB.dom.replay(this.purseEl, "is-popping");
      YB.Dialogs.toast(t("ledger.got", { n: amount }));
      const rect = button?.getBoundingClientRect?.();
      if (rect) this.sparkle(rect);
    }

    // a few coins that jump out of the button and fall away
    sparkle(rect) {
      if (YB.dom.calm()) return;
      for (let i = 0; i < 6; i++) {
        const el = YB.ShopScreen.coin(2);
        el.classList.add("fly");
        el.style.left = `${rect.left + rect.width / 2}px`;
        el.style.top = `${rect.top}px`;
        el.style.setProperty("--dx", `${(Math.random() - 0.5) * 120}px`);
        el.style.setProperty("--dy", `${-60 - Math.random() * 70}px`);
        el.style.animationDelay = `${i * 40}ms`;
        document.body.append(el);
        setTimeout(() => el.remove(), 900);
      }
    }

    claimErrand(index, button) {
      const errand = YB.Store.errands().list[index];
      if (!errand || errand.progress < errand.goal) {
        YB.dom.replay(button, "is-shaking");
        return;
      }
      const amount = YB.Store.claimErrand(index);
      if (amount) this.reward(amount, button);
    }

    openChest(button) {
      const prize = YB.Store.openChest();
      if (!prize) {
        YB.dom.replay(button, "is-shaking");
        YB.Dialogs.toast(t("ledger.chest.locked"));
        return;
      }
      YB.Audio.play("unlock");
      this.render(false);
      YB.dom.replay(this.purseEl, "is-popping");
      const rect = this.root.querySelector(".chest")?.getBoundingClientRect();
      if (rect) this.sparkle(rect);
      YB.Dialogs.open({
        title: t("ledger.chest.name"),
        className: "buy",
        body: [
          sprite("chest|open", bake(YB.Sprites.CHEST.open), { scale: 3, className: "chest__art is-popping" }),
          h("p", { class: "buy__price" }, YB.ShopScreen.coin(2), `+${prize.coins}`),
          prize.trick ? h("p", { class: "buy__price" }, YB.ShopScreen.trickIcon(prize.trick), t("ledger.chest.trick", { name: t(`tricks.${prize.trick}.name`) })) : null,
        ],
        actions: [{ label: t("coach.ok"), kind: "primary" }],
      });
    }

    claimDeed(id, button) {
      const amount = YB.Store.claimDeed(id);
      if (!amount) {
        YB.dom.replay(button, "is-shaking");
        return;
      }
      this.reward(amount, button);
    }
  }

  YB.LedgerScreen = LedgerScreen;
})(window.YirmibirHani);
