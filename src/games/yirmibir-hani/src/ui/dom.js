"use strict";
(function (YB) {
  function h(tag, props = {}, ...children) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (value == null || value === false) continue;
      if (key === "class") el.className = value;
      else if (key === "html") el.innerHTML = value;
      else if (key === "dataset") Object.assign(el.dataset, value);
      else if (key === "style") for (const [name, v] of Object.entries(value)) el.style.setProperty(name, v);
      else if (key === "label") {
        el.dataset.label = value;
        el.setAttribute("aria-label", YB.t(value));
      } else if (key.startsWith("on")) el.addEventListener(key.slice(2), value);
      else el.setAttribute(key, value === true ? "" : value);
    }
    for (const child of children.flat()) {
      if (child == null || child === false) continue;
      el.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }
    return el;
  }

  const urls = new Map();

  // a baked sprite as a data URL, remembered by key
  function spriteUrl(key, make) {
    if (!urls.has(key)) {
      const canvas = make();
      urls.set(key, { url: YB.Pixels.url(canvas), w: canvas.width, h: canvas.height });
    }
    return urls.get(key);
  }

  // an <img> of a sprite, sized in art pixels
  function sprite(key, make, { scale = 1, className = "" } = {}) {
    const { url, w, h: height } = spriteUrl(key, make);
    return h("img", { class: `sprite ${className}`, src: url, alt: "", draggable: "false", style: { "--w": w * scale, "--h": height * scale } });
  }

  function icon(name, color = "#231726", { large = false } = {}) {
    const { url, w, h: height } = spriteUrl(`icon|${name}|${color}`, () => YB.Pixels.bake(YB.Sprites.ICONS[name], { colors: { "#": color } }));
    return h("span", { class: `icon${large ? " icon-large" : ""}`, "aria-hidden": "true", style: { "--w": w, "--h": height, "background-image": `url(${url})` } });
  }

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const frame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));

  function replay(el, className) {
    el.classList.remove(className);
    void el.offsetWidth;
    el.classList.add(className);
  }

  const calm = () => YB.Store?.data.settings.calm === true;

  function relabel(root = document) {
    for (const el of root.querySelectorAll("[data-label]")) el.setAttribute("aria-label", YB.t(el.dataset.label));
  }

  YB.dom = { h, sprite, spriteUrl, icon, wait, frame, replay, calm, relabel };
})(window.YirmibirHani);
