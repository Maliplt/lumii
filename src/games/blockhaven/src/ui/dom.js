"use strict";
(function (B) {
  function h(tag, props = {}, ...children) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (value == null || value === false) continue;
      if (key === "class") el.className = value;
      else if (key === "dataset") Object.assign(el.dataset, value);
      else if (key === "style") for (const [name, v] of Object.entries(value)) el.style.setProperty(name, v);
      else if (key === "label") {
        el.dataset.label = value;
        el.setAttribute("aria-label", B.t(value));
      } else if (key.startsWith("on")) el.addEventListener(key.slice(2), value);
      else el.setAttribute(key, value === true ? "" : value);
    }
    for (const child of children.flat()) {
      if (child == null || child === false) continue;
      el.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }
    return el;
  }

  // icons on a 24-unit grid; `fill` ones are solid
  const ICONS = {
    back: { d: "M15 5l-7 7 7 7" },
    forward: { d: "M9 5l7 7-7 7" },
    pause: { d: "M8 5.5h2.5v13H8zM13.5 5.5H16v13h-2.5z", fill: true },
    play: { d: "M8 5.2v13.6c0 .8.9 1.3 1.6.8l10-6.8a1 1 0 000-1.6l-10-6.8C8.9 3.9 8 4.4 8 5.2z", fill: true },
    restart: { d: "M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" },
    help: { d: "M9.1 9a3 3 0 015.8 1c0 2-3 3-3 3M12 17h.01M12 22a10 10 0 100-20 10 10 0 000 20z" },
    gear: {
      d: "M12 9a3 3 0 100 6 3 3 0 000-6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z",
    },
    close: { d: "M6 6l12 12M18 6L6 18" },
    lock: { d: "M6 11h12v10H6zM8 11V7a4 4 0 018 0v4" },
    check: { d: "M5 12l5 5 9-10" },
    star: { d: "M12 2.6l2.8 5.8 6.4.8-4.7 4.4 1.2 6.3L12 16.8l-5.7 3.1 1.2-6.3L2.8 9.2l6.4-.8z", fill: true },
    hammer: { d: "M13.5 4.5l6 6-2.5 2.5-6-6zM11 7l-7.5 7.5a1.5 1.5 0 000 2.1l1 1a1.5 1.5 0 002.1 0L14 10" },
    shuffle: { d: "M4 7h3.5c4 0 5 10 9 10H20M17 14l3 3-3 3M4 17h3.5c1.4 0 2.4-1.2 3.2-2.8M13.3 9.8C14.1 8.2 15.1 7 16.5 7H20M17 4l3 3-3 3" },
    infinity: { d: "M6.5 8.5c-2 0-3.5 1.6-3.5 3.5s1.5 3.5 3.5 3.5c3.5 0 7.5-7 11-7 2 0 3.5 1.6 3.5 3.5s-1.5 3.5-3.5 3.5c-3.5 0-7.5-7-11-7z" },
    calendar: { d: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M9 14.5l2 2 4-4" },
    moves: { d: "M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3" },
    grid: { d: "M4.5 4.5h6v6h-6zM13.5 4.5h6v6h-6zM4.5 13.5h6v6h-6zM13.5 13.5h6v6h-6z" },
    music: { d: "M9 18V6l10-2v12M9 18a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM19 16a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" },
    sound: { d: "M4 9.5h3.5L12 5.5v13l-4.5-4H4zM15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11" },
    mute: { d: "M4 9.5h3.5L12 5.5v13l-4.5-4H4zM16 9.5l5 5M21 9.5l-5 5" },
    trophy: { d: "M8 4h8v5a4 4 0 01-8 0zM8 6H5a3 3 0 003 4M16 6h3a3 3 0 01-3 4M12 13v4M8.5 20h7M10 17h4" },
  };

  function icon(name, { size = 22 } = {}) {
    const ns = "http://www.w3.org/2000/svg";
    const spec = ICONS[name];
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.setAttribute("aria-hidden", "true");
    svg.classList.add("icon", `icon--${name}`);
    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", spec.d);
    path.setAttribute("fill", spec.fill ? "currentColor" : "none");
    path.setAttribute("stroke", spec.fill ? "none" : "currentColor");
    path.setAttribute("stroke-width", "2.6");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.append(path);
    return svg;
  }

  function replay(el, className) {
    if (!el) return;
    el.classList.remove(className);
    void el.offsetWidth;
    el.classList.add(className);
  }

  const calm = () => B.Store?.data.settings.calm === true;

  function relabel(root = document) {
    for (const el of root.querySelectorAll("[data-label]")) el.setAttribute("aria-label", B.t(el.dataset.label));
  }

  // three stars, `on` of them lit
  function stars(on, size = 16) {
    return h("span", { class: "stars" }, [0, 1, 2].map((i) => h("span", { class: `star${i < on ? " is-on" : ""}` }, icon("star", { size }))));
  }

  // a small canvas with one art item on it (a gem, crate, ice…)
  function badge(kind, size = 26, gem = null) {
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const canvas = h("canvas", { class: "art-badge", width: Math.round(size * dpr), height: Math.round(size * dpr), "aria-hidden": "true" });
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    const A = B.Art;
    if (kind === "gems") A.gemIcon(ctx, size / 2, size / 2 - 1, size * 0.36, gem);
    else if (kind === "crates") A.crate(ctx, 0, 0, size);
    else if (kind === "ice") A.ice(ctx, 0, 0, size, 2);
    else if (kind === "stone") A.stone(ctx, 0, 0, size);
    else if (kind === "perk") A.block(ctx, 0, 0, size, gem === "bomb" ? "tangerine" : gem === "double" ? "sky" : "grape", { perk: gem });
    else if (kind === "lines") {
      const s = size / 3;
      ["coral", "sun", "lime"].forEach((c, i) => A.block(ctx, i * s, size / 2 - s / 2, s, c));
    } else A.block(ctx, 0, 0, size, gem || "sun");
    return canvas;
  }

  B.dom = { h, icon, replay, calm, relabel, stars, badge };
})(window.Blockhaven);
