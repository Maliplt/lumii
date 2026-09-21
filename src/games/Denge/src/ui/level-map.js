"use strict";
const createDengeLevelMap = ({
  $,
  campaigns,
  getLevel,
  getState,
  transition,
  showAtlas,
  startGame,
  onHome,
  t,
  levelName,
  availableStars,
  reduceMotion,
}) => {
  let page = 0n;
  let lanes = window.innerWidth < 760 ? 2 : 1;
  let fraction = 0;
  let velocity = 0;
  let frame = 0;
  let drag = null;
  let suppressClick = false;

  function show(center = true) {
    const level = getLevel();
    if (level === 1) {
      showAtlas();
      return;
    }
    if (getState() !== "map") transition("map");
    cancelAnimationFrame(frame);
    velocity = 0;
    if (center) {
      page = (BigInt(campaigns[level].next) - 1n) / BigInt(lanes);
      page = page > 2n ? page - 2n : 0n;
      fraction = 0;
    }
    render();
    $("map-title").tabIndex = -1;
    $("map-title").focus({ preventScroll: true });
  }

  function pan(columns) {
    fraction += columns;
    const whole = Math.floor(fraction);
    if (whole) {
      page += BigInt(whole);
      fraction -= whole;
    }
    if (page < 0n) {
      page = 0n;
      fraction = 0;
      velocity = 0;
    }
    render();
  }

  function render() {
    const journey = campaigns[getLevel()];
    const next = BigInt(journey.next);
    const first = page * BigInt(lanes) + 1n;
    const columns = 10 / lanes;
    $("map-eyebrow").textContent = levelName();
    $("map-progress").textContent = t("cleared", {
      number: String(next - 1n),
    });
    $("map-stars").textContent = t("collected", { number: availableStars() });
    $("map-range").textContent = t("dragMap");
    $("map-prev").disabled = page === 0n && fraction === 0;
    $("map-current").hidden = next >= first && next < first + 10n;
    $("map-play-label").textContent = t("playLevel", { number: journey.next });

    const existing = new Map(
      [...$("map-nodes").children].map((element) => [
        element.dataset.chapter,
        element,
      ]),
    );
    const active = new Set();
    const points = [];
    for (let column = -1; column <= columns + 1; column++) {
      const absolute = page + BigInt(column);
      if (absolute < 0n) continue;
      for (let lane = 0; lane < lanes; lane++) {
        const number = absolute * BigInt(lanes) + BigInt(lane) + 1n;
        const key = String(number);
        const x = ((column + 0.5 - fraction) / columns) * 100;
        let terrain = 2166136261;
        for (const character of `${journey.seed}:${absolute}`)
          terrain = Math.imul(terrain ^ character.charCodeAt(0), 16777619);
        terrain = Math.imul(terrain ^ (terrain >>> 16), 0x7feb352d);
        terrain = Math.imul(terrain ^ (terrain >>> 15), 0x846ca68b);
        terrain ^= terrain >>> 16;
        const noise = (terrain >>> 0) / 4294967296;
        const y =
          lanes === 2
            ? lane === 0
              ? 23 + noise * 19
              : 62 + (1 - noise) * 17
            : 29 + noise * 42;
        points.push({ x, y, number });
        active.add(key);
        let button = existing.get(key);
        const locked = number > next;
        const completed = number < next;
        const entry = journey.records[key];
        if (!button) {
          button = document.createElement("button");
          button.dataset.chapter = key;
          button.innerHTML = '<strong></strong><small aria-hidden="true"></small>';
          button.onclick = () => {
            if (!suppressClick) startGame(key);
          };
          $("map-nodes").append(button);
        }
        button.className = `level-node${locked ? " locked" : completed ? " complete" : " current"}${number % 10n === 0n ? " challenge-node" : ""}`;
        button.disabled = locked;
        button.style.left = `${x}%`;
        button.style.top = `${y}%`;
        button.tabIndex = x >= 0 && x <= 100 && !locked ? 0 : -1;
        button.setAttribute(
          "aria-label",
          `${t("level", { number: key })} · ${t(locked ? "locked" : completed ? "completed" : "current")}`,
        );
        if (number === next) button.setAttribute("aria-current", "step");
        else button.removeAttribute("aria-current");
        button.firstChild.textContent = key;
        button.lastChild.textContent = locked
          ? number % 10n === 0n
            ? "!"
            : "·"
          : entry?.stars
            ? "★".repeat(entry.stars)
            : completed
              ? "✓"
              : number % 10n === 0n
                ? "!"
                : "▶";
      }
    }
    for (const [key, element] of existing)
      if (!active.has(key)) element.remove();
    const path = points
      .map((point, index) => {
        if (!index) return `M${point.x * 12} ${point.y * 5}`;
        const previous = points[index - 1];
        const midpoint = (previous.x + point.x) * 6;
        return `C${midpoint} ${previous.y * 5},${midpoint} ${point.y * 5},${point.x * 12} ${point.y * 5}`;
      })
      .join(" ");
    $("map-road").innerHTML =
      `<path class="road" d="${path}"/><path class="road-dashes" d="${path}"/>`;
  }

  function coast() {
    cancelAnimationFrame(frame);
    let last = 0;
    const tick = (now) => {
      if (getState() !== "map" || drag) return;
      const elapsed = last ? Math.min(32, now - last) : 16;
      last = now;
      pan(velocity * elapsed);
      velocity *= Math.pow(0.92, elapsed / 16);
      if (Math.abs(velocity) > 0.00015) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  }

  function move(direction) {
    if (reduceMotion()) {
      pan(direction);
      return;
    }
    velocity = direction * 0.012;
    coast();
  }

  $("map-prev").onclick = () => move(-1);
  $("map-next").onclick = () => move(1);
  for (const [id, path] of [
    ["map-prev", "m14 6-6 6 6 6M8 12h12"],
    ["map-next", "m10 6 6 6-6 6M4 12h12"],
  ])
    $(id).innerHTML =
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;
  $("map-current").onclick = () => show();
  $("map-home").onclick = onHome;
  $("map-window").addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    cancelAnimationFrame(frame);
    velocity = 0;
    suppressClick = false;
    drag = {
      x: event.clientX,
      start: event.clientX,
      time: performance.now(),
      id: event.pointerId,
    };
  });
  $("map-window").addEventListener("pointermove", (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    const delta = drag.x - event.clientX;
    const now = performance.now();
    const step = $("map-window").getBoundingClientRect().width / (10 / lanes);
    if (Math.abs(event.clientX - drag.start) > 5) {
      suppressClick = true;
      $("map-window").setPointerCapture(event.pointerId);
    }
    if (suppressClick) {
      pan(delta / step);
      velocity = delta / step / Math.max(8, now - drag.time);
    }
    drag.x = event.clientX;
    drag.time = now;
  });
  const release = () => {
    if (!drag) return;
    if (performance.now() - drag.time > 90) velocity = 0;
    drag = null;
    if (suppressClick && !reduceMotion()) coast();
  };
  $("map-window").addEventListener("pointerup", release);
  $("map-window").addEventListener("pointercancel", () => {
    drag = null;
    velocity = 0;
  });
  $("map-window").addEventListener(
    "click",
    (event) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    },
    true,
  );
  $("map-window").addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      cancelAnimationFrame(frame);
      pan(
        (Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY) /
          ($("map-window").getBoundingClientRect().width / (10 / lanes)),
      );
    },
    { passive: false },
  );
  $("map-window").addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    suppressClick = false;
    move(event.key === "ArrowRight" ? 1 : -1);
  });
  window.addEventListener("resize", () => {
    const nextLanes = window.innerWidth < 760 ? 2 : 1;
    if (nextLanes !== lanes) {
      page = (page * BigInt(lanes)) / BigInt(nextLanes);
      lanes = nextLanes;
      fraction = 0;
    }
    if (getState() === "map") render();
  });

  return Object.freeze({ show, render });
};

if (typeof module !== "undefined" && module.exports)
  module.exports = createDengeLevelMap;
