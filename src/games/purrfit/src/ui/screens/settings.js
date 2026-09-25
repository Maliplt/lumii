"use strict";
// settings, the rules, and the size picker for a free window
(function (V) {
  const { h, icon } = V.dom;
  const t = (key, vars) => V.t(key, vars);

  function open(app) {
    const store = V.Store;
    const labels = [];
    const label = (tag, props, key) => {
      const el = h(tag, props, t(key));
      labels.push([el, key]);
      return el;
    };

    const languages = h(
      "div",
      { class: "languages" },
      V.LANGUAGES.map((code) => h("button", { type: "button", class: "chunky chunky--white chunky--lang", lang: code, "aria-pressed": String(V.i18n.lang === code), onclick: () => setLanguage(code) }, V.LOCALES[code].meta.name)),
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
        if (key === "sfx") V.Audio.play("place", { area: 4 });
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

    const dialog = V.Dialogs.open({
      title: t("settings.title"),
      className: "settings",
      body: [label("p", { class: "field-label" }, "settings.language"), languages, slider("music"), slider("sfx"), toggle("timer"), toggle("calm")],
    });

    function setLanguage(code) {
      store.setSetting("language", code);
      V.i18n.set(code);
      for (const button of languages.children) button.setAttribute("aria-pressed", String(button.lang === code));
      for (const [el, key] of labels) el.textContent = t(key);
      dialog.panel.querySelector(".dialog__title").textContent = t("settings.title");
      V.dom.relabel(dialog.panel);
    }
    return dialog;
  }

  // a small solved example on a 4×2 rug
  function sample(boxes, cats) {
    const cell = 30;
    const w = cell * 4;
    const hh = cell * 2;
    const dpr = 2;
    const canvas = h("canvas", { class: "rule__art", width: (w + 8) * dpr, height: (hh + 8) * dpr });
    canvas.style.width = `${w + 8}px`;
    canvas.style.height = `${hh + 8}px`;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.translate(4, 4);
    V.Paint.rounded(ctx, -2, -2, w + 4, hh + 4, 8);
    ctx.fillStyle = "#fff4dc";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = V.Palette.INK;
    ctx.stroke();
    for (const [x, y, bw, bh, color] of boxes) V.Paint.box(ctx, { x: x * cell + 1.5, y: y * cell + 1.5, w: bw * cell - 3, h: bh * cell - 3 }, V.Palette.BOXES[color], { cell, line: 2 });
    cats.forEach(([x, y, clue], i) => V.Paint.resident(ctx, x * cell, y * cell, cell, clue, [0, 4, 1, 3][i % 4], "sleep"));
    return canvas;
  }
  const Help = {
    open() {
      const rule = (art, key) => h("div", { class: "rule" }, art, h("p", {}, t(key)));
      V.Dialogs.open({
        title: t("help.title"),
        className: "help",
        body: [
          rule(sample([[0, 0, 2, 2, "kraft"], [2, 0, 2, 1, "pink"], [2, 1, 2, 1, "mint"]], [[0, 1, { kind: "number", value: 4 }], [3, 0, { kind: "number", value: 2 }], [2, 1, { kind: "number", value: 2 }]]), "help.goal"),
          rule(sample([[0, 0, 3, 2, "kraft"], [3, 0, 1, 2, "sky"]], [[1, 0, { kind: "number", value: 6 }], [3, 1, { kind: "number", value: 2 }]]), "help.size"),
          rule(sample([[0, 0, 3, 1, "lemon"], [3, 0, 1, 2, "lilac"], [0, 1, 3, 1, "kraft"]], [[1, 0, { kind: "wide", value: 3 }], [3, 1, { kind: "tall", value: 2 }], [2, 1, { kind: "number", value: 3 }]]), "kinds.shape.text"),
          h("p", { class: "fine" }, t("help.controls")),
          h("p", { class: "fine" }, t("help.stars")),
        ],
        actions: [{ label: t("common.ok"), kind: "green" }],
      });
    },
  };
  function openFree(app) {
    V.Dialogs.open({
      title: t("free.title"),
      className: "free",
      body: [
        h("p", {}, t("free.text")),
        h(
          "div",
          { class: "sizes" },
          Object.entries(V.Levels.FREE_SIZES).map(([size, [w, hh]]) =>
            h(
              "button",
              {
                type: "button",
                class: "chunky chunky--white size",
                onclick: () => {
                  V.Dialogs.closeAll();
                  app.go("play", { mode: "free", size, seed: `${Date.now()}` });
                },
              },
              h("span", { class: "size__box" }, h("span", { class: "size__grid", style: { "--w": w, "--h": hh } })),
              h("span", { class: "size__name" }, t(`free.${size}`)),
              h("span", { class: "size__dim" }, `${w} × ${hh}`),
            ),
          ),
        ),
      ],
    });
  }
  V.Settings = { open };
  V.Help = Help;
  V.Free = { open: openFree };
})(window.Purrfit);
