"use strict";

function createLevelBrowser({ $, engine, store, text, launch, change, persist, freeze, isTransitioning }) {
  const previewCache = new Map();
  let page = 0;

  function preview(level) {
    if (previewCache.has(level)) return previewCache.get(level);
    const puzzle = engine.generate(level, store.data.seed);
    const step = 14;
    let content = "";
    for (let index = 0; index < puzzle.size ** 2; index++) {
      const x = (index % puzzle.size) * step + 7;
      const y = Math.floor(index / puzzle.size) * step + 7;
      content += puzzle.walls.includes(index)
        ? `<rect x="${x - 4}" y="${y - 4}" width="8" height="8" rx="2" fill="#526079"/>`
        : `<circle cx="${x}" cy="${y}" r="1.1" fill="#617089"/>`;
    }
    puzzle.routes.forEach((route) =>
      [route.start, route.end].forEach((index) => {
        content += `<circle cx="${(index % puzzle.size) * step + 7}" cy="${Math.floor(index / puzzle.size) * step + 7}" r="4.7" fill="${engine.COLORS[route.color]}"/>`;
      }),
    );
    const markup = `<svg class="level-preview" viewBox="0 0 ${puzzle.size * step} ${puzzle.size * step}" aria-hidden="true">${content}</svg>`;
    previewCache.set(level, markup);
    if (previewCache.size > 36) previewCache.delete(previewCache.keys().next().value);
    return markup;
  }

  function render() {
    $("level-grid").replaceChildren();
    for (let offset = 1; offset <= 12; offset++) {
      const level = page * 12 + offset;
      const config = engine.difficulty(level);
      const currentId = `katman:connect:dots-2:${store.data.seed}:${level}`;
      const record =
        store.data.records[currentId] ||
        store.data.records[`katman:connect:dots-1:${store.data.seed}:${level}`];
      const locked = level > store.data.next;
      const button = document.createElement("button");
      button.className =
        "level-card" +
        (level === store.data.next ? " current" : "") +
        (record ? " done" : "") +
        (config.boss ? " boss" : "");
      button.disabled = locked;
      button.innerHTML = `<div><strong>${String(level).padStart(2, "0")}</strong>${locked ? "" : `<small>${config.size} × ${config.size} · ${config.pairs} ${text("connections")}</small>`}</div>${locked ? '<svg class="level-lock"><use href="#lock"/></svg>' : preview(level)}${locked ? "" : record ? `<span class="level-stars">${"★".repeat(record.score.stars)}</span>` : '<svg><use href="#arrow"/></svg>'}`;
      button.setAttribute("aria-label", `${text("level")} ${level}${locked ? " " + text("locked") : ""}`);
      button.onclick = () => launch(level);
      $("level-grid").append(button);
    }
    $("page-label").textContent = `${page * 12 + 1} — ${page * 12 + 12}`;
    $("prev-page").disabled = page === 0;
  }

  async function open() {
    if (isTransitioning()) return;
    persist();
    freeze();
    page = Math.floor((store.data.next - 1) / 12);
    render();
    await change("levels");
  }

  function previousPage() {
    page = Math.max(0, page - 1);
    render();
  }

  function nextPage() {
    page++;
    render();
  }

  return Object.freeze({ open, render, previousPage, nextPage });
}
