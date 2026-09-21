(function () {
  "use strict";
  const E = window.ZarEngine,
    S = window.ZarStorage,
    D = S.data,
    I = window.ZarI18n;
  const $ = (id) => document.getElementById(id),
    t = (key) => I.t(D.settings.language, key);
  const icons = window.ZarAssets.icons.names;
  const palettes = window.ZarAssets.palettes;
  const symbols = ["◆", "●", "▲", "■"];
  let mode = "journey",
    level,
    board,
    history = [],
    future = [],
    moves = 0,
    hints = 0,
    selected = null,
    done = false,
    lastFocus = null,
    dialogType = null,
    drag = null,
    suppressClick = 0,
    statusTimer;
  let tutorialStep = -1,
    pendingPlay = null;
  let elapsedMs = 0,
    lastTick = performance.now();
  const dailyCache = new Map();
  function today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  function daily(date) {
    if (!dailyCache.has(date)) {
      let seed = 0;
      for (const ch of date)
        seed = (Math.imul(seed, 31) + ch.charCodeAt(0)) >>> 0;
      dailyCache.set(date, { ...E.generate(seed, 5, 3), id: date, chapter: 5 });
    }
    return dailyCache.get(date);
  }
  function color(c) {
    return palettes[D.settings.palette][c];
  }
  function icon(name) {
    return `<i class="icon" style="--icon:${icons.indexOf(name)}" aria-hidden="true"></i>`;
  }
  function localize(scope = document) {
    scope
      .querySelectorAll("[data-t]")
      .forEach((el) => (el.textContent = t(el.dataset.t)));
    scope.querySelectorAll("[data-label]").forEach((el) => {
      el.setAttribute("aria-label", t(el.dataset.label));
      el.title = t(el.dataset.label);
    });
    scope.querySelectorAll("[data-icon]").forEach((el) => {
      el.style.setProperty("--icon", icons.indexOf(el.dataset.icon));
      el.setAttribute("aria-hidden", "true");
    });
  }
  function applySettings() {
    document.documentElement.lang = D.settings.language;
    document.documentElement.dir = D.settings.language === "ar" ? "rtl" : "ltr";
    document.documentElement.dataset.theme = D.settings.theme;

    document.title = t("title");
    $("language").innerHTML =
      `<img class="flag" src="assets/flag-${D.settings.language}.svg" alt="${I.names[I.languages.indexOf(D.settings.language)]}">`;
    $("language").setAttribute("aria-label", t("language"));
    $("board").setAttribute("aria-label", t("level"));
    document.querySelector('meta[name="theme-color"]').content =
      D.settings.theme === "dark" ? "#000000" : "#fafafa";
    localize();
    const inGame = !$("game-screen").hidden;
    $("brand").innerHTML =
      (inGame ? icon("arrow") : "") +
      `<span>${t(inGame ? "mainMenu" : "title")}</span>`;
    $("brand").classList.toggle("back-brand", inGame);
  }
  function announce(key) {
    clearTimeout(statusTimer);
    $("status").textContent = t(key);
    statusTimer = setTimeout(() => ($("status").textContent = ""), 6500);
  }
  function audio(kind) {
    window.ZarAudio.play(kind, D.settings.sound);
  }
  function save() {
    if (tutorialStep >= 0) {
      S.save();
      return;
    }
    D.activeMode = mode;
    if (level)
      D.sessions[mode] = {
        levelId: level.id,
        board: [...board],
        history: history.slice(-200),
        future: future.slice(-200),
        moves,
        hints,
        elapsedMs,
      };
    const persisted = S.save();
    $("save-status").textContent = persisted ? "" : t("saveError");
    $("save-status").classList.toggle("error", !persisted);
  }
  function validSession(s, l) {
    return (
      s &&
      s.levelId === l.id &&
      E.validBoard(l, s.board) &&
      Number.isSafeInteger(s.moves) &&
      s.moves >= 0 &&
      Number.isSafeInteger(s.hints) &&
      s.hints >= 0
    );
  }
  function load(nextMode, id, resume = true) {
    ZarMotion.cancel();
    clearDrag();
    if (level) save();
    tutorialStep = -1;
    document.body.classList.add("playing");
    $("home").hidden = true;
    $("game-screen").hidden = false;
    mode = nextMode;
    level =
      mode === "daily"
        ? daily(id || today())
        : window.ZarLevels[
            Math.max(0, Math.min(47, (Number(id) || D.next) - 1))
          ];
    const session = D.sessions[mode];
    if (resume && validSession(session, level)) {
      board = [...session.board];
      moves = session.moves;
      hints = session.hints;
      elapsedMs =
        Number.isFinite(session.elapsedMs) && session.elapsedMs >= 0
          ? session.elapsedMs
          : 0;
      history = (Array.isArray(session.history) ? session.history : [])
        .filter((b) => E.validBoard(level, b))
        .slice(-200);
      future = (Array.isArray(session.future) ? session.future : [])
        .filter((b) => E.validBoard(level, b))
        .slice(-200);
    } else {
      board = [...level.fixed];
      moves = 0;
      hints = 0;
      elapsedMs = 0;
      history = [];
      future = [];
    }
    selected = null;
    done = E.inspect(level, board).solved;
    $("status").textContent = "";
    closeDialog();
    render();
    save();
    if (done) showWin();
  }
  function die(id) {
    const tile = level.tiles[id];
    return `<span class="die" aria-hidden="true" style="--value:${tile.value - 1};--row:${D.settings.palette * 4 + tile.color};--die-color:${color(tile.color)}">${D.settings.display === "numbers" ? `<span class="number">${tile.value}</span>` : ""}${D.settings.colorblind ? `<span class="symbol">${symbols[tile.color]}</span>` : ""}</span>`;
  }
  function tileLabel(id) {
    const tile = level.tiles[id];
    return `${t("colors").split(",")[tile.color]} ${tile.value}`;
  }
  function render() {
    applySettings();
    $("game-title").textContent =
      tutorialStep >= 0
        ? t(["rule1", "rule2short", "rule2", "yourTurn"][tutorialStep])
        : mode === "daily"
          ? t("dailyShort")
          : `${t("discovery")} #${level.id}`;
    $("board").style.setProperty("--cols", level.w);
    $("board").innerHTML = board
      .map(
        (id, i) =>
          `<button class="cell ${id === null ? "empty" : ""}" data-cell="${i}" aria-label="${(i % level.w) + 1}, ${Math.floor(i / level.w) + 1}: ${id === null ? t("empty") : tileLabel(id) + (level.fixed[i] !== null ? " · " + t("fixed") : "")}" ${done ? "disabled" : ""}>${id !== null ? die(id) : ""}${level.fixed[i] !== null ? `<span class="fixed-mark">${icon("lock")}</span>` : ""}</button>`,
      )
      .join("");
    const available = level.tiles.filter((tile) => !board.includes(tile.id));
    $("reserve").innerHTML = available
      .map(
        (tile) =>
          `<button class="reserve-die ${selected === tile.id ? "selected" : ""}" data-tile="${tile.id}" aria-label="${tileLabel(tile.id)}" aria-pressed="${selected === tile.id}">${die(tile.id)}</button>`,
      )
      .join("");
    $("reset").disabled = done || !board.some((id, i) => id !== level.fixed[i]);
    $("hint").disabled = done;
    $("hint").innerHTML =
      icon("hint") + `<span>${Math.max(0, 3 - hints)}</span>`;
    $("hint").disabled = done || hints >= 3;
    $("tutorial-navigation").hidden = tutorialStep < 0;
    $("tutorial-next").hidden = !done;
    if (tutorialStep >= 0) {
      $("tutorial-instruction").textContent = t(done ? "win" : "placeDie");
      $("tutorial-next").textContent = t(
        tutorialStep === 3 ? "startGame" : "continue",
      );
      $("hint").hidden = true;
      $("elapsed").parentElement.hidden = true;
    } else {
      $("hint").hidden = false;
      $("elapsed").parentElement.hidden = false;
    }
    updateTimer();
    resizeBoard();
  }
  function resizeBoard() {
    if (!level) return;
    const padding = 0,
      gap = 2;
    const available = document.querySelector(".play-center").clientWidth;
    const cell = Math.min(
      110,
      Math.floor((available - padding - 2 - gap * (level.w - 1)) / level.w),
    );
    document.documentElement.style.setProperty("--cell", `${cell}px`);
    document.documentElement.style.setProperty("--gap", `${gap}px`);
  }
  function focusCell(i) {
    document
      .querySelector(`[data-cell="${i}"]`)
      ?.focus({ preventScroll: true });
  }
  function change(next, kind = "place") {
    if (
      done ||
      !E.validBoard(level, next) ||
      next.every((id, i) => id === board[i])
    )
      return false;
    const previous = ZarMotion.positions(board);
    const dragged = drag?.active
      ? { id: drag.id, rect: $("drag-ghost").getBoundingClientRect() }
      : null;
    history.push([...board]);
    if (history.length > 200) history.shift();
    future = [];
    board = next;
    moves++;
    selected = null;
    audio(kind);
    const result = E.inspect(level, board);
    done = result.solved;
    if (tutorialStep >= 0) {
      render();
      ZarMotion.move(previous, board, dragged);
      if (done) {
        audio("win");
        $("tutorial-next").hidden = true;
        ZarMotion.celebrate(level, board, () => {
          $("tutorial-next").hidden = false;
        });
      }
      return true;
    }
    if (done) {
      const record = { stars: hints ? 2 : 3, moves, hints },
        records = mode === "daily" ? D.dailyRecords : D.records,
        old = records[level.id];
      if (
        !old ||
        record.stars > old.stars ||
        (record.stars === old.stars && record.moves < old.moves)
      )
        records[level.id] = record;
      if (mode === "journey") {
        D.next = Math.min(48, Math.max(D.next, level.id + 1));
        if (level.id === 1) D.settings.learned = true;
      }
    }
    render();
    ZarMotion.move(previous, board, dragged);
    save();
    if (done) {
      audio("win");
      ZarMotion.celebrate(level, board, showWin);
    } else if (!board.includes(null)) announce("check");
    return true;
  }
  function selectTile(id) {
    if (done) return;
    selected = selected === id ? null : id;
    audio("pick");
    render();
    document
      .querySelector(`[data-tile="${id}"]`)
      ?.focus({ preventScroll: true });
  }
  function clickCell(i) {
    if (done) return;
    if (level.fixed[i] !== null) {
      announce("locked");
      return;
    }
    const next = [...board];
    if (board[i] !== null) {
      next[i] = null;
      change(next, "remove");
    } else if (selected !== null) {
      next[i] = selected;
      change(next);
    } else announce("selectFirst");
    if (!done) focusCell(i);
  }
  function undo(redo = false) {
    if (done) return;
    const from = redo ? future : history,
      to = redo ? history : future;
    if (!from.length) return;
    to.push([...board]);
    board = from.pop();
    selected = null;
    moves++;
    audio("remove");
    render();
    save();
    document.querySelector("[data-cell]")?.focus({ preventScroll: true });
  }
  function giveHint() {
    if (done || hints >= 3) return;
    let solutions = E.solve(level, board, 1),
      next = [...board],
      message = "hintPlaced";
    if (solutions.length) {
      const solution = solutions[0],
        i = board.findIndex((id) => id === null);
      if (i < 0) return;
      next[i] = solution[i];
    } else {
      solutions = E.solve(level, level.fixed, 1);
      const solution = solutions[0];
      if (!solution) return;
      const i = board.findIndex(
        (id, i) => level.fixed[i] === null && id !== null && id !== solution[i],
      );
      if (i < 0) return;
      next[i] = null;
      message = "hintRemoved";
    }
    hints++;
    change(next, "hint");
    if (!done) announce(message);
  }
  function dialog(title, body, type) {
    $("dialog").dataset.view = type;
    if (!$("dialog").open) lastFocus = document.activeElement;
    dialogType = type;
    $("dialog-content").innerHTML =
      `<div class="dialog-top"><h2 id="dialog-title">${title}</h2><button class="icon-button" data-action="close" aria-label="${t("close")}">${icon("close")}</button></div>${body}`;
    if (!$("dialog").open) $("dialog").showModal();
    localize($("dialog"));
    $("dialog").scrollTop = 0;
  }
  function closeDialog() {
    if (!$("dialog").open) return;
    $("dialog").close();
    dialogType = null;
    if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
    else $("help").focus({ preventScroll: true });
  }
  function demoDie(value, c = 0) {
    return `<span class="die" style="--value:${value - 1};--row:${D.settings.palette * 4 + c};--die-color:${color(c)}" aria-hidden="true"></span>`;
  }
  function showHelp() {
    dialog(
      t("help"),
      `<section class="rule"><h3>${t("rule1")}</h3><div class="rule-demo">${demoDie(1)}${demoDie(2)}</div></section><section class="rule"><h3>${t("rule2short")}</h3><div class="rule-demo">${demoDie(1, 2)}${demoDie(2, 2)}${demoDie(3, 2)}</div></section><section class="rule"><h3>${t("rule2")}</h3><div class="rule-demo turn">${demoDie(1, 1)}<span class="demo-empty"></span>${demoDie(2, 1)}${demoDie(3, 1)}</div></section><p class="keyboard">${t("shortControls")}</p><button class="menu-button" data-action="tutorial">${t("practice")}</button><div class="dialog-actions"><button class="primary" data-action="close">${t("gotIt")}</button></div>`,
      "help",
    );
  }
  function showSettings() {
    const setting = (key, value, label, art = "") =>
      `<button class="setting-choice" data-setting="${key}" data-value="${value}" aria-pressed="${D.settings[key] === value}">${art}<span>${label}</span></button>`;
    const group = (key, content, cls = "") =>
      `<section class="settings-group"><h3>${t(key)}</h3><div class="choice-grid ${cls}">${content}</div></section>`;
    const flags = I.languages
      .map((lang, i) =>
        setting(
          "language",
          lang,
          I.names[i],
          `<img class="flag" src="assets/flag-${lang}.svg" alt="">`,
        ),
      )
      .join("");
    const themes = ["dark", "light"]
      .map((theme) => setting("theme", theme, t(theme), ""))
      .join("");
    const palette = palettes
      .map((colors, i) =>
        setting(
          "palette",
          i,
          t("palettes").split(",")[i],
          `<span class="swatches">${colors.map((c) => `<i style="background:${c}"></i>`).join("")}</span>`,
        ),
      )
      .join("");
    const faces =
      setting(
        "display",
        "pips",
        t("pips"),
        `<span class="face-preview">${demoDie(5)}</span>`,
      ) +
      setting(
        "display",
        "numbers",
        t("numbers"),
        `<span class="face-preview">${demoDie(1).replace("</span>", "<b>5</b></span>")}</span>`,
      );
    const toggle = (key) =>
      `<button class="toggle-setting" data-setting="${key}" data-value="${!D.settings[key]}" role="switch" aria-checked="${D.settings[key]}"><span>${t(key)}${key === "colorblind" ? "<small>◆ ● ▲ ■</small>" : ""}</span><i class="switch-track"><b></b></i></button>`;
    dialog(
      t("settings"),
      group("language", flags, "languages") +
        group("theme", themes) +
        group("palette", palette, "palette-choices") +
        group("display", faces) +
        toggle("colorblind") +
        toggle("sound") +
        `<div class="dialog-actions"><button class="primary" data-action="close">${t("close")}</button></div>`,
      "settings",
    );
  }
  function home() {
    ZarMotion.cancel();
    clearDrag();
    save();
    if (tutorialStep >= 0)
      load("journey", D.sessions.journey?.levelId || D.next);
    tutorialStep = -1;
    closeDialog();
    $("game-screen").hidden = true;
    document.body.classList.remove("playing");
    $("home").hidden = false;
    applySettings();
    refreshHome();
  }
  function refreshHome() {
    $("home-progress").textContent = `${Object.keys(D.records).length} / 48`;
    document.querySelector(".home-art").innerHTML =
      demoDie(1, 0) + demoDie(2, 1) + demoDie(3, 2);
  }
  function beginPlay(nextMode = "journey", id = null) {
    pendingPlay = {
      mode: nextMode,
      id:
        id ??
        (nextMode === "daily"
          ? today()
          : D.sessions.journey?.levelId || D.next),
    };
    if (!D.settings.tutorialDone) startTutorial();
    else load(pendingPlay.mode, pendingPlay.id);
  }
  function startTutorial() {
    save();
    tutorialStep = 0;
    tutorialLevel();
  }
  function tutorialLevel() {
    clearDrag();
    closeDialog();
    document.body.classList.add("playing");
    $("home").hidden = true;
    $("game-screen").hidden = false;
    const tile = (id, color, value) => ({ id, color, value });
    const lessons = [
      { w: 2, h: 1, tiles: [tile(0, 0, 1), tile(1, 0, 2)], fixed: [0, null] },
      {
        w: 3,
        h: 1,
        tiles: [tile(0, 0, 1), tile(1, 0, 2), tile(2, 0, 3)],
        fixed: [0, null, 2],
      },
      {
        w: 2,
        h: 2,
        tiles: [tile(0, 1, 1), tile(1, 1, 2), tile(2, 1, 3), tile(3, 0, 1)],
        fixed: [0, 3, null, 2],
      },
      {
        w: 3,
        h: 2,
        tiles: [
          tile(0, 0, 1),
          tile(1, 0, 2),
          tile(2, 0, 3),
          tile(3, 2, 1),
          tile(4, 2, 2),
          tile(5, 2, 3),
        ],
        fixed: [0, null, null, null, null, 3],
      },
    ];
    level = { ...lessons[tutorialStep], id: "tutorial", chapter: 0 };
    board = [...level.fixed];
    moves = 0;
    hints = 0;
    history = [];
    future = [];
    selected = null;
    done = false;
    elapsedMs = 0;
    render();
  }
  function advanceTutorial() {
    if (!done) return;
    if (tutorialStep < 3) {
      tutorialStep++;
      tutorialLevel();
      return;
    }
    D.settings.tutorialDone = true;
    S.save();
    const destination = pendingPlay || {
      mode: "journey",
      id: D.sessions.journey?.levelId || D.next,
    };
    load(destination.mode, destination.id);
  }
  function showLevels() {
    dialog(
      t("levels"),
      `<p class="map-count"><bdi dir="ltr">${Object.keys(D.records).length} / 48</bdi><span>${t("completed")}</span></p><div class="level-grid">${window.ZarLevels.map((l) => `<button class="level-pick ${mode === "journey" && l.id === level.id ? "current" : ""}" data-level="${l.id}" aria-label="${t("level")} ${l.id}${D.records[l.id] ? ", " + t("completed") : ""}">#${l.id}<small aria-hidden="true">${D.records[l.id] ? "★".repeat(D.records[l.id].stars) : "—"}</small></button>`).join("")}</div>`,
      "levels",
    );
  }
  function showWin() {
    const last = mode === "journey" && level.id === 48;
    dialog(
      t("win"),
      `<div class="win-content"><h2>${t("win")}</h2><p class="win-level">${mode === "daily" ? t("daily") : `${t("level")} ${level.id}`}</p><div class="win-stars" aria-label="${hints ? 2 : 3} / 3">${hints ? "★★☆" : "★★★"}</div><button class="primary" data-action="next">${t(mode === "daily" ? "back" : last ? "daily" : "next")}${icon("arrow")}</button><button class="secondary" data-action="replay">${t("replay")}</button></div>`,
      "win",
    );
  }
  function nextLevel() {
    if (mode === "daily")
      load("journey", D.sessions.journey?.levelId || D.next);
    else if (level.id === 48) load("daily", today());
    else load("journey", level.id + 1);
  }
  function showReset() {
    dialog(
      t("resetTitle"),
      `<p class="dialog-body">${t("resetBody")}</p><div class="dialog-actions"><button data-action="close">${t("cancel")}</button><button class="primary" data-action="reset">${t("reset")}</button></div>`,
      "reset",
    );
  }
  function showHint() {
    if (done) {
      showWin();
      return;
    }
    if (hints >= 3) return;
    giveHint();
  }
  function clearDrag() {
    drag?.el?.classList.remove("drag-source");
    if (drag?.el?.hasPointerCapture?.(drag.pointerId))
      drag.el.releasePointerCapture(drag.pointerId);
    drag = null;
    $("drag-ghost").hidden = true;
    $("reserve").classList.remove("return-target");
    document
      .querySelectorAll(".cell.hover")
      .forEach((el) => el.classList.remove("hover"));
  }
  function pointerDown(e) {
    if (done || e.button !== 0 || !e.isPrimary) return;
    const el = e.target.closest("[data-tile],[data-cell]");
    if (!el) return;
    const from = el.hasAttribute("data-cell") ? Number(el.dataset.cell) : null,
      id = from === null ? Number(el.dataset.tile) : board[from];
    const movable =
      id !== null && (from === null || level.fixed[from] === null);
    drag = {
      id,
      from,
      x: e.clientX,
      y: e.clientY,
      pointerId: e.pointerId,
      pointerType: e.pointerType,
      el,
      active: false,
      movable,
      cancelled: false,
    };
    el.setPointerCapture(e.pointerId);
  }
  function pointerMove(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    if (!drag.active && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 7)
      return;
    if (!drag.movable) {
      drag.cancelled = true;
      return;
    }
    if (!drag.active) {
      drag.active = true;
      drag.el.classList.add("drag-source");
      $("drag-ghost").innerHTML = die(drag.id);
      $("drag-ghost").hidden = false;
      audio("pick");
    }
    e.preventDefault();
    $("drag-ghost").style.left = `${e.clientX - 26}px`;
    $("drag-ghost").style.top = `${e.clientY - 26}px`;
    const target = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest("[data-cell]");
    document
      .querySelectorAll(".cell.hover")
      .forEach((el) => el.classList.remove("hover"));
    if (target && level.fixed[Number(target.dataset.cell)] === null)
      target.classList.add("hover");
    $("reserve").classList.toggle(
      "return-target",
      !!document.elementFromPoint(e.clientX, e.clientY)?.closest("#reserve") &&
        drag.from !== null,
    );
  }
  function pointerUp(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const current = drag;
    if (!current.active && current.pointerType !== "mouse") {
      suppressClick = Date.now() + 400;
      e.preventDefault();
      clearDrag();
      if (!current.cancelled) {
        if (current.from === null) selectTile(current.id);
        else clickCell(current.from);
      }
      return;
    }
    if (current.active) {
      suppressClick = Date.now() + 400;
      e.preventDefault();
      const target = document.elementFromPoint(e.clientX, e.clientY),
        cell = target?.closest("[data-cell]");
      const next = [...board];
      if (cell) {
        const i = Number(cell.dataset.cell);
        if (level.fixed[i] === null) {
          if (current.from !== null) next[current.from] = next[i];
          next[i] = current.id;
          change(next);
          if (!done) focusCell(i);
        } else announce("locked");
      } else if (target?.closest("#reserve") && current.from !== null) {
        next[current.from] = null;
        change(next, "remove");
      }
    }
    clearDrag();
  }
  $("board").addEventListener("click", (e) => {
    if (Date.now() < suppressClick) return;
    const b = e.target.closest("[data-cell]");
    if (b) clickCell(Number(b.dataset.cell));
  });
  $("reserve").addEventListener("click", (e) => {
    if (Date.now() < suppressClick) return;
    const b = e.target.closest("[data-tile]");
    if (b) selectTile(Number(b.dataset.tile));
  });
  for (const id of ["board", "reserve"])
    $(id).addEventListener("pointerdown", pointerDown);
  document.addEventListener("pointermove", pointerMove, { passive: false });
  document.addEventListener("pointerup", pointerUp);
  document.addEventListener("pointercancel", clearDrag);
  window.addEventListener("blur", clearDrag);
  $("reset").onclick = showReset;
  $("hint").onclick = showHint;
  $("help").onclick = showHelp;
  $("settings").onclick = showSettings;
  $("brand").onclick = home;
  $("game-back").onclick = home;
  $("play").onclick = () => beginPlay();
  $("home-daily").onclick = () => beginPlay("daily");
  $("home-levels").onclick = showLevels;
  $("home-settings").onclick = showSettings;
  $("tutorial-next").onclick = advanceTutorial;
  $("language").onclick = showSettings;
  $("dialog").addEventListener("cancel", (e) => {
    e.preventDefault();
    if (dialogType === "win") home();
    else closeDialog();
  });
  $("dialog").addEventListener("click", (e) => {
    const levelButton = e.target.closest("[data-level]");
    if (levelButton) {
      beginPlay("journey", Number(levelButton.dataset.level));
      return;
    }
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (action === "close") {
      if (dialogType === "win") home();
      else closeDialog();
    }
    if (action === "tutorial") {
      pendingPlay = null;
      startTutorial();
    }
    if (action === "next") nextLevel();
    if (action === "replay") load(mode, level.id, false);
    if (action === "reset") {
      closeDialog();
      if (tutorialStep >= 0) tutorialLevel();
      else load(mode, level.id, false);
    }
    if (action === "hint") {
      closeDialog();
      giveHint();
    }
  });
  $("dialog").addEventListener("click", (e) => {
    const button = e.target.closest("[data-setting]");
    if (!button) return;
    const key = button.dataset.setting,
      raw = button.dataset.value;
    const scroll = $("dialog").scrollTop;
    D.settings[key] =
      key === "palette"
        ? Number(raw)
        : ["sound", "colorblind"].includes(key)
          ? raw === "true"
          : raw;
    render();
    refreshHome();
    save();
    showSettings();
    $("dialog").scrollTop = scroll;
    document
      .querySelector(`[data-setting="${key}"][data-value="${raw}"]`)
      ?.focus({ preventScroll: true });
  });
  document.addEventListener("keydown", (e) => {
    if ($("dialog").open || $("game-screen").hidden) return;
    if (e.key === "Escape") {
      selected = null;
      clearDrag();
      render();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      undo(e.shiftKey);
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
      e.preventDefault();
      undo(true);
      return;
    }
    const cell = e.target.closest("[data-cell]");
    if (
      cell &&
      ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)
    ) {
      e.preventDefault();
      const i = Number(cell.dataset.cell),
        delta = {
          ArrowLeft: -1,
          ArrowRight: 1,
          ArrowUp: -level.w,
          ArrowDown: level.w,
        }[e.key],
        j = i + delta;
      if (j >= 0 && j < board.length && E.adjacent(i, j, level.w)) focusCell(j);
    }
  });
  function updateTimer() {
    const seconds = Math.floor(elapsedMs / 1000);
    $("elapsed").textContent =
      `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  }
  setInterval(() => {
    const now = performance.now(),
      delta = now - lastTick;
    lastTick = now;
    if (
      !$("game-screen").hidden &&
      !document.hidden &&
      !$("dialog").open &&
      !done &&
      tutorialStep < 0
    ) {
      elapsedMs += Math.min(delta, 1500);
      updateTimer();
    }
  }, 250);
  window.addEventListener("resize", resizeBoard);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) save();
  });
  window.addEventListener("pagehide", save);
  window.ZarDebug = Object.freeze({
    snapshot: () =>
      JSON.parse(
        JSON.stringify({
          mode,
          tutorialStep,
          level,
          board,
          moves,
          hints,
          done,
          selected,
          history: history.length,
          future: future.length,
        }),
      ),
  });
  load(
    D.activeMode,
    D.activeMode === "daily" ? today() : D.sessions.journey?.levelId || D.next,
  );
  home();
})();
