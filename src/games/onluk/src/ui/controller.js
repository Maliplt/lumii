"use strict";
(() => {
  const $ = (id) => document.getElementById(id),
    { data, save } = TenStorage,
    settings = data.settings;
  const audio = createDotAudio(settings);
  const t = (key, args = {}) =>
    Object.entries(args).reduce(
      (s, [k, v]) => s.replaceAll("{" + k + "}", String(v)),
      TenText[settings.language][key] ?? key,
    );
  let state = null,
    chain = [],
    phase = "idle",
    practice = false,
    focusIndex = 0,
    screen = "home",
    modalKind = null,
    previousFocus = null;
  let hinted = [],
    pending = null,
    animationMs = 0,
    lastFrame = performance.now(),
    statusKey = "select",
    newBest = false,
    inputReadyAt = 0;
  const sum = () => TenEngine.evaluate(state, chain);
  const ready = () =>
    TenEngine.isTen(sum()) && chain.length >= (state.rules?.min || 2);
  const local = (tr, en) => (settings.language === "tr" ? tr : en);
  const journeyView = createJourneyView({
    data,
    settings,
    t,
    onPlay: (level) => start(false, false, level),
    onClose: () => resume(),
  });
  function announce(key) {
    statusKey = key;
    $("status").textContent = t(key);
  }
  function persist() {
    if (!save()) announce("saveError");
  }
  function saveRound() {
    if (state && !practice && state.turns > 0) {
      data.session = structuredClone(state);
      persist();
    }
  }
  function translate() {
    document.documentElement.lang = settings.language;
    document.documentElement.dir = settings.language === "ar" ? "rtl" : "ltr";
    document.body.dataset.theme = settings.theme;
    document.title = "Onluk — " + t("tagline");
    document.querySelector('meta[name="description"]').content = t("tagline");
    document.querySelector('meta[name="theme-color"]').content =
      settings.theme === "dark" ? "#111114" : "#f5f7fb";
    document
      .querySelectorAll("[data-t]")
      .forEach((n) => (n.textContent = t(n.dataset.t)));
    document.querySelectorAll("[data-label]").forEach((n) => {
      n.setAttribute("aria-label", t(n.dataset.label));
      n.title = t(n.dataset.label);
    });
    $("sound").classList.toggle("muted", settings.muted);
    $("sound").setAttribute("aria-pressed", String(!settings.muted));
    $("theme").setAttribute("aria-pressed", String(settings.theme === "dark"));
    picker.update(settings.language);
    homeInfo();
    if (state && screen === "game") render();
    announce(statusKey);
    if (modalKind) modal(modalKind, false);
  }
  const picker = createLanguagePicker((lang) => {
    settings.language = lang;
    $("language-panel").hidden = true;
    $("language").setAttribute("aria-expanded", "false");
    translate();
    persist();
    $("language").focus();
  });
  function homeInfo() {
    $("journey").textContent = local("Bölümler", "Levels");
    $("new-game").hidden = !data.session;
    $("home-best").textContent = data.best.toLocaleString(settings.language);
    $("play").querySelector("span").textContent = t(
      data.session ? "continue" : "play",
    );
  }
  function show(name) {
    screen = name;
    document.querySelector(".app").dataset.screen = name;
    $("home").hidden = name !== "home";
    $("game").hidden = name !== "game";
    homeInfo();
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function close() {
    modalKind = null;
    if ($("modal").open) $("modal").close();
    $("game").classList.remove("paused");
    previousFocus?.focus?.({ preventScroll: true });
    previousFocus = null;
  }
  function seed() {
    const a = new Uint32Array(1);
    if (globalThis.crypto?.getRandomValues) {
      crypto.getRandomValues(a);
      return a[0];
    }
    return (Date.now() ^ Math.floor(Math.random() * 4294967296)) >>> 0;
  }
  function start(
    isPractice = false,
    resume = false,
    level = data.level,
    roundSeed = null,
  ) {
    input.cancel();
    close();
    TenEffects.reset();
    inputReadyAt = 0;
    practice = isPractice;
    state =
      resume && data.session
        ? structuredClone(data.session)
        : TenEngine.create(roundSeed ?? seed(), level);
    state.rounds ??= 0;
    if (practice) {
      state.training = true;
      state.columns = 3;
      state.rows = 2;
      state.solution = [[25, 26, 27]];
      state.rules = { min: 2, gravity: "down", gold: false };
      state.golden = [];
      state.board.fill(0);
      state.board.splice(25, 3, 2, 3, 5);
      state.turns = 3;
      state.initialCount = 3;
    }
    chain = [];
    hinted = [];
    pending = null;
    input.cancel();
    phase = "playing";
    newBest = false;
    focusIndex = state.board.findIndex(Boolean);
    if (!resume && !practice) data.undo = null;
    show("game");
    announce("select");
    render();
    saveRound();
  }
  function play() {
    if (!settings.learned && !data.session) start(true);
    else start(false, true);
  }
  function leave() {
    saveRound();
    close();
    pending = null;
    input.cancel();
    phase = "idle";
    TenEffects.reset();
    show("home");
  }
  function render(drops = [], fall = {}, slide = {}, spawned = []) {
    inputReadyAt = drops.length || spawned.length ? performance.now() + 480 : 0;
    journeyView.worldInfo(state, practice);
    const columns = state.columns || 5,
      rows = state.rows || 6;
    $("board").style.setProperty("--columns", columns);
    $("board").style.setProperty("--rows", rows);
    document
      .querySelector(".board-shell")
      .style.setProperty("--board-ratio", columns / rows);
    document
      .querySelector(".board-shell")
      .style.setProperty("--columns", columns);
    document.querySelector(".board-shell").style.setProperty("--rows", rows);
    const boardStyle = getComputedStyle($("board"));
    const boardRect = $("board").getBoundingClientRect();
    const strideX =
      (boardRect.width + parseFloat(boardStyle.columnGap)) / columns;
    const strideY = (boardRect.height + parseFloat(boardStyle.rowGap)) / rows;
    TenEffects.setScore($("score"), state.score, settings.language);
    $("combo").textContent = state.combo;
    $("moves").textContent = state.turns;
    $("game-best").textContent = data.best.toLocaleString(settings.language);
    $("mode-label").textContent = practice
      ? t("practice")
      : t("level") + " " + state.level;
    $("practice-note").hidden = !practice;
    $("mission-label").textContent = local("TEMİZLENEN", "CLEARED");
    $("mission-dots").setAttribute("aria-label", t("clearBoard"));
    $("mission-dots").setAttribute(
      "aria-valuenow",
      Math.round((state.cleared / state.initialCount) * 100),
    );
    $("mission-dots").style.setProperty(
      "--progress",
      state.cleared / state.initialCount,
    );
    $("mission-reward").textContent = state.cleared + "/" + state.initialCount;
    document.querySelector(".mission").hidden = practice;
    $("undo").disabled = !data.undo || practice || phase !== "playing";
    const f = document.createDocumentFragment();
    state.board.forEach((n, id) => {
      const button = document.createElement("button");
      button.className =
        "number" +
        (drops.includes(id) ? " dropping" : "") +
        (spawned.includes(id) ? " spawning" : "");
      button.textContent = n || "";
      button.classList.toggle("empty", !n);
      button.classList.toggle("golden", state.golden?.includes(id) || false);
      button.setAttribute("aria-hidden", String(!n));
      button.dataset.id = id;
      button.dataset.value = n;
      const row = Math.floor(id / 5);
      button.hidden =
        id % 5 >= columns ||
        (state.rules.gravity === "up" ? row >= rows : row < 6 - rows);
      button.style.setProperty("--fall", -(fall[id] || 0) * strideY + "px");
      button.style.setProperty("--slide", (slide[id] || 0) * strideX + "px");
      button.style.setProperty("--row", Math.floor(id / 5));
      button.setAttribute(
        "aria-label",
        t("cell", {
          r:
            Math.floor(id / 5) +
            1 -
            (state.rules.gravity === "up" ? 0 : 6 - rows),
          c: (id % 5) + 1,
          n,
        }),
      );
      if (state.golden?.includes(id)) {
        button.setAttribute(
          "aria-label",
          button.getAttribute("aria-label") +
            local(", altın taş, +50 puan", ", golden tile, +50 points"),
        );
      }
      button.tabIndex = id === focusIndex ? 0 : -1;
      button.disabled = !n || phase !== "playing";
      f.append(button);
    });
    $("board").replaceChildren(f);
    updateSelection();
    $("hint").disabled = practice || phase !== "playing";
    $("restart").disabled = phase !== "playing";
    $("score-pop").classList.remove("active");
  }
  function updateSelection() {
    const total = sum();
    $("sum").textContent = chain.length ? total : 10;
    const fragment = document.createDocumentFragment();
    const count = Math.max(
      2,
      chain.length + (ready() || chain.length >= 7 ? 0 : 1),
    );
    for (let i = 0; i < count; i++) {
      if (i) {
        const plus = document.createElement("b");
        plus.className = "expression-plus";
        plus.textContent = "+";
        fragment.append(plus);
      }
      const tile = document.createElement("span");
      tile.className =
        "expression-tile" + (chain[i] === undefined ? " placeholder" : "");
      if (chain[i] !== undefined) {
        tile.textContent = state.board[chain[i]];
        tile.dataset.value = state.board[chain[i]];
      }
      fragment.append(tile);
    }
    $("expression").replaceChildren(fragment);
    $("expression").dataset.length = count > 5 ? "long" : "short";
    const dock = document.querySelector(".expression-panel");
    dock.classList.toggle("ready", ready());
    dock.classList.toggle("over", false);
    const routeTotals = new Map();
    let routeTotal = 0;
    chain.forEach((id) => {
      routeTotal += state.board[id];
      routeTotals.set(id, routeTotal);
    });
    $("board")
      .querySelectorAll(".number")
      .forEach((b, id) => {
        const at = chain.indexOf(id);
        b.classList.toggle("selected", at >= 0);
        b.classList.toggle("last", id === chain.at(-1));
        b.classList.toggle("hinted", hinted.includes(id));
        b.dataset.routeTotal = routeTotals.get(id) || "";
        b.setAttribute("aria-pressed", String(at >= 0));
        b.tabIndex = state.board[id] && id === focusIndex ? 0 : -1;
      });
    const rect = $("board").getBoundingClientRect();
    $("chain-lines").setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);
    const points = chain.map((id) => {
      const r = $("board").children[id].getBoundingClientRect();
      return {
        x: r.left + r.width / 2 - rect.left,
        y: r.top + r.height / 2 - rect.top,
        halfWidth: r.width / 2,
        halfHeight: r.height / 2,
      };
    });
    const connectors = $("route-connectors"),
      svg = "http://www.w3.org/2000/svg";
    connectors.replaceChildren();
    points.slice(1).forEach((point, index) => {
      const previous = points[index],
        horizontal = Math.abs(point.x - previous.x) > Math.abs(point.y - previous.y),
        direction = horizontal
          ? Math.sign(point.x - previous.x)
          : Math.sign(point.y - previous.y),
        start = {
          x: previous.x + (horizontal ? direction * (previous.halfWidth - 3) : 0),
          y: previous.y + (horizontal ? 0 : direction * (previous.halfHeight - 3)),
        },
        end = {
          x: point.x - (horizontal ? direction * (point.halfWidth - 3) : 0),
          y: point.y - (horizontal ? 0 : direction * (point.halfHeight - 3)),
        },
        middle = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
        unit = { x: horizontal ? direction : 0, y: horizontal ? 0 : direction },
        perpendicular = { x: -unit.y, y: unit.x };
      for (const className of ["route-link-border", "route-link"]) {
        const line = document.createElementNS(svg, "line");
        line.setAttribute("x1", start.x);
        line.setAttribute("y1", start.y);
        line.setAttribute("x2", end.x);
        line.setAttribute("y2", end.y);
        line.setAttribute("class", className);
        connectors.append(line);
      }
      const arrow = document.createElementNS(svg, "path"),
        tailX = middle.x - unit.x * 6,
        tailY = middle.y - unit.y * 6,
        tipX = middle.x + unit.x * 7,
        tipY = middle.y + unit.y * 7;
      arrow.setAttribute(
        "d",
        `M ${tailX + perpendicular.x * 5} ${tailY + perpendicular.y * 5} L ${tipX} ${tipY} L ${tailX - perpendicular.x * 5} ${tailY - perpendicular.y * 5} Z`,
      );
      arrow.setAttribute("class", "route-chevron");
      connectors.append(arrow);
    });
    $("chain-lines").classList.toggle("complete", ready());
    $("guide-hand").hidden =
      !practice || phase !== "playing" || chain.length >= 3;
    if (practice) {
      const next = 25 + Math.min(chain.length, 2),
        cell = $("board").children[next].getBoundingClientRect();
      const shell = document
        .querySelector(".board-shell")
        .getBoundingClientRect();
      $("guide-hand").style.left =
        cell.left + cell.width / 2 - shell.left + "px";
      $("guide-hand").style.top = cell.top + cell.height / 2 - shell.top + "px";
    }
  }
  function select(id, dragging = false) {
    if (phase !== "playing" || !state.board[id] || $("modal").open) return;
    if (
      practice &&
      (id < 25 || id > 27 || (!chain.includes(id) && id !== 25 + chain.length))
    )
      return;
    const next = TenSelection.extend(chain, id, state.board, state.rules.min);
    if (next === chain) return;
    chain = next;
    focusIndex = id;
    hinted = [];
    audio.play("step", chain.length);
    updateSelection();
    announce(ready() ? "ready" : "select");
  }
  function clear() {
    if (phase !== "playing") return;
    chain = [];
    hinted = [];
    updateSelection();
    announce("select");
  }
  function burst(ids) {
    const cells = ids.map((id) =>
      $("board").children[id].getBoundingClientRect(),
    );
    TenEffects.burst(cells, $("score").getBoundingClientRect(), state.combo);
  }
  function collect() {
    if (phase !== "playing" || !ready()) return;
    $("guide-hand").hidden = true;
    const selected = [...chain];
    const result = TenEngine.commitPlayable(state, selected);
    if (!result) return;
    if (!practice) data.undo = result.before;
    burst(selected);
    phase = "resolving";
    $("route-connectors").replaceChildren();
    pending = result;
    animationMs = 0;
    input.cancel();
    selected.forEach((id) => $("board").children[id].classList.add("popping"));
    $("board")
      .querySelectorAll("button")
      .forEach((b) => (b.disabled = true));

    $("hint").disabled = true;
    $("restart").disabled = true;
    audio.play(state.combo >= 3 ? "bonus" : "pair", state.combo);
    if (!practice && state.turns === 0) {
      newBest = state.score > data.best;
      data.best = Math.max(data.best, state.score);
      data.games++;
      data.stars[state.level] = Math.max(
        data.stars[state.level] || 0,
        TenJourney.stars(state),
      );
      data.level = Math.max(
        data.level,
        Math.min(TenJourney.TOTAL_LEVELS, state.level + 1),
      );
      data.undo = null;
      data.session = null;
      persist();
    } else saveRound();
  }
  function settle() {
    if (!pending) return;
    const result = pending;
    pending = null;
    chain = [];
    hinted = [];
    phase = "playing";
    focusIndex = state.board.findIndex(Boolean);
    render(result.drops, result.fall, result.slide, result.spawned);
    $("score-pop").textContent = "+" + result.points;
    TenEffects.score(
      $("score"),
      result.before.score,
      state.score,
      settings.language,
    );
    TenEffects.bump($("combo"), state.combo > 1 ? 1.32 : 1.1);
    // Restart the reward even when the previous CSS animation is still running.
    void $("score-pop").offsetWidth;
    $("score-pop").classList.add("active");
    announce("select");
    if (practice) {
      settings.learned = true;
      persist();
      phase = "finished";
      modal("practiceDone");
    } else if (!state.turns) {
      phase = "finished";
      audio.play("win");
      TenEffects.celebrate();
      modal("result");
    } else $("board").children[focusIndex]?.focus({ preventScroll: true });
  }
  function pause(kind = "pause") {
    if (phase === "resolving") return;
    input.cancel();
    if (screen === "game" && phase === "playing") {
      phase = "paused";
      saveRound();
      $("game").classList.add("paused");
    }
    modal(kind);
  }
  function resume() {
    close();
    if (screen === "game" && phase === "paused") {
      phase = "playing";
      render();
    }
  }
  function addButton(key, fn, primary = false) {
    const b = document.createElement("button");
    b.className = primary ? "primary" : "secondary";
    b.textContent = t(key);
    b.onclick = fn;
    $("modal-actions").append(b);
    return b;
  }
  function paragraph(key) {
    const p = document.createElement("p");
    p.textContent = t(key);
    $("modal-copy").append(p);
  }
  function modal(kind, open = true) {
    if (open) previousFocus = document.activeElement;
    modalKind = kind;
    $("modal-copy").replaceChildren();
    $("modal-actions").replaceChildren();
    $("modal-kicker").textContent =
      kind === "result" && newBest ? t("newBest") : "ONLUK";
    $("modal-title").textContent = t(
      {
        help: "help",
        pause: "paused",
        restart: "restart",
        result: "levelDone",
        practiceDone: "practiceDone",
      }[kind],
    );
    if (kind === "journey") journeyView.journeyMap();
    if (kind === "help") {
      const demo = document.createElement("div");
      demo.className = "help-demo";
      demo.innerHTML = "2 + 3 + 5 = <b>10</b>";
      $("modal-copy").append(demo);
      ["help1", "help2", "help3", "keyboard"].forEach(paragraph);
      addButton(
        "try",
        () => {
          saveRound();
          start(true);
        },
        true,
      );
      addButton("close", resume);
    }
    if (kind === "pause") {
      addButton("continue", resume, true);
      addButton("home", leave);
    }
    if (kind === "restart") {
      paragraph("restartCopy");
      addButton(
        "restart",
        () => start(false, false, state?.level || data.level, state?.seed),
        true,
      );
      addButton("cancel", resume);
    }
    if (kind === "practiceDone") {
      const demo = document.createElement("div");
      demo.className = "help-demo";
      demo.innerHTML = "<b>2</b> + <b>3</b> + <b>5</b> = <strong>10</strong>";
      $("modal-copy").append(demo);
      addButton("play", () => start(false, true), true);
      addButton("home", leave);
    }
    if (kind === "result") {
      const stars = document.createElement("div");
      stars.className = "result-stars";
      const earned = TenJourney.stars(state);
      stars.textContent = "★".repeat(earned) + "☆".repeat(3 - earned);
      stars.setAttribute("aria-label", `${earned}/3 ★`);
      $("modal-copy").append(stars);
      const score = document.createElement("div");
      score.className = "result-score";
      score.textContent = state.score.toLocaleString(settings.language);
      $("modal-copy").append(score);
      for (const [key, value] of [
        ["best", data.best],
        ["longest", state.longest],
      ]) {
        const row = document.createElement("div");
        row.className = "result-line";
        const label = document.createElement("span"),
          number = document.createElement("b");
        label.textContent = t(key);
        number.textContent = value;
        row.append(label, number);
        $("modal-copy").append(row);
      }
      if (state.level % 10 === 0 && state.level < TenJourney.TOTAL_LEVELS) {
        const unlock = document.createElement("p");
        unlock.textContent =
          local("Yeni kural: ", "New rule: ") +
          TenJourney.text(
            TenJourney.chapter(state.level + 1),
            settings.language,
          );
        $("modal-copy").append(unlock);
      }
      if (state.level < TenJourney.TOTAL_LEVELS)
        addButton(
          "nextLevel",
          () => start(false, false, state.level + 1),
          true,
        );
      else addButton("restart", () => start(false, false, state.level), true);
      addButton("home", leave);
    }
    if (open && !$("modal").open) $("modal").showModal();
  }
  function undo() {
    if (!data.undo || practice || phase === "resolving") return;
    close();
    const hints = state.hints;
    const undos = (state.undos || 0) + 1;
    state = structuredClone(data.undo);
    state.hints = Math.max(state.hints, hints);
    state.undos = undos;
    data.undo = null;
    pending = null;
    chain = [];
    hinted = [];
    phase = "playing";
    focusIndex = state.board.findIndex(Boolean);
    render();
    saveRound();
  }
  $("journey").onclick = () => modal("journey");
  $("undo").onclick = undo;
  $("play").onclick = play;
  $("new-game").onclick = () => start(false, false, 1);
  $("learn").onclick = () => start(true);
  $("home-button").onclick = leave;

  $("help").onclick = () => {
    if (phase !== "resolving") pause("help");
  };
  $("pause").onclick = () => pause();
  $("restart").onclick = () => pause("restart");

  $("hint").onclick = () => {
    if (phase !== "playing" || practice) return;
    chain = [];
    hinted =
      state.solution?.[0] ||
      TenEngine.findChain(state.board, state.rules?.min || 2) ||
      [];
    state.hints++;
    journeyView.worldInfo(state, practice);
    updateSelection();
    audio.play("tap");
    saveRound();
  };
  $("theme").onclick = () => {
    settings.theme = settings.theme === "dark" ? "light" : "dark";
    translate();
    persist();
  };
  $("sound").onclick = () => {
    settings.muted = !settings.muted;
    audio.mute();
    translate();
    persist();
  };
  $("modal").addEventListener("cancel", (e) => {
    e.preventDefault();
    if (["result", "practiceDone"].includes(modalKind)) leave();
    else resume();
  });
  document.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button:not(.number)")) audio.play("tap");
  });
  const input = createBoardInput({
    board: $("board"),
    enabled: () =>
      screen === "game" &&
      phase === "playing" &&
      performance.now() >= inputReadyAt &&
      !$("modal").open,
    begin(id) {
      chain = [];
      hinted = [];
      select(id, true);
    },
    visit(id) {
      select(id, true);
    },
    finish() {
      if (ready()) collect();
      else clear();
    },
    cancel() {
      if (state && phase === "playing") clear();
    },
    tap(id) {
      select(id);
      if (ready()) collect();
    },
  });
  $("board").addEventListener("keydown", (e) => {
    if (phase !== "playing") return;
    const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -5, ArrowDown: 5 }[
      e.key
    ];
    if (delta) {
      e.preventDefault();
      let next = focusIndex + delta;
      while (
        next >= 0 &&
        next < 30 &&
        (Math.abs(delta) === 5 ||
          Math.floor(next / 5) === Math.floor(focusIndex / 5))
      ) {
        if (state.board[next]) {
          focusIndex = next;
          updateSelection();
          $("board").children[next].focus();
          break;
        }
        next += delta;
      }
    }
  });
  document.addEventListener("keydown", (e) => {
    if (
      screen !== "game" ||
      phase !== "playing" ||
      $("modal").open ||
      !$("language-panel").hidden ||
      e.ctrlKey ||
      e.metaKey ||
      e.altKey
    )
      return;
    if (e.key.toLowerCase() === "c") {
      e.preventDefault();
      collect();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      if (chain.length) clear();
      else pause();
    }
  });
  window.addEventListener("resize", () => {
    if (state && screen === "game") updateSelection();
  });
  document.addEventListener("visibilitychange", () => {
    input.cancel();
    if (document.hidden && phase === "playing" && screen === "game") pause();
    lastFrame = performance.now();
  });
  window.addEventListener("pagehide", saveRound);
  function frame(now) {
    const dt = now - lastFrame;
    lastFrame = now;
    if (phase === "resolving" && !document.hidden) {
      animationMs += dt;
      if (animationMs > 220) settle();
    }
    requestAnimationFrame(frame);
  }
  translate();
  requestAnimationFrame(frame);
})();
