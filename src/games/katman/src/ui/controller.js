"use strict";
(() => {
  const $ = (id) => document.getElementById(id),
    E = DotEngine,
    store = DotStorage,
    settings = store.data.settings,
    audio = createDotAudio(settings),
    NS = "http://www.w3.org/2000/svg";
  const { formatTime, homePreview, roundedPath } = DotView;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const languages = ["tr", "en", "es", "fr", "ar", "de"];
  const t = (key) =>
    DotText[key]?.[languages.indexOf(settings.language)] ??
    DotText[key]?.[1] ??
    key;
  const picker = createLanguagePicker((language) => {
    settings.language = language;
    store.save();
    labels();
  });
  let state = "home",
    transitioning = false,
    board = null,
    paths = [],
    history = [],
    active = -1,
    dragging = false,
    gestureBefore = null,
    lastCell = -1,
    lastPointerTime = 0;
  let elapsed = 0,
    started = 0,
    hintsUsed = 0,
    undos = 0,
    tutorial = false,
    guideColor = -1,
    scoreShown = 0,
    scoreFrame = 0,
    finishTimer = 0,
    awardTimer = 0;
  const screen = {
    home: "home",
    levels: "levels",
    playing: "game",
    paused: "game",
    celebrating: "game",
    result: "result",
  };
  let applyTheme, renderHomePreview, labels, change;
  const clonePaths = () => paths.map((p) => p.slice());
  const time = () =>
    elapsed + (state === "playing" ? performance.now() - started : 0);
  function freeze() {
    if (state === "playing") elapsed = time();
    started = performance.now();
  }
  function persist() {
    if (!board || tutorial || !["playing", "paused"].includes(state)) return;
    store.data.session = {
      levelId: board.levelId,
      level: board.level,
      paths:
        dragging && gestureBefore
          ? gestureBefore.map((p) => p.slice())
          : clonePaths(),
      history: history.slice(-100),
      elapsed: time(),
      hintsUsed,
      undos,
    };
    store.save();
  }
  async function launch(level, { fresh = false, learn = false } = {}) {
    if (transitioning) return;
    clearTimeout(finishTimer);
    clearTimeout(awardTimer);
    tutorial = learn;
    board = learn
      ? E.tutorial()
      : E.generate(
          level,
          store.data.seed,
          !fresh &&
            store.data.session?.level === level &&
            store.data.session.levelId?.includes(":dots-1:")
            ? "dots-1"
            : "dots-2",
        );
    paths = board.routes.map(() => []);
    history = [];
    active = -1;
    elapsed = 0;
    hintsUsed = 0;
    undos = 0;
    guideColor = -1;
    scoreShown = 0;
    const saved = store.data.session;
    if (
      !fresh &&
      !learn &&
      saved?.levelId === board.levelId &&
      E.validate(board, saved.paths) &&
      !E.stats(board, saved.paths).won
    ) {
      paths = saved.paths.map((p, i) =>
        E.connected(board.routes[i], p) ? p.slice() : [],
      );
      history = Array.isArray(saved.history)
        ? saved.history.filter((p) => E.validate(board, p)).slice(-100)
        : [];
      elapsed = Math.max(0, Number(saved.elapsed) || 0);
      hintsUsed = Math.max(0, Math.min(3, Number(saved.hintsUsed) || 0));
      undos = Math.max(0, Number(saved.undos) || 0);
    } else if (fresh && !learn && saved?.levelId === board.levelId)
      hintsUsed = Math.max(0, Math.min(3, Number(saved.hintsUsed) || 0));
    $("board-seal").hidden = true;
    $("effects").replaceChildren();
    build();
    render();
    await change("playing");
    render();
    persist();
  }
  function build() {
    const grid = $("cells");
    grid.replaceChildren();
    grid.style.setProperty("--size", board.size);
    grid.style.setProperty("--pad", "2.5%");
    grid.style.setProperty("--gap", board.size > 7 ? "0.7%" : "1%");
    for (let i = 0; i < board.size ** 2; i++) {
      const el = document.createElement("button");
      el.className = "cell";
      el.dataset.index = i;
      el.tabIndex = board.walls.includes(i) ? -1 : 0;
      el.onclick = (e) => {
        if (e.detail === 0 || performance.now() - lastPointerTime > 300) tap(i);
      };
      grid.append(el);
    }
  }
  function endpointColor(i) {
    return board.routes.findIndex((r) => r.start === i || r.end === i);
  }
  function owner(i) {
    return paths.findIndex((p) => p.includes(i));
  }
  function guideTarget() {
    let color = guideColor;
    if (tutorial)
      color = board.routes.findIndex((r, i) => !E.connected(r, paths[i]));
    if (color < 0) return -1;
    const r = board.routes[color],
      p = paths[color];
    if (!p.length || p.some((v, i) => v !== r.solution[i])) return r.start;
    if (E.connected(r, p)) {
      if (!tutorial) guideColor = -1;
      return -1;
    }
    const next = r.solution[p.length] ?? -1;
    // İpucu yolunu başka renk kapatıyorsa önce o rengi yeniden başlat.
    const blocker = next >= 0 ? owner(next) : -1;
    if (!tutorial && blocker >= 0 && blocker !== color) {
      guideColor = blocker;
      return board.routes[blocker].start;
    }
    return next;
  }
  function render() {
    if (!board) return;
    const stats = E.stats(board, paths),
      target = guideTarget();
    [...$("cells").children].forEach((el, i) => {
      const endpoint = endpointColor(i),
        color = endpoint >= 0 ? endpoint : owner(i),
        connected =
          endpoint >= 0 && E.connected(board.routes[endpoint], paths[endpoint]);
      el.className =
        "cell" +
        (board.walls.includes(i) ? " wall" : "") +
        (owner(i) >= 0 ? " used" : "") +
        (connected ? " connected" : "") +
        (active >= 0 && paths[active].at(-1) === i ? " head" : "") +
        (target === i ? " suggested" : "");
      if (color >= 0) el.style.setProperty("--color", E.COLORS[color]);
      else el.style.removeProperty("--color");
      el.innerHTML =
        endpoint >= 0 ? `<span class="endpoint">${endpoint + 1}</span>` : "";
      el.setAttribute(
        "aria-label",
        `${Math.floor(i / board.size) + 1}, ${(i % board.size) + 1}${endpoint >= 0 ? " · " + t("pairName") + " " + (endpoint + 1) : board.walls.includes(i) ? " · " + t("locked") : ""}`,
      );
      el.setAttribute("aria-pressed", String(owner(i) >= 0));
    });
    $("level-label").textContent =
      t(tutorial ? "tutorial" : "level") + (tutorial ? "" : " " + board.level);
    $("game-title").textContent = t(board.boss ? "boss" : "normal");
    $("pair-count").textContent = `${stats.pairs} / ${board.routes.length}`;
    $("timer").textContent = formatTime(time());
    $("hint-count").textContent = 3 - hintsUsed;
    $("hint").disabled = tutorial || hintsUsed >= 3;
    $("undo").disabled = tutorial || !history.length;
    status(
      tutorial
        ? "tutorialBody"
        : guideColor >= 0
          ? "hintBody"
          : stats.pairs === board.routes.length
            ? "full"
            : active < 0
              ? "start"
              : "draw",
    );
    animateScore(stats.score);
    geometry();
  }
  function status(key) {
    $("status").textContent = t(key);
  }
  function animateScore(value) {
    cancelAnimationFrame(scoreFrame);
    const from = scoreShown,
      at = performance.now();
    if (reduced()) {
      scoreShown = value;
      $("score").textContent = value.toLocaleString();
      return;
    }
    function frame(now) {
      const p = Math.min(1, (now - at) / 300);
      scoreShown = Math.round(from + (value - from) * (1 - (1 - p) ** 3));
      $("score").textContent = scoreShown.toLocaleString(settings.language);
      if (p < 1) scoreFrame = requestAnimationFrame(frame);
    }
    scoreFrame = requestAnimationFrame(frame);
  }
  function center(i) {
    const el = $("cells").children[i];
    return {
      x: el.offsetLeft + el.offsetWidth / 2,
      y: el.offsetTop + el.offsetHeight / 2,
    };
  }
  let gestureUndos = 0;
  let pointerPosition = null,
    followFrame = 0;
  function trackPointer(event) {
    const rect = $("board").getBoundingClientRect();
    pointerPosition = {
      x: event.clientX - rect.left - 1,
      y: event.clientY - rect.top - 1,
    };
    if (!followFrame) followFrame = requestAnimationFrame(followPointer);
  }
  function followPointer() {
    followFrame = 0;
    if (!dragging || active < 0 || state !== "playing" || !pointerPosition)
      return;
    const route = paths[active];
    if (!route.length) return;
    const head = route.at(-1),
      origin = center(head);
    const points = route.map(center);
    const dx = pointerPosition.x - origin.x,
      dy = pointerPosition.y - origin.y;
    const horizontal = Math.abs(dx) > Math.abs(dy);
    const neighbor =
      head + (horizontal ? Math.sign(dx) : Math.sign(dy) * board.size);
    const previous = route.at(-2);
    const allowed =
      neighbor !== head &&
      neighbor >= 0 &&
      neighbor < board.size ** 2 &&
      E.adjacent(head, neighbor, board.size) &&
      !board.walls.includes(neighbor) &&
      (owner(neighbor) < 0 || neighbor === previous) &&
      (endpointColor(neighbor) < 0 || endpointColor(neighbor) === active);
    if (allowed) {
      const next = center(neighbor);
      const vx = next.x - origin.x,
        vy = next.y - origin.y;
      const fraction = Math.max(
        0,
        Math.min(1, (dx * vx + dy * vy) / (vx * vx + vy * vy)),
      );
      const tip = { x: origin.x + vx * fraction, y: origin.y + vy * fraction };
      // Geri giderken son parçayı kısalt; dönüşte köşeyi koru.
      if (neighbor === previous) points.pop();
      points.push(tip);
    }
    const d = roundedPath(points, $("board").clientWidth / board.size);
    $("paths")
      .querySelectorAll(`[data-color="${active}"]`)
      .forEach((el) => el.setAttribute("d", d));
  }

  function geometry() {
    if (!board || $("game").hidden) return;
    const size = $("board").clientWidth,
      svg = $("paths");
    svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
    svg.replaceChildren();
    // Çizgiler, nokta yüzeylerinin üzerine çıkamaz.
    const defs = document.createElementNS(NS, "defs");
    const mask = document.createElementNS(NS, "mask");
    mask.id = "socket-mask";
    mask.setAttribute("maskUnits", "userSpaceOnUse");
    mask.innerHTML = `<rect width="${size}" height="${size}" fill="white"/>`;
    for (const route of board.routes)
      for (const index of [route.start, route.end]) {
        const point = center(index),
          socket = $("cells").children[index].querySelector(".endpoint");
        const circle = document.createElementNS(NS, "circle");
        circle.setAttribute("cx", point.x);
        circle.setAttribute("cy", point.y);
        circle.setAttribute("r", socket.offsetWidth / 2 - 2);
        circle.setAttribute("fill", "black");
        mask.append(circle);
      }
    defs.append(mask);
    svg.append(defs);
    const stroke = (size / board.size) * 0.21;
    paths.forEach((path, color) => {
      if (!path.length) return;
      const d = roundedPath(
        path.map(center),
        $("board").clientWidth / board.size,
      );
      for (const [className, width] of [
        ["route-shadow", stroke + 3],
        ["route-line", stroke],
      ]) {
        const p = document.createElementNS(NS, "path");
        p.setAttribute("d", d);
        p.setAttribute("class", className);
        p.dataset.color = color;
        p.setAttribute("stroke-width", width);
        p.style.setProperty("--color", E.COLORS[color]);
        p.setAttribute("mask", "url(#socket-mask)");
        svg.append(p);
      }
      if (E.connected(board.routes[color], path) && !reduced()) {
        const p = document.createElementNS(NS, "path");
        p.setAttribute("d", d);
        p.setAttribute("class", "route-highlight");
        p.setAttribute("stroke-width", Math.max(2, stroke * 0.24));
        p.setAttribute("pathLength", "150");
        p.setAttribute("mask", "url(#socket-mask)");
        svg.append(p);
      }
    });
    const target = guideTarget(),
      hand = $("pointer");
    hand.style.display = target >= 0 && state === "playing" ? "block" : "none";
    if (target >= 0) {
      const p = center(target);
      hand.style.left = p.x + "px";
      hand.style.top = p.y + "px";
    }
  }
  new ResizeObserver(geometry).observe($("board"));
  function burst(i, color, large = false) {
    if (reduced()) return;
    const origin = center(i),
      count = large ? 20 : 9,
      range = ($("board").clientWidth / board.size) * (large ? 1.1 : 0.6);
    for (let k = 0; k < count; k++) {
      const p = document.createElement("i"),
        angle = (k / count) * Math.PI * 2;
      p.className = "particle";
      p.style.cssText = `left:${origin.x}px;top:${origin.y}px;--color:${E.COLORS[color]};--dx:${Math.cos(angle) * range}px;--dy:${Math.sin(angle) * range}px`;
      $("effects").append(p);
      p.addEventListener("animationend", () => p.remove(), { once: true });
    }
  }
  function reward(i, points, color) {
    if (reduced()) return;
    const p = center(i),
      label = document.createElement("b");
    label.className = "floating-score";
    label.textContent = "+" + points;
    label.style.left = p.x + "px";
    label.style.top = p.y + "px";
    $("effects").append(label);
    label.addEventListener("animationend", () => label.remove(), {
      once: true,
    });
    const gain = $("score-gain");
    gain.textContent = "+" + points;
    gain.getAnimations().forEach((a) => a.cancel());
    gain.animate(
      [
        { opacity: 0, translate: "0 5px" },
        { opacity: 1, translate: "0 0", offset: 0.2 },
        { opacity: 0, translate: "0 -12px" },
      ],
      { duration: 800 },
    );
    burst(i, color, true);
  }
  function reject(i, key) {
    status(key);
    const el = $("cells").children[i];
    el.classList.remove("invalid");
    void el.offsetWidth;
    el.classList.add("invalid");
    audio.play("error");
  }
  function commitGesture() {
    if (
      gestureBefore &&
      JSON.stringify(gestureBefore) !== JSON.stringify(paths)
    ) {
      history.push(gestureBefore);
      if (history.length > 100) history.shift();
    }
    gestureBefore = null;
    const feedback = $("status").textContent;
    render();
    $("status").textContent = feedback;
    persist();
  }
  function clearRoute(color) {
    if (color < 0 || paths[color].length < 2) return false;
    gestureBefore = clonePaths();
    paths[color] = [];
    active = -1;
    undos++;
    audio.play("back");
    commitGesture();
    return true;
  }
  let press = null;
  function tap(i) {
    if (transitioning || state !== "playing") return;
    noteActivity();
    if (active < 0 && clearRoute(endpointColor(i))) return;
    gestureBefore = clonePaths();
    input(i, false);
    commitGesture();
  }
  function input(i, continuing) {
    if (transitioning || state !== "playing" || i < 0 || i >= board.size ** 2)
      return;
    if (tutorial && i !== guideTarget()) {
      reject(i, "tutorialBody");
      return;
    }
    if (board.walls.includes(i)) {
      if (!continuing || active >= 0) reject(i, "wallStop");
      return;
    }
    const endpoint = endpointColor(i),
      occupied = owner(i);
    if (active >= 0 && paths[active].length && i === paths[active].at(-1))
      return;
    if (
      active >= 0 &&
      paths[active].length &&
      E.adjacent(paths[active].at(-1), i, board.size)
    ) {
      if (occupied === active) {
        const at = paths[active].indexOf(i);
        paths[active] = paths[active].slice(0, at + 1);
        undos++;
        audio.play("back");
        render();
        return;
      }
      if (endpoint >= 0 && endpoint !== active) {
        if (continuing) {
          reject(i, "wrongColor");
          return;
        }
      } else if (occupied >= 0) {
        reject(i, "blocked");
        return;
      } else {
        paths[active].push(i);
        const color = active,
          connected = E.connected(board.routes[color], paths[color]),
          after = E.stats(board, paths);
        render();
        $("cells").children[i].classList.add("flash");
        if (connected) {
          reward(i, 150, color);
          audio.play("pair", color);
          active = -1;
        } else {
          burst(i, color);
          audio.play("step", paths[color].length);
        }
        if (after.won) {
          commitGesture();
          win();
        }
        return;
      }
    }
    // Yeni sürükleme bir uçtan veya mevcut yolun üzerinden başlatılabilir.
    if (continuing && active >= 0) return;
    if (endpoint >= 0) {
      paths[endpoint] = [i];
      active = endpoint;
      audio.play("tap");
      render();
      return;
    }
    if (occupied >= 0) {
      active = occupied;
      const at = paths[active].indexOf(i);
      if (at < paths[active].length - 1) undos++;
      paths[active] = paths[active].slice(0, at + 1);
      audio.play("back");
      render();
    }
  }
  $("board").addEventListener("pointerdown", (event) => {
    if (state !== "playing" || transitioning || dragging || event.button > 0)
      return;
    const cell = event.target.closest(".cell");
    if (!cell) return;
    event.preventDefault();
    press = {
      index: Number(cell.dataset.index),
      x: event.clientX,
      y: event.clientY,
      moved: false,
    };
    dragging = true;
    $("board").classList.add("dragging");
    trackPointer(event);
    gestureBefore = clonePaths();
    gestureUndos = undos;
    active = -1;
    lastCell = Number(cell.dataset.index);
    lastPointerTime = performance.now();
    input(lastCell, false);
    $("board").setPointerCapture(event.pointerId);
  });
  $("board").addEventListener("pointermove", (event) => {
    if (!dragging || state !== "playing" || transitioning) return;
    noteActivity();
    if (
      press &&
      Math.hypot(event.clientX - press.x, event.clientY - press.y) > 8
    )
      press.moved = true;
    trackPointer(event);
    const cell = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest(".cell");
    if (!cell) return;
    const i = Number(cell.dataset.index);
    if (i !== lastCell) {
      lastCell = i;
      lastPointerTime = performance.now();
      continueDrag(i);
    }
  });
  function continueDrag(target) {
    if (active < 0) return;
    const head = paths[active].at(-1);
    const sameRow =
      Math.floor(head / board.size) === Math.floor(target / board.size);
    const sameColumn = head % board.size === target % board.size;
    if (!sameRow && !sameColumn) return;
    // Hızlı sürüklemede atlanan ara kareleri sırayla işle.
    const delta = sameRow
      ? Math.sign(target - head)
      : Math.sign(target - head) * board.size;
    if (!delta) return;
    for (let cell = head + delta; ; cell += delta) {
      const previous = active >= 0 ? paths[active].at(-1) : -1;
      input(cell, true);
      if (
        cell === target ||
        active < 0 ||
        paths[active].at(-1) === previous ||
        state !== "playing"
      )
        break;
    }
  }
  function endDrag(event) {
    if (!dragging) return;
    dragging = false;
    $("board").classList.remove("dragging");
    cancelAnimationFrame(followFrame);
    followFrame = 0;
    pointerPosition = null;
    lastCell = -1;
    lastPointerTime = performance.now();
    if (state !== "playing") return;
    const clicked = event?.type === "pointerup" && press && !press.moved;
    const color = clicked ? endpointColor(press.index) : -1;
    press = null;
    if (color >= 0 && gestureBefore?.[color].length > 1) {
      paths = gestureBefore;
      gestureBefore = null;
      undos = gestureUndos;
      clearRoute(color);
      return;
    }
    const cancelled = event?.type === "pointercancel";
    const incomplete =
      active >= 0 && !E.connected(board.routes[active], paths[active]);
    if (cancelled || incomplete) {
      const color = active;
      paths = gestureBefore || board.routes.map(() => []);
      undos = gestureUndos;
      gestureBefore = null;
      active = -1;
      $("effects").replaceChildren();
      animateScore(E.stats(board, paths).score);
      const lines =
        color >= 0
          ? [...$("paths").querySelectorAll(`[data-color="${color}"]`)]
          : [];
      if (!reduced() && lines.length) {
        transitioning = true;
        Promise.all(
          lines.map((line) => {
            const length = line.getTotalLength();
            line.style.strokeDasharray = String(length);
            return line.animate(
              [{ strokeDashoffset: 0 }, { strokeDashoffset: length }],
              { duration: 180, easing: "ease-out" },
            ).finished;
          }),
        ).then(() => {
          transitioning = false;
          render();
          persist();
        });
      } else {
        render();
        persist();
      }
      return;
    }
    active = -1;
    commitGesture();
  }
  $("board").addEventListener("pointerup", endDrag);
  $("board").addEventListener("pointercancel", endDrag);
  $("board").addEventListener("lostpointercapture", endDrag);
  document.addEventListener("keydown", (event) => {
    if (state !== "playing" || transitioning || $("dialog").open) return;
    const keys = {
      ArrowUp: -board.size,
      ArrowRight: 1,
      ArrowDown: board.size,
      ArrowLeft: -1,
    };
    if (event.key in keys && active >= 0) {
      event.preventDefault();
      const current = paths[active].at(-1),
        next = current + keys[event.key];
      if (E.adjacent(current, next, board.size)) tap(next);
    }
    if ((event.ctrlKey || event.metaKey) && event.key === "z") {
      event.preventDefault();
      undo();
    }
    if (event.key === "Escape") pause();
  });
  function undo() {
    if (transitioning || state !== "playing" || tutorial || !history.length)
      return;
    paths = history.pop();
    active = -1;
    undos++;
    audio.play("back");
    render();
    persist();
  }
  function suggestedColor() {
    let color = board.routes.findIndex((r, i) =>
      paths[i].some((v, k) => v !== r.solution[k]),
    );
    if (color < 0)
      color = board.routes.findIndex((r, i) => !E.connected(r, paths[i]));
    return color;
  }
  const IDLE_DELAY = 18000,
    IDLE_DURATION = 3200;
  let lastActivity = performance.now(),
    idleUntil = 0;
  function noteActivity() {
    lastActivity = performance.now();
    idleUntil = 0;
    $("idle-cue").hidden = true;
  }
  function idleHint(now) {
    if (
      state !== "playing" ||
      transitioning ||
      dragging ||
      tutorial ||
      guideColor >= 0 ||
      document.hidden ||
      $("dialog").open
    ) {
      noteActivity();
      return;
    }
    if (idleUntil) {
      if (now >= idleUntil) noteActivity();
      return;
    }
    if (now - lastActivity < IDLE_DELAY) return;
    const color = suggestedColor();
    if (color < 0) return;
    const route = board.routes[color].solution;
    const from = center(route[0]),
      to = center(route[1]),
      cue = $("idle-cue");
    cue.style.left = from.x + "px";
    cue.style.top = from.y + "px";
    cue.style.setProperty("--color", E.COLORS[color]);
    cue.style.setProperty(
      "--cue-scale",
      Math.min(1, $("board").clientWidth / board.size / 72),
    );
    cue.style.setProperty(
      "--direction",
      Math.atan2(to.y - from.y, to.x - from.x) + "rad",
    );
    cue.hidden = false;
    idleUntil = now + IDLE_DURATION;
  }
  document.addEventListener("pointerdown", noteActivity, true);
  document.addEventListener("keydown", noteActivity, true);
  function hint() {
    if (transitioning || state !== "playing" || tutorial) return;
    if (guideColor >= 0) {
      geometry();
      return;
    }
    if (hintsUsed >= 3) return;
    // Çözümden ayrılan renk önce temizlenir; doğru ön ekler korunur.
    const color = suggestedColor();
    if (color < 0) {
      status("full");
      return;
    }
    guideColor = color;
    hintsUsed++;
    active = -1;
    render();
    persist();
    audio.play("tap");
  }
  const celebrateBoard = createBoardCelebration({
    $,
    colors: E.COLORS,
    reducedMotion: reduced,
    getBoard: () => board,
    getPaths: () => paths,
    burst,
  });
  function win() {
    noteActivity();
    freeze();
    state = "celebrating";
    $("board").classList.remove("dragging");
    document.body.dataset.state = state;
    dragging = false;
    transitioning = true;
    $("pointer").style.display = "none";
    const stats = E.stats(board, paths),
      completionBonus = Math.max(
        0,
        board.size * 60 - undos * 10 - hintsUsed * 75,
      ),
      score = stats.score + completionBonus,
      stars =
        hintsUsed === 0 && undos <= 2
          ? 3
          : hintsUsed <= 1 && undos <= 10
            ? 2
            : 1;
    if (!tutorial) {
      const old = store.data.records[board.levelId];
      store.data.records[board.levelId] = {
        levelId: board.levelId,
        gameId: "katman",
        modeId: "connect",
        levelNumber: String(board.level),
        seed: board.seed,
        generatorVersion: board.generatorVersion,
        score: {
          stars: Math.max(old?.score.stars || 0, stars),
          points: Math.max(old?.score.points || 0, score),
          bestTimeMs: old ? Math.min(old.score.bestTimeMs, elapsed) : elapsed,
        },
      };
      store.data.next = Math.max(store.data.next, board.level + 1);
      store.data.session = null;
    } else settings.learned = true;
    store.save();
    $("stars").innerHTML = [1, 2, 3]
      .map((i) => `<span class="${i > stars ? "empty" : ""}">★</span>`)
      .join("");
    $("stars").setAttribute("aria-label", `${stars} / 3`);
    $("result-time").textContent = formatTime(elapsed);
    $("result-bonus").textContent = `+${completionBonus} ${t("bonusTotal")}`;
    $("result-score").textContent = score.toLocaleString(settings.language);
    audio.play("win");
    celebrateBoard();
    awardTimer = setTimeout(
      () => {
        $("board-seal").hidden = false;
        animateScore(score);
      },
      reduced() ? 0 : 500,
    );
    finishTimer = setTimeout(
      async () => {
        transitioning = false;
        await change("result");
        labels();
        if (!reduced()) {
          const at = performance.now();
          function count(now) {
            const p = Math.min(1, (now - at) / 700);
            $("result-score").textContent = Math.round(
              score * (1 - (1 - p) ** 3),
            ).toLocaleString(settings.language);
            if (p < 1) requestAnimationFrame(count);
          }
          requestAnimationFrame(count);
        }
      },
      reduced() ? 400 : 2400,
    );
  }
  const dialogs = createDialogController({
    $,
    text: t,
    getState: () => state,
    setState: (next) => {
      state = next;
    },
    startPlaying: () => {
      started = performance.now();
    },
    isTransitioning: () => transitioning,
    endDrag,
    freeze,
    persist,
    geometry,
  });
  const openDialog = dialogs.open;
  const closeDialog = dialogs.close;
  function help() {
    openDialog(
      "helpTitle",
      "helpBody",
      [
        ["try", () => launch(0, { learn: true, fresh: true }), true],
        ["resume", null, false],
      ],
      true,
    );
  }
  function pause() {
    openDialog("pauseTitle", "pauseBody", [
      ["resume", null, true],
      ["levels", levels, false],
    ]);
  }
  let levelBrowser;
  const appShell = createAppShell({
    $,
    settings,
    store,
    picker,
    text: t,
    engine: E,
    homePreview,
    reducedMotion: reduced,
    screens: screen,
    getState: () => state,
    setState: (next) => {
      state = next;
      if (next === "playing") started = performance.now();
    },
    setTransitioning: (value) => {
      transitioning = value;
    },
    cancelDrag: () => {
      dragging = false;
    },
    noteActivity,
    renderBoard: render,
    renderLevels: () => levelBrowser.render(),
    geometry,
    hasBoard: () => Boolean(board),
    isTutorial: () => tutorial,
  });
  ({ applyTheme, renderHome: renderHomePreview, labels, change } = appShell);

  levelBrowser = createLevelBrowser({
    $,
    engine: E,
    store,
    text: t,
    launch,
    change,
    persist,
    freeze,
    isTransitioning: () => transitioning,
  });
  const levels = levelBrowser.open;
  $("play").onclick = () =>
    settings.learned ? launch(store.data.next) : help();
  $("open-levels").onclick = levels;
  $("learn").onclick = help;
  $("help").onclick = help;
  $("home-button").onclick = () => {
    if (transitioning) return;
    endDrag();
    persist();
    freeze();
    change("home");
    labels();
  };
  $("levels-back").onclick = () => {
    change("home");
    labels();
  };
  $("game-back").onclick = () =>
    openDialog("exitTitle", "exitBody", [
      ["levels", levels, true],
      ["resume", null, false],
    ]);
  $("pause").onclick = pause;
  $("undo").onclick = undo;
  $("hint").onclick = hint;
  $("reset").onclick = () =>
    openDialog("resetTitle", "resetBody", [
      [
        "reset",
        () => launch(board.level, { fresh: true, learn: tutorial }),
        true,
      ],
      ["cancel", null, false],
    ]);
  $("next").onclick = () =>
    launch(tutorial ? store.data.next : board.level + 1, { fresh: true });
  $("retry").onclick = () =>
    launch(board.level, { fresh: true, learn: tutorial });
  $("result-levels").onclick = levels;
  $("prev-page").onclick = levelBrowser.previousPage;
  $("next-page").onclick = levelBrowser.nextPage;
  $("theme").onclick = () => {
    settings.theme = settings.theme === "dark" ? "light" : "dark";
    store.save();
    applyTheme();
  };
  $("sound").onclick = () => {
    settings.muted = !settings.muted;
    audio.mute();
    store.save();
    labels();
  };
  $("close").onclick = closeDialog;
  $("dialog").addEventListener("cancel", (e) => {
    e.preventDefault();
    closeDialog();
  });
  window.gameData = { exportData: store.exportData, download: store.download };
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state === "playing" && !transitioning) pause();
  });
  window.addEventListener("pagehide", persist);
  setInterval(() => {
    if (state === "playing") $("timer").textContent = formatTime(time());
    idleHint(performance.now());
  }, 250);
  setInterval(persist, 4000);
  document.body.dataset.state = state;
  renderHomePreview();
  labels();
})();
