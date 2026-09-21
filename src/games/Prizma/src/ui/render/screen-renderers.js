"use strict";

(() => {
  function createResultRenderer({
    element,
    translate,
    formatTime,
    getLanguage,
    getProgress,
  }) {
    return (result) => {
      if (!result) return;
      element("result-title").textContent = result.tutorial
        ? translate("tutorialDone")
        : translate("resultTitle");
      element("result-level").textContent = result.tutorial
        ? translate("tutorialTitle")
        : `${translate("level")} ${result.level} · ${translate("connected")}`;
      element("result-time").textContent = formatTime(result.ms);
      element("result-moves").textContent = result.moves;
      element("result-score").textContent = result.score.toLocaleString(getLanguage());
      element("rating").innerHTML = [0, 1, 2]
        .map(
          (index) =>
            `<span class="medal ${index >= result.stars ? "empty" : ""}" aria-hidden="true">${index < result.stars ? "✓" : "·"}</span>`,
        )
        .join("");
      element("rating").setAttribute("aria-label", `${result.stars} / 3`);
      element("unlock-label").textContent = result.tutorial
        ? translate("startReal")
        : `${translate("level")} ${getProgress().next} ${translate("unlock")}`;
      element("next").querySelector("span").textContent = result.tutorial
        ? translate("startReal")
        : translate("next");
    };
  }

  function createMapRenderer({
    element,
    createElement,
    translate,
    icon,
    circuit,
    themeMarkup,
    getProgress,
    launch,
    canShift,
    reducedMotion,
    playSound,
  }) {
    const previewCache = new Map();
    let start = 0n;

    function center(level) {
      start = ((BigInt(level) - 1n) / 10n) * 10n;
    }

    function preview(number) {
      if (!previewCache.has(number)) {
        const board = circuit.generate(getProgress().seed, number);
        const size = board.n;
        const lit = circuit.connected(board.masks, size, board.root).lit;
        let tiles = "";
        board.masks.forEach((mask, index) => {
          const x = (index % size) * 24;
          const y = Math.floor(index / size) * 24;
          const root = index === board.root;
          const fixed = board.fixed?.includes(index);
          const on = lit[index];
          const ends = [];
          for (let direction = 0; direction < 4; direction++)
            if (mask & (1 << direction)) ends.push(direction);
          const point = (direction) => [
            11 + Math.sin((direction * Math.PI) / 2) * 11,
            11 - Math.cos((direction * Math.PI) / 2) * 11,
          ];
          let path = "";
          if (ends.length === 2 && (ends[0] + 2) % 4 !== ends[1]) {
            const a = point(ends[0]);
            const b = point(ends[1]);
            path = `M${a} L${11 + (a[0] - 11) * 0.36} ${11 + (a[1] - 11) * 0.36} Q11 11 ${11 + (b[0] - 11) * 0.36} ${11 + (b[1] - 11) * 0.36} L${b}`;
          } else {
            ends.forEach((direction) => {
              path += `M11 11 L${point(direction)}`;
            });
          }
          tiles += `<g transform="translate(${x} ${y})"><rect y="1" width="22" height="22" rx="4" fill="#c8c3b5"/><rect width="22" height="22" rx="4" fill="${fixed ? "#dad3c2" : on ? "#fff3da" : "#faf7ee"}"/><path d="${path}" fill="none" stroke="${on ? "#aa6046" : "#6e8d89"}" stroke-width="4" stroke-linejoin="round"/><path d="${path}" fill="none" stroke="${on ? "#d47e5c" : "#92aaa6"}" stroke-width="3" stroke-linejoin="round"/><path d="${path}" fill="none" stroke="${on ? "#edb08b" : "#c9d9d1"}" stroke-width=".8" stroke-linejoin="round"/>`;
          if (root || board.crystals.includes(index))
            tiles += `<circle cx="11" cy="11" r="${root ? 4 : 3}" fill="${on ? "#d47e5c" : "#92aaa6"}"/><circle cx="11" cy="11" r="${root ? 2 : 1.4}" fill="#fff7df"/>`;
          if (fixed)
            tiles += '<circle cx="3" cy="3" r=".7" fill="#968b74"/>';
          tiles += "</g>";
        });
        previewCache.set(
          number,
          `<svg class="level-preview" viewBox="-1 -1 ${size * 24} ${size * 24}" aria-hidden="true">${tiles}</svg>`,
        );
        if (previewCache.size > 40)
          previewCache.delete(previewCache.keys().next().value);
      }
      return themeMarkup(previewCache.get(number));
    }

    function render() {
      const progress = getProgress();
      element("map-nodes").replaceChildren();
      element("map-road").replaceChildren();
      for (let index = 0; index < 10; index++) {
        const number = String(start + BigInt(index) + 1n);
        const record = progress.records[number];
        const locked = BigInt(number) > BigInt(progress.next);
        const current = number === progress.next;
        const boss = BigInt(number) % 10n === 0n;
        const button = createElement("button");
        button.className =
          "map-node" +
          (record ? " done" : "") +
          (current ? " current" : "") +
          (boss ? " boss" : "");
        button.disabled = locked;
        button.dataset.level = number;
        const difficulty = circuit.difficulty(number).n;
        button.innerHTML = `<div class="level-card-top"><strong>${number.length > 6 ? "…" + number.slice(-4) : number.padStart(2, "0")}</strong><small>${record ? "●".repeat(record.stars) : current ? "▶" : icon("lock")}</small></div>${locked ? `<span class="level-locked" aria-hidden="true">${icon("lock")}</span>` : preview(number)}<span class="level-card-caption">${boss ? translate("challenge") : difficulty + " × " + difficulty}</span>`;
        button.setAttribute(
          "aria-label",
          `${translate("level")} ${number}${locked ? " · " + translate("locked") : ""}${record ? " · " + record.stars + "/3" : ""}`,
        );
        button.onclick = () => launch(number);
        element("map-nodes").append(button);
      }
      element("map-sector").textContent =
        `${translate("chapter")} ${start / 10n + 1n} / ${start + 1n}–${start + 10n}`;
      element("map-record").textContent =
        `${Object.keys(progress.records).length} ${translate("completed")}`;
      element("map-prev").disabled = start === 0n;
      element("map-play").querySelector("span").textContent =
        `${translate("play")} · ${translate("level")} ${progress.next}`;
    }

    function shift(delta) {
      if (!canShift()) return;
      start += BigInt(delta) * 10n;
      if (start < 0n) start = 0n;
      render();
      if (!reducedMotion())
        element("map-nodes").animate(
          [
            { opacity: 0.2, transform: `translateX(${delta * 22}px)` },
            { opacity: 1, transform: "translateX(0)" },
          ],
          { duration: 240, easing: "ease-out" },
        );
      playSound("tap");
    }

    return Object.freeze({ center, render, shift });
  }

  window.PrizmaScreens = Object.freeze({ createResultRenderer, createMapRenderer });
})();
