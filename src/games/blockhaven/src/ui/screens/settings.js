"use strict";
// settings and the rules
(function (B) {
  const { h } = B.dom;
  const t = (key, vars) => B.t(key, vars);

  function open(app) {
    const store = B.Store;
    const labels = [];
    const label = (tag, props, key) => {
      const el = h(tag, props, t(key));
      labels.push([el, key]);
      return el;
    };

    const languages = h(
      "div",
      { class: "languages" },
      B.LANGUAGES.map((code) => h("button", { type: "button", class: "lang", lang: code, "aria-pressed": String(B.i18n.lang === code), onclick: () => setLanguage(code) }, B.LOCALES[code].meta.name)),
    );

    const slider = (key) => {
      const input = h("input", { class: "slider", type: "range", min: "0", max: "100", step: "5", value: String(Math.round(store.data.settings[key] * 100)) });
      input.style.setProperty("--v", Number(input.value) / 100);
      input.addEventListener("input", () => {
        input.style.setProperty("--v", Number(input.value) / 100);
        store.data.settings[key] = Number(input.value) / 100;
        app.applySettings();
      });
      input.addEventListener("change", () => {
        store.setSetting(key, Number(input.value) / 100);
        if (key === "sfx") B.Audio.play("clear", { lines: 1, combo: 1 });
      });
      return h("label", { class: "setting" }, label("span", {}, `settings.${key}`), input);
    };

    const toggle = (key) => {
      const button = h("button", {
        type: "button",
        class: "toggle",
        role: "switch",
        "aria-checked": String(store.data.settings[key]),
        onclick: () => {
          const next = !store.data.settings[key];
          store.setSetting(key, next);
          button.setAttribute("aria-checked", String(next));
          app.applySettings();
        },
      });
      return h("div", { class: "setting" }, label("span", {}, `settings.${key}`), button);
    };

    const dialog = B.Dialogs.open({
      title: t("settings.title"),
      className: "settings",
      body: [label("p", { class: "field-label" }, "settings.language"), languages, slider("music"), slider("sfx"), toggle("calm")],
    });

    function setLanguage(code) {
      store.setSetting("language", code);
      B.i18n.set(code);
      for (const button of languages.children) button.setAttribute("aria-pressed", String(button.lang === code));
      for (const [el, key] of labels) el.textContent = t(key);
      dialog.panel.querySelector(".dialog__title").textContent = t("settings.title");
      B.dom.relabel(dialog.panel);
    }
    return dialog;
  }

  const Help = {
    open() {
      const row = (badges, key) => h("div", { class: "rule" }, h("div", { class: "rule__art" }, badges), h("p", {}, t(key)));
      B.Audio.play("open");
      B.Dialogs.open({
        title: t("help.title"),
        className: "help",
        body: [
          row(["coral", "sun", "lime"].map((c) => B.dom.badge("block", 34, c)), "help.goal"),
          row([B.dom.badge("block", 34, "grape"), B.dom.badge("block", 34, "sky")], "help.combo"),
          row([B.dom.badge("gems", 34, "ruby"), B.dom.badge("crates", 34), B.dom.badge("ice", 34)], "help.goals"),
          row(B.Scoring.PERKS.map((perk) => B.dom.badge("perk", 30, perk)), "help.perks"),
          row([h("span", { class: "power power--mini" }, B.dom.icon("hammer", { size: 22 })), h("span", { class: "power power--mini power--shuffle" }, B.dom.icon("shuffle", { size: 22 }))], "help.boosters"),
        ],
        actions: [{ label: t("common.ok"), kind: "primary" }],
      });
    },
  };

  B.Settings = { open };
  B.Help = Help;
})(window.Blockhaven);
