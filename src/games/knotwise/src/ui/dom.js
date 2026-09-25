"use strict";
(function (K) {
  function h(tag, props = {}, ...children) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (value == null || value === false) continue;
      if (key === "class") el.className = value;
      else if (key === "dataset") Object.assign(el.dataset, value);
      else if (key === "style") for (const [name, v] of Object.entries(value)) el.style.setProperty(name, v);
      else if (key === "label") {
        el.dataset.label = value;
        el.setAttribute("aria-label", K.t(value));
      } else if (key.startsWith("on")) el.addEventListener(key.slice(2), value);
      else el.setAttribute(key, value === true ? "" : value);
    }
    for (const child of children.flat()) {
      if (child == null || child === false) continue;
      el.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }
    return el;
  }

  // line icons on a 24-unit grid; `fill` parts are drawn solid
  const ICONS = {
    back: { d: "M15 5l-7 7 7 7" },
    forward: { d: "M9 5l7 7-7 7" },
    pause: { d: "M9 5v14M15 5v14" },
    play: { d: "M8 5.5v13l10.5-6.5z", fill: true },
    undo: { d: "M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3" },
    restart: { d: "M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" },
    star: { d: "M12 2.8l2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 16.6l-5.6 3.2 1.3-6.2L3 9.3l6.3-.7z", fill: true },
    pin: { d: "M9 3.5h6M10 3.5l-.6 5.2c-1.9.9-3 2.4-3 4.2h11.2c0-1.8-1.1-3.3-3-4.2L14 3.5M12 12.9V21" },
    music: { d: "M9 18V6l10-2v12M9 18a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM19 16a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" },
    sound: { d: "M4 9.5h3.5L12 5.5v13l-4.5-4H4zM15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11" },
    mute: { d: "M4 9.5h3.5L12 5.5v13l-4.5-4H4zM16 9.5l5 5M21 9.5l-5 5" },
    tangle: { d: "M5 12c0-4 3-7 7-7s6 3 5 6-5 4-7 2 0-6 4-6 7 3 6 8-5 7-9 6" },    calendar: { d: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M9 14.5l2 2 4-4" },
    shuffle: { d: "M4 7h3.5c4 0 5 10 9 10H20M17 14l3 3-3 3M4 17h3.5c1.4 0 2.4-1.2 3.2-2.8M13.3 9.8C14.1 8.2 15.1 7 16.5 7H20M17 4l3 3-3 3" },
    help: { d: "M9.1 9a3 3 0 015.8 1c0 2-3 3-3 3M12 17h.01M12 22a10 10 0 100-20 10 10 0 000 20z" },
    gear: {
      d: "M12 9a3 3 0 100 6 3 3 0 000-6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z",
    },
    close: { d: "M6 6l12 12M18 6L6 18" },
    lock: { d: "M6 11h12v10H6zM8 11V7a4 4 0 018 0v4" },
    check: { d: "M5 12l5 5 9-10" },
    grid: { d: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" },
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
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", spec.fill ? "1.6" : "2.4");
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

  const calm = () => K.Store?.data.settings.calm === true;

  function relabel(root = document) {
    for (const el of root.querySelectorAll("[data-label]")) el.setAttribute("aria-label", K.t(el.dataset.label));
  }

  // three stars, `on` of them filled: the rating of a page
  function stars(on, size = 16) {
    return h("span", { class: "stars" }, [0, 1, 2].map((i) => h("span", { class: `star${i < on ? " is-on" : ""}` }, icon("star", { size }))));
  }

  K.dom = { h, icon, replay, calm, relabel, stars };
})(window.Knotwise);
