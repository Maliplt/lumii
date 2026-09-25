"use strict";
(function (YB) {
  const { h } = YB.dom;
  const t = (key, vars) => YB.t(key, vars);

  function open(app) {
    const store = YB.Store;
    const labels = [];
    const label = (tag, props, key, vars) => {
      const el = h(tag, props, t(key, vars));
      labels.push([el, key, vars]);
      return el;
    };

    const languages = h(
      "div",
      { class: "languages" },
      YB.LANGUAGES.map((code) =>
        h("button", { type: "button", class: "btn", lang: code, "aria-pressed": String(YB.i18n.lang === code), onclick: () => setLanguage(code) }, YB.LOCALES[code].meta.name),
      ),
    );

    const slider = (key) => {
      const input = h("input", { class: "slider", type: "range", min: "0", max: "100", step: "5", value: String(Math.round(store.data.settings[key] * 100)) });
      input.addEventListener("input", () => {
        store.data.settings[key] = Number(input.value) / 100;
        app.applySettings();
      });
      input.addEventListener("change", () => {
        store.setSetting(key, Number(input.value) / 100);
        if (key === "sfx") YB.Audio.play("place", 2);
      });
      return h("label", { class: "setting" }, label("span", {}, `settings.${key}`), input);
    };

    const calm = h("button", {
      type: "button",
      class: "toggle",
      role: "switch",
      "aria-checked": String(store.data.settings.calm),
      onclick: () => {
        const next = !store.data.settings.calm;
        store.setSetting("calm", next);
        calm.setAttribute("aria-checked", String(next));
        app.applySettings();
      },
    });

    const body = [
      label("p", { class: "field-label" }, "settings.language"),
      languages,
      slider("music"),
      slider("sfx"),
      h("div", { class: "setting" }, label("span", {}, "settings.calm"), calm),
    ];

    const dialog = YB.Dialogs.open({ title: t("settings.title"), body, className: "settings" });

    function setLanguage(code) {
      store.setSetting("language", code);
      YB.i18n.set(code);
      for (const button of languages.children) button.setAttribute("aria-pressed", String(button.lang === code));
      for (const [el, key, vars] of labels) el.textContent = t(key, vars);
      dialog.panel.querySelector(".dialog__title").textContent = t("settings.title");
      YB.dom.relabel(dialog.panel);
    }

    return dialog;
  }

  YB.Settings = { open };

  YB.Help = {
    open() {
      const rule = (glyph, key) => h("div", { class: "rule" }, h("span", { class: "rule__glyph" }, glyph), h("p", {}, t(key)));
      const card = (make, key) => YB.dom.sprite(key, make, { className: "rule__card" });
      const { number } = YB.Cards;
      YB.Dialogs.open({
        title: t("help.title"),
        className: "help",
        body: [
          rule(h("span", { class: "rule__cards" }, card(() => YB.CardArt.face(number(13, "H")), "help|K"), card(() => YB.CardArt.face(number(1, "S")), "help|A")), "help.goal"),
          rule(YB.dom.sprite("help|21", () => YB.Font.render("big", "21", { color: "#ffd84a", shade: "#e9a126", ink: "#231726" }), { className: "rule__num" }), "help.values"),
          rule(YB.dom.sprite("help|heart", () => YB.Pixels.bake(YB.Sprites.HEART, { outline: "k" }), { scale: 2 }), "help.bust"),
          rule(YB.dom.sprite("help|five", () => YB.Font.render("big", "5", { color: "#fff3da", shade: "#efd3a6", ink: "#231726" }), { className: "rule__num" }), "help.five"),
          rule(YB.dom.sprite("help|combo", () => YB.Font.render("big", "×5", { color: "#fff39e", shade: "#f7872a", ink: "#231726" }), { className: "rule__num" }), "help.combo"),
          rule(YB.dom.sprite("help|pouch", () => YB.Pixels.bake(YB.Sprites.POUCH, { outline: "k" }), { scale: 2 }), "help.hold"),
          rule(YB.dom.sprite("help|patron", () => YB.PatronArt.patron(4, "happy"), { scale: 2 }), "help.patrons"),
          rule(YB.dom.sprite("help|broom", () => YB.Pixels.bake(YB.Sprites.TRICKS.broom, { outline: "k" }), { scale: 2 }), "help.tricks"),
        ],
        actions: [{ label: t("coach.ok"), kind: "primary" }],
      });
    },
  };
})(window.YirmibirHani);
