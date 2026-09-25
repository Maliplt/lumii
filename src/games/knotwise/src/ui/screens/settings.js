"use strict";
// settings, the rules, and the size picker for free play
(function (K) {
  const { h, icon } = K.dom;
  const t = (key, vars) => K.t(key, vars);

  function open(app) {
    const store = K.Store;
    const labels = [];
    const label = (tag, props, key) => {
      const el = h(tag, props, t(key));
      labels.push([el, key]);
      return el;
    };

    const languages = h(
      "div",
      { class: "languages" },
      K.LANGUAGES.map((code) => h("button", { type: "button", class: "tab tab--paper tab--lang", lang: code, "aria-pressed": String(K.i18n.lang === code), onclick: () => setLanguage(code) }, K.LOCALES[code].meta.name)),
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
        if (key === "sfx") K.Audio.play("untie", { step: 4 });
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
          app.refresh();
        },
      });
      return h("div", { class: "setting" }, label("span", {}, `settings.${key}`), button);
    };

    const dialog = K.Dialogs.open({
      title: t("settings.title"),
      className: "settings",
      body: [label("p", { class: "field-label" }, "settings.language"), languages, slider("music"), slider("sfx"), toggle("timer"), toggle("calm")],
    });

    function setLanguage(code) {
      store.setSetting("language", code);
      K.i18n.set(code);
      for (const button of languages.children) button.setAttribute("aria-pressed", String(button.lang === code));
      for (const [el, key] of labels) el.textContent = t(key);
      dialog.panel.querySelector(".dialog__title").textContent = t("settings.title");
      K.dom.relabel(dialog.panel);
    }
    return dialog;
  }

  const Help = {
    open() {
      const rule = (kind, key) => h("div", { class: "rule" }, K.teachArt(kind, 200), h("p", {}, t(key)));
      K.Audio.play("open");
      K.Dialogs.open({
        title: t("help.title"),
        className: "help",
        body: [rule("goal", "help.goal"), rule("tangles", "help.tangles"), h("p", { class: "fine" }, t("help.extras")), h("p", { class: "fine" }, t("help.stars"))],
        actions: [{ label: t("common.ok"), kind: "primary" }],
      });
    },
  };

  function openFree(app) {
    K.Audio.play("open");
    K.Dialogs.open({
      title: t("free.title"),
      className: "free",
      body: [
        h("p", {}, t("free.text")),
        h(
          "div",
          { class: "sizes" },
          Object.entries(K.Levels.FREE_SIZES).map(([size, count]) =>
            h(
              "button",
              {
                type: "button",
                class: "tab tab--paper size",
                onclick: () => {
                  K.Dialogs.closeAll();
                  app.go("play", { mode: "free", size, seed: `${Date.now()}` });
                },
              },
              h("span", { class: "size__dots", style: { "--n": Math.round(count / 3) } }, Array.from({ length: Math.round(count / 3) }, () => h("i"))),
              h("span", { class: "size__name" }, t(`free.${size}`)),
              h("span", { class: "size__count" }, t("free.beads", { n: count })),
            ),
          ),
        ),
      ],
    });
  }

  K.Settings = { open };
  K.Help = Help;
  K.Free = { open: openFree };
})(window.Knotwise);
