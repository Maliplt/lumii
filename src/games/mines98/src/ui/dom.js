"use strict";
(function (M) {
  function h(tag, props = {}, ...children) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (value == null || value === false) continue;
      if (key === "class") el.className = value;
      else if (key === "dataset") Object.assign(el.dataset, value);
      else if (key === "style") for (const [name, v] of Object.entries(value)) el.style.setProperty(name, v);
      else if (key === "label") {
        el.dataset.label = value;
        el.setAttribute("aria-label", M.t(value));
        el.title = M.t(value);
      } else if (key.startsWith("on")) el.addEventListener(key.slice(2), value);
      else el.setAttribute(key, value === true ? "" : value);
    }
    for (const child of children.flat()) {
      if (child == null || child === false) continue;
      el.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }
    return el;
  }

  // pixel icons, 16×16
  const ICONS = {
    mine: [
      "................",
      ".......k........",
      ".......k........",
      "...k.kkkkk.k....",
      "....kkkkkkk.....",
      "...kkwwkkkkk....",
      "...kkwwkkkkk....",
      ".kkkkkkkkkkkkk..",
      "...kkkkkkkkk....",
      "...kkkkkkkkk....",
      "....kkkkkkk.....",
      "...k.kkkkk.k....",
      ".......k........",
      ".......k........",
      "................",
      "................",
    ],
    trophy: [
      "................",
      "...yyyyyyyyyy...",
      ".yyyyyyyyyyyyyy.",
      ".y.yyyyyyyyyy.y.",
      ".y.yyyyyyyyyy.y.",
      "..yyyyyyyyyyyy..",
      "....yyyyyyyy....",
      ".....yyyyyy.....",
      "......yyyy......",
      ".......yy.......",
      ".......yy.......",
      "......oooo......",
      ".....oooooo.....",
      "....kkkkkkkk....",
      "....kkkkkkkk....",
      "................",
    ],
    book: [
      "................",
      "..bbbbbbbbbbbb..",
      "..bwwwwwwwwwwb..",
      "..bwwwkkkkwwwb..",
      "..bwwkkwwkkwwb..",
      "..bwwwwwwkkwwb..",
      "..bwwwwwkkwwwb..",
      "..bwwwwkkwwwwb..",
      "..bwwwwkkwwwwb..",
      "..bwwwwwwwwwwb..",
      "..bwwwwkkwwwwb..",
      "..bwwwwwwwwwwb..",
      "..bbbbbbbbbbbb..",
      "...gggggggggggg.",
      "................",
      "................",
    ],
    globe: [
      "................",
      ".....bbbbbb.....",
      "...bbcgcccbbb...",
      "..bcggggccccbb..",
      "..bcgggccggccb..",
      ".bcccggccggccb..",
      ".bcccgcccccccb..",
      ".bccccccgggcccb.",
      ".bcccccggggcccb.",
      ".bccccccgggcccb.",
      "..bcccccccgccb..",
      "..bccgccccccbb..",
      "...bbccccccbb...",
      ".....bbbbbb.....",
      "................",
      "................",
    ],
    flag: [
      "................",
      "......rrr.......",
      "....rrrrr.......",
      "..rrrrrrr.......",
      "....rrrrr.......",
      "......rrr.......",
      "........k.......",
      "........k.......",
      "........k.......",
      "........k.......",
      "......kkkkk.....",
      "....kkkkkkkkk...",
      "................",
      "................",
      "................",
      "................",
    ],
    speaker: [
      "................",
      "................",
      ".......k........",
      "......kk...k....",
      ".....kwk....k...",
      ".kkkkwwk..k..k..",
      ".kwwwwwk...k.k..",
      ".kwwwwwk...k.k..",
      ".kwwwwwk...k.k..",
      ".kkkkwwk..k..k..",
      ".....kwk....k...",
      "......kk...k....",
      ".......k........",
      "................",
      "................",
      "................",
    ],
  };
  const ICON_COLORS = { k: "#000000", w: "#ffffff", y: "#ffd400", o: "#b87a00", b: "#000080", c: "#3a9ad9", g: "#1d8a3a", r: "#ff0000" };

  function pixelIcon(name, size = 16) {
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const canvas = h("canvas", { class: "pixel-icon", width: size * dpr, height: size * dpr, "aria-hidden": "true" });
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    M.Pixel.sprite(ctx, ICONS[name], 0, 0, size / 16, ICON_COLORS);
    return canvas;
  }

  function replay(el, className) {
    if (!el) return;
    el.classList.remove(className);
    void el.offsetWidth;
    el.classList.add(className);
  }

  function relabel(root = document) {
    for (const el of root.querySelectorAll("[data-label]")) {
      el.setAttribute("aria-label", M.t(el.dataset.label));
      el.title = M.t(el.dataset.label);
    }
  }

  M.dom = { h, pixelIcon, replay, relabel };
})(window.Mines98);
