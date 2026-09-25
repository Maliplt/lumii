"use strict";
// the inn's market: backs and cloths to keep, tricks for the pouch
(function (YB) {
  const { h, icon, sprite } = YB.dom;
  const t = (key, vars) => YB.t(key, vars);
  const bakeCoin = () => YB.Pixels.bake(YB.Sprites.COIN, { outline: "k" });
  const TABS = ["backs", "cloths", "tricks"];

  const coin = (scale = 1) => sprite("coin", bakeCoin, { scale, className: "coin" });
  const trickIcon = (id, scale = 2) => sprite(`trick|${id}`, () => YB.Pixels.bake(YB.Sprites.TRICKS[id], { outline: "k" }), { scale });

  class ShopScreen {
    constructor(app, root) {
      this.app = app;
      this.root = root;
      this.tab = "backs";
    }

    enter({ tab } = {}) {
      if (TABS.includes(tab)) this.tab = tab;
      this.app.setScene("harbor", "room");
      YB.Audio.music("tavern");
      this.render(true);
    }

    refresh() {
      if (!this.root.hidden) this.render(false);
    }

    purse() {
      return h("span", { class: "chip purse" }, coin(), h("span", { class: "purse__value" }, String(YB.Store.data.coins)));
    }

    render(animate) {
      this.purseEl = this.purse();
      const tabs = h(
        "div",
        { class: "tabs", role: "tablist" },
        TABS.map((id) =>
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
            t(`shop.tabs.${id}`),
          ),
        ),
      );
      const shelf = this.tab === "tricks" ? this.tricks(animate) : this.goods(this.tab, animate);
      this.root.replaceChildren(
        h(
          "header",
          { class: "topbar" },
          h("button", { type: "button", class: "btn btn-square", label: "common.back", onclick: () => this.app.go("menu") }, icon("back", "#231726", { large: true })),
          h("h1", { class: "topbar__title title-text" }, t("shop.title")),
          this.purseEl,
        ),
        tabs,
        h("p", { class: "shop__note title-text" }, t(`shop.notes.${this.tab}`)),
        shelf,
      );
    }

    // backs or cloths: things you buy once and then wear
    goods(kind, animate) {
      const store = YB.Store;
      const prices = kind === "backs" ? YB.Shop.BACKS : YB.Shop.CLOTHS;
      const chosen = kind === "backs" ? store.data.back : store.data.cloth;
      return h(
        "div",
        { class: `wares${animate ? " is-dealing" : ""}` },
        Object.keys(prices).map((id, i) => {
          const owned = store.owns(kind, id);
          const price = prices[id];
          const picture = kind === "backs" ? sprite(`back|${id}`, () => YB.CardArt.back(id), { className: "ware__card" }) : sprite(`swatch|${id}`, () => YB.Cloth.swatch(id), { className: "ware__cloth" });
          const status = chosen === id ? [icon("check", "#6cc24a"), t("shop.inUse")] : owned ? t("shop.use") : [coin(), String(price)];
          return h(
            "button",
            {
              type: "button",
              class: `ware${owned ? "" : " is-for-sale"}${chosen === id ? " is-chosen" : ""}${!owned && store.data.coins < price ? " is-dear" : ""}`,
              style: { "--i": i },
              "aria-pressed": String(chosen === id),
              onclick: (e) => this.pick(kind, id, e.currentTarget),
            },
            h("span", { class: `ware__frame${kind === "cloths" ? " ware__frame--cloth" : ""}` }, picture),
            h("span", { class: "ware__name" }, t(`shop.${kind}.${id}`)),
            h("span", { class: "ware__status" }, status),
          );
        }),
      );
    }

    tricks(animate) {
      const store = YB.Store;
      return h(
        "div",
        { class: `tricks${animate ? " is-dealing" : ""}` },
        YB.Shop.TRICK_IDS.map((id, i) => {
          const count = store.data.tricks[id];
          const price = YB.Shop.TRICKS[id];
          const full = count >= YB.Shop.STACK;
          if (!store.trickOpen(id)) {
            const [region, level] = YB.Shop.UNLOCK[id];
            return h(
              "div",
              { class: "panel trick is-sealed", style: { "--i": i } },
              h("span", { class: "trick__icon" }, trickIcon(id), h("span", { class: "trick__lock" }, icon("lock", "#3f2b40", { large: true }))),
              h(
                "span",
                { class: "trick__text" },
                h("span", { class: "trick__name" }, t(`tricks.${id}.name`)),
                h("span", { class: "trick__desc" }, t("shop.opensAt", { place: t(`regions.${YB.Levels.REGIONS[region].id}.name`), n: level + 1 })),
              ),
            );
          }
          return h(
            "div",
            { class: "panel trick", style: { "--i": i } },
            h("span", { class: "trick__icon" }, trickIcon(id)),
            h(
              "span",
              { class: "trick__text" },
              h("span", { class: "trick__name" }, t(`tricks.${id}.name`), h("span", { class: "trick__count" }, `×${count}`)),
              h("span", { class: "trick__desc" }, t(`tricks.${id}.desc`)),
            ),
            h(
              "button",
              {
                type: "button",
                class: `btn btn-small btn-gold trick__buy${full || store.data.coins < price ? " is-locked" : ""}`,
                onclick: (e) => this.buyTrick(id, e.currentTarget),
              },
              full ? t("shop.full") : [coin(), String(price)],
            ),
          );
        }),
      );
    }

    short(button, amount) {
      YB.dom.replay(button, "is-shaking");
      YB.dom.replay(this.purseEl, "is-shaking");
      YB.Audio.play("bust");
      YB.Dialogs.toast(t("shop.short", { n: amount }));
    }

    pick(kind, id, button) {
      const store = YB.Store;
      if (store.owns(kind, id)) {
        if ((kind === "backs" ? store.data.back : store.data.cloth) === id) return;
        store.equip(kind, id);
        YB.Audio.play("unlock");
        this.render(false);
        YB.dom.replay(this.root.querySelector(".ware.is-chosen"), "is-picked");
        return;
      }
      const price = (kind === "backs" ? YB.Shop.BACKS : YB.Shop.CLOTHS)[id];
      if (store.data.coins < price) return this.short(button, price - store.data.coins);
      const picture = kind === "backs" ? sprite(`back|${id}`, () => YB.CardArt.back(id), { scale: 2, className: "ware__card" }) : sprite(`swatch|${id}`, () => YB.Cloth.swatch(id), { scale: 2, className: "ware__cloth" });
      YB.Dialogs.open({
        title: t(`shop.${kind}.${id}`),
        className: "buy",
        body: [picture, h("p", { class: "buy__price" }, coin(2), String(price))],
        actions: [
          { label: t("common.no") },
          {
            label: t("shop.buy"),
            kind: "gold",
            onClick: () => {
              if (!store.buy(kind, id)) return;
              YB.Audio.play("buy");
              this.render(false);
              YB.dom.replay(this.purseEl, "is-popping");
              YB.dom.replay(this.root.querySelector(".ware.is-chosen"), "is-picked");
            },
          },
        ],
      });
    }

    buyTrick(id, button) {
      const store = YB.Store;
      if (store.data.tricks[id] >= YB.Shop.STACK) {
        YB.dom.replay(button, "is-shaking");
        YB.Dialogs.toast(t("shop.fullNote", { n: YB.Shop.STACK }));
        return;
      }
      const price = YB.Shop.TRICKS[id];
      if (store.data.coins < price) return this.short(button, price - store.data.coins);
      store.buy("tricks", id);
      YB.Audio.play("buy");
      this.render(false);
      YB.dom.replay(this.purseEl, "is-popping");
      const row = this.root.querySelectorAll(".trick")[YB.Shop.TRICK_IDS.indexOf(id)];
      if (row) YB.dom.replay(row.querySelector(".trick__icon"), "is-picked");
    }
  }

  YB.ShopScreen = ShopScreen;
  YB.ShopScreen.coin = coin;
  YB.ShopScreen.trickIcon = trickIcon;
})(window.YirmibirHani);
