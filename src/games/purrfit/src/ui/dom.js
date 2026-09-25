"use strict";
(function (V) {
  function h(tag, props = {}, ...children) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (value == null || value === false) continue;
      if (key === "class") el.className = value;
      else if (key === "dataset") Object.assign(el.dataset, value);
      else if (key === "style") for (const [name, v] of Object.entries(value)) el.style.setProperty(name, v);
      else if (key === "label") {
        el.dataset.label = value;
        el.setAttribute("aria-label", V.t(value));
      } else if (key.startsWith("on")) el.addEventListener(key.slice(2), value);
      else el.setAttribute(key, value === true ? "" : value);
    }
    for (const child of children.flat()) {
      if (child == null || child === false) continue;
      el.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }
    return el;
  }

  // line icons drawn as SVG paths on a 24-unit grid
  const ICONS = {
    back: "M15 5l-7 7 7 7",
    forward: "M9 5l7 7-7 7",
    pause: "M9 5v14M15 5v14",
    play: "M8 5l11 7-11 7z",
    undo: "M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3",
    restart: "M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4",
    lantern: "M9 3h6M12 3v2M8 7h8l1 10a3 3 0 01-3 3h-4a3 3 0 01-3-3zM10 11.5a2 2 0 004 0c0-1.5-2-3.5-2-3.5s-2 2-2 3.5z",
    gear: "M12 9a3 3 0 100 6 3 3 0 000-6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z",
    help: "M9.1 9a3 3 0 015.8 1c0 2-3 3-3 3M12 17h.01M12 22a10 10 0 100-20 10 10 0 000 20z",
    close: "M6 6l12 12M18 6L6 18",
    star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z",
    calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
    windows: "M12 3a9 9 0 019 9v9H3v-9a9 9 0 019-9zM12 3v18M3 13h18",
    rose: "M12 12m-9 0a9 9 0 1018 0 9 9 0 10-18 0M12 12m-3 0a3 3 0 106 0 3 3 0 10-6 0M12 3v6M12 15v6M3 12h6M15 12h6M5.6 5.6l4.3 4.3M14.1 14.1l4.3 4.3M18.4 5.6l-4.3 4.3M9.9 14.1l-4.3 4.3",
    lock: "M6 11h12v10H6zM8 11V7a4 4 0 018 0v4",
    check: "M5 12l5 5 9-10",
    sparkle: "M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z",
    trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
    paw: "M12 13c-3 0-5.5 3-5.5 5.2 0 1.6 1.4 2.3 2.8 1.9l1.7-.5a3.4 3.4 0 012 0l1.7.5c1.4.4 2.8-.3 2.8-1.9C17.5 16 15 13 12 13zM6.5 11.5a1.8 2.3 0 103.6 0 1.8 2.3 0 10-3.6 0zM13.9 11.5a1.8 2.3 0 103.6 0 1.8 2.3 0 10-3.6 0zM3 15a1.6 2 0 103.2 0 1.6 2 0 10-3.2 0zM17.8 15a1.6 2 0 103.2 0 1.6 2 0 10-3.2 0z",
    fish: "M3 12c3-5 9-6 13-3l4-3v12l-4-3c-4 3-10 2-13-3zM8 11.2h.01",
    grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
    shuffle: "M4 7h3.5c4 0 5 10 9 10H20M17 14l3 3-3 3M4 17h3.5c1.4 0 2.4-1.2 3.2-2.8M13.3 9.8C14.1 8.2 15.1 7 16.5 7H20M17 4l3 3-3 3",
  };

  function icon(name, { size = 22, fill = false } = {}) {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.setAttribute("aria-hidden", "true");
    svg.classList.add("icon", `icon--${name}`);
    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", ICONS[name]);
    path.setAttribute("fill", fill ? "currentColor" : "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", fill ? "1.2" : "2.4");
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

  const calm = () => V.Store?.data.settings.calm === true;

  function relabel(root = document) {
    for (const el of root.querySelectorAll("[data-label]")) el.setAttribute("aria-label", V.t(el.dataset.label));
  }

  // three paws, `on` of them filled: the rating of a level
  function stars(on, { size = 16 } = {}) {
    return h("span", { class: "stars" }, [0, 1, 2].map((i) => h("span", { class: `star${i < on ? " is-on" : ""}` }, icon("paw", { size, fill: true }))));
  }

  V.dom = { h, icon, replay, calm, relabel, stars };
})(window.Purrfit);
