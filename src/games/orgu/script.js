"use strict";
(() => {
  const $ = (id) => document.getElementById(id);
  const { data, save } = WeaveStorage;
  const settings = data.settings;
  const audio = createDotAudio(settings);
  const text = (key, params = {}) =>
    Object.entries(params).reduce(
      (value, [name, replacement]) =>
        value.replaceAll(`{${name}}`, String(replacement)),
      WeaveText[settings.language][key] ?? key,
    );
  const formatTime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  };
  let screen = "home",
    mode = "series",
    phase = "idle",
    puzzle = null;
  let placed = {},
    selected = null,
    history = [],
    elapsed = 0,
    moves = 0,
    hints = 0;
  let mapPage = Math.floor((data.next - 1) / 10),
    typed = "",
    modalKind = null,
    previousFocus = null;
  let celebration = 0,
    lastFrame = performance.now(),
    lastSaved = 0,
    statusKey = "select",
    statusParams = {};
  let litEquations = new Set();
  let trainingStage = 0;

  function persist() {
    if (!save()) setStatus("savingUnavailable");
  }
  function saveSession() {
    if (
      !puzzle ||
      mode === "tutorial" ||
      !["playing", "paused"].includes(phase)
    )
      return;
    data.session = {
      version: WeaveEngine.VERSION,
      layoutVersion: puzzle.layoutVersion ?? 1,
      mode,
      seed: puzzle.seed,
      level: puzzle.level,
      placed: { ...placed },
      elapsed,
      moves,
      hints,
      selected,
      history: history.slice(-100),
    };
    persist();
  }
  function setStatus(key, params = {}) {
    statusKey = key;
    statusParams = params;
    $("status").textContent = text(key, params);
    $("status").dataset.kind = key;
  }

  function sizeBoard(host, model) {
    const points = Object.values(model.coordinates);
    const cols = Math.max(...points.map((p) => p[0])) / 2;
    const rows = Math.max(...points.map((p) => p[1])) / 2;
    const tracks = (n) =>
      "repeat(" + n + ", minmax(0,1fr) minmax(0,.46fr)) minmax(0,1fr)";
    host.style.gridTemplateColumns = tracks(cols);
    host.style.gridTemplateRows = tracks(rows);
    host.style.setProperty(
      "--board-shape",
      (cols * 1.46 + 1) / (rows * 1.46 + 1),
    );
    host.style.aspectRatio = cols * 1.46 + 1 + " / " + (rows * 1.46 + 1);
  }
  const operatorKind = (op) =>
    ({
      "+": "plus",
      "−": "minus",
      "×": "multiply",
      "÷": "divide",
      "=": "equals",
    })[op] || "equals";
  function renderHomeWeave() {
    // A balanced emblem, independent of the shape of the next playable board.
    const preview = {
      coordinates: { a: [0, 2], b: [2, 2], c: [4, 2], d: [2, 0], e: [2, 4] },
      solution: { a: 6, b: 4, c: 10, d: 3, e: 7 },
      hidden: ["b", "e"],
      equations: [
        { ids: ["a", "b", "c"], op: "+" },
        { ids: ["d", "b", "e"], op: "+" },
      ],
    };
    const host = $("home-weave");
    sizeBoard(host, preview);
    const fragment = document.createDocumentFragment();
    for (const [id, [x, y]] of Object.entries(preview.coordinates)) {
      const tile = document.createElement("span");
      const blank = preview.hidden.includes(id);
      tile.className = "tile " + (blank ? "preview-answer" : "fixed");
      tile.textContent = preview.solution[id];
      tile.style.setProperty("--x", x + 1);
      tile.style.setProperty("--y", y + 1);
      fragment.append(tile);
    }
    for (const e of preview.equations) {
      for (let i = 0; i < 2; i++) {
        const from = preview.coordinates[e.ids[i]],
          to = preview.coordinates[e.ids[i + 1]];
        const symbol = document.createElement("span");
        symbol.className = "symbol";
        symbol.textContent = i ? "=" : e.op;
        symbol.dataset.op = operatorKind(i ? "=" : e.op);
        symbol.style.setProperty("--x", (from[0] + to[0]) / 2 + 1);
        symbol.style.setProperty("--y", (from[1] + to[1]) / 2 + 1);
        fragment.append(symbol);
      }
    }
    host.replaceChildren(fragment);
  }

  function updateHome() {
    renderHomeWeave();
    $("home-level").textContent = text("chapter", { n: data.next });
    $("home-progress").textContent = text("progress", {
      n: Object.keys(data.records).length,
    });
  }
  const topbar = document.querySelector(".topbar");
  const settingsBar = document.querySelector(".top-actions");
  const heading = document.querySelector(".level-heading");
  topbar.insertBefore(heading, settingsBar);
  topbar.append($("pause"));
  const settingsButton = document.createElement("button");
  settingsButton.id = "settings-button";
  settingsButton.className = "icon-button";
  settingsButton.dataset.label = "settings";
  settingsButton.innerHTML =
    '<svg aria-hidden="true"><use href="#i-settings"/></svg>';
  settingsButton.addEventListener("click", () => renderModal("settings"));
  topbar.append(settingsButton);
  document
    .querySelector(".board-panel")
    .append(document.querySelector(".equation-panel"));
  const playMetrics = document.createElement("div");
  playMetrics.className = "play-metrics";
  const progressLabel = document.createElement("span");
  progressLabel.id = "progress-label";
  const clockLabel = document.createElement("span");
  clockLabel.className = "play-clock";
  const clockTitle = document.createElement("span");
  clockTitle.dataset.t = "time";
  clockLabel.append(clockTitle, $("timer"));
  playMetrics.append(progressLabel, clockLabel);
  document.querySelector(".board-panel").prepend(playMetrics);
  const progressTrack = document.querySelector(".board-progress");
  progressTrack.removeAttribute("aria-hidden");
  progressTrack.setAttribute("role", "progressbar");
  progressTrack.setAttribute("aria-valuemin", "0");
  progressTrack.setAttribute("aria-valuemax", "100");
  function syncChrome(inModal = false) {
    document.body.dataset.screen = screen;
    heading.hidden = screen !== "game";
    $("pause").hidden = screen !== "game";
    settingsBar.hidden = !inModal;
    settingsButton.hidden = screen === "game";
    const host = inModal ? document.querySelector(".modal-inner") : topbar;
    if (settingsBar.parentElement !== host) {
      if (inModal) host.insertBefore(settingsBar, $("modal-content"));
      else host.append(settingsBar);
    }
    const panelHost = inModal ? $("modal") : document.body;
    if ($("language-panel").parentElement !== panelHost) {
      $("language-panel").hidden = true;
      $("language").setAttribute("aria-expanded", "false");
      panelHost.append($("language-panel"));
    }
    $("timer").hidden = screen !== "game";
  }
  function showScreen(name) {
    screen = name;
    syncChrome();
    updateHome();
    for (const id of ["home", "map", "game"]) $(id).hidden = id !== name;
    $("play").querySelector("span").textContent = text(
      data.session ? "continue" : "play",
    );
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function translate() {
    document.documentElement.lang = settings.language;
    document.documentElement.dir = settings.language === "ar" ? "rtl" : "ltr";
    document.body.dataset.theme = settings.theme;
    document.title = `Örgü — ${text("board")}`;
    document.querySelector('meta[name="description"]').content = text("intro");
    document.querySelector('meta[name="theme-color"]').content =
      settings.theme === "dark" ? "#000000" : "#f5f0eb";
    document
      .querySelectorAll("[data-t]")
      .forEach((node) => (node.textContent = text(node.dataset.t)));
    document
      .querySelectorAll("[data-html]")
      .forEach((node) => (node.innerHTML = text(node.dataset.html)));
    document.querySelectorAll("[data-label]").forEach((node) => {
      node.setAttribute("aria-label", text(node.dataset.label));
      node.title = text(node.dataset.label);
    });
    $("sound").setAttribute("aria-pressed", String(!settings.muted));
    $("sound")
      .querySelector("use")
      .setAttribute("href", settings.muted ? "#i-muted" : "#i-sound");
    $("theme").setAttribute("aria-pressed", String(settings.theme === "dark"));
    $("board").setAttribute("aria-label", text("board"));
    picker.update(settings.language);
    updateHome();
    $("play").querySelector("span").textContent = text(
      data.session ? "continue" : "play",
    );
    if (screen === "map") renderMap();
    if (puzzle && screen === "game") render();
    setStatus(statusKey, statusParams);
    if (modalKind) renderModal(modalKind, false);
  }
  const picker = createLanguagePicker((language) => {
    settings.language = language;
    $("language-panel").hidden = true;
    $("language").setAttribute("aria-expanded", "false");
    translate();
    persist();
    $("language").focus();
  });

  function start(
    level,
    seed = data.seed,
    nextMode = "series",
    restored = null,
  ) {
    closeModal();
    mode = nextMode;
    puzzle =
      mode === "tutorial"
        ? WeaveEngine.tutorial()
        : WeaveEngine.generate(
            seed,
            level,
            restored ? (restored.layoutVersion ?? 1) : 3,
          );
    litEquations = new Set();
    trainingStage = 0;
    progressLabel.dataset.score = "0";
    placed = {};
    history = [];
    elapsed = 0;
    moves = 0;
    hints = 0;
    if (restored && WeaveEngine.validPlacement(puzzle, restored.placed)) {
      placed = { ...restored.placed };
      for (const key of ["elapsed", "moves", "hints"]) {
        const value = restored[key];
        if (!Number.isFinite(value) || value < 0 || value > 1e10) continue;
        if (key === "elapsed") elapsed = value;
        else if (key === "moves") moves = Math.floor(value);
        else hints = Math.floor(value);
      }
      if (Array.isArray(restored.history))
        history = restored.history
          .slice(-100)
          .filter((entry) => WeaveEngine.validPlacement(puzzle, entry))
          .map((entry) => ({ ...entry }));
    }
    const unfilled = new Set(puzzle.hidden.filter((id) => placed[id] == null));
    const firstDeduction = WeaveEngine.deduce(puzzle, unfilled)?.[0]?.id;
    selected =
      firstDeduction ??
      puzzle.hidden.find((id) => placed[id] == null) ??
      puzzle.hidden[0];
    phase = "playing";
    celebration = 0;
    typed = "";
    $("game").classList.remove("paused");
    showScreen("game");
    setStatus("select");
    render();
    saveSession();
    if (WeaveEngine.status(puzzle, placed).every((state) => state === "valid"))
      win();
  }
  function continueGame() {
    const session = data.session;
    if (
      session?.version === WeaveEngine.VERSION &&
      session.mode === "series" &&
      Number.isSafeInteger(session.level) &&
      session.level > 0 &&
      session.level < Number.MAX_SAFE_INTEGER &&
      typeof session.seed === "string" &&
      session.seed.length > 0 &&
      session.seed.length <= 32 &&
      (session.mode !== "series" ||
        (session.level <= data.next && session.seed === data.seed))
    ) {
      start(session.level, session.seed, session.mode, session);
    } else start(data.next);
  }
  function leave(destination) {
    saveSession();
    closeModal();
    phase = "idle";
    showScreen(destination);
    if (destination === "map") {
      mapPage = Math.floor((data.next - 1) / 10);
      renderMap();
    }
  }
  function renderMap() {
    const first = mapPage * 10 + 1;
    $("map-range").textContent = `${first} — ${first + 9}`;
    $("map-prev").disabled = mapPage === 0;
    $("map-next").disabled = first + 10 > data.next + 10;
    const fragment = document.createDocumentFragment();
    for (let level = first; level < first + 10; level++) {
      const record = data.records[level],
        locked = level > data.next;
      const button = document.createElement("button");
      button.className = `level-node${level === data.next ? " current" : ""}${record ? " completed" : ""}`;
      button.disabled = locked;
      if (level === data.next) button.setAttribute("aria-current", "step");
      const label = locked ? "locked" : record ? "completed" : "ready";
      button.setAttribute(
        "aria-label",
        `${text("chapter", { n: level })} · ${text(label)}`,
      );
      const badge = record
        ? "★".repeat(record.stars) + "☆".repeat(3 - record.stars)
        : '<svg><use href="#' + (locked ? "i-lock" : "i-arrow") + '"/></svg>';
      button.innerHTML = `<span class="node-circle">${String(level).padStart(2, "0")}</span><span class="node-stars" aria-hidden="true">${badge}</span><span class="node-label"></span>`;
      button.querySelector(".node-label").textContent = text(label);
      button.addEventListener("click", () => start(level));
      fragment.append(button);
    }
    $("level-map").replaceChildren(fragment);
  }

  function render(justPlaced = null) {
    sizeBoard($("board"), puzzle);
    const current = WeaveEngine.values(puzzle, placed);
    const states = WeaveEngine.status(puzzle, placed);
    const validEquations = puzzle.equations.filter(
      (e) => states[e.id] === "valid",
    );
    const validCells = new Set(validEquations.flatMap((e) => e.ids));
    const newlyValid = new Set(
      validEquations
        .filter((e) => !litEquations.has(e.id))
        .flatMap((e) => e.ids),
    );
    litEquations = new Set(validEquations.map((e) => e.id));
    $("board-progress-fill").style.width =
      `${(validEquations.length / states.length) * 100}%`;
    const completion = Math.round(
      (validEquations.length / states.length) * 100,
    );
    const score = validEquations.length * 100;
    const increased = score > Number(progressLabel.dataset.score || 0);
    progressLabel.dataset.score = score;
    progressLabel.textContent = text("scoreValue", { n: score });
    progressLabel.classList.toggle("score-pop", increased);
    progressTrack.setAttribute(
      "aria-label",
      text("scoreTarget", { n: score, total: states.length * 100 }),
    );
    progressTrack.setAttribute("aria-valuenow", String(completion));
    const linked = puzzle.equations.filter((e) => e.ids.includes(selected));
    const related = new Set(linked.flatMap((e) => e.ids));
    const invalid = new Set(
      puzzle.equations
        .filter((e) => states[e.id] === "invalid")
        .flatMap((e) => e.ids),
    );
    $("game-mode").textContent = text(
      mode === "tutorial" ? "practice" : "series",
    );
    $("level-title").textContent =
      mode === "tutorial"
        ? text("learn")
        : text("chapter", { n: puzzle.level });
    $("difficulty").textContent = text(["easy", "medium", "hard"][puzzle.tier]);
    $("equation-count").textContent = text("equations", {
      n: states.filter((s) => s === "valid").length,
      total: states.length,
    });
    $("timer").textContent = formatTime(elapsed);
    $("placed-count").textContent =
      `${Object.keys(placed).length} / ${puzzle.hidden.length}`;
    $("board").className =
      `board${mode === "tutorial" ? " tutorial-board" : ""}${phase === "celebrating" || phase === "finished" ? " won" : ""}`;
    const fragment = document.createDocumentFragment();
    for (const [id, [x, y]] of Object.entries(puzzle.coordinates)) {
      const editable = puzzle.hidden.includes(id),
        value = current[id];
      const node = document.createElement(editable ? "button" : "span");
      node.className = `tile ${editable ? (value == null ? "empty" : "editable") : "fixed"}${related.has(id) ? " related" : ""}${editable && invalid.has(id) ? " conflict" : ""}${selected === id ? " selected" : ""}${justPlaced === id ? " just-placed" : ""}`;
      for (const eq of linked.filter((e) => e.ids.includes(id))) {
        const start = puzzle.coordinates[eq.ids[0]],
          end = puzzle.coordinates[eq.ids[2]];
        node.classList.add(
          start[0] === end[0] ? "linked-vertical" : "linked-horizontal",
        );
      }
      if (justPlaced === id && !invalid.has(id)) {
        node.classList.add("placement-burst");
      }
      if (linked.length > 1 && id === selected) node.classList.add("junction");

      node.style.setProperty("--x", x + 1);
      node.style.setProperty("--y", y + 1);
      node.textContent = value ?? "";
      node.setAttribute(
        "aria-label",
        text("cell", { r: y + 1, c: x + 1, v: value ?? text("empty") }),
      );
      if (editable) {
        node.dataset.cell = id;
        node.setAttribute("aria-pressed", String(id === selected));
        node.disabled = phase !== "playing";
        node.addEventListener("click", () => {
          selected = id;
          typed = "";
          audio.play("tap");
          render();
          focusCell();
        });
      }
      fragment.append(node);
    }
    for (const equation of puzzle.equations) {
      const startPoint = puzzle.coordinates[equation.ids[0]],
        middlePoint = puzzle.coordinates[equation.ids[1]],
        endPoint = puzzle.coordinates[equation.ids[2]];
      const vertical = startPoint[0] === endPoint[0];
      const line = document.createElement("span");
      line.className = `equation-path ${vertical ? "vertical" : "horizontal"} ${states[equation.id]}${linked.includes(equation) ? " linked" : ""}${phase === "celebrating" || phase === "finished" ? " complete" : ""}`;
      line.setAttribute("aria-hidden", "true");
      line.style.gridColumn = `${startPoint[0] + 1} / ${endPoint[0] + 2}`;
      line.style.gridRow = `${startPoint[1] + 1} / ${endPoint[1] + 2}`;
      line.style.setProperty("--order", equation.id);
      fragment.append(line);
      for (const [value, from, to] of [
        [equation.op, startPoint, middlePoint],
        ["=", middlePoint, endPoint],
      ]) {
        const symbol = document.createElement("span");
        symbol.className = `symbol ${states[equation.id]}${linked.includes(equation) ? " linked" : ""}`;
        symbol.style.setProperty("--x", (from[0] + to[0]) / 2 + 1);
        symbol.style.setProperty("--y", (from[1] + to[1]) / 2 + 1);
        symbol.textContent = value;
        symbol.dataset.op = operatorKind(value);
        if (linked.includes(equation))
          symbol.classList.add(
            vertical ? "linked-vertical" : "linked-horizontal",
          );
        if (
          justPlaced &&
          value === "=" &&
          states[equation.id] === "valid" &&
          equation.ids.includes(justPlaced)
        )
          symbol.classList.add("just-solved");
        symbol.setAttribute("aria-hidden", "true");
        fragment.append(symbol);
      }
    }
    $("board").replaceChildren(fragment);
    $("play-guidance").textContent =
      selected && placed[selected] != null
        ? text("editGuidance")
        : text("placeGuidance");
    const trayFragment = document.createDocumentFragment();
    WeaveEngine.remaining(puzzle, placed).forEach((value, index) => {
      const button = document.createElement("button");
      button.className = "tile accent";
      if (value != null) button.dataset.value = value;
      button.textContent = value == null ? "·" : puzzle.tray[index];
      button.classList.toggle("used", value == null);
      button.setAttribute(
        "aria-label",
        value == null ? text("usedTile") : String(value),
      );
      button.disabled = value == null || phase !== "playing";
      button.addEventListener("click", () => place(value));
      trayFragment.append(button);
    });
    $("tray").replaceChildren(trayFragment);
    $("undo").disabled = !history.length || phase !== "playing";
    $("erase").disabled = placed[selected] == null || phase !== "playing";
    $("hint").disabled = phase !== "playing" || mode === "tutorial";
    $("restart").disabled = phase !== "playing";
    const equationsFragment = document.createDocumentFragment();
    for (const equation of linked) {
      const row = document.createElement("div");
      const vertical =
        puzzle.coordinates[equation.ids[0]][0] ===
        puzzle.coordinates[equation.ids[2]][0];
      row.className = `equation-row ${states[equation.id]} ${vertical ? "vertical" : "horizontal"}`;
      row.setAttribute(
        "aria-label",
        text(vertical ? "verticalEquation" : "horizontalEquation"),
      );
      const expression = document.createElement("span"),
        mark = document.createElement("span");
      const [a, b, c] = equation.ids.map((id) => current[id] ?? "?");
      expression.textContent = `${a} ${equation.op} ${b} = ${c}`;
      mark.className = "equation-status";
      mark.textContent =
        states[equation.id] === "valid"
          ? "✓"
          : states[equation.id] === "invalid"
            ? "!"
            : "";
      mark.setAttribute("aria-hidden", "true");
      const direction = document.createElement("span");
      direction.className = "equation-direction";
      direction.textContent = vertical ? "↓" : "→";
      direction.setAttribute("aria-hidden", "true");
      row.append(direction, expression, mark);
      equationsFragment.append(row);
    }
    $("equation-list").replaceChildren(equationsFragment);
    updateCoach();
    $("tutorial-note").hidden = mode !== "tutorial";
    if (mode === "tutorial") {
      $("tutorial-title").textContent = text("practiceTitle", {
        n: Math.min(trainingStage + 1, 6),
      });
      $("tutorial-copy").textContent = text(`practice${trainingStage}`);
      document.querySelector(".tutorial-number").textContent =
        `${Math.min(trainingStage + 1, 6)}/6`;
    }
  }
  function updateCoach() {
    document.querySelectorAll(".coach-hand").forEach((node) => node.remove());
    document
      .querySelectorAll(".coach-target")
      .forEach((node) => node.classList.remove("coach-target"));
    if (mode !== "tutorial" || screen !== "game" || phase !== "playing") return;
    let target;
    if (trainingStage === 1) target = $("undo");
    else if (trainingStage === 3) target = $("erase");
    else {
      const desiredCell = trainingStage === 5 ? "d" : "b";
      const desiredValue = trainingStage === 0 || trainingStage === 5 ? 3 : 4;
      target =
        selected !== desiredCell
          ? $("board").querySelector(`[data-cell="${desiredCell}"]`)
          : $("tray").querySelector(`[data-value="${desiredValue}"]`);
    }
    if (!target) return;
    target.classList.add("coach-target");
    const hand = document.createElement("span");
    hand.className = "coach-hand";
    hand.textContent = "👆";
    hand.setAttribute("aria-hidden", "true");
    target.append(hand);
  }
  function focusCell() {
    $("board")
      .querySelector(`[data-cell="${selected}"]`)
      ?.focus({ preventScroll: true });
  }
  function remember() {
    history.push({ ...placed });
    if (history.length > 100) history.shift();
  }
  function place(value) {
    if (phase !== "playing" || !selected) return;
    if (mode === "tutorial") {
      const expected = [
        { id: "b", value: 3 },
        null,
        { id: "b", value: 4 },
        null,
        { id: "b", value: 4 },
        { id: "d", value: 3 },
      ][trainingStage];
      if (!expected || selected !== expected.id || value !== expected.value) {
        setStatus("followPractice");
        return;
      }
    }
    if (!WeaveEngine.remaining(puzzle, placed).includes(value)) {
      setStatus("unavailable");
      return;
    }
    remember();
    placed[selected] = value;
    moves++;
    typed = "";
    const changed = selected;
    const states = WeaveEngine.status(puzzle, placed);
    const bad = states.includes("invalid");
    const completedNow =
      states.filter((s) => s === "valid").length > litEquations.size;
    audio.play(bad ? "error" : completedNow ? "pair" : "place");
    setStatus(bad ? "mismatch" : "placed");
    if (mode === "tutorial") {
      trainingStage++;
      selected = trainingStage === 5 ? "d" : "b";
    }
    render(changed);
    focusCell();
    saveSession();
    if (states.every((state) => state === "valid")) win();
  }
  function undo() {
    if (phase !== "playing" || !history.length) return;
    if (mode === "tutorial" && trainingStage !== 1) {
      setStatus("followPractice");
      return;
    }
    const previousPlaced = { ...placed };
    placed = history.pop();
    if (mode === "tutorial") {
      trainingStage = 2;
      selected = "b";
    }
    typed = "";
    audio.play("back");
    setStatus("select");
    render();
    for (const [id, value] of Object.entries(previousPlaced)) {
      if (placed[id] == null) animateRemoval(id, value);
    }
    saveSession();
  }
  function animateRemoval(id, value) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cell = $("board").querySelector(`[data-cell="${id}"]`);
    if (!cell) return;
    const ghost = document.createElement("span");
    ghost.className = "number-ghost";
    ghost.textContent = value;
    ghost.setAttribute("aria-hidden", "true");
    cell.append(ghost);
    const motion = ghost.animate(
      [
        { opacity: 1, transform: "translateY(0) scale(1)" },
        {
          opacity: 0,
          transform: "translateY(-20px) rotate(-10deg) scale(.65)",
        },
      ],
      { duration: 260, easing: "ease-out" },
    );
    motion.onfinish = () => ghost.remove();
  }
  function erase() {
    if (phase !== "playing" || placed[selected] == null) return;
    if (mode === "tutorial" && (trainingStage !== 3 || selected !== "b")) {
      setStatus("followPractice");
      return;
    }
    const removedId = selected,
      removedValue = placed[selected];
    remember();
    delete placed[selected];
    if (mode === "tutorial") trainingStage = 4;
    moves++;
    typed = "";
    audio.play("back");
    setStatus("select");
    render();
    animateRemoval(removedId, removedValue);
    focusCell();
    saveSession();
  }
  function hint() {
    if (phase !== "playing" || mode === "tutorial") return;
    const id =
      puzzle.hidden.includes(selected) &&
      placed[selected] !== puzzle.solution[selected]
        ? selected
        : puzzle.hidden.find((cell) => placed[cell] !== puzzle.solution[cell]);
    if (!id) return;
    const current = WeaveEngine.values(puzzle, placed);
    const reason = puzzle.equations.find(
      (e) =>
        e.ids.includes(id) &&
        e.ids.filter(
          (cell) =>
            current[cell] == null || current[cell] !== puzzle.solution[cell],
        ).length === 1,
    );
    remember();
    const value = puzzle.solution[id];
    delete placed[id];
    // Return a misplaced matching tile if the needed value is already in use.
    if (!WeaveEngine.remaining(puzzle, placed).includes(value)) {
      const donor = puzzle.hidden.find(
        (cell) => placed[cell] === value && puzzle.solution[cell] !== value,
      );
      if (donor) delete placed[donor];
    }
    placed[id] = value;
    selected = id;
    moves++;
    hints++;
    typed = "";
    if (reason)
      setStatus("hintReason", {
        equation: reason.ids
          .map((cell) => (cell === id ? `[${value}]` : current[cell]))
          .join("|")
          .replace("|", ` ${reason.op} `)
          .replace("|", " = "),
      });
    else setStatus("hintUsed", { n: hints });
    audio.play("bonus");
    render(id);
    saveSession();
    if (WeaveEngine.status(puzzle, placed).every((state) => state === "valid"))
      win();
  }
  function win() {
    if (phase !== "playing") return;
    phase = "celebrating";
    celebration = 0;
    audio.play("win");
    if (mode === "series") {
      const stars = hints === 0 ? 3 : hints <= 2 ? 2 : 1;
      const old = data.records[puzzle.level];
      // Time records compare only attempts with equal star quality.
      if (
        !old ||
        stars > old.stars ||
        (stars === old.stars && elapsed < old.time)
      )
        data.records[puzzle.level] = { stars, time: elapsed, moves, hints };
      if (puzzle.level === data.next)
        data.next = Math.min(Number.MAX_SAFE_INTEGER - 1, data.next + 1);
    }
    if (mode !== "tutorial") data.session = null;
    else settings.learned = true;
    persist();
    render();
    setStatus("winCopy");
  }
  function closeModal() {
    modalKind = null;
    syncChrome();
    if ($("modal").open) $("modal").close();
    $("game").classList.remove("paused");
    const focusTarget = screen === "game" ? $("pause") : previousFocus;
    focusTarget?.focus?.({ preventScroll: true });
    previousFocus = null;
  }
  function resume() {
    closeModal();
    if (screen === "game" && phase === "paused") phase = "playing";
  }
  function modalButton(key, action, primary = false) {
    const button = document.createElement("button");
    button.textContent = text(key);
    if (primary) button.className = "primary";
    button.addEventListener("click", action);
    $("modal-actions").append(button);
  }
  function paragraph(key) {
    const node = document.createElement("p");
    node.textContent = text(key);
    return node;
  }
  function renderModal(kind, open = true) {
    if (open) previousFocus = document.activeElement;
    $("modal").dataset.kind = kind;
    modalKind = kind;
    syncChrome(true);
    const content = $("modal-content");
    content.replaceChildren();
    $("modal-actions").replaceChildren();
    $("modal-eyebrow").textContent = text(
      kind === "result" ? "completed" : "numberStudio",
    );
    const modalIcon =
      kind === "settings"
        ? "i-settings"
        : kind === "result"
          ? "i-grid"
          : kind === "pause"
            ? "i-pause"
            : kind === "restart"
              ? "i-restart"
              : "i-help";
    $("modal-mark").innerHTML = `<svg><use href="#${modalIcon}"/></svg>`;
    if (kind === "settings") {
      $("modal-title").textContent = text("settings");
      modalButton("close", resume, true);
    } else if (kind === "help") {
      $("modal-title").textContent = text("help");
      const equation = document.createElement("div");
      equation.className = "help-equation";
      equation.textContent = "6 + 4 = 10";
      content.append(equation);
      const steps = document.createElement("div");
      steps.className = "help-steps";
      ["help1", "help2", "help3", "keyboard"].forEach((key) =>
        steps.append(paragraph(key)),
      );
      content.append(steps);
      modalButton(
        "learn",
        () => {
          saveSession();
          start(0, "tutorial", "tutorial");
        },
        true,
      );
      modalButton("close", resume);
    } else if (kind === "pause") {
      $("modal-title").textContent = text("paused");

      modalButton("continue", resume, true);
      modalButton("levels", () => leave("map"));
      modalButton("home", () => leave("home"));
    } else if (kind === "restart") {
      $("modal-title").textContent = text("restartTitle");
      content.append(paragraph("restartCopy"));
      modalButton("replay", () => start(puzzle.level, puzzle.seed, mode), true);
      modalButton("cancel", resume);
    } else if (kind === "result") {
      $("modal-title").textContent = text(
        mode === "tutorial" ? "tutorialDone" : "winTitle",
      );
      if (mode === "tutorial") {
        content.append(paragraph("tutorialDoneCopy"));
        modalButton(data.session ? "continue" : "play", continueGame, true);
      } else {
        const stars = hints === 0 ? 3 : hints <= 2 ? 2 : 1;
        const rating = document.createElement("div");
        rating.className = "result-stars";
        rating.setAttribute("aria-label", stars + " / 3");
        for (let i = 0; i < 3; i++) {
          const star = document.createElement("span");
          star.textContent = i < stars ? "★" : "☆";
          star.className = i < stars ? "earned-star" : "empty-star";
          star.style.setProperty("--star-index", i);
          star.setAttribute("aria-hidden", "true");
          rating.append(star);
        }
        if (open) audio.play("stars", stars);
        content.append(rating);

        const stats = document.createElement("div");
        stats.className = "result-stats";
        for (const [value, key] of [
          [formatTime(elapsed), "time"],
          [moves, "moves"],
        ]) {
          const item = document.createElement("div"),
            strong = document.createElement("strong"),
            label = document.createElement("span");
          strong.textContent = value;
          label.textContent = text(key);
          item.append(strong, label);
          stats.append(item);
        }
        content.append(stats);
        modalButton(
          "nextLevel",
          () => start(Math.min(puzzle.level + 1, data.next), puzzle.seed, mode),
          true,
        );
        modalButton("replay", () => start(puzzle.level, puzzle.seed, mode));
      }
      modalButton("levels", () => leave("map"));
    }
    if (kind === "result") settingsBar.hidden = true;
    if (open && !$("modal").open) $("modal").showModal();
  }
  function openPause(kind = "pause") {
    if (phase === "celebrating" || phase === "finished") return;
    if (screen === "game" && phase === "playing") {
      phase = "paused";
      saveSession();
      $("game").classList.add("paused");
    }
    renderModal(kind);
  }

  $("play").addEventListener("click", () =>
    settings.learned ? continueGame() : start(0, "tutorial", "tutorial"),
  );
  $("learn").addEventListener("click", () => start(0, "tutorial", "tutorial"));
  $("help").addEventListener("click", () => openPause("help"));
  $("theme").addEventListener("click", () => {
    settings.theme = settings.theme === "light" ? "dark" : "light";
    translate();
    persist();
  });
  $("sound").addEventListener("click", () => {
    settings.muted = !settings.muted;
    audio.mute();
    translate();
    persist();
  });
  $("home-button").addEventListener("click", () => leave("home"));
  $("map-back").addEventListener("click", () => leave("home"));
  $("open-map").addEventListener("click", () => leave("map"));
  $("game-back").addEventListener("click", () => leave("map"));
  $("map-prev").addEventListener("click", () => {
    mapPage = Math.max(0, mapPage - 1);
    renderMap();
  });
  $("map-next").addEventListener("click", () => {
    mapPage++;
    renderMap();
  });
  $("map-current").addEventListener("click", continueGame);
  $("undo").addEventListener("click", undo);
  $("erase").addEventListener("click", erase);
  $("hint").addEventListener("click", hint);
  $("restart").addEventListener("click", () => openPause("restart"));
  $("pause").addEventListener("click", () => openPause());
  $("modal").addEventListener("cancel", (event) => {
    event.preventDefault();
    if (modalKind === "result") leave("map");
    else resume();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (screen === "game" && phase === "playing") openPause();
      else saveSession();
    }
    lastFrame = performance.now();
  });
  window.addEventListener("pagehide", saveSession);
  document.addEventListener("keydown", (event) => {
    if (
      screen !== "game" ||
      phase !== "playing" ||
      $("modal").open ||
      !$("language-panel").hidden ||
      event.target instanceof HTMLInputElement
    )
      return;
    if (event.key === "Escape") {
      openPause();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      undo();
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (
      ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)
    ) {
      event.preventDefault();
      typed = "";
      const [x, y] = puzzle.coordinates[selected];
      const direction = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      }[event.key];
      const candidates = puzzle.hidden
        .filter((id) => id !== selected)
        .map((id) => {
          const [cx, cy] = puzzle.coordinates[id];
          const dx = cx - x,
            dy = cy - y;
          return {
            id,
            forward: dx * direction[0] + dy * direction[1],
            distance:
              Math.abs(dx) +
              Math.abs(dy) +
              2 * Math.abs(dx * direction[1] - dy * direction[0]),
          };
        })
        .filter((candidate) => candidate.forward > 0)
        .sort((a, b) => a.distance - b.distance);
      if (candidates.length) selected = candidates[0].id;
      render();
      focusCell();
      return;
    }
    if (/^[0-9]$/.test(event.key)) {
      event.preventDefault();
      typed = (typed + event.key).slice(-3);
      setStatus("typed", { n: typed });
    } else if (event.key === "Enter" && typed) {
      event.preventDefault();
      place(Number(typed));
      typed = "";
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      typed = "";
      erase();
    }
  });
  function frame(now) {
    const delta = Math.max(0, now - lastFrame);
    lastFrame = now;
    if (!document.hidden && screen === "game") {
      if (phase === "playing") {
        elapsed += delta;
        $("timer").textContent = formatTime(elapsed);
        if (now - lastSaved > 10000) {
          lastSaved = now;
          saveSession();
        }
      } else if (phase === "celebrating") {
        celebration += delta;
        if (
          celebration >=
          (matchMedia("(prefers-reduced-motion: reduce)").matches ? 500 : 1900)
        ) {
          phase = "finished";
          renderModal("result");
        }
      }
    }
    requestAnimationFrame(frame);
  }
  syncChrome();
  translate();
  requestAnimationFrame(frame);
})();
